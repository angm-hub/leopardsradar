#!/usr/bin/env python3
"""
sync_fbref_stats.py — Sprint 3.2 du brief Léopards Radar v3 (2026-05-15).

Scrape les stats StatsBomb publiques de FBRef pour tous les joueurs ayant
un fbref_id (renseigné automatiquement via Wikidata SPARQL en Sprint 3.1).

Cron : dimanche 04h UTC (hebdomadaire). Rate limit FBRef : 4 sec entre
chaque requête. ~355 joueurs × 4 sec = ~24 min — ça passe dans les minutes
GH Actions gratuites.

Stratégie de parsing FBRef :
  - URL : https://fbref.com/en/players/{fbref_id}/
  - Table 'stats_standard_dom_lg' = stats standard saison en cours
    (matchs, minutes, buts, assists, xG, xAG) pour les championnats domestiques
  - Saison ciblée : 2025-2026
  - Tier weighting : déterminé via le nom de la compétition

Fallback graceful : si une page FBRef est down ou que le parsing rate, on
log et on continue — pas de fail global du job.

Update field_freshness.stats_advanced après chaque succès — utilisé par
audit-freshness pour détecter les profils périmés.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from datetime import datetime, timezone

import requests
from bs4 import BeautifulSoup, Comment


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

USER_AGENT = "LeopardsRadar/1.0 (https://angm-hub.github.io/leopardsradar; alexandre@withkaira.com — non-commercial data project)"
DELAY_SEC = 4
SEASON = "2025-2026"

# Mapping ligue → tier (référence brief Sprint 4 méthodologie scoring)
TIER_BY_LEAGUE = {
    "Premier League": 1, "La Liga": 1, "Bundesliga": 1, "Serie A": 1, "Ligue 1": 1,
    "Champions League": 1, "Europa League": 2, "Conference League": 3,
    "Pro League": 2, "Eredivisie": 2, "Primeira Liga": 2, "Süper Lig": 2,
    "Championship": 3, "Ligue 2": 3, "Serie B": 3, "Segunda División": 3, "2. Bundesliga": 3,
    "MLS": 3, "Saudi Pro League": 3,
    "Linafoot": 4, "Botola Pro": 4,
}


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


# ── Récupération des joueurs cibles ─────────────────────────────────────────

def fetch_targets(limit: int | None = None) -> list[dict]:
    """Joueurs ayant un fbref_id renseigné. Tri par level_band desc puis
    market_value desc — on commence par les plus importants pour limiter
    l'impact d'un crash en milieu de cron."""
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


# ── Parsing FBRef ───────────────────────────────────────────────────────────

def fetch_fbref_page(fbref_id: str) -> str | None:
    """Charge la page FBRef d'un joueur. Retourne None si ratée."""
    url = f"https://fbref.com/en/players/{fbref_id}/"
    try:
        r = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=30)
        if r.status_code == 200:
            return r.text
        print(f"  [warn] HTTP {r.status_code} for {fbref_id}", file=sys.stderr)
        return None
    except Exception as exc:
        print(f"  [error] fetch failed {fbref_id}: {exc}", file=sys.stderr)
        return None


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


def extract_standard_stats(html: str) -> list[dict]:
    """Extrait les rows de la table 'Standard Stats' pour la saison cible.

    FBRef encode souvent les tables principales dans des HTML comments pour
    contourner les bots — on doit décommenter avant de parser.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Décommente les tables encodées en commentaires
    for comment in soup.find_all(string=lambda t: isinstance(t, Comment)):
        if "<table" in comment:
            try:
                comment.replace_with(BeautifulSoup(comment, "html.parser"))
            except Exception:
                pass

    # Table cible : stats_standard_dom_lg (ligue domestique uniquement)
    # Fallback : stats_standard
    table = soup.find("table", {"id": "stats_standard_dom_lg"}) or soup.find(
        "table", {"id": "stats_standard"}
    )
    if not table:
        return []

    rows_out = []
    tbody = table.find("tbody")
    if not tbody:
        return []

    for tr in tbody.find_all("tr"):
        if "thead" in tr.get("class", []):
            continue

        season_cell = tr.find("th", {"data-stat": "year_id"}) or tr.find(
            "th", {"data-stat": "season"}
        )
        if not season_cell:
            continue
        season = season_cell.get_text(strip=True)
        if season != SEASON:
            continue

        def cell(stat_name: str) -> str:
            c = tr.find("td", {"data-stat": stat_name})
            return c.get_text(strip=True) if c else ""

        comp = cell("comp_level") or cell("comp_name") or cell("comp")
        comp_clean = re.sub(r"^\d+\.\s*", "", comp).strip()

        rows_out.append({
            "season": season,
            "competition": comp_clean or "Unknown",
            "competition_tier": TIER_BY_LEAGUE.get(comp_clean, 4),
            "matches_played": parse_int(cell("games")) or 0,
            "minutes_played": parse_int(cell("minutes")) or 0,
            "goals": parse_int(cell("goals")) or 0,
            "assists": parse_int(cell("assists")) or 0,
            "xg": parse_float(cell("xg")),
            "xag": parse_float(cell("xg_assist")),
        })

    return rows_out


# ── Persist ─────────────────────────────────────────────────────────────────

def upsert_stats(player_id: int, rows: list[dict]) -> int:
    """UPSERT dans player_stats_advanced. Retourne le nombre de rows écrites."""
    if not rows:
        return 0
    payload = []
    now = datetime.now(timezone.utc).isoformat()
    for r in rows:
        payload.append({
            "player_id": player_id,
            "season": r["season"],
            "competition": r["competition"],
            "competition_tier": r["competition_tier"],
            "matches_played": r["matches_played"],
            "minutes_played": r["minutes_played"],
            "goals": r["goals"],
            "assists": r["assists"],
            "xg": r["xg"],
            "xag": r["xag"],
            "source": "fbref",
            "scraped_at": now,
            "updated_at": now,
        })
    res = supa_request(
        "POST",
        "/rest/v1/player_stats_advanced?on_conflict=player_id,season,competition",
        headers={"Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"},
        json=payload,
    )
    if res.status_code >= 400:
        print(f"  [error] upsert failed pid={player_id}: HTTP {res.status_code} {res.text[:200]}",
              file=sys.stderr)
        return 0
    return len(payload)


def update_freshness(player_id: int, current: dict | None) -> None:
    """Marque players.field_freshness.stats_advanced = {at, src}."""
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
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        supa_request(
            "POST", "/rest/v1/sync_logs",
            headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
            json={
                "job_name": "sync-fbref-stats",
                "status": "success" if errors == 0 else ("partial" if updated > 0 else "error"),
                "ran_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "targets_total": total,
                    "players_updated": updated,
                    "errors": errors,
                    "season": SEASON,
                    "run_url": RUN_URL,
                },
            },
        )
    except Exception as exc:
        print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)


# ── Main ────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Pas d'écriture en BDD")
    ap.add_argument("--limit", type=int, default=None, help="Limite le nombre de joueurs traités")
    ap.add_argument("--player", type=str, default=None, help="ID Supabase d'un joueur unique (test)")
    args = ap.parse_args()

    if not args.dry_run and (not SUPABASE_URL or not SUPABASE_KEY):
        fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes")

    if args.player:
        targets = [{"id": int(args.player), "name": "?", "fbref_id": "?", "field_freshness": {}}]
        # Re-fetch via single query
        r = supa_request("GET", f"/rest/v1/players?id=eq.{args.player}&select=id,name,fbref_id,field_freshness")
        if r.status_code == 200 and r.json():
            targets = r.json()
    else:
        targets = fetch_targets(args.limit)

    if not targets:
        print("[sync-fbref] no targets — exit")
        log_sync(0, 0, 0)
        return 0

    updated = 0
    errors = 0
    rows_total = 0
    print(f"[sync-fbref] starting — {len(targets)} targets, season={SEASON}, delay={DELAY_SEC}s")

    for i, t in enumerate(targets, 1):
        pid = t["id"]
        fbref_id = t.get("fbref_id")
        if not fbref_id:
            continue
        print(f"  [{i}/{len(targets)}] {t.get('name', '?'):40} fbref={fbref_id}")

        html = fetch_fbref_page(fbref_id)
        if not html:
            errors += 1
            time.sleep(DELAY_SEC)
            continue

        try:
            rows = extract_standard_stats(html)
        except Exception as exc:
            print(f"  [error] parse failed: {exc}", file=sys.stderr)
            errors += 1
            time.sleep(DELAY_SEC)
            continue

        if not rows:
            print(f"  [info] no {SEASON} row found")
        elif not args.dry_run:
            n = upsert_stats(pid, rows)
            if n > 0:
                update_freshness(pid, t.get("field_freshness"))
                updated += 1
                rows_total += n
                print(f"  [ok] {n} rows upserted")
            else:
                errors += 1

        time.sleep(DELAY_SEC)

    print(f"\n[sync-fbref] done — {updated}/{len(targets)} players updated, "
          f"{rows_total} rows total, {errors} errors")

    if not args.dry_run:
        log_sync(updated, errors, len(targets))
    return 0 if errors < len(targets) * 0.3 else 1


if __name__ == "__main__":
    sys.exit(main())
