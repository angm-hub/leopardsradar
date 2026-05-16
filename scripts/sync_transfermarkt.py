#!/usr/bin/env python3
"""
Léopards Radar — Sync hebdo Transfermarkt (job GitHub Actions cron).

Logique :
  1. Charge les joueurs depuis Supabase, triés par `updated_at` ASC (les plus vieux d'abord)
  2. Limite à BATCH_SIZE par run (par défaut 200) pour rester sous 6h GH Actions
  3. Pour chaque joueur :
     - Fetch profil Transfermarkt (3 sec délai)
     - Update : market_value_eur, current_club, contract_expires, image_url
     - Fetch sélections internationales → upsert dans `selections`
  4. Trigger recompute_all_eligibility() à la fin
  5. Log dans `sync_logs`

Variables d'environnement requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  GITHUB_RUN_URL (optionnel, fourni par GH Actions)
"""

from __future__ import annotations

import datetime as dt
import os
import sys
import time
import traceback

from supabase_client import SupabaseClient
from transfermarkt_client import TransfermarktClient

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "200"))
RATE_LIMIT = float(os.environ.get("RATE_LIMIT_SECONDS", "3.0"))
USE_PLAYWRIGHT = os.environ.get("USE_PLAYWRIGHT", "false").lower() == "true"
JOB_NAME = "sync-transfermarkt"


def main():
    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Sync Transfermarkt ===")
    print(f"Start : {started_at.isoformat()}Z")
    print(f"Batch : {BATCH_SIZE} | Rate : {RATE_LIMIT}s/req")

    sb = SupabaseClient()

    # Sanity check : valider l'auth Supabase AVANT de scraper. Sans ça, le job
    # crash silencieusement après 10 min sans rien logger dans sync_logs.
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"!!! ABORTING: {e}", file=sys.stderr)
        sys.exit(1)

    tm = TransfermarktClient(rate_limit_seconds=RATE_LIMIT, use_playwright=USE_PLAYWRIGHT)
    if USE_PLAYWRIGHT:
        print(f"[mode] USE_PLAYWRIGHT=true → Chromium headless (bypass Cloudflare)")

    # 1. Sélectionner les joueurs à refresh.
    # Mode PRIORITY_NO_CLUB (défaut on) : prioriser les joueurs sans club
    # connu — héritage Wikidata jamais enrichi (~1647 sur 2187). Ces profils
    # bloquent la cartographie par championnat et la revue éditoriale.
    # Désactivable via PRIORITY_NO_CLUB=false pour mode legacy.
    priority_no_club = os.environ.get("PRIORITY_NO_CLUB", "true").lower() == "true"
    if priority_no_club:
        players = sb.select(
            "players",
            select="id,name,slug,transfermarkt_id,updated_at",
            current_club="is.null",
            order="updated_at.asc.nullsfirst",
            limit=str(BATCH_SIZE),
        )
        print(f"[mode] PRIORITY_NO_CLUB=true → {len(players)} joueurs sans club ciblés")
        # Fallback : si moins que BATCH_SIZE, complète avec les plus vieux
        if len(players) < BATCH_SIZE:
            need = BATCH_SIZE - len(players)
            seen = {p["id"] for p in players}
            extra = sb.select(
                "players",
                select="id,name,slug,transfermarkt_id,updated_at",
                order="updated_at.asc.nullsfirst",
                limit=str(need * 2),
            )
            for e in extra:
                if e["id"] not in seen:
                    players.append(e)
                    seen.add(e["id"])
                    if len(players) >= BATCH_SIZE:
                        break
    else:
        players = sb.select(
            "players",
            select="id,name,slug,transfermarkt_id,updated_at",
            order="updated_at.asc.nullsfirst",
            limit=str(BATCH_SIZE),
        )
    players = [p for p in players if p.get("transfermarkt_id")]
    print(f"Joueurs à traiter : {len(players)}")

    stats = {
        "players_processed": 0,
        "players_updated": 0,
        "selections_added": 0,
        "errors_count": 0,
        "error_details": [],
    }

    for i, player in enumerate(players, 1):
        try:
            tm_id = player["transfermarkt_id"]
            print(f"  [{i:>3}/{len(players)}] {player['name']} (TM {tm_id})")

            tm_player = tm.fetch_player_profile(tm_id)
            if not tm_player:
                stats["errors_count"] += 1
                stats["error_details"].append({"player_id": player["id"], "error": "fetch_profile returned None"})
                continue

            # Construire le patch
            patch = {
                "name": tm_player.name or player["name"],
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
                "updated_at": dt.datetime.utcnow().isoformat(),
            }
            # Drop None values (don't overwrite with NULL)
            patch = {k: v for k, v in patch.items() if v is not None}

            sb.update("players", {"id": f"eq.{player['id']}"}, patch)
            stats["players_updated"] += 1

            # Sélections internationales (1 fetch supplémentaire)
            try:
                appearances = tm.fetch_player_national_appearances(tm_id)
                if appearances:
                    rows = [{**a, "player_id": player["id"]} for a in appearances]
                    # On INSERT direct — pas de unique constraint sur selections
                    # Donc on filtre côté serveur les doublons via match (player_id + match_date + competition)
                    existing = sb.select(
                        "selections",
                        **{"player_id": f"eq.{player['id']}", "select": "match_date,competition"}
                    )
                    existing_keys = {(e["match_date"], e["competition"]) for e in existing}
                    new_rows = [
                        r for r in rows
                        if (r["match_date"], r["competition"][:200]) not in existing_keys
                    ]
                    if new_rows:
                        sb.insert("selections", new_rows)
                        stats["selections_added"] += len(new_rows)
            except Exception as e:
                # Échec sur les sélections ne bloque pas le sync du profil
                print(f"    ! selections fetch failed: {e}")

            stats["players_processed"] += 1

        except RuntimeError as e:
            # Signal de ban → on stoppe net
            if "ban signal" in str(e).lower():
                print(f"!!! Ban signal détecté, arrêt du job.")
                stats["error_details"].append({"global_error": str(e)})
                break
            raise
        except Exception as e:
            stats["errors_count"] += 1
            stats["error_details"].append({
                "player_id": player["id"],
                "name": player.get("name"),
                "error": f"{type(e).__name__}: {e}",
                "traceback": traceback.format_exc()[-500:],
            })

    # 2. Recompute éligibilité globale
    try:
        recomputed = sb.rpc("recompute_all_eligibility")
        print(f"\nÉligibilité recalculée pour {recomputed} joueurs.")
    except Exception as e:
        print(f"\n! recompute_all_eligibility failed: {e}")
        stats["error_details"].append({"recompute_error": str(e)})

    # 3. Log final
    finished_at = dt.datetime.utcnow()
    duration_seconds = int((finished_at - started_at).total_seconds())
    log_status = "success" if stats["errors_count"] == 0 else ("partial" if stats["players_updated"] > 0 else "failure")

    sb.insert("sync_logs", {
        "job_name": JOB_NAME,
        "status": log_status,
        "players_processed": stats["players_processed"],
        "players_updated": stats["players_updated"],
        "candidates_discovered": 0,
        "errors_count": stats["errors_count"],
        "error_details": stats["error_details"][:50],  # max 50 erreurs détaillées
        "started_at": started_at.isoformat() + "Z",
        "finished_at": finished_at.isoformat() + "Z",
        "duration_seconds": duration_seconds,
        "github_run_url": os.environ.get("GITHUB_RUN_URL"),
    })

    print(f"\n=== Récap ===")
    print(f"Status     : {log_status}")
    print(f"Processés  : {stats['players_processed']}")
    print(f"Updated    : {stats['players_updated']}")
    print(f"Selections : +{stats['selections_added']}")
    print(f"Erreurs    : {stats['errors_count']}")
    print(f"Durée      : {duration_seconds}s")

    # Cleanup Playwright si actif
    try: tm.close()
    except Exception: pass

    # Exit code non-zero si rien n'a marché
    if stats["players_updated"] == 0 and stats["players_processed"] == 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
