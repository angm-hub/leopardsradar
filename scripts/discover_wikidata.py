#!/usr/bin/env python3
"""
Léopards Radar — Discovery via Wikidata SPARQL.

Wikidata répertorie les footballeurs et leur lien à des nations. On query :
  - Personnes (Q5) qui sont footballeurs (P106 = Q937857)
  - Lieu de naissance (P19) en RDC (Q974) OU nationalité (P27) RDC
  - Avec leur Transfermarkt ID (P2446) si disponible

Cible : ~1300 footballeurs RDC dont ~1000 avec TM ID.

Usage :
  python discover_wikidata.py [--dry-run]

Variables d'env :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
import unicodedata
from typing import Optional

import requests

from supabase_client import SupabaseClient

JOB_NAME = "discover-wikidata"

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"

# Q974 = République démocratique du Congo
# Q937857 = footballeur
# Q5 = humain
# P19 = lieu de naissance
# P27 = nationalité
# P2446 = Transfermarkt ID
# P31 = instance of
# P106 = profession

SPARQL_QUERY = """
SELECT DISTINCT ?player ?playerLabel ?birthPlaceLabel ?countryOfCitizenshipLabel ?tmId WHERE {
  ?player wdt:P31 wd:Q5 ;
          wdt:P106 wd:Q937857 .
  {
    ?player wdt:P19 ?birthPlace .
    ?birthPlace wdt:P17 wd:Q974 .
  } UNION {
    ?player wdt:P27 wd:Q974 .
  }
  OPTIONAL { ?player wdt:P19 ?birthPlace . }
  OPTIONAL { ?player wdt:P27 ?countryOfCitizenship . }
  OPTIONAL { ?player wdt:P2446 ?tmId . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 5000
"""


def slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def fetch_wikidata() -> list:
    """Run SPARQL query, return list of player dicts."""
    print("Querying Wikidata SPARQL...")
    headers = {
        "Accept": "application/sparql-results+json",
        "User-Agent": "leopards-radar-scraper/1.0 (alexandre@withkaira.com)",
    }
    r = requests.get(
        WIKIDATA_SPARQL,
        params={"query": SPARQL_QUERY},
        headers=headers,
        timeout=120,
    )
    r.raise_for_status()
    data = r.json()
    rows = data.get("results", {}).get("bindings", [])
    print(f"Wikidata returned {len(rows)} rows")

    players = []
    for r in rows:
        wd_uri = r.get("player", {}).get("value", "")
        wikidata_id = wd_uri.rsplit("/", 1)[-1] if wd_uri else None
        name = r.get("playerLabel", {}).get("value", "")
        # Skip si le label est juste l'ID Q12345 (pas de label en EN)
        if not name or name.startswith("Q") and name[1:].isdigit():
            continue
        tm_id = r.get("tmId", {}).get("value")
        birth_place = r.get("birthPlaceLabel", {}).get("value")
        citizenship = r.get("countryOfCitizenshipLabel", {}).get("value")
        players.append({
            "wikidata_id": wikidata_id,
            "name": name,
            "transfermarkt_id": tm_id,
            "birth_place": birth_place,
            "citizenship": citizenship,
        })
    return players


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Discover via Wikidata SPARQL ===")
    print(f"Start : {started_at.isoformat()}Z | Dry run : {args.dry_run}")

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK")

    # 1. Fetch Wikidata
    wd_players = fetch_wikidata()
    with_tm = [p for p in wd_players if p["transfermarkt_id"]]
    without_tm = [p for p in wd_players if not p["transfermarkt_id"]]
    print(f"  → {len(with_tm)} avec TM ID")
    print(f"  → {len(without_tm)} sans TM ID")

    # 2. Charger les TM IDs déjà en base (paginer)
    print("Chargement TM IDs déjà en base...")
    existing_tm_ids = set()
    offset = 0
    page_size = 1000
    while True:
        batch = sb.select("players", select="transfermarkt_id", limit=str(page_size), offset=str(offset))
        if not batch:
            break
        existing_tm_ids.update(p["transfermarkt_id"] for p in batch if p.get("transfermarkt_id"))
        if len(batch) < page_size:
            break
        offset += page_size
    print(f"  → {len(existing_tm_ids)} TM IDs déjà en DB")

    # 3. Filtrer les nouveaux (uniquement ceux avec TM ID, on ignore les sans-TM pour l'instant)
    new = [p for p in with_tm if p["transfermarkt_id"] not in existing_tm_ids]
    print(f"Nouveaux à insérer : {len(new)}")

    if args.dry_run:
        print("Dry run — sample 5 nouveaux :")
        for p in new[:5]:
            print(f"  TM {p['transfermarkt_id']:>10} | {p['name'][:30]:30} | né à {p['birth_place'] or '?'}")
        return

    # 4. Insertion bulk
    inserted = 0
    for batch_start in range(0, len(new), 200):
        batch = new[batch_start:batch_start + 200]
        rows = []
        for p in batch:
            # Si né en RDC : base BIRTH HIGH directement (Wikidata est sourcé)
            evidence = []
            if p["birth_place"]:
                evidence.append(f"Born in {p['birth_place']} per Wikidata")
            if p["citizenship"]:
                evidence.append(f"Citizenship: {p['citizenship']} per Wikidata")
            evidence_str = ". ".join(evidence) if evidence else "Discovered via Wikidata SPARQL"

            rows.append({
                "name": p["name"],
                "slug": slugify(p["name"]) or f"wd-{p['wikidata_id']}",
                "transfermarkt_id": p["transfermarkt_id"],
                "player_category": "radar",
                "eligibility_status": "potentially_eligible",
                "eligibility_note": f"Découvert via Wikidata. {evidence_str}.",
                "verified": False,
                "nationalities": ["DR Congo"] + ([p["citizenship"]] if p["citizenship"] and p["citizenship"] != "Democratic Republic of the Congo" else []),
                "country_of_birth": p["birth_place"] if p["birth_place"] and "congo" in p["birth_place"].lower() else None,
                "source_urls": [f"https://www.wikidata.org/wiki/{p['wikidata_id']}", f"https://www.transfermarkt.com/-/profil/spieler/{p['transfermarkt_id']}"],
            })
        result = sb.insert("players", rows, on_conflict="transfermarkt_id")
        if result:
            inserted += len(result)
            print(f"  batch {batch_start // 200 + 1}: +{len(result)} inserted (cumul {inserted})")

    finished_at = dt.datetime.utcnow()
    duration = int((finished_at - started_at).total_seconds())
    print(f"\nDurée : {duration}s | Insérés : {inserted}")

    # 5. Log
    sb.insert("sync_logs", {
        "job_name": JOB_NAME,
        "status": "success",
        "players_processed": len(new),
        "players_updated": 0,
        "candidates_discovered": inserted,
        "errors_count": 0,
        "started_at": started_at.isoformat() + "Z",
        "finished_at": finished_at.isoformat() + "Z",
        "duration_seconds": duration,
        "github_run_url": os.environ.get("GITHUB_RUN_URL"),
    })


if __name__ == "__main__":
    main()
