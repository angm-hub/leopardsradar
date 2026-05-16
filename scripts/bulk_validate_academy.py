#!/usr/bin/env python3
"""
Bulk validation des candidats academy_scan_2026 par TM IDs.

Usage :
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python bulk_validate_academy.py --tm-ids "1464685,1379191,1232104"

  # via workflow GH (input tm_ids = liste séparée par virgules)
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--tm-ids", required=True,
                        help="CSV des transfermarkt_id à valider (verified=true).")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    tm_ids = [s.strip() for s in args.tm_ids.split(",") if s.strip()]
    if not tm_ids:
        print("ERROR: --tm-ids vide", file=sys.stderr)
        sys.exit(1)
    print(f"=== Bulk validate {len(tm_ids)} candidate(s) ===")

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK\n")

    ok = skip = miss = fail = 0
    for tm_id in tm_ids:
        rows = sb.select("players",
                         select="id,name,verified,discovery_method,current_club",
                         transfermarkt_id=f"eq.{tm_id}")
        if not rows:
            print(f"  [MISS] TM {tm_id} — pas en BDD")
            miss += 1
            continue
        row = rows[0]
        if row.get("verified") is True:
            print(f"  [SKIP] {row['name']:30} — déjà verified")
            skip += 1
            continue
        if args.dry_run:
            print(f"  [DRY ] {row['name']:30} → would set verified=true ({row.get('current_club')})")
            ok += 1
            continue
        r = requests.patch(
            f"{sb.url}/rest/v1/players?transfermarkt_id=eq.{tm_id}",
            headers=sb.headers,
            json={"verified": True},
            timeout=20,
        )
        if r.status_code >= 400:
            print(f"  [FAIL] {row['name']:30} — HTTP {r.status_code} {r.text[:160]}")
            fail += 1
            continue
        print(f"  [OK  ] {row['name']:30} → verified=true ({row.get('current_club')})")
        ok += 1

    print(f"\n=== Done: {ok} OK, {skip} skipped, {miss} not in DB, {fail} failed ===")
    if fail or miss:
        sys.exit(1)


if __name__ == "__main__":
    main()
