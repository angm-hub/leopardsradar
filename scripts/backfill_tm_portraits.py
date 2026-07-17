#!/usr/bin/env python3
"""
Leopards Radar -- Backfill des portraits Transfermarkt vers le storage Supabase.

Cible : joueurs ACTIFS sans aucune photo (image_url ET image_url_alt nuls)
mais avec un transfermarkt_id numerique (243 fiches au 2026-07-09).
Pour chacun : page profil TM -> og:image (portrait officiel) -> upload dans
le bucket player-photos -> players.image_url.

Meme approche que l'edge function batch-migrate-photos, mais executable en
GitHub Action avec la cle service (l'edge function exige un JWT admin).
Cadence lente (1 req / 2,5 s) pour rester sous les radars TM.

Variables d'env requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Usage :
  python backfill_tm_portraits.py [--dry-run] [--limit N]
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
import time
import traceback

import requests

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient

JOB_NAME = "backfill-tm-portraits"
BUCKET = "player-photos"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
DELAY_S = 2.5
# Miroirs TM : .com bloque souvent les runners CI, les TLD regionaux moins.
TM_HOSTS = ["www.transfermarkt.us", "www.transfermarkt.co.uk", "www.transfermarkt.com.tr"]


def find_tm_portrait(tm_id: str) -> bytes | None:
    """Page profil TM -> og:image -> octets de l'image (None si echec)."""
    for host in TM_HOSTS:
        try:
            r = requests.get(
                f"https://{host}/a/profil/spieler/{tm_id}",
                headers={"User-Agent": UA, "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8"},
                timeout=30, allow_redirects=True,
            )
            if r.status_code != 200:
                continue
            m = re.search(r'<meta property="og:image" content="([^"]+)"', r.text)
            if not m:
                m = re.search(r'<img[^>]+class="[^"]*data-header__profile-image[^"]*"[^>]*src="([^"]+)"', r.text)
            if not m:
                continue
            img_url = m.group(1)
            # Le portrait par defaut TM (silhouette) ne vaut rien : skip.
            if "default" in img_url or "photo-missing" in img_url:
                return None
            ir = requests.get(img_url, headers={"User-Agent": UA, "Referer": f"https://{host}/"}, timeout=30)
            if ir.status_code == 200 and ir.headers.get("Content-Type", "").startswith("image/"):
                return ir.content
        except requests.RequestException:
            continue
    return None


def upload_to_storage(sb: SupabaseClient, path: str, data: bytes) -> str | None:
    url = f"{sb.url}/storage/v1/object/{BUCKET}/{path}"
    r = requests.post(
        url, data=data,
        headers={
            "Authorization": f"Bearer {sb.key}", "apikey": sb.key,
            "Content-Type": "image/jpeg", "x-upsert": "true",
            "Cache-Control": "max-age=604800",
        },
        timeout=60,
    )
    if r.status_code not in (200, 201):
        print(f"    upload KO ({r.status_code}) : {r.text[:100]}")
        return None
    return f"{sb.url}/storage/v1/object/public/{BUCKET}/{path}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=130)
    # scope=value : les plus valorisees d'abord (backlog historique).
    # scope=recent : les fiches les plus recemment creees d'abord. A utiliser
    # apres une vague d'ingestion (nouvelles fiches a valeur marchande nulle,
    # sinon reléguées en fin de file par le tri par valeur et jamais atteintes).
    parser.add_argument("--scope", choices=["value", "recent"], default="value")
    args = parser.parse_args()

    order_by = ("created_at.desc.nullslast" if args.scope == "recent"
                else "market_value_eur.desc.nullslast,player_category.asc")

    started_at = dt.datetime.utcnow()
    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK")

    players = sb.select(
        "players",
        select="id,name,slug,transfermarkt_id",
        **{
            "archived": "not.is.true",
            "image_url": "is.null",
            "image_url_alt": "is.null",
            "transfermarkt_id": "not.is.null",
        },
        order=order_by,
        limit=str(args.limit),
    )
    players = [p for p in players if (p.get("transfermarkt_id") or "").isdigit()]
    print(f"Joueurs sans photo avec TM id : {len(players)}")

    stats = {"processed": 0, "updated": 0, "not_found": 0, "errors": 0}
    for i, p in enumerate(players, 1):
        stats["processed"] += 1
        try:
            print(f"  [{i:>3}/{len(players)}] {p['name']} (TM {p['transfermarkt_id']})", end=" ... ")
            data = find_tm_portrait(p["transfermarkt_id"])
            time.sleep(DELAY_S)
            if not data:
                stats["not_found"] += 1
                print("pas de portrait")
                continue
            public_url = upload_to_storage(sb, f"portraits/{p['slug']}.jpg", data)
            if not public_url:
                stats["errors"] += 1
                continue
            if not args.dry_run:
                sb.update("players", {"id": f"eq.{p['id']}"}, {"image_url": public_url})
            stats["updated"] += 1
            print("OK")
        except Exception:
            stats["errors"] += 1
            print("ERREUR")
            traceback.print_exc()

    status = "success" if stats["errors"] == 0 else ("partial" if stats["updated"] else "failure")
    finished_at = dt.datetime.utcnow()
    if not args.dry_run:
        sb.insert("sync_logs", {
            "job_name": JOB_NAME, "status": status,
            "players_processed": stats["processed"], "players_updated": stats["updated"],
            "errors_count": stats["errors"],
            "started_at": started_at.isoformat() + "Z",
            "finished_at": finished_at.isoformat() + "Z",
            "duration_seconds": int((finished_at - started_at).total_seconds()),
            "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        })
    print(f"\n[{JOB_NAME}] {status} : {stats['updated']} photos posees, "
          f"{stats['not_found']} sans portrait TM, {stats['errors']} erreurs")


if __name__ == "__main__":
    main()
