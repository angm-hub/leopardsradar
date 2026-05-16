#!/usr/bin/env python3
"""
sync_fbref_stats.py — Sprint 3.2 du brief Léopards Radar v3.

Scrape les stats StatsBomb publiques de FBRef via Playwright (Chromium
headless). FBRef est passé sur Cloudflare avec protection bot avancée
en 2024 — requests / cloudscraper / curl_cffi sont tous bloqués 403,
seul un vrai navigateur passe le challenge.

Cron : dimanche 04h UTC (hebdomadaire). Délai 4 sec entre chaque page
pour rester correct côté FBRef. ~355 joueurs × (8 sec attente CF +
4 sec délai) = ~70 min — ok dans les 360 min/mois GH Actions free.

Stats v1 : matches, minutes, goals, assists par competition × season
depuis la table stats_standard_dom_lg. Saison cible = 2025-2026.
Tier weighting via mapping ligue. xG/xAG seront ajoutés en v2 depuis
la table stats_shooting_dom_lg.

Update field_freshness.stats_advanced après chaque succès — utilisé
par audit-freshness pour détecter les profils périmés.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout


def _normalize_supabase_url(raw: str) -> str:
    """Strip trailing slashes + suffixes /rest/v1 ou /rest souvent copiés
    par erreur dans le secret. Aligne avec scripts/supabase_client.py."""
    s = (raw or "").strip().rstrip("/")
    for suffix in ("/rest/v1", "/rest", "/api"):
        if s.endswith(suffix):
            s = s[: -len(suffix)].rstrip("/")
    return s


SUPABASE_URL = _normalize_supabase_url(os.environ.get("SUPABASE_URL", ""))
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
RUN_URL = os.environ.get("GITHUB_RUN_URL", "")

DELAY_SEC = 2           # Reduit de 4 a 2 sec — Cloudflare laisse passer
                        # tant que cf_clearance reste valide. Test 18:13 a hit
                        # le timeout 90 min avec 4 sec/page. 2 sec donne ~25 min
                        # de marge sur 355 joueurs.
SEASON = "2025-2026"
CF_WAIT_SEC = 8         # Attente initiale du challenge Cloudflare
PAGE_TIMEOUT_MS = 45000 # Total max par page

# Mapping ligue → tier pour le scoring hexagonal Sprint 4
TIER_BY_LEAGUE = {
    "Premier League": 1, "La Liga": 1, "Bundesliga": 1, "Serie A": 1, "Ligue 1": 1,
    "Champions League": 1, "Europa League": 2, "Conference League": 3,
    "Pro League": 2, "Eredivisie": 2, "Primeira Liga": 2, "Süper Lig": 2,
    "Championship": 3, "Ligue 2": 3, "Serie B": 3, "Segunda División": 3, "2. Bundesliga": 3,
    "MLS": 3, "Saudi Pro League": 3,
    "Linafoot": 4, "Botola Pro": 4,
}

# Script JS exécuté dans la page pour extraire les stats — évite les allers-retours
# Python ↔ DOM. Retourne directement la liste des rows pour la saison cible.
EXTRACT_JS = """
(season) => {
  const std = document.querySelector('table#stats_standard_dom_lg')
           || document.querySelector('table#stats_standard');
  if (!std) return { rows: [], reason: 'no_table' };

  const out = [];
  for (const tr of std.querySelectorAll('tbody tr')) {
    const yearCell = tr.querySelector('th[data-stat="year_id"], th[data-stat="season"]');
    if (!yearCell || yearCell.textContent.trim() !== season) continue;

    const cell = (s) => {
      const c = tr.querySelector(`td[data-stat="${s}"]`);
      return c ? c.textContent.trim() : '';
    };
    out.push({
      season,
      competition: cell('comp_level') || cell('comp_name') || cell('comp'),
      games: cell('games'),
      minutes: cell('minutes'),
      goals: cell('goals'),
      assists: cell('assists'),
      xg: cell('xg'),
      xag: cell('xg_assist'),
    });
  }
  return { rows: out, reason: out.length === 0 ? 'no_season_row' : 'ok' };
}
"""


def fail(msg: str, code: int = 1) -> None:
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(code)


def supa_request(method: str, path: str, **kwargs) -> requests.Response:
    headers = kwargs.pop("headers", {})
    headers.update({
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    })
    return requests.request(method, f"{SUPABASE_URL}{path}",
                            headers=headers, timeout=60, **kwargs)


def parse_int(s: str) -> int | None:
    if not s or s == "—":
        return None
    s = s.strip().replace(",", "").replace(" ", "")
    try:
        return int(s)
    except ValueError:
        return None


def parse_float(s: str) -> float | None:
    if not s or s == "—":
        return None
    s = s.strip().replace(",", "")
    try:
        return float(s)
    except ValueError:
        return None


def clean_competition(name: str) -> str:
    """Strip prefixes Soccerway-style ('1. Premier League' → 'Premier League')."""
    return re.sub(r"^\d+\.\s*", "", name or "").strip() or "Unknown"


# ── Targets ────────────────────────────────────────────────────────────────

def fetch_targets(limit: int | None = None) -> list[dict]:
    print(f"[supabase] fetching players with fbref_id (limit={limit or 'all'})")
    qs = (
        "/rest/v1/players?select=id,name,fbref_id,field_freshness"
        "&fbref_id=not.is.null"
        "&order=level_band.asc.nullslast,market_value_eur.desc.nullslast"
    )
    if limit:
        qs += f"&limit={limit}"
    r = supa_request("GET", qs)
    if r.status_code >= 400:
        fail(f"fetch_targets failed: HTTP {r.status_code} {r.text[:200]}")
    rows = r.json()
    print(f"[supabase] {len(rows)} targets")
    return rows


# ── Persist ─────────────────────────────────────────────────────────────────

def upsert_stats(player_id: int, rows: list[dict]) -> int:
    if not rows:
        return 0
    payload = []
    now = datetime.now(timezone.utc).isoformat()
    for r in rows:
        comp = clean_competition(r["competition"])
        payload.append({
            "player_id": player_id,
            "season": r["season"],
            "competition": comp,
            "competition_tier": TIER_BY_LEAGUE.get(comp, 4),
            "matches_played": parse_int(r["games"]) or 0,
            "minutes_played": parse_int(r["minutes"]) or 0,
            "goals": parse_int(r["goals"]) or 0,
            "assists": parse_int(r["assists"]) or 0,
            "xg": parse_float(r["xg"]),
            "xag": parse_float(r["xag"]),
            "source": "fbref",
            "scraped_at": now,
            "updated_at": now,
        })
    res = supa_request(
        "POST",
        "/rest/v1/player_stats_advanced?on_conflict=player_id,season,competition",
        headers={
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=payload,
    )
    if res.status_code >= 400:
        print(f"  [error] upsert failed pid={player_id}: HTTP {res.status_code} {res.text[:200]}",
              file=sys.stderr)
        return 0
    return len(payload)


def update_freshness(player_id: int, current: dict | None) -> None:
    freshness = dict(current or {})
    freshness["stats_advanced"] = {
        "at": datetime.now(timezone.utc).isoformat(),
        "src": "fbref",
    }
    res = supa_request(
        "PATCH",
        f"/rest/v1/players?id=eq.{player_id}",
        headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
        json={"field_freshness": freshness},
    )
    if res.status_code >= 400:
        print(f"  [warn] freshness update failed pid={player_id}: HTTP {res.status_code}",
              file=sys.stderr)


def log_sync(updated: int, errors: int, total: int) -> None:
    """Insert dans sync_logs avec le schéma réel (started_at/finished_at/...
    pas details/ran_at)."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        supa_request(
            "POST", "/rest/v1/sync_logs",
            headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
            json={
                "job_name": "sync-fbref-stats",
                "status": "success" if errors == 0 else ("partial" if updated > 0 else "error"),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "players_processed": total,
                "players_updated": updated,
                "errors_count": errors,
                "github_run_url": RUN_URL,
            },
        )
    except Exception as exc:
        print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)


# ── Main scraping loop ─────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--limit", type=int, default=None)
    ap.add_argument("--player", type=str, default=None,
                    help="ID Supabase d'un joueur unique (test ciblé)")
    args = ap.parse_args()

    if not args.dry_run and (not SUPABASE_URL or not SUPABASE_KEY):
        fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes")

    if args.player:
        r = supa_request("GET", f"/rest/v1/players?id=eq.{args.player}&select=id,name,fbref_id,field_freshness")
        if r.status_code != 200 or not r.json():
            fail(f"player {args.player} not found")
        targets = r.json()
    else:
        targets = fetch_targets(args.limit)

    if not targets:
        print("[sync-fbref] no targets — exit")
        log_sync(0, 0, 0)
        return 0

    updated = errors = rows_total = 0
    print(f"[sync-fbref] starting — {len(targets)} targets, season={SEASON}, "
          f"playwright headless, delay={DELAY_SEC}s/page")

    with sync_playwright() as pw:
        # Chromium headless avec profil réaliste — passe le challenge Cloudflare
        browser = pw.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            locale="en-US",
        )
        page = context.new_page()

        for i, t in enumerate(targets, 1):
            pid = t["id"]
            fbref_id = t.get("fbref_id")
            if not fbref_id:
                continue
            url = f"https://fbref.com/en/players/{fbref_id}/"
            print(f"  [{i}/{len(targets)}] {t.get('name', '?'):40} fbref={fbref_id}")

            try:
                page.goto(url, timeout=PAGE_TIMEOUT_MS, wait_until="domcontentloaded")

                # Cloudflare : si cf_clearance est valide (cas des pages 2..N
                # de la session), le titre est déjà bon → on saute le wait.
                # Si on est sur un challenge (1ère page de la session ou
                # refresh CF), on attend max 30 sec.
                title = page.title().lower()
                if "moment" in title or "instant" in title:
                    page.wait_for_function(
                        "() => !document.title.toLowerCase().includes('moment') "
                        "&& !document.title.toLowerCase().includes('instant')",
                        timeout=30000,
                    )

                result = page.evaluate(EXTRACT_JS, SEASON)
                rows = result.get("rows", [])
                reason = result.get("reason", "?")

                if not rows:
                    print(f"  [info] no {SEASON} row ({reason})")
                elif not args.dry_run:
                    n = upsert_stats(pid, rows)
                    if n > 0:
                        update_freshness(pid, t.get("field_freshness"))
                        updated += 1
                        rows_total += n
                        print(f"  [ok] {n} rows upserted")
                    else:
                        errors += 1
                else:
                    print(f"  [dry] would upsert {len(rows)} rows: {rows}")

            except PWTimeout:
                print(f"  [error] timeout for {fbref_id}", file=sys.stderr)
                errors += 1
            except Exception as exc:
                print(f"  [error] {fbref_id}: {exc}", file=sys.stderr)
                errors += 1

            time.sleep(DELAY_SEC)

        context.close()
        browser.close()

    print(f"\n[sync-fbref] done — {updated}/{len(targets)} players updated, "
          f"{rows_total} rows total, {errors} errors")

    if not args.dry_run:
        log_sync(updated, errors, len(targets))
    # Exit 0 sauf si > 50% errors (Cloudflare bloque, panique)
    return 0 if errors < len(targets) * 0.5 else 1


if __name__ == "__main__":
    sys.exit(main())
