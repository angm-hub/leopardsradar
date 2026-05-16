#!/usr/bin/env python3
"""
Léopards Radar — One-shot validation des 8 RDC explicites détectés par
le premier scan academy (2026-05-16). Tous ont 'DR Congo' dans leurs
nationalités sur Transfermarkt → validation safe en batch.

UPDATE verified=true sur les 8 TM IDs ci-dessous.
Idempotent : si déjà verified, no-op.

Usage :
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python validate_8_rdc_academy.py
"""

from __future__ import annotations
import sys
import requests

try:
    from supabase_client import SupabaseClient
except ImportError:
    sys.path.insert(0, ".")
    from supabase_client import SupabaseClient

# 8 candidats issus du scan PROD #5 (2026-05-16) avec DR Congo dans
# nationalities. Tous insérés via discover_academies, verified=false.
TARGETS = [
    ("1077656", "Vainqueur Nzinga",   "Paris SG U23"),
    ("1215403", "Preston Zenga",      "ESTAC Troyes B"),
    ("1512928", "Gédéao Mukala",      "Clermont 63 U17"),
    ("1539749", "Siméon Bondo",       "FC Sochaux U17"),
    ("1353516", "Othniel Pembélé",    "SM Caen U19"),
    ("988242",  "Joël Matondo",       "EA Guingamp B"),
    ("1318283", "Ravi Mbala",         "Antwerp U18"),
    ("1278591", "Ezra Tika-Lemba",    "Newcastle U18"),
]


def main():
    print(f"=== Validate 8 RDC academy candidates ===")
    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK\n")

    ok = 0
    skip = 0
    fail = 0
    for tm_id, name, club in TARGETS:
        # Check current state
        rows = sb.select("players", select="id,name,verified,discovery_method",
                         transfermarkt_id=f"eq.{tm_id}")
        if not rows:
            print(f"  [MISS] {name} (TM {tm_id}) — pas trouvé en BDD")
            fail += 1
            continue
        row = rows[0]
        if row.get("verified") is True:
            print(f"  [SKIP] {name} (id {row['id']}) — déjà verified")
            skip += 1
            continue
        # PATCH verified=true
        url = f"{sb.url}/rest/v1/players?transfermarkt_id=eq.{tm_id}"
        r = requests.patch(url, headers=sb.headers,
                           json={"verified": True}, timeout=20)
        if r.status_code >= 400:
            print(f"  [FAIL] {name} (TM {tm_id}) — HTTP {r.status_code} {r.text[:200]}")
            fail += 1
            continue
        print(f"  [OK]   {name:25} → verified=true ({club})")
        ok += 1

    print(f"\n=== Done: {ok} OK, {skip} skipped, {fail} failed ===")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
