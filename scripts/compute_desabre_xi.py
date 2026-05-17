#!/usr/bin/env python3
"""
compute_desabre_xi.py — Calcule le 11 reel de Desabre depuis national_lineups.

Lit la vue materielle desabre_xi_stats (ou la reconstruit depuis national_lineups
si la vue n'existe pas encore) et produit :

  1. Un JSON cache desabre_xi.json dans scripts/cache/ :
       {
         "generated_at": "...",
         "total_matches": N,
         "formation": "4-3-3",
         "xi": [
           {
             "player_id": 42,
             "player_name": "...",
             "slug": "...",
             "position": "Goalkeeper",
             "appearances": 12,
             "appearances_official": 10,
             "start_pct": 85.7,
             "first_start": "2022-09-27",
             "last_start": "2026-03-31"
           },
           ...
         ],
         "bench": [...]  # 5-8 joueurs suivants par poste
       }

  2. Un REFRESH de la vue materielle desabre_xi_stats si la BDD est accessible.

Formation par defaut : 4-3-3 (formation la plus utilisee par Desabre selon
les matchs scraped). Si une formation different est majoritaire dans les
national_lineups.formation, on l'utilise.

Selection du 11 :
  - Par poste : top N joueurs par appearances_total sous Desabre
  - Contraintes : 1 GK, 4 DEF, 3 MID, 3 ATT (4-3-3)
  - Si poste incomplet (pas assez de joueurs avec des starts) : alerter, ne pas forcer

Usage :
  python compute_desabre_xi.py [--dry-run] [--refresh-view]
  python compute_desabre_xi.py --output /tmp/desabre_xi.json
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient

# ─── Config ───────────────────────────────────────────────────────────────────

DESABRE_START = "2022-08-07"
FORMATION_DEFAULT = "4-3-3"
FORMATION_SLOTS: dict[str, int] = {
    "Goalkeeper": 1,
    "Defender":   4,
    "Midfield":   3,
    "Attack":     3,
}
BENCH_PER_POS: dict[str, int] = {
    "Goalkeeper": 2,
    "Defender":   2,
    "Midfield":   2,
    "Attack":     2,
}
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_FILE = CACHE_DIR / "desabre_xi.json"


# ─── Fetch data ───────────────────────────────────────────────────────────────

def _fetch_lineups(sb: SupabaseClient) -> list[dict]:
    """Charge tous les matchs Desabre depuis national_lineups."""
    return sb.select(
        "national_lineups",
        select="id,match_date,starting_xi,competition,is_official,formation",
        coach="eq.Desabre",
        order="match_date.asc",
    )


def _fetch_players(sb: SupabaseClient) -> dict[int, dict]:
    """Charge tous les joueurs en BDD. Retourne {player_id: player_dict}."""
    rows = sb.select(
        "players",
        select="id,name,slug,position",
        order="id.asc",
    )
    return {r["id"]: r for r in rows}


def _detect_formation(lineups: list[dict]) -> str:
    """Detecte la formation majoritaire depuis les donnees scrapeees."""
    formations = [ln.get("formation") for ln in lineups if ln.get("formation")]
    if not formations:
        return FORMATION_DEFAULT
    most_common = Counter(formations).most_common(1)
    return most_common[0][0] if most_common else FORMATION_DEFAULT


def _compute_stats(lineups: list[dict], players: dict[int, dict]) -> dict[int, dict]:
    """
    Calcule les stats de titularisation par joueur sous Desabre.

    Retourne {player_id: {player_id, player_name, slug, position, appearances_total,
                          appearances_official, start_pct, first_start, last_start}}
    """
    total_matches = len(lineups)
    by_player: dict[int, dict] = {}

    for ln in lineups:
        xi = ln.get("starting_xi") or []
        for pid in xi:
            if not isinstance(pid, int):
                continue
            if pid not in by_player:
                p = players.get(pid, {})
                by_player[pid] = {
                    "player_id":             pid,
                    "player_name":           p.get("name", f"Player {pid}"),
                    "slug":                  p.get("slug", ""),
                    "position":              p.get("position", "Unknown"),
                    "appearances_total":     0,
                    "appearances_official":  0,
                    "first_start":           None,
                    "last_start":            None,
                }
            by_player[pid]["appearances_total"] += 1
            if ln.get("is_official", True):
                by_player[pid]["appearances_official"] += 1

            md = ln.get("match_date", "")
            if md:
                if not by_player[pid]["first_start"] or md < by_player[pid]["first_start"]:
                    by_player[pid]["first_start"] = md
                if not by_player[pid]["last_start"] or md > by_player[pid]["last_start"]:
                    by_player[pid]["last_start"] = md

    # Calcule start_pct
    for pid, stats in by_player.items():
        stats["start_pct"] = (
            round(stats["appearances_total"] / total_matches * 100, 1)
            if total_matches > 0 else 0.0
        )

    return by_player


def _select_xi(by_player: dict[int, dict], formation: str) -> tuple[list[dict], list[dict]]:
    """
    Selectionne le 11 et le banc par poste selon la formation.

    Returns (xi, bench) — listes de dicts stats joueur.
    """
    by_position: dict[str, list[dict]] = {}
    for stats in by_player.values():
        pos = stats["position"]
        by_position.setdefault(pos, []).append(stats)

    for pos in by_position:
        by_position[pos].sort(key=lambda x: x["appearances_total"], reverse=True)

    xi:    list[dict] = []
    bench: list[dict] = []
    used_ids: set[int] = set()

    for pos, n_starters in FORMATION_SLOTS.items():
        pool = by_position.get(pos, [])
        available = [p for p in pool if p["player_id"] not in used_ids]

        # XI
        picks = available[:n_starters]
        for p in picks:
            xi.append(p)
            used_ids.add(p["player_id"])

        if len(picks) < n_starters:
            print(
                f"  [warn] {pos} : seulement {len(picks)}/{n_starters} joueurs disponibles",
                file=sys.stderr,
            )

        # Banc (joueurs suivants)
        n_bench = BENCH_PER_POS.get(pos, 2)
        bench_picks = available[n_starters : n_starters + n_bench]
        bench.extend(bench_picks)

    return xi, bench


def _refresh_materialized_view(sb: SupabaseClient) -> bool:
    """
    Rafraichit la vue materielle desabre_xi_stats.
    Retourne True si succes.
    """
    try:
        sb.rpc("exec_sql", {"sql": "REFRESH MATERIALIZED VIEW desabre_xi_stats;"})
        print("[compute] vue materielle desabre_xi_stats rafraichie")
        return True
    except Exception as exc:
        # La vue materielle existe peut-etre pas encore ou exec_sql pas dispo
        print(f"[warn] refresh view failed: {exc} — skip")
        return False


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description="Calcule le 11 reel Desabre depuis national_lineups")
    ap.add_argument("--dry-run",      action="store_true", help="Pas d'ecriture en BDD/cache")
    ap.add_argument("--refresh-view", action="store_true", help="Rafraichit la vue materielle")
    ap.add_argument("--output",       type=str, default=None, help="Chemin JSON de sortie custom")
    args = ap.parse_args()

    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        print("::error::SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes", file=sys.stderr)
        return 1

    sb = SupabaseClient()
    sb.ping()

    print("[compute-desabre-xi] chargement des compositions...")
    lineups = _fetch_lineups(sb)
    print(f"[compute-desabre-xi] {len(lineups)} matchs Desabre en BDD")

    if not lineups:
        print("[compute-desabre-xi] aucun match en BDD — run scrape_rdc_lineups.py d'abord")
        return 1

    players = _fetch_players(sb)
    print(f"[compute-desabre-xi] {len(players)} joueurs en BDD")

    formation = _detect_formation(lineups)
    print(f"[compute-desabre-xi] formation dominante : {formation}")

    by_player = _compute_stats(lineups, players)
    print(f"[compute-desabre-xi] {len(by_player)} joueurs ont au moins 1 start sous Desabre")

    xi, bench = _select_xi(by_player, formation)

    # Affichage rapport
    print(f"\n=== 11 Desabre reel ({len(lineups)} matchs) ===")
    for p in xi:
        print(
            f"  {p['position']:12} {p['player_name']:30} "
            f"{p['appearances_total']:3} starts "
            f"({p['start_pct']}%) "
            f"| {p['first_start']} → {p['last_start']}"
        )

    print(f"\n=== Banc / alternatifs ===")
    for p in bench:
        print(
            f"  {p['position']:12} {p['player_name']:30} "
            f"{p['appearances_total']:3} starts ({p['start_pct']}%)"
        )

    # Construire le JSON de sortie
    output_data = {
        "generated_at":  datetime.now(timezone.utc).isoformat(),
        "desabre_start": DESABRE_START,
        "total_matches": len(lineups),
        "formation":     formation,
        "xi":            xi,
        "bench":         bench,
    }

    if not args.dry_run:
        # Ecriture cache JSON
        CACHE_DIR.mkdir(exist_ok=True)
        out_path = Path(args.output) if args.output else CACHE_FILE
        out_path.write_text(json.dumps(output_data, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n[compute] JSON ecrit -> {out_path}")

        # Refresh vue materielle
        if args.refresh_view:
            _refresh_materialized_view(sb)
    else:
        print("\n[dry] JSON non ecrit (--dry-run)")
        print(json.dumps(output_data, indent=2, ensure_ascii=False)[:500], "...")

    return 0


if __name__ == "__main__":
    sys.exit(main())
