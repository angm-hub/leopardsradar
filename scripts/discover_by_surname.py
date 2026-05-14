#!/usr/bin/env python3
"""
Léopards Radar — Discovery via crawl sélections jeunes EU + match patronyme bantou.

Cible les "binationaux invisibles" : joueurs avec ascendance RDC qui ne sont
ni dans le pool TM RDC nationality, ni à Linafoot, ni dans Wikidata, ni dans
les sélections jeunes RDC. Mais qui ont un nom de famille à racine bantou-RDC
et jouent dans une sélection jeune européenne.

Méthode :
  1. Crawl rosters des 20+ sélections jeunes EU (FR/BE/CH/NL/EN/DE/IT/ES/PT/IE)
     via TM verein/ pages.
  2. Pour chaque joueur, extraire le nom de famille (dernier mot).
  3. Match contre whitelist bantou (HIGH/MEDIUM/LOW confidence) en excluant
     la blacklist (faux positifs européens).
  4. Insère les matches en base avec verified=FALSE + eligibility_note tag.
"""

from __future__ import annotations

import datetime as dt
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

from supabase_client import SupabaseClient
from transfermarkt_client import TransfermarktClient

JOB_NAME = "discover-by-surname-eu"
RATE_LIMIT = float(os.environ.get("RATE_LIMIT_SECONDS", "3.0"))
WHITELIST_PATH = Path(__file__).parent / "data" / "bantou_surnames.json"

# Catalogue des sélections jeunes EU à crawler (verein IDs TM confirmés)
YOUTH_EU_TEAMS = [
    {"id": "10831",  "name": "France U17"},
    {"id": "25250",  "name": "France U18"},
    {"id": "23101",  "name": "France U19"},
    {"id": "23658",  "name": "France U20"},
    {"id": "9323",   "name": "France U21"},
    {"id": "23219",  "name": "Belgium U17"},
    {"id": "16338",  "name": "Belgium U19"},
    {"id": "9315",   "name": "Belgium U21"},
    {"id": "23140",  "name": "Switzerland U17"},
    {"id": "19429",  "name": "Switzerland U19"},
    {"id": "9534",   "name": "Switzerland U21"},
    {"id": "10933",  "name": "Netherlands U17"},
    {"id": "16341",  "name": "Netherlands U19"},
    {"id": "11944",  "name": "Netherlands U21"},
    {"id": "23260",  "name": "England U17"},
    {"id": "21340",  "name": "England U19"},
    {"id": "9565",   "name": "England U21"},
    {"id": "82768",  "name": "Germany U17"},
    {"id": "5710",   "name": "Germany U19"},
    {"id": "23100",  "name": "Germany U21"},
    {"id": "21426",  "name": "Italy U19"},
    {"id": "12609",  "name": "Spain U19"},
    {"id": "104772", "name": "Portugal U19"},
    {"id": "23102",  "name": "Ireland U19"},
]


def load_whitelist() -> dict:
    """Charge la whitelist + blacklist depuis le JSON."""
    with open(WHITELIST_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    blacklist = {strip_accents(s).lower() for s in data["blacklist"]}
    high = {strip_accents(s).lower() for s in data["high_confidence"]}
    medium = {strip_accents(s).lower() for s in data["medium_confidence"]}
    low = {strip_accents(s).lower() for s in data["low_confidence_radicals"]}
    return {"blacklist": blacklist, "high": high, "medium": medium, "low": low}


def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)
    )


def slugify(name: str) -> str:
    s = strip_accents(name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def extract_surname(full_name: str) -> str:
    """Dernier mot du nom, normalisé pour matching."""
    if not full_name:
        return ""
    parts = full_name.strip().split()
    if not parts:
        return ""
    last = parts[-1]
    last = re.sub(r"[^A-Za-zÀ-ÿ\-]", "", last)
    return strip_accents(last).lower()


def match_surname(surname: str, wl: dict) -> tuple[bool, str]:
    """
    Retourne (is_match, confidence_label).
    Confidence : 'HIGH' / 'MEDIUM' / 'LOW' / None
    """
    if not surname or len(surname) < 4:
        return False, None
    if surname in wl["blacklist"]:
        return False, None
    if surname in wl["high"]:
        return True, "HIGH"
    if surname in wl["medium"]:
        return True, "MEDIUM"
    if surname in wl["low"]:
        return True, "LOW"
    return False, None


def main():
    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Discover via surname EU youth teams ===")
    print(f"Start : {started_at.isoformat()}Z")

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK")

    tm = TransfermarktClient(rate_limit_seconds=RATE_LIMIT)
    wl = load_whitelist()
    print(f"Whitelist : {len(wl['high'])} HIGH + {len(wl['medium'])} MEDIUM + {len(wl['low'])} LOW (blacklist: {len(wl['blacklist'])})")

    # Charger TM IDs déjà en base
    print("Chargement TM IDs en DB...")
    existing_ids = set()
    offset = 0
    while True:
        batch = sb.select("players", select="transfermarkt_id", limit="1000", offset=str(offset))
        if not batch:
            break
        existing_ids.update(p["transfermarkt_id"] for p in batch if p.get("transfermarkt_id"))
        if len(batch) < 1000:
            break
        offset += 1000
    print(f"  → {len(existing_ids)} TM IDs déjà en DB")

    # Crawl chaque sélection jeune EU
    all_candidates: dict = {}  # tm_id → {name, source_team, source_team_name, confidence}
    for team in YOUTH_EU_TEAMS:
        print(f"\n→ {team['name']} (verein/{team['id']})")
        try:
            roster = tm.discover_by_clubs([team["id"]])
        except RuntimeError as e:
            if "ban signal" in str(e).lower():
                print(f"  !!! Ban — arrêt")
                break
            print(f"  !!! Error : {e}")
            continue

        team_match_count = 0
        for player in roster:
            tm_id = player["transfermarkt_id"]
            if tm_id in existing_ids:
                continue  # déjà en base
            surname = extract_surname(player["name"])
            is_match, conf = match_surname(surname, wl)
            if is_match:
                if tm_id not in all_candidates or _conf_rank(conf) > _conf_rank(all_candidates[tm_id]["confidence"]):
                    all_candidates[tm_id] = {
                        "name": player["name"],
                        "source_team": team["id"],
                        "source_team_name": team["name"],
                        "confidence": conf,
                        "surname": surname,
                        "profile_url": player["profile_url"],
                    }
                team_match_count += 1
        print(f"  Matches dans {team['name']} : {team_match_count}")

    print(f"\n=== Total candidats binationaux invisibles : {len(all_candidates)} ===")
    for tm_id, c in list(all_candidates.items())[:20]:
        print(f"  TM {tm_id:>8} | {c['confidence']:6} | {c['name'][:30]:30} | via {c['source_team_name']} | surname='{c['surname']}'")

    # 4. INSERT en base
    inserted = 0
    rows = []
    for tm_id, c in all_candidates.items():
        rows.append({
            "name": c["name"],
            "slug": slugify(c["name"]) or f"surname-{tm_id}",
            "transfermarkt_id": tm_id,
            "player_category": "radar",
            "eligibility_status": "potentially_eligible",
            "eligibility_note": f"BINATIONAL INVISIBLE — découvert via {c['source_team_name']} avec patronyme bantou-RDC '{c['surname']}' (confiance {c['confidence']}). À vérifier manuellement (origine RDC à confirmer).",
            "verified": False,
            "nationalities": ["DR Congo"],  # à valider
            "source_urls": [c["profile_url"]],
        })
        if len(rows) >= 100:
            result = sb.insert("players", rows, on_conflict="transfermarkt_id")
            if result:
                inserted += len(result)
            rows = []
    if rows:
        result = sb.insert("players", rows, on_conflict="transfermarkt_id")
        if result:
            inserted += len(result)

    finished_at = dt.datetime.utcnow()
    duration = int((finished_at - started_at).total_seconds())

    sb.insert("sync_logs", {
        "job_name": JOB_NAME,
        "status": "success",
        "players_processed": len(all_candidates),
        "players_updated": 0,
        "candidates_discovered": inserted,
        "errors_count": 0,
        "started_at": started_at.isoformat() + "Z",
        "finished_at": finished_at.isoformat() + "Z",
        "duration_seconds": duration,
        "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        "error_details": [{"breakdown_by_confidence": {
            "HIGH": sum(1 for c in all_candidates.values() if c["confidence"] == "HIGH"),
            "MEDIUM": sum(1 for c in all_candidates.values() if c["confidence"] == "MEDIUM"),
            "LOW": sum(1 for c in all_candidates.values() if c["confidence"] == "LOW"),
        }}],
    })

    print(f"\nInsérés : {inserted} | Durée : {duration}s")


def _conf_rank(c: str) -> int:
    return {"HIGH": 3, "MEDIUM": 2, "LOW": 1, None: 0}[c]


if __name__ == "__main__":
    main()
