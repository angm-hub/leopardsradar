#!/usr/bin/env python3
"""
Enrichissement via FBRef profile page (Playwright = passe Cloudflare).
Extrait current_club + image_url + position depuis le header de la page joueur.

Cible : joueurs avec fbref_id (~355) qui n'ont pas de current_club en BDD.

Usage :
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python enrich_via_fbref.py [--limit 100] [--dry-run]
"""

from __future__ import annotations
import argparse
import os
import re
import sys
import time
import requests
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from bs4 import BeautifulSoup

try:
    from supabase_client import SupabaseClient
except ImportError:
    sys.path.insert(0, ".")
    from supabase_client import SupabaseClient

DELAY_SEC = float(os.environ.get("DELAY_SEC", "2.5"))
PAGE_TIMEOUT_MS = 30000


def parse_fbref_profile(html: str) -> dict:
    """Extrait club + image + position depuis le header FBRef profile."""
    soup = BeautifulSoup(html, "html.parser")
    out = {"club": None, "image_url": None, "position": None}

    # Image
    img = soup.select_one("div.media-item img")
    if img:
        src = img.get("src")
        if src:
            out["image_url"] = src

    # Club + position : info-box block (#meta)
    meta = soup.select_one("#meta")
    if meta:
        # "Club: ..." line
        for p in meta.select("p"):
            text = p.get_text(" ", strip=True)
            if text.lower().startswith("club:"):
                # ex: "Club: Brentford"
                out["club"] = text[5:].strip().strip("·") or None
            elif text.lower().startswith("position:"):
                # ex: "Position: FW (RW, LW)  ▸ Footed: Right"
                m = re.match(r"position:\s*([A-Za-z]+)", text, re.IGNORECASE)
                if m:
                    fbref_pos = m.group(1).upper()
                    # Map FBRef -> Léopards Radar positions
                    if fbref_pos in {"GK"}: out["position"] = "Goalkeeper"
                    elif fbref_pos in {"DF", "DEF", "CB", "FB", "LB", "RB"}: out["position"] = "Defender"
                    elif fbref_pos in {"MF", "MID", "CM", "AM", "DM"}: out["position"] = "Midfield"
                    elif fbref_pos in {"FW", "ST", "RW", "LW", "AT"}: out["position"] = "Attack"

    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK\n", flush=True)

    # Cibles : fbref_id non null + sans current_club
    targets = sb.select(
        "players",
        select="id,name,fbref_id",
        current_club="is.null",
        fbref_id="not.is.null",
        limit=str(args.limit or 1000),
    )
    print(f"Cibles : {len(targets)}\n", flush=True)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
            locale="en-US",
        )
        page = ctx.new_page()

        ok = skip = fail = 0
        for i, p in enumerate(targets, 1):
            fid = p["fbref_id"]
            url = f"https://fbref.com/en/players/{fid}/"
            try:
                page.goto(url, timeout=PAGE_TIMEOUT_MS, wait_until="domcontentloaded")
                title = (page.title() or "").lower()
                if "moment" in title or "instant" in title:
                    try:
                        page.wait_for_function(
                            "() => !document.title.toLowerCase().includes('moment') "
                            "&& !document.title.toLowerCase().includes('instant')",
                            timeout=30000)
                    except PWTimeout:
                        print(f"  [{i:>3}/{len(targets)}] FAIL CF {p['name']} ({fid})", flush=True)
                        fail += 1
                        time.sleep(DELAY_SEC)
                        continue
                html = page.content()
                info = parse_fbref_profile(html)
                if not info["club"] and not info["image_url"]:
                    print(f"  [{i:>3}/{len(targets)}] SKIP {p['name']} (rien à enrichir)", flush=True)
                    skip += 1
                    time.sleep(DELAY_SEC)
                    continue
                patch = {k: v for k, v in info.items() if v}
                if args.dry_run:
                    print(f"  [{i:>3}/{len(targets)}] DRY  {p['name']} → {patch}", flush=True)
                    ok += 1
                else:
                    r = requests.patch(
                        f"{sb.url}/rest/v1/players?id=eq.{p['id']}",
                        headers=sb.headers, json=patch, timeout=20,
                    )
                    if r.status_code >= 400:
                        print(f"  [{i:>3}/{len(targets)}] FAIL patch {r.status_code}", flush=True)
                        fail += 1
                    else:
                        print(f"  [{i:>3}/{len(targets)}] OK   {p['name']} → club={info.get('club')!r}", flush=True)
                        ok += 1
            except Exception as e:
                print(f"  [{i:>3}/{len(targets)}] ERROR {p['name']}: {e}", flush=True)
                fail += 1
            time.sleep(DELAY_SEC)
        browser.close()

    print(f"\n=== Done: {ok} OK, {skip} skip (page vide), {fail} fail ===", flush=True)


if __name__ == "__main__":
    main()
