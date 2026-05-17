#!/usr/bin/env python3
"""
aggregate_player_stats.py — Merge player_stats_multi → players.season_*

Lit les rows is_canonical=true dans player_stats_multi pour la saison courante
et ecrit les totaux dans players.season_goals / season_assists / season_games /
season_minutes.

Idempotent : re-run = memes resultats.
Peut etre appele standalone apres sync_stats_multi.py ou via GH Actions.

Usage :
  python aggregate_player_stats.py [--season 2025-2026] [--dry-run]
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient

SEASON_DEFAULT = "2025-2026"


def _fetch_canonical_stats(sb: SupabaseClient, season: str) -> list[dict]:
    """Fetch toutes les rows is_canonical=true pour la saison."""
    return sb.select(
        "player_stats_multi",
        select="player_id,goals,assists,matches_played,minutes_played,source,competition",
        season=f"eq.{season}",
        is_canonical="eq.true",
        order="player_id.asc,competition.asc",
    )


def _aggregate_by_player(rows: list[dict]) -> dict[int, dict]:
    """Somme les stats par player_id. Retourne {player_id: totals_dict}."""
    by_player: dict[int, dict] = {}
    for r in rows:
        pid = r["player_id"]
        if pid not in by_player:
            by_player[pid] = {
                "season_goals":   0,
                "season_assists": 0,
                "season_games":   0,
                "season_minutes": 0,
                "sources":        set(),
            }
        by_player[pid]["season_goals"]   += r.get("goals", 0) or 0
        by_player[pid]["season_assists"] += r.get("assists", 0) or 0
        by_player[pid]["season_games"]   += r.get("matches_played", 0) or 0
        by_player[pid]["season_minutes"] += r.get("minutes_played", 0) or 0
        if r.get("source"):
            by_player[pid]["sources"].add(r["source"])
    return by_player


def main() -> int:
    ap = argparse.ArgumentParser(description="Aggregate player_stats_multi -> players.season_*")
    ap.add_argument("--season",  default=SEASON_DEFAULT, help="Saison cible (defaut: 2025-2026)")
    ap.add_argument("--dry-run", action="store_true",    help="Pas d'ecriture en BDD")
    ap.add_argument("--player",  type=str, default=None, help="ID Supabase d'un joueur unique")
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

    print(f"[aggregate] fetching canonical stats for season={args.season}")
    rows = _fetch_canonical_stats(sb, args.season)

    if args.player:
        rows = [r for r in rows if str(r["player_id"]) == args.player]

    print(f"[aggregate] {len(rows)} rows is_canonical=true")

    if not rows:
        print("[aggregate] rien a aggreger — exit")
        return 0

    by_player = _aggregate_by_player(rows)
    print(f"[aggregate] {len(by_player)} joueurs a mettre a jour")

    updated = errors = 0
    for pid, totals in by_player.items():
        patch = {
            "season_goals":   totals["season_goals"],
            "season_assists": totals["season_assists"],
            "season_games":   totals["season_games"],
            "season_minutes": totals["season_minutes"],
        }
        if args.dry_run:
            src = ", ".join(sorted(totals["sources"]))
            print(
                f"  [dry] pid={pid} : "
                f"{totals['season_goals']}G {totals['season_assists']}A "
                f"{totals['season_games']}gp {totals['season_minutes']}min "
                f"(src: {src})"
            )
            updated += 1
            continue
        try:
            sb.update("players", {"id": f"eq.{pid}"}, patch)
            src = ", ".join(sorted(totals["sources"]))
            print(
                f"  [ok] pid={pid} : "
                f"{totals['season_goals']}G {totals['season_assists']}A "
                f"{totals['season_games']}gp {totals['season_minutes']}min "
                f"(src: {src})"
            )
            updated += 1
        except Exception as exc:
            print(f"  [error] pid={pid}: {exc}", file=sys.stderr)
            errors += 1

    print(f"\n[aggregate] done — {updated} joueurs mis a jour, {errors} erreurs")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
