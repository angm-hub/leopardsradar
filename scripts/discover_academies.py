#!/usr/bin/env python3
"""
Léopards Radar — Discovery académies U16-U21 / B / Reserves (Sprint diaspora jeunes).

Pourquoi ce script existe :
  Arcial Nzamu Ena (TM 1472856, FC Lorient U17, 16 ans, nom 100% Kikongo)
  n'était pas en BDD. Diagnostic du cas :

  1. discover_candidates.py filtre TM par nationalité RDC déclarée → Arcial
     n'a que France sur sa fiche → invisible.
  2. discover_wikidata.py SPARQL P19/P27 RDC → Arcial 16 ans pas encore sur
     Wikidata → invisible.
  3. discover_by_surname.py scanne les SÉLECTIONS jeunes EU (France U17,
     etc.) → Arcial pas encore appelé en équipe nationale → invisible.
  4. comprehensive_discovery.py méthode A scanne les ROSTERS des clubs pros
     → seul le verein_id 432 était utilisé pour "FC Lorient" mais 432 =
     Chicago Fire FC (vrai FC Lorient = 1158). Bug silencieux qui a fait
     rater toute la diaspora Ligue 1 sur ce mapping cassé. PIRE : même si
     l'ID avait été bon, le roster pro n'inclut PAS les U17.

Ce script comble ce trou :
  - Charge `scripts/data/academy_map.json` (~99 clubs × 4 catégories =
    397 académies U16/U17/U18/U19/U21/B/Reserves/Youth couvrant FR L1+L2,
    BEL Pro League, NL Eredivisie, GER 1+2 Bundesliga, ENG Premier+Champ.)
  - Scrape chaque roster, filtre par patronyme bantou (whitelist v2.2,
    884 HIGH dont Nzamu, Ena, Ngomo, Mukoko, Tshikuna…)
  - Pour chaque hit ET pas déjà en BDD : fetch fiche détaillée TM, insert
    en `players` avec :
      player_category = 'radar'
      eligibility_status = 'potentially_eligible'
      verified = false
      discovery_method = 'academy_scan_2026'
  - Front public exclut `verified=false AND discovery_method LIKE
    'academy_scan%' AND caps_rdc=0` du radar (filtré côté query — voir
    src/lib/players-query.ts).
  - Validation Alexandre par lots avant `verified=true`.

Cron : recommandé mensuel (1er du mois 02h UTC). Wall time ~30 min.
  - 397 rosters × 1.5 sec = ~10 min scrape
  - ~600 hits patronyme × 2 sec = ~20 min fetch détail + insert

Usage local :
  SUPABASE_URL=https://pvpshyoaregroihwglye.supabase.co \\
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
  python discover_academies.py [--dry-run] [--limit 50] [--league L1,L2,BEL1]
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import traceback
import unicodedata
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

from supabase_client import SupabaseClient
from transfermarkt_client import TransfermarktClient

SCRIPTS = Path(__file__).parent
ACADEMY_MAP = SCRIPTS / "data" / "academy_map.json"
WHITELIST = SCRIPTS / "data" / "bantou_surnames.json"

RATE_LIMIT = float(os.environ.get("RATE_LIMIT_SECONDS", "1.5"))
JOB_NAME = "discover-academies"
DISCOVERY_METHOD = "academy_scan_2026"

# Si une académie a des Léopards déjà connus parmi son roster, on peut
# inférer la confiance — mais pas critique en v1.

# Country of birth signals — un joueur U17 né hors Afrique avec patronyme
# bantu HIGH a forte probabilité d'être un descendant de diaspora.
EU_COUNTRIES_HINT = {
    "France", "Belgium", "Netherlands", "Germany", "United Kingdom",
    "Spain", "Italy", "Portugal", "Switzerland", "Austria", "Denmark",
    "Sweden", "Norway", "Finland", "Czech Republic", "Poland", "Greece",
    "Ireland", "Luxembourg", "Iceland",
    "England", "Scotland", "Wales", "Northern Ireland",
}


def strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize(s: str) -> str:
    return strip_accents(s).lower().strip()


def slugify(name: str) -> str:
    s = strip_accents(name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "unknown"


def load_whitelist() -> dict:
    db = json.loads(WHITELIST.read_text(encoding="utf-8"))
    return {
        "blacklist": set(normalize(s) for s in db.get("blacklist", [])),
        "high": set(normalize(s) for s in db.get("high_confidence", [])),
        "med": set(normalize(s) for s in db.get("medium_confidence", [])),
        "low": set(normalize(s) for s in db.get("low_confidence_radicals", [])),
    }


def surname_score(full_name: str, wl: dict) -> Optional[str]:
    """Retourne 'HIGH' / 'MED' / 'LOW' / None selon le matching le plus fort."""
    if not full_name:
        return None
    # Strip parenthèses, ponctuation
    name = re.sub(r"\([^)]+\)", "", full_name).strip()
    parts = [t for t in re.split(r"[\s\-]+", name) if t]
    if not parts:
        return None
    # Try each token after the first (skip prénom)
    best = None
    rank = {"HIGH": 3, "MED": 2, "LOW": 1}
    for tok in parts[1:]:
        if len(tok) < 3:
            continue
        key = normalize(tok)
        if key in wl["blacklist"]:
            return None  # blacklisted, abort
        for tier in ("high", "med", "low"):
            if key in wl[tier]:
                t = tier.upper() if tier != "med" else "MED"
                if not best or rank[t] > rank[best]:
                    best = t
                break
    # Try the LAST token explicitly (often the canonical surname)
    if parts:
        last_key = normalize(parts[-1])
        for tier, tname in (("high", "HIGH"), ("med", "MED"), ("low", "LOW")):
            if last_key in wl[tier]:
                if not best or rank[tname] > rank[best]:
                    best = tname
    return best


def fetch_academy_roster(session: requests.Session, ua: str, verein_id: str,
                         rate_limit: float, last_call: list[float]) -> list[dict]:
    """Scrape un roster d'académie et retourne [{tm_id, name}, ...]."""
    now = time.time()
    wait = rate_limit - (now - last_call[0])
    if wait > 0:
        time.sleep(wait)
    last_call[0] = time.time()

    url = f"https://www.transfermarkt.com/-/startseite/verein/{verein_id}"
    try:
        r = session.get(
            url,
            headers={
                "User-Agent": ua,
                "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
                "DNT": "1",
            },
            timeout=20,
        )
    except requests.RequestException as e:
        print(f"  [{verein_id}] network error: {e}", flush=True)
        return []

    if r.status_code in (403, 429):
        print(f"  [{verein_id}] BAN SIGNAL {r.status_code}, pause 30s", flush=True)
        time.sleep(30)
        return []
    if r.status_code != 200:
        print(f"  [{verein_id}] HTTP {r.status_code}, skip", flush=True)
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    out, seen = [], set()
    for a in soup.select('a[href*="/profil/spieler/"]'):
        m = re.search(r"/profil/spieler/(\d+)", a.get("href", ""))
        if not m:
            continue
        tm_id = m.group(1)
        if tm_id in seen:
            continue
        seen.add(tm_id)
        nm = a.get_text(strip=True)
        if not nm or len(nm) < 2:
            continue
        out.append({"tm_id": tm_id, "name": nm})
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Pas d'écriture en BDD.")
    parser.add_argument("--limit", type=int, default=None, help="Limite le nombre d'académies scannées.")
    parser.add_argument("--league", type=str, default=None,
                        help="CSV des ligues à scanner (ex: L1,L2,BEL1). Sinon : toutes.")
    parser.add_argument("--min-tier", choices=["HIGH", "MED", "LOW"], default="HIGH",
                        help="Niveau minimum de confiance patronyme pour insérer (HIGH par défaut).")
    args = parser.parse_args()

    started = dt.datetime.utcnow()
    print(f"=== {JOB_NAME} ===", flush=True)
    print(f"Started : {started.isoformat()}Z", flush=True)
    print(f"Mode    : dry-run={args.dry_run} limit={args.limit} league={args.league} min_tier={args.min_tier}", flush=True)

    # Load resources
    wl = load_whitelist()
    print(f"Whitelist : {len(wl['high'])} HIGH / {len(wl['med'])} MED / {len(wl['low'])} LOW / "
          f"{len(wl['blacklist'])} blacklist", flush=True)

    if not ACADEMY_MAP.exists():
        print(f"ERREUR : {ACADEMY_MAP} introuvable. Lance d'abord _work/discover_club_and_academies.py", file=sys.stderr)
        sys.exit(2)
    amap = json.loads(ACADEMY_MAP.read_text(encoding="utf-8"))

    # Build list of (club_name, league, academy_id, academy_name, level)
    academies = []
    leagues_filter = set(args.league.split(",")) if args.league else None
    for club_name, cinfo in amap.items():
        if leagues_filter and cinfo["league"] not in leagues_filter:
            continue
        for ac in cinfo["academies"]:
            academies.append({
                "club_name": club_name,
                "league": cinfo["league"],
                "academy_id": ac["id"],
                "academy_name": ac["name"],
                "level": ac["level"],
            })

    if args.limit:
        academies = academies[: args.limit]
    print(f"Académies à scanner : {len(academies)}", flush=True)

    # Supabase
    sb: Optional[SupabaseClient] = None
    existing_ids: set = set()
    if not args.dry_run:
        sb = SupabaseClient()
        sb.ping()
        print("[Supabase] auth OK", flush=True)
        # Pull tous les transfermarkt_id existants (paginer si besoin)
        chunk_size = 1000
        offset = 0
        while True:
            rows = sb.select(
                "players",
                select="transfermarkt_id",
                order="id.asc",
                limit=str(chunk_size),
                offset=str(offset),
            )
            if not rows:
                break
            for r in rows:
                tid = r.get("transfermarkt_id")
                if tid:
                    existing_ids.add(str(tid))
            if len(rows) < chunk_size:
                break
            offset += chunk_size
        print(f"Existing players in DB: {len(existing_ids)}", flush=True)

    # Setup TM scraping session
    session = requests.Session()
    UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15"
    last_call = [0.0]

    tm_client = TransfermarktClient(rate_limit_seconds=RATE_LIMIT)

    # Stats
    stats = {
        "academies_scanned": 0,
        "rosters_total_players": 0,
        "patronyme_hits_high": 0,
        "patronyme_hits_med": 0,
        "patronyme_hits_low": 0,
        "already_in_db": 0,
        "fetched_detail": 0,
        "fetched_detail_fail": 0,
        "inserted": 0,
        "insert_failed": 0,
    }

    min_tier_rank = {"LOW": 1, "MED": 2, "HIGH": 3}[args.min_tier]
    rank = {"HIGH": 3, "MED": 2, "LOW": 1}
    new_candidates = []  # for dry-run report

    for i, ac in enumerate(academies, 1):
        roster = fetch_academy_roster(session, UA, ac["academy_id"], RATE_LIMIT, last_call)
        stats["academies_scanned"] += 1
        stats["rosters_total_players"] += len(roster)
        hits_this_roster = 0

        for player in roster:
            score = surname_score(player["name"], wl)
            if score is None:
                continue
            if score == "HIGH": stats["patronyme_hits_high"] += 1
            elif score == "MED": stats["patronyme_hits_med"] += 1
            else: stats["patronyme_hits_low"] += 1
            if rank[score] < min_tier_rank:
                continue
            if player["tm_id"] in existing_ids:
                stats["already_in_db"] += 1
                continue
            hits_this_roster += 1

            # Fetch detail
            stats["fetched_detail"] += 1
            details = tm_client.fetch_player_details(player["tm_id"])
            if not details:
                stats["fetched_detail_fail"] += 1
                print(f"    [{ac['academy_id']}] FAIL fetch detail {player['tm_id']} ({player['name']})", flush=True)
                continue

            # Build insert payload
            name = details.get("name") or player["name"]
            nationalities = details.get("nationalities", []) or []
            country_of_birth = details.get("country_of_birth")
            is_diaspora_signal = (
                country_of_birth in EU_COUNTRIES_HINT
                or any(n in EU_COUNTRIES_HINT for n in nationalities)
            )

            row = {
                "name": name,
                "slug": slugify(name) + "-" + player["tm_id"][-4:],
                "transfermarkt_id": player["tm_id"],
                "current_club": details.get("current_club_name") or ac["academy_name"],
                "current_club_id": details.get("current_club_id") or ac["academy_id"],
                "date_of_birth": details.get("date_of_birth"),
                "place_of_birth": details.get("place_of_birth"),
                "country_of_birth": country_of_birth,
                "height_cm": details.get("height_cm"),
                "position": details.get("position"),
                "foot": details.get("foot"),
                "nationalities": nationalities,
                "other_nationalities": [n for n in nationalities if n != "DR Congo"],
                "is_binational": "DR Congo" not in nationalities and is_diaspora_signal,
                "market_value_eur": details.get("market_value_eur"),
                "image_url": details.get("image_url"),
                "player_category": "radar",
                "tier": "tier2",
                "eligibility_status": "potentially_eligible",
                "eligibility_note": (
                    f"Découvert via {JOB_NAME} ({started.date()}) — "
                    f"académie {ac['academy_name']} ({ac['league']}), patronyme bantou score {score}. "
                    f"À instruire : base juridique RDC (parent), caps EU U-jeunes, fenêtre de switch FIFA art. 9."
                ),
                "source_urls": [f"https://www.transfermarkt.com/-/profil/spieler/{player['tm_id']}"],
                "discovery_method": DISCOVERY_METHOD,
                "verified": False,
            }
            new_candidates.append({
                "name": name, "tm_id": player["tm_id"], "score": score,
                "academy": ac["academy_name"], "league": ac["league"],
                "dob": details.get("date_of_birth"),
                "country_of_birth": country_of_birth,
                "nationalities": nationalities,
            })

            if args.dry_run:
                print(f"  [DRY] [{score}] {name} ({player['tm_id']}) — "
                      f"{ac['academy_name']} | dob={row['date_of_birth']} cob={country_of_birth} nats={nationalities}", flush=True)
            else:
                res = sb.insert("players", row, on_conflict="transfermarkt_id")
                if res:
                    stats["inserted"] += 1
                    print(f"  [INS] [{score}] {name} ({player['tm_id']}) — {ac['academy_name']}", flush=True)
                    existing_ids.add(player["tm_id"])
                else:
                    stats["insert_failed"] += 1

        if hits_this_roster > 0:
            print(f"  [{i:>3}/{len(academies)}] {ac['academy_name']:40} {ac['level']:6} → "
                  f"+{hits_this_roster} candidat(s) HIGH (roster={len(roster)})", flush=True)
        elif i % 20 == 0:
            print(f"  [{i:>3}/{len(academies)}] progress... (last={ac['academy_name']})", flush=True)

    finished = dt.datetime.utcnow()
    duration = (finished - started).total_seconds()

    print()
    print(f"=== DONE in {duration:.0f}s ===", flush=True)
    for k, v in stats.items():
        print(f"  {k:30} : {v}", flush=True)

    # Persist sync log
    if not args.dry_run and sb:
        try:
            sb.insert("sync_logs", {
                "job_name": JOB_NAME,
                "started_at": started.isoformat() + "Z",
                "finished_at": finished.isoformat() + "Z",
                "duration_seconds": int(duration),
                "players_processed": stats["academies_scanned"],
                "players_updated": stats["inserted"],
                "errors_count": stats["insert_failed"] + stats["fetched_detail_fail"],
                "github_run_url": os.environ.get("GITHUB_RUN_URL"),
            })
        except Exception as e:
            print(f"[sync_logs] insert failed: {e}", file=sys.stderr)

    # Dry-run summary file for review
    if args.dry_run and new_candidates:
        ts = started.strftime("%Y%m%d_%H%M")
        out = SCRIPTS / "data" / "_work" / f"dryrun_academies_{ts}.json"
        out.parent.mkdir(exist_ok=True)
        out.write_text(json.dumps(new_candidates, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"  Dry-run candidates written to {out}", flush=True)


if __name__ == "__main__":
    main()
