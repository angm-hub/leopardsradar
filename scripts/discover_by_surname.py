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
    # Sélections jeunes EU principales (24)
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
    # Sélections jeunes étendues (Levier 2)
    {"id": "12519",  "name": "Austria U19"},
    {"id": "23488",  "name": "Sweden U19"},
    {"id": "22515",  "name": "Norway U19"},
    {"id": "20902",  "name": "Denmark U19"},
    {"id": "16298",  "name": "Poland U19"},
    {"id": "11946",  "name": "USA U20"},
    {"id": "27261",  "name": "Canada U20"},
    # Clubs académies binationales — historiquement riches en RDC (Levier 3 v3.0)
    # France
    {"id": "86347",  "name": "Charleroi academy"},
    {"id": "7817",   "name": "AJ Auxerre U19"},
    {"id": "12278",  "name": "Le Havre AC U19"},
    {"id": "10826",  "name": "FC Sochaux U19"},
    {"id": "6326",   "name": "PSG U19"},
    {"id": "8058",   "name": "Olympique Marseille U19"},
    {"id": "7874",   "name": "Stade Rennais U19"},
    {"id": "10851",  "name": "FC Nantes U19"},
    {"id": "10849",  "name": "FC Metz U19"},
    {"id": "10873",  "name": "Girondins Bordeaux U19"},
    {"id": "9372",   "name": "Toulouse FC U19"},
    {"id": "12774",  "name": "Stade Reims U19"},
    {"id": "10824",  "name": "RC Lens U19"},
    {"id": "12745",  "name": "AS Saint-Etienne U19"},
    {"id": "9669",   "name": "AS Monaco U19"},
    {"id": "12769",  "name": "Angers SCO U19"},
    {"id": "7875",   "name": "LOSC Lille U19"},
    # England
    {"id": "6945",   "name": "Crystal Palace U23"},
    {"id": "9254",   "name": "Tottenham U23"},
    {"id": "37993",  "name": "Watford U23"},
    {"id": "39336",  "name": "Brighton U23"},
    {"id": "46959",  "name": "Brentford U21"},
    {"id": "38967",  "name": "Bournemouth U21"},
    {"id": "9267",   "name": "West Ham U23"},
    # Switzerland (forte diaspora RDC à Genève/Bâle/Zurich)
    {"id": "5299",   "name": "FC Basel U21"},
    {"id": "5508",   "name": "Young Boys U21"},
    # Pays-Bas (académies importantes)
    {"id": "2824",   "name": "Ajax Amsterdam U19"},
    {"id": "4575",   "name": "PSV Eindhoven U19"},
]


def load_whitelist() -> dict:
    """Charge la whitelist + blacklist + ambiguës depuis le JSON."""
    with open(WHITELIST_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    blacklist = {strip_accents(s).lower() for s in data["blacklist"]}
    high = {strip_accents(s).lower() for s in data["high_confidence"]}
    medium = {strip_accents(s).lower() for s in data["medium_confidence"]}
    low = {strip_accents(s).lower() for s in data["low_confidence_radicals"]}
    ambiguous = set()
    for k, v in data.get("ambiguous_shared_bantu", {}).items():
        if k.startswith("_"):
            continue
        for s in v:
            ambiguous.add(strip_accents(s).lower())
    return {
        "blacklist": blacklist, "high": high, "medium": medium,
        "low": low, "ambiguous": ambiguous,
    }


def verify_via_wikipedia(player_name: str) -> dict:
    """
    Vérification Wikipedia : cherche la page (FR puis EN) du joueur et
    parse l'extract pour mots-clés indiquant l'origine.

    Retourne un dict :
      {
        'verdict': 'CONFIRMED_RDC' | 'OTHER_CONGO' | 'OTHER_AFRICA' | 'NOT_FOUND' | 'AMBIGUOUS',
        'evidence': str,
        'source_url': str | None
      }
    """
    import requests
    headers = {"User-Agent": "leopards-radar-scraper/1.0 (alexandre@withkaira.com)"}

    for lang in ("fr", "en"):
        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{player_name.replace(' ', '_')}"
        try:
            r = requests.get(url, headers=headers, timeout=10)
            if r.status_code != 200:
                continue
            data = r.json()
            extract = (data.get("extract") or "").lower()
            page_url = data.get("content_urls", {}).get("desktop", {}).get("page")
            if not extract:
                continue

            # Mots-clés clairement RDC
            rdc_kw_strict = [
                "republique democratique du congo", "république démocratique du congo",
                "democratic republic of the congo", "kinshasa", "lubumbashi",
                "rd congo", "drc ", "drcongo", "ex-zaire", "ex-zaïre",
            ]
            # Mots-clés Congo-Brazza
            brazza_kw = [
                "republique du congo", "république du congo",
                "republic of the congo", "brazzaville", "congo-brazzaville",
            ]
            # Autres pays partageant patronymes bantu
            other_kw = [
                "angolais", "angolan", "angola",
                "camerounais", "cameroonian", "cameroon",
                "rwandais", "rwandan", "rwanda",
                "burundais", "burundian", "burundi",
                "ghanaian", "ghanéen", "ghana",
                "nigerian", "nigérian", "nigeria",
            ]

            rdc_hits = sum(kw in extract for kw in rdc_kw_strict)
            brazza_hits = sum(kw in extract for kw in brazza_kw)
            other_hits = sum(kw in extract for kw in other_kw)

            # Decision logic
            if rdc_hits > 0 and brazza_hits == 0:
                return {
                    "verdict": "CONFIRMED_RDC",
                    "evidence": extract[:300],
                    "source_url": page_url,
                }
            if brazza_hits > rdc_hits:
                return {
                    "verdict": "OTHER_CONGO",
                    "evidence": extract[:300],
                    "source_url": page_url,
                }
            if other_hits > 0 and rdc_hits == 0:
                return {
                    "verdict": "OTHER_AFRICA",
                    "evidence": extract[:300],
                    "source_url": page_url,
                }
            if rdc_hits > 0 and brazza_hits > 0:
                return {
                    "verdict": "AMBIGUOUS",
                    "evidence": extract[:300],
                    "source_url": page_url,
                }
        except Exception as e:
            continue

    return {"verdict": "NOT_FOUND", "evidence": "", "source_url": None}


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
    Confidence : 'HIGH' / 'MEDIUM' / 'LOW' / 'AMBIGUOUS' / None

    AMBIGUOUS = patronyme partagé avec autre pays bantu — déclenche
    la vérification Wikipedia obligatoire.
    """
    if not surname or len(surname) < 4:
        return False, None
    if surname in wl["blacklist"]:
        return False, None
    if surname in wl["ambiguous"]:
        return True, "AMBIGUOUS"
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

    # 4. Vérification Wikipedia automatique pour chaque candidat
    print(f"\n=== Vérification Wikipedia pour {len(all_candidates)} candidats ===")
    verified_rdc = []
    rejected_other_congo = []
    rejected_other_africa = []
    not_found_or_ambiguous = []

    for tm_id, c in all_candidates.items():
        wiki = verify_via_wikipedia(c["name"])
        c["wiki_verdict"] = wiki["verdict"]
        c["wiki_evidence"] = wiki["evidence"]
        c["wiki_url"] = wiki["source_url"]

        if wiki["verdict"] == "CONFIRMED_RDC":
            verified_rdc.append(c)
            print(f"  ✓ {c['name']:30} | RDC confirmé via Wikipedia")
        elif wiki["verdict"] == "OTHER_CONGO":
            rejected_other_congo.append(c)
            print(f"  ✗ {c['name']:30} | Congo-Brazza détecté → reject")
        elif wiki["verdict"] == "OTHER_AFRICA":
            rejected_other_africa.append(c)
            print(f"  ✗ {c['name']:30} | Autre pays africain détecté → reject")
        else:
            not_found_or_ambiguous.append(c)
            verdict_str = "non trouvé" if wiki["verdict"] == "NOT_FOUND" else "ambigu"
            # On garde si confidence HIGH (whitelist forte) MÊME si Wikipedia muet
            if c["confidence"] == "HIGH":
                verified_rdc.append(c)
                print(f"  ? {c['name']:30} | Wiki {verdict_str}, gardé (HIGH whitelist)")
            else:
                print(f"  ? {c['name']:30} | Wiki {verdict_str}, skip (confiance {c['confidence']})")

    print(f"\nRépartition après vérification :")
    print(f"  ✓ RDC confirmé              : {len(verified_rdc)}")
    print(f"  ✗ Congo-Brazza détecté      : {len(rejected_other_congo)}")
    print(f"  ✗ Autre pays africain       : {len(rejected_other_africa)}")
    print(f"  ? Non trouvé / Ambigu       : {len(not_found_or_ambiguous) - sum(1 for c in not_found_or_ambiguous if c['confidence'] == 'HIGH')}")

    # 5. INSERT en base UNIQUEMENT les confirmés RDC
    inserted = 0
    rows = []
    for c in verified_rdc:
        wiki_note = ""
        if c["wiki_url"]:
            wiki_note = f" Wikipedia ({c['wiki_verdict']}) : {c['wiki_url']}"
        rows.append({
            "name": c["name"],
            "slug": slugify(c["name"]) or f"surname-{c.get('transfermarkt_id') or 'unknown'}",
            "transfermarkt_id": [tid for tid, ca in all_candidates.items() if ca == c][0],
            "player_category": "radar",
            "eligibility_status": "potentially_eligible",
            "eligibility_note": f"BINATIONAL INVISIBLE — découvert via {c['source_team_name']} (patronyme '{c['surname']}', confiance {c['confidence']}).{wiki_note} À vérifier manuellement (origine RDC à confirmer).",
            "verified": False,
            "nationalities": ["DR Congo"],
            "source_urls": [c["profile_url"]] + ([c["wiki_url"]] if c["wiki_url"] else []),
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
    return {"HIGH": 3, "AMBIGUOUS": 2.5, "MEDIUM": 2, "LOW": 1, None: 0}[c]


if __name__ == "__main__":
    main()
