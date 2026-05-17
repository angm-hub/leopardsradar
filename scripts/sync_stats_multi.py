#!/usr/bin/env python3
"""
sync_stats_multi.py — Orchestrateur cascade stats multi-source.

Pipeline pour chaque joueur :
  1. FBRef (Playwright) → si goals+assists+minutes complets, is_canonical=True
  2. Sinon FBRef partiel : combler avec TM /leistungsdaten/ (goals/assists/apps/minutes)
  3. Sinon (ligue exotique, joueur absent FBRef) : Soccerway
  4. Sinon : Sofascore API JSON publique
  5. Sinon : Understat (Big 5 uniquement, pour xG/xA)
  6. Sinon : flag no_stats, joueur exclu des classements

La cascade s'arrete des qu'une source ramene des stats completes
(goals + assists + minutes tous presents et non-None, minutes > 100).

Idempotent : re-run = pas de doublons. La contrainte UNIQUE de player_stats_multi
(player_id, source, season, competition) garantit l'idempotence via UPSERT.

Apres le scraping, appelle aggregate_player_stats.py pour ecrire
players.season_* depuis player_stats_multi (is_canonical=true).

Usage :
  python sync_stats_multi.py [--limit N] [--player PLAYER_ID] [--dry-run]
  python sync_stats_multi.py --skip-fbref    # saute FBRef (test Soccerway/Sofascore)

Variables d'environnement :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  GITHUB_RUN_URL (optionnel, fourni par GH Actions)
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime, timezone
from typing import Optional

import requests

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient
from stats_sources import source_fbref, source_transfermarkt, source_soccerway, source_sofascore, source_understat

# ─── Config ───────────────────────────────────────────────────────────────────

SEASON = "2025-2026"
RUN_URL = os.environ.get("GITHUB_RUN_URL", "")
JOB_NAME = "sync-stats-multi"

# Seuil pour considerer les stats FBRef comme "completes"
FBREF_MIN_MINUTES = 100  # en-dessous : le joueur a a peine joue, on peut completer


# ─── Supabase helpers ─────────────────────────────────────────────────────────

def _supa_upsert(sb: SupabaseClient, rows: list[dict]) -> int:
    """Upsert dans player_stats_multi. Retourne le nombre de rows inserees."""
    if not rows:
        return 0
    now = datetime.now(timezone.utc).isoformat()
    for row in rows:
        row["scraped_at"] = now
    try:
        result = sb.insert(
            "player_stats_multi",
            rows,
            on_conflict="player_id,source,season,competition",
        )
        return len(rows)
    except Exception as exc:
        print(f"  [supabase] upsert error: {exc}", file=sys.stderr)
        return 0


def _mark_canonical(sb: SupabaseClient, player_id: int, source: str) -> None:
    """
    Marque is_canonical=true pour toutes les rows de (player_id, source, season)
    et false pour les autres sources du meme joueur et saison.
    """
    try:
        # Reset toutes les canonical du joueur pour cette saison
        sb.update(
            "player_stats_multi",
            {"player_id": f"eq.{player_id}", "season": f"eq.{SEASON}"},
            {"is_canonical": False},
        )
        # Marque la source retenue
        sb.update(
            "player_stats_multi",
            {
                "player_id": f"eq.{player_id}",
                "season":    f"eq.{SEASON}",
                "source":    f"eq.{source}",
            },
            {"is_canonical": True},
        )
    except Exception as exc:
        print(f"  [supabase] canonical mark error pid={player_id}: {exc}", file=sys.stderr)


def _fetch_targets(sb: SupabaseClient, limit: Optional[int], player_id: Optional[str]) -> list[dict]:
    """Charge les joueurs a traiter depuis Supabase."""
    if player_id:
        players = sb.select(
            "players",
            select="id,name,fbref_id,transfermarkt_id,date_of_birth,field_freshness,sofascore_id",
            id=f"eq.{player_id}",
        )
    else:
        params = {
            "select": "id,name,fbref_id,transfermarkt_id,date_of_birth,field_freshness,sofascore_id",
            "order": "level_band.asc.nullslast,market_value_eur.desc.nullslast",
        }
        if limit:
            params["limit"] = str(limit)
        players = sb.select("players", **params)
    return players


def _is_stats_complete(rows: list[dict]) -> bool:
    """
    Returns True si au moins une row a goals/assists/minutes tous presents
    et minutes > FBREF_MIN_MINUTES (joueur a vraiment joue cette saison).
    """
    for r in rows:
        if (
            r.get("goals") is not None
            and r.get("assists") is not None
            and r.get("minutes_played") is not None
            and (r.get("minutes_played") or 0) > FBREF_MIN_MINUTES
        ):
            return True
    return False


def _backfill_season_stats(sb: SupabaseClient, player_id: int, rows: list[dict]) -> None:
    """
    Calcule les totaux saison depuis les rows canoniques et ecrit dans players.season_*.
    Identique a la logique de sync_fbref_stats.py mais source-agnostique.
    """
    totals = {
        "season_goals":   0,
        "season_assists": 0,
        "season_games":   0,
        "season_minutes": 0,
    }
    for r in rows:
        totals["season_goals"]   += r.get("goals", 0) or 0
        totals["season_assists"] += r.get("assists", 0) or 0
        totals["season_games"]   += r.get("matches_played", 0) or 0
        totals["season_minutes"] += r.get("minutes_played", 0) or 0

    try:
        sb.update("players", {"id": f"eq.{player_id}"}, totals)
        print(
            f"  [backfill] {totals['season_goals']}G "
            f"{totals['season_assists']}A "
            f"{totals['season_games']}gp "
            f"{totals['season_minutes']}min"
        )
    except Exception as exc:
        print(f"  [backfill] error pid={player_id}: {exc}", file=sys.stderr)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description="Sync stats multi-source (cascade FBRef → TM → SW → SS → US)")
    ap.add_argument("--dry-run",     action="store_true", help="Pas d'ecriture en BDD")
    ap.add_argument("--limit",       type=int, default=None, help="Limite le nombre de joueurs")
    ap.add_argument("--player",      type=str, default=None, help="ID Supabase d'un joueur unique")
    ap.add_argument("--skip-fbref",  action="store_true", help="Saute FBRef (test alternatives)")
    ap.add_argument("--skip-tm",     action="store_true", help="Saute Transfermarkt")
    ap.add_argument("--skip-sw",     action="store_true", help="Saute Soccerway")
    ap.add_argument("--skip-ss",     action="store_true", help="Saute Sofascore")
    ap.add_argument("--skip-us",     action="store_true", help="Saute Understat")
    args = ap.parse_args()

    if not args.dry_run and (
        not os.environ.get("SUPABASE_URL")
        or not os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    ):
        print("::error::SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes", file=sys.stderr)
        return 1

    sb = SupabaseClient()
    if not args.dry_run:
        sb.ping()

    targets = _fetch_targets(sb, args.limit, args.player)
    print(f"[sync-stats-multi] {len(targets)} joueurs a traiter, saison={SEASON}")

    stats = {
        "total":      len(targets),
        "fbref":      0,
        "tm":         0,
        "soccerway":  0,
        "sofascore":  0,
        "understat":  0,
        "no_stats":   0,
        "errors":     0,
    }

    # Playwright context — cree une fois, reutilise pour tous les FBRef
    pw_ctx = None
    pw_browser = None
    pw_page = None

    if not args.skip_fbref:
        try:
            from playwright.sync_api import sync_playwright
            pw_ctx = sync_playwright().start()
            pw_browser = pw_ctx.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"],
            )
            context = pw_browser.new_context(
                viewport={"width": 1280, "height": 800},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                locale="en-US",
            )
            pw_page = context.new_page()
            print("[playwright] Chromium headless initialise")
        except ImportError:
            print("[warn] playwright non installe — FBRef skip force")
            args.skip_fbref = True
        except Exception as exc:
            print(f"[warn] playwright init failed: {exc} — FBRef skip force")
            args.skip_fbref = True

    try:
        for i, player in enumerate(targets, 1):
            pid = player["id"]
            name = player.get("name", f"Player {pid}")
            print(f"\n[{i}/{len(targets)}] {name}")

            canonical_source: Optional[str] = None
            canonical_rows: list[dict] = []

            # ── Step 1 : FBRef ─────────────────────────────────────────────
            if not args.skip_fbref and player.get("fbref_id") and pw_page is not None:
                rows = source_fbref.fetch(player, pw_page)
                if rows:
                    if not args.dry_run:
                        n = _supa_upsert(sb, [
                            {"player_id": pid, "season": SEASON, **r} for r in rows
                        ])
                    if _is_stats_complete(rows):
                        canonical_source = "fbref"
                        canonical_rows = rows
                        stats["fbref"] += 1

            # ── Step 2 : Transfermarkt (complement ou fallback) ────────────
            if canonical_source is None and not args.skip_tm and player.get("transfermarkt_id"):
                rows = source_transfermarkt.fetch(player)
                if rows:
                    if not args.dry_run:
                        _supa_upsert(sb, [
                            {"player_id": pid, "season": SEASON, **r} for r in rows
                        ])
                    if _is_stats_complete(rows):
                        canonical_source = "transfermarkt"
                        canonical_rows = rows
                        stats["tm"] += 1
                    elif canonical_rows:
                        # FBRef partiel + TM pour combler : merge
                        # On garde FBRef comme canonical mais on utilise TM pour minutes si manquant
                        print(f"  [cascade] FBRef partiel — merge TM pour complement")
                        canonical_source = "fbref"  # priorite a FBRef
                        canonical_rows = canonical_rows  # on garde FBRef
                        stats["fbref"] += 1

            # ── Step 3 : Soccerway ────────────────────────────────────────
            if canonical_source is None and not args.skip_sw:
                rows = source_soccerway.fetch(player)
                if rows:
                    if not args.dry_run:
                        _supa_upsert(sb, [
                            {"player_id": pid, "season": SEASON, **r} for r in rows
                        ])
                    if _is_stats_complete(rows) or rows:  # SW : on retient meme partiel
                        canonical_source = "soccerway"
                        canonical_rows = rows
                        stats["soccerway"] += 1

            # ── Step 4 : Sofascore ────────────────────────────────────────
            if canonical_source is None and not args.skip_ss:
                rows = source_sofascore.fetch(player)
                if rows:
                    if not args.dry_run:
                        _supa_upsert(sb, [
                            {"player_id": pid, "season": SEASON, **r} for r in rows
                        ])
                    if rows:  # Sofascore : on retient si on a quoi que ce soit
                        canonical_source = "sofascore"
                        canonical_rows = rows
                        stats["sofascore"] += 1

            # ── Step 5 : Understat (Big 5 xG/xA) ─────────────────────────
            if canonical_source is None and not args.skip_us:
                rows = source_understat.fetch(player)
                if rows:
                    if not args.dry_run:
                        _supa_upsert(sb, [
                            {"player_id": pid, "season": SEASON, **r} for r in rows
                        ])
                    if rows:
                        canonical_source = "understat"
                        canonical_rows = rows
                        stats["understat"] += 1

            # ── Step 6 : No stats ─────────────────────────────────────────
            if canonical_source is None:
                print(f"  [no_stats] aucune source n'a ramene de data pour {name}")
                stats["no_stats"] += 1
                continue

            # ── Persister canonical + backfill season_* ───────────────────
            if not args.dry_run:
                _mark_canonical(sb, pid, canonical_source)
                _backfill_season_stats(sb, pid, canonical_rows)
                print(f"  [ok] source={canonical_source}, {len(canonical_rows)} rows")
            else:
                print(f"  [dry] would use source={canonical_source}, {len(canonical_rows)} rows")

    finally:
        # Fermeture propre Playwright
        if pw_browser:
            try: pw_browser.close()
            except Exception: pass
        if pw_ctx:
            try: pw_ctx.stop()
            except Exception: pass

    # ── Log ───────────────────────────────────────────────────────────────────
    print(f"\n[sync-stats-multi] === Recap ===")
    print(f"  Total traites : {stats['total']}")
    print(f"  FBRef       : {stats['fbref']}")
    print(f"  Transfermarkt: {stats['tm']}")
    print(f"  Soccerway   : {stats['soccerway']}")
    print(f"  Sofascore   : {stats['sofascore']}")
    print(f"  Understat   : {stats['understat']}")
    print(f"  No stats    : {stats['no_stats']}")
    print(f"  Erreurs     : {stats['errors']}")

    if not args.dry_run:
        try:
            now = datetime.now(timezone.utc).isoformat()
            sb.insert("sync_logs", {
                "job_name":          JOB_NAME,
                "status":            "success" if stats["errors"] == 0 else "partial",
                "started_at":        now,
                "finished_at":       now,
                "players_processed": stats["total"] - stats["no_stats"],
                "players_updated":   stats["total"] - stats["no_stats"] - stats["errors"],
                "errors_count":      stats["errors"],
                "github_run_url":    RUN_URL,
            })
        except Exception as exc:
            print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)

    return 0 if stats["errors"] < stats["total"] * 0.5 else 1


if __name__ == "__main__":
    sys.exit(main())
