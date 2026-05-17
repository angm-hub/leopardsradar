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
    #
    # Mode PRIORITY_NO_CLUB (défaut on) — ancienne logique : 100% sans-club.
    # Problème : avec ~1 647 joueurs sans club et BATCH_SIZE=200, le fallback
    # "complète avec les plus vieux" ne se déclenchait JAMAIS. Conséquence :
    # les joueurs avec un club connu (ex. Moutoussamy) n'étaient jamais re-syncés.
    #
    # Nouveau comportement : split 50/50
    #   - 50% du batch (BATCH_SIZE // 2) = joueurs sans club (priorité haute)
    #   - 50% du batch = joueurs les plus vieux toutes catégories (refresh régulier)
    #   - Déduplication : un joueur ne peut apparaître qu'une fois dans le batch
    #
    # PRIORITY_NO_CLUB=false : 100% les plus vieux (mode legacy, inchangé).
    priority_no_club = os.environ.get("PRIORITY_NO_CLUB", "true").lower() == "true"
    if priority_no_club:
        half = BATCH_SIZE // 2

        # Moitié 1 : joueurs sans club, les plus vieux en premier
        no_club = sb.select(
            "players",
            select="id,name,slug,transfermarkt_id,updated_at",
            current_club="is.null",
            order="updated_at.asc.nullsfirst",
            limit=str(half),
        )
        print(f"[mode] PRIORITY_NO_CLUB=true → split {half} sans-club + {BATCH_SIZE - half} oldest")
        print(f"  → sans-club sélectionnés : {len(no_club)}")

        seen = {p["id"] for p in no_club}

        # Moitié 2 : tous les joueurs les plus vieux (include ceux qui ont un club)
        # On demande 2× la cible pour avoir de la marge après déduplication
        need = BATCH_SIZE - len(no_club)
        oldest = sb.select(
            "players",
            select="id,name,slug,transfermarkt_id,updated_at",
            order="updated_at.asc.nullsfirst",
            limit=str(need * 2),
        )
        oldest_picked = []
        for e in oldest:
            if e["id"] not in seen:
                oldest_picked.append(e)
                seen.add(e["id"])
                if len(oldest_picked) >= need:
                    break
        print(f"  → oldest sélectionnés    : {len(oldest_picked)}")

        players = no_club + oldest_picked
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
        "caps_updated": 0,
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

            # GARDE-FOU : si le parsing TM a retourné un nom "Unknown XXX"
            # (= H1 introuvable, parser fail, Cloudflare blocking, etc.),
            # SKIP l'update complete pour ne pas ecraser le nom existant.
            # Incident 2026-05-16 : 500 noms ecrases en "Unknown {id}" suite
            # a un sync Playwright ou CF a bloque silencieusement.
            if not tm_player.name or tm_player.name.startswith("Unknown "):
                stats["errors_count"] += 1
                stats["error_details"].append({
                    "player_id": player["id"],
                    "error": f"name parse failed (got '{tm_player.name}') — skip to preserve existing data",
                })
                continue

            # Construire le patch — name garanti non-Unknown grace au garde-fou
            patch = {
                "name": tm_player.name,
                "date_of_birth": tm_player.date_of_birth,
                "place_of_birth": tm_player.place_of_birth,
                "country_of_birth": tm_player.country_of_birth,
                "height_cm": tm_player.height_cm,
                "foot": tm_player.foot,
                "position": tm_player.position,
                "current_club": tm_player.current_club_name,
                "current_club_id": tm_player.current_club_id,
                "contract_expires": tm_player.contract_expires,
                "market_value_eur": tm_player.market_value_eur,
                "agent": tm_player.agent,
                "image_url": tm_player.image_url,
                "updated_at": dt.datetime.utcnow().isoformat(),
            }
            # Drop None values (don't overwrite with NULL)
            patch = {k: v for k, v in patch.items() if v is not None}

            # Si market_value_eur est mis a jour, tracker aussi market_value_updated_at.
            # Permet de distinguer "jamais sync" (NULL) de "sync recente meme si valeur
            # inchangee" (timestamp present). Verifie aux incident du 17/05/2026 ou les
            # 65 joueurs roster avaient market_value_updated_at=NULL malgre des syncs.
            if "market_value_eur" in patch:
                patch["market_value_updated_at"] = dt.datetime.utcnow().isoformat()

            # Caps RDC — mise à jour SEULEMENT si TM retourne une valeur non-None
            # pour la fédération DR Congo (verein_id 3854).
            # Garde-fous :
            # 1. national_caps is None → parsing échoué ou bloc absent → on ne touche pas
            # 2. national_team_id != "3854" → joueur lié à une autre fédération → on log
            #    sans écraser (le caps_rdc RDC reste intact)
            caps_rdc_updated = False
            if tm_player.national_caps is not None:
                if tm_player.national_team_id == "3854":
                    patch["caps_rdc"] = tm_player.national_caps
                    caps_rdc_updated = True
                else:
                    # Fedération différente affichée dans le data-header — log discret
                    print(f"    [caps] fed={tm_player.national_team_id} (pas RDC) → caps_rdc non modifié")

            sb.update("players", {"id": f"eq.{player['id']}"}, patch)
            stats["players_updated"] += 1

            # Compteur caps_updated + auto-fix des audit_findings pending
            if caps_rdc_updated:
                stats["caps_updated"] += 1
                # Marquer toutes les findings pending pour ce joueur comme auto-fixed
                # (le sync vient de corriger la valeur en base)
                try:
                    today_str = dt.datetime.utcnow().strftime("%Y-%m-%d")
                    pending_findings = sb.select(
                        "caps_audit_findings",
                        **{
                            "player_id": f"eq.{player['id']}",
                            "status": "eq.pending",
                            "select": "id",
                        },
                    )
                    for finding in pending_findings:
                        sb.update(
                            "caps_audit_findings",
                            {"id": f"eq.{finding['id']}"},
                            {
                                "status": "auto-fixed",
                                "reviewed_at": dt.datetime.utcnow().isoformat(),
                                "note": f"Auto-fix from sync-transfermarkt run {today_str}",
                            },
                        )
                    if pending_findings:
                        print(f"    [audit] {len(pending_findings)} finding(s) marquée(s) auto-fixed")
                except Exception as e:
                    # Échec sur l'audit ne bloque pas le sync principal
                    print(f"    ! audit_findings update failed: {e}")

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

    # 2. Recompute eligibilite globale -- DESACTIVE (2026-05-17).
    # La fonction SQL recompute_all_eligibility ne reflete ni le manuel
    # (eligibility_status) ni la realite TM (cap-tied externes). Tant qu elle
    # n est pas refactor, on coupe son execution pour ne pas re-introduire les
    # 579 mismatchs corriges par le bulk UPDATE du 17/05/2026. La source de
    # verite est desormais le champ manuel eligibility_status, copie a la main
    # vers computed_eligibility_status lors des audits manuels.
    # A reactiver quand la fonction SQL aura ete refactor pour consulter
    # caps_other_count + caps_rdc et trancher correctement INELIGIBLE / SELECTED
    # / ELIGIBLE / POTENTIALLY.
    print("\n[eligibility] recompute_all_eligibility skip (cf. patch 2026-05-17)")

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
    print(f"Caps RDC   : {stats['caps_updated']} mis à jour")
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
