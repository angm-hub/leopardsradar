#!/usr/bin/env python3
"""
Bulk action sur des joueurs lors de la revue éditoriale par championnat.

4 actions par batch :
  confirm    : verified=true + eligibility_status=eligible
  investigate: verified=false + eligibility_status=potentially_eligible (status garde-fou)
  reject     : verified=false + eligibility_status=ineligible
  archive    : archived=true (soft delete, masqué du front)

Input : CSV de TM IDs (séparés par virgule) + action + note libre (optionnelle).

Usage :
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python bulk_action_players.py \\
      --action confirm --tm-ids "1234,5678" --note "Top 5 L1 sprint 2026-05-16"

Via workflow GH : input action + tm_ids + note (optionnelle).
"""

from __future__ import annotations
import argparse
import sys
import requests

try:
    from supabase_client import SupabaseClient
except ImportError:
    sys.path.insert(0, ".")
    from supabase_client import SupabaseClient

ACTIONS = {
    "confirm": {
        "patch": lambda note: {
            "verified": True,
            "eligibility_status": "eligible",
            **({"editorial_note": note} if note else {}),
        },
        "label": "Léopard confirmé",
    },
    "investigate": {
        "patch": lambda note: {
            "verified": False,
            "eligibility_status": "potentially_eligible",
            **({"editorial_note": note} if note else {}),
        },
        "label": "À creuser",
    },
    "reject": {
        "patch": lambda note: {
            "verified": False,
            "eligibility_status": "ineligible",
            **({"editorial_note": note} if note else {}),
        },
        "label": "Pas Léopard",
    },
    "archive": {
        "patch": lambda note: {
            "archived": True,
            **({"editorial_note": note} if note else {}),
        },
        "label": "Archivé",
    },
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--action", required=True, choices=list(ACTIONS.keys()))
    parser.add_argument("--tm-ids", required=True,
                        help="CSV des transfermarkt_id (séparés virgule)")
    parser.add_argument("--note", default="",
                        help="Note libre (stockée dans editorial_note)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    tm_ids = [s.strip() for s in args.tm_ids.split(",") if s.strip()]
    if not tm_ids:
        print("ERROR: --tm-ids vide", file=sys.stderr)
        sys.exit(1)

    cfg = ACTIONS[args.action]
    patch = cfg["patch"](args.note.strip() or None)

    print(f"=== Bulk action [{args.action}] {cfg['label']} ===")
    print(f"Cibles : {len(tm_ids)}")
    print(f"Patch  : {patch}")
    print()

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK\n")

    ok = miss = fail = 0
    for tm_id in tm_ids:
        rows = sb.select("players",
                         select="id,name,current_club,verified,eligibility_status,archived",
                         transfermarkt_id=f"eq.{tm_id}")
        if not rows:
            print(f"  [MISS] TM {tm_id} — pas en BDD")
            miss += 1
            continue
        row = rows[0]
        if args.dry_run:
            print(f"  [DRY] {row['name']:30} → {args.action} ({row.get('current_club') or '?'})")
            ok += 1
            continue
        r = requests.patch(
            f"{sb.url}/rest/v1/players?transfermarkt_id=eq.{tm_id}",
            headers=sb.headers, json=patch, timeout=20,
        )
        if r.status_code >= 400:
            print(f"  [FAIL] {row['name']:30} — HTTP {r.status_code} {r.text[:160]}")
            fail += 1
            continue
        print(f"  [OK]   {row['name']:30} → {args.action}")
        ok += 1

    print(f"\n=== Done: {ok} OK, {miss} missing, {fail} failed ===")
    if fail or miss:
        sys.exit(1)


if __name__ == "__main__":
    main()
