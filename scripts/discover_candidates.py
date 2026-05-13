#!/usr/bin/env python3
"""
Léopards Radar — Découverte mensuelle de nouveaux candidats RDC sur Transfermarkt.

Logique :
  1. Crawl la page Transfermarkt qui liste les joueurs avec nationalité RDC
     (`land_id=140`, jusqu'à 10 pages = 250 candidats)
  2. Pour chaque candidat NON présent dans `players`, on insère un row minimal
     en `player_category = 'radar'` + `verified = false`
  3. Fetch le profil complet pour ces nouveaux candidats (rate-limit appliqué)
  4. Log dans `sync_logs`

Variables d'environnement requises : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import datetime as dt
import os
import sys
import time
import traceback
from typing import Optional

from supabase_client import SupabaseClient
from transfermarkt_client import TransfermarktClient

RATE_LIMIT = float(os.environ.get("RATE_LIMIT_SECONDS", "3.0"))
MAX_NEW_CANDIDATES = int(os.environ.get("MAX_NEW_CANDIDATES", "50"))
JOB_NAME = "discover-rdc-candidates"


def slugify(name: str) -> str:
    """Slug-friendly version of a player name."""
    import re
    import unicodedata
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def main():
    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Discover RDC candidates ===")
    print(f"Start : {started_at.isoformat()}Z")

    sb = SupabaseClient()
    tm = TransfermarktClient(rate_limit_seconds=RATE_LIMIT)

    # 1. Charger les TM IDs déjà en base
    existing = sb.select("players", select="transfermarkt_id", limit="2000")
    existing_ids = {p["transfermarkt_id"] for p in existing if p.get("transfermarkt_id")}
    print(f"Joueurs déjà en DB : {len(existing_ids)}")

    # 2. Découverte
    print(f"Crawl Transfermarkt RDC pool...")
    try:
        candidates = tm.discover_rdc_pool()
    except RuntimeError as e:
        print(f"!!! Ban signal: {e}")
        sb.insert("sync_logs", {
            "job_name": JOB_NAME,
            "status": "failure",
            "started_at": started_at.isoformat() + "Z",
            "finished_at": dt.datetime.utcnow().isoformat() + "Z",
            "error_details": [{"global_error": str(e)}],
        })
        sys.exit(1)

    print(f"Candidats trouvés : {len(candidates)}")

    new_candidates = [c for c in candidates if c["transfermarkt_id"] not in existing_ids][:MAX_NEW_CANDIDATES]
    print(f"Nouveaux candidats (≤ {MAX_NEW_CANDIDATES}) : {len(new_candidates)}")

    # 3. Pour chaque nouveau candidat, fetch profile complet et INSERT
    inserted = 0
    errors = []
    for i, cand in enumerate(new_candidates, 1):
        try:
            tm_id = cand["transfermarkt_id"]
            print(f"  [{i:>3}/{len(new_candidates)}] {cand['name']} (TM {tm_id})")

            tm_player = tm.fetch_player_profile(tm_id)
            if not tm_player:
                errors.append({"tm_id": tm_id, "error": "fetch_profile returned None"})
                continue

            row = {
                "name": tm_player.name,
                "slug": slugify(tm_player.name),
                "transfermarkt_id": tm_id,
                "date_of_birth": tm_player.date_of_birth,
                "place_of_birth": tm_player.place_of_birth,
                "country_of_birth": tm_player.country_of_birth,
                "height_cm": tm_player.height_cm,
                "foot": tm_player.foot,
                "position": tm_player.position,
                "current_club": tm_player.current_club_name,
                "contract_expires": tm_player.contract_expires,
                "market_value_eur": tm_player.market_value_eur,
                "agent": tm_player.agent,
                "image_url": tm_player.image_url,
                "nationalities": tm_player.nationalities,
                "player_category": "radar",
                "eligibility_status": "potentially_eligible",
                "eligibility_note": "Découvert automatiquement via Transfermarkt RDC pool. À instruire.",
                "verified": False,
                "source_urls": [tm_player.profile_url],
            }
            result = sb.insert("players", row, on_conflict="transfermarkt_id")
            if result:
                inserted += 1
        except RuntimeError as e:
            if "ban signal" in str(e).lower():
                print(f"!!! Ban signal détecté, arrêt.")
                errors.append({"global_error": str(e)})
                break
            raise
        except Exception as e:
            errors.append({
                "tm_id": cand.get("transfermarkt_id"),
                "error": f"{type(e).__name__}: {e}",
                "traceback": traceback.format_exc()[-500:],
            })

    finished_at = dt.datetime.utcnow()
    duration_seconds = int((finished_at - started_at).total_seconds())
    status = "success" if not errors else ("partial" if inserted > 0 else "failure")

    sb.insert("sync_logs", {
        "job_name": JOB_NAME,
        "status": status,
        "players_processed": len(new_candidates),
        "players_updated": 0,
        "candidates_discovered": inserted,
        "errors_count": len(errors),
        "error_details": errors[:50],
        "started_at": started_at.isoformat() + "Z",
        "finished_at": finished_at.isoformat() + "Z",
        "duration_seconds": duration_seconds,
        "github_run_url": os.environ.get("GITHUB_RUN_URL"),
    })

    print(f"\n=== Récap ===")
    print(f"Status     : {status}")
    print(f"Découverts : {len(new_candidates)}")
    print(f"Insérés    : {inserted}")
    print(f"Erreurs    : {len(errors)}")
    print(f"Durée      : {duration_seconds}s")


if __name__ == "__main__":
    main()
