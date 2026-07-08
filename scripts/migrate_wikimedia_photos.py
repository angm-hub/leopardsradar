#!/usr/bin/env python3
"""
Leopards Radar -- Migration des photos hotlinkees Wikimedia vers le storage Supabase.

Pourquoi : Wikimedia rate-limite le hotlinking (HTTP 429 en text/html), que les
navigateurs bloquent ensuite via ORB (ERR_BLOCKED_BY_ORB constate a l'audit du
5 juillet 2026). Les fiches concernees retombent sur l'avatar initiales.
La solution durable : telecharger une fois chaque image (gentiment, 1 req/2s,
User-Agent conforme a la policy Wikimedia) et servir depuis notre bucket
player-photos, comme le fait deja l'edge function batch-migrate-photos pour
les portraits Transfermarkt.

Cible : players dont image_url OU image_url_alt pointe encore vers
upload.wikimedia.org / *.wikipedia.org.

Variables d'env requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Usage :
  python migrate_wikimedia_photos.py [--dry-run] [--limit N]
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
import time
import traceback

import requests

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient

JOB_NAME = "migrate-wikimedia-photos"
BUCKET = "player-photos"
# Policy Wikimedia : User-Agent descriptif avec contact, cadence lente.
UA = "LeopardsRadarBot/1.0 (https://angm-hub.github.io/leopardsradar/; contact via repo angm-hub/leopardsradar) python-requests"
DELAY_S = 2.0


def is_wikimedia(url: str | None) -> bool:
    if not url:
        return False
    return "upload.wikimedia.org" in url or "wikipedia.org" in url or "wikimedia.org" in url


def download(url: str) -> bytes | None:
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=30)
        ct = r.headers.get("Content-Type", "")
        if r.status_code == 200 and ct.startswith("image/"):
            return r.content
        print(f"    HTTP {r.status_code} ({ct}) -> skip")
        return None
    except requests.RequestException as e:
        print(f"    erreur reseau : {e}")
        return None


def upload_to_storage(sb: SupabaseClient, path: str, data: bytes, content_type: str) -> str | None:
    """Upload binaire dans le bucket public, retourne l'URL publique."""
    url = f"{sb.url}/storage/v1/object/{BUCKET}/{path}"
    r = requests.post(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {sb.key}",
            "apikey": sb.key,
            "Content-Type": content_type,
            "x-upsert": "true",
            "Cache-Control": "max-age=604800",
        },
        timeout=60,
    )
    if r.status_code not in (200, 201):
        print(f"    upload KO ({r.status_code}) : {r.text[:120]}")
        return None
    return f"{sb.url}/storage/v1/object/public/{BUCKET}/{path}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=120)
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK")

    players = sb.select(
        "players",
        select="id,name,slug,image_url,image_url_alt",
        **{"or": "(image_url.ilike.*wikimedia*,image_url.ilike.*wikipedia*,image_url_alt.ilike.*wikimedia*,image_url_alt.ilike.*wikipedia*)"},
        order="id.asc",
        limit=str(args.limit),
    )
    print(f"Joueurs avec hotlink Wikimedia : {len(players)}")

    stats = {"processed": 0, "migrated": 0, "errors": 0, "details": []}

    for i, p in enumerate(players, 1):
        stats["processed"] += 1
        try:
            print(f"  [{i:>3}/{len(players)}] {p['name']} (id={p['id']})")
            patch: dict = {}
            for field in ("image_url", "image_url_alt"):
                src = p.get(field)
                if not is_wikimedia(src):
                    continue
                data = download(src)
                time.sleep(DELAY_S)
                if not data:
                    # Lien mort ou throttle persistant : on retire le hotlink,
                    # PlayerAvatar retombe proprement sur l'autre source ou
                    # les initiales, et les pipelines photo rechercheront.
                    patch[field] = None
                    print(f"    {field} : hotlink retire (image irrecuperable)")
                    continue
                ext = "png" if src.lower().endswith(".png") else "jpg"
                ct = "image/png" if ext == "png" else "image/jpeg"
                suffix = "" if field == "image_url" else "-alt"
                path = f"portraits/{p['slug']}{suffix}.{ext}"
                public_url = upload_to_storage(sb, path, data, ct)
                if public_url:
                    patch[field] = public_url
                    print(f"    {field} -> storage OK")
                else:
                    print(f"    {field} : upload KO, hotlink conserve")

            if patch and not args.dry_run:
                sb.update("players", {"id": f"eq.{p['id']}"}, patch)
                stats["migrated"] += 1
            elif patch:
                print(f"    [dry-run] patch = {patch}")
        except Exception as e:  # un joueur en echec ne stoppe pas le batch
            stats["errors"] += 1
            stats["details"].append({"id": p.get("id"), "err": f"{type(e).__name__}: {e}",
                                     "tb": traceback.format_exc()[-300:]})
            print("    ERREUR")

    status = "success" if stats["errors"] == 0 else ("partial" if stats["migrated"] else "failure")
    finished_at = dt.datetime.utcnow()
    if not args.dry_run:
        sb.insert("sync_logs", {
            "job_name": JOB_NAME,
            "status": status,
            "players_processed": stats["processed"],
            "players_updated": stats["migrated"],
            "errors_count": stats["errors"],
            "started_at": started_at.isoformat() + "Z",
            "finished_at": finished_at.isoformat() + "Z",
            "duration_seconds": int((finished_at - started_at).total_seconds()),
            "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        })
    print(f"\n[{JOB_NAME}] {status} : {stats['migrated']}/{stats['processed']} migres, {stats['errors']} erreurs")


if __name__ == "__main__":
    main()
