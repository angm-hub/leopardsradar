#!/usr/bin/env python3
"""
sync_understat.py — Sprint 3C du brief Léopards Radar v3 (2026-05-15).

Source alternative à FBRef pour les stats xG/xA fiables. Couvre les
6 ligues européennes du top : EPL, La Liga, Bundesliga, Serie A,
Ligue 1, RFPL — soit ~3200 joueurs scannés. Pour chaque ligue, fetch
le JSON via l'endpoint AJAX /main/getPlayersStats/ puis match par nom
contre players.

Avantages vs FBRef :
  - Pas de Cloudflare, requests simple suffit
  - Endpoint JSON direct, pas de parsing HTML
  - Données xG/xA très fiables (même source que les graphes shot maps)

Limitations :
  - 6 ligues seulement (pas Pro League / Eredivisie / Championship)
  - Pas de stats défensives ni de pressings — uniquement offensif

Stats inserées dans player_stats_advanced :
  matches, minutes, goals, assists, xG, xAG, key_passes
  (source = 'understat')

Cron : dimanche 03h30 UTC (après transfermarkt 02h, avant fbref 04h).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
import unicodedata
from datetime import datetime, timezone

import requests


def _normalize_supabase_url(raw: str) -> str:
    s = (raw or "").strip().rstrip("/")
    for suffix in ("/rest/v1", "/rest", "/api"):
        if s.endswith(suffix):
            s = s[: -len(suffix)].rstrip("/")
    return s


SUPABASE_URL = _normalize_supabase_url(os.environ.get("SUPABASE_URL", ""))
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
RUN_URL = os.environ.get("GITHUB_RUN_URL", "")

SEASON_DB = "2025-2026"           # Format BDD player_stats_advanced
SEASON_UNDERSTAT = "2025"         # Understat dénote la saison par l'année du début
DELAY_SEC = 2

LEAGUES = [
    ("EPL",        "Premier League", 1),
    ("La_Liga",    "La Liga",        1),
    ("Bundesliga", "Bundesliga",     1),
    ("Serie_A",    "Serie A",        1),
    ("Ligue_1",    "Ligue 1",        1),
    ("RFPL",       "RFPL",           2),
]

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def fail(msg: str, code: int = 1) -> None:
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(code)


def normalize_name(s: str) -> str:
    if not s:
        return ""
    nfd = unicodedata.normalize("NFD", s)
    no_acc = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Z0-9 ]+", " ", no_acc.lower())).strip()


def supa_request(method: str, path: str, **kwargs) -> requests.Response:
    headers = kwargs.pop("headers", {})
    headers.update({
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    })
    return requests.request(method, f"{SUPABASE_URL}{path}",
                            headers=headers, timeout=60, **kwargs)


# ── Fetch Understat ─────────────────────────────────────────────────────────

def fetch_league_players(league_code: str) -> list[dict]:
    """Récupère tous les joueurs de la ligue × saison via l'endpoint AJAX."""
    r = requests.post(
        "https://understat.com/main/getPlayersStats/",
        data=f"league={league_code}&season={SEASON_UNDERSTAT}",
        headers={
            "User-Agent": USER_AGENT,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": f"https://understat.com/league/{league_code}/{SEASON_UNDERSTAT}",
        },
        timeout=30,
    )
    if r.status_code != 200:
        print(f"  [warn] understat {league_code} HTTP {r.status_code}", file=sys.stderr)
        return []
    try:
        data = r.json()
    except Exception as exc:
        print(f"  [warn] understat {league_code} JSON parse failed: {exc}", file=sys.stderr)
        return []
    return data.get("players", []) if data.get("success") else []


# ── Players cible ───────────────────────────────────────────────────────────

def fetch_players() -> list[dict]:
    """Tous les joueurs avec un nom — index par nom normalisé pour matching."""
    print("[supabase] fetching players")
    all_rows = []
    PAGE = 1000
    for page in range(0, 50):
        r = supa_request(
            "GET",
            "/rest/v1/players?select=id,name,understat_id,date_of_birth&order=id.asc",
            headers={"Range-Unit": "items", "Range": f"{page * PAGE}-{(page + 1) * PAGE - 1}"},
        )
        if r.status_code >= 400:
            fail(f"fetch_players failed: HTTP {r.status_code}")
        rows = r.json()
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < PAGE:
            break
    print(f"[supabase] {len(all_rows)} players")
    return all_rows


# ── Persist ─────────────────────────────────────────────────────────────────

def update_understat_id(player_id: int, understat_id: str) -> bool:
    r = supa_request(
        "PATCH",
        f"/rest/v1/players?id=eq.{player_id}",
        headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
        json={"understat_id": understat_id},
    )
    return r.status_code < 400


def upsert_stats(player_id: int, league_name: str, league_tier: int, p: dict) -> bool:
    """Insère 1 row dans player_stats_advanced (source='understat')."""
    now = datetime.now(timezone.utc).isoformat()

    def to_int(s):
        try:
            return int(str(s).replace(",", "")) if s not in (None, "") else 0
        except (ValueError, TypeError):
            return 0

    def to_float(s):
        try:
            return float(str(s).replace(",", "")) if s not in (None, "") else None
        except (ValueError, TypeError):
            return None

    payload = {
        "player_id": player_id,
        "season": SEASON_DB,
        "competition": league_name,
        "competition_tier": league_tier,
        "matches_played": to_int(p.get("games")),
        "minutes_played": to_int(p.get("time")),
        "goals": to_int(p.get("goals")),
        "assists": to_int(p.get("assists")),
        "xg": to_float(p.get("xG")),
        "xag": to_float(p.get("xA")),
        "key_passes": to_int(p.get("key_passes")),
        "source": "understat",
        "scraped_at": now,
        "updated_at": now,
    }
    r = supa_request(
        "POST",
        "/rest/v1/player_stats_advanced?on_conflict=player_id,season,competition",
        headers={
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=payload,
    )
    if r.status_code >= 400:
        print(f"  [error] upsert pid={player_id} HTTP {r.status_code} {r.text[:150]}",
              file=sys.stderr)
        return False
    return True


def log_sync(updated: int, errors: int, processed: int) -> None:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        supa_request(
            "POST", "/rest/v1/sync_logs",
            headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
            json={
                "job_name": "sync-understat",
                "status": "success" if errors == 0 else ("partial" if updated > 0 else "error"),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "players_processed": processed,
                "players_updated": updated,
                "errors_count": errors,
                "github_run_url": RUN_URL,
            },
        )
    except Exception as exc:
        print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)


# ── Main ────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not args.dry_run and (not SUPABASE_URL or not SUPABASE_KEY):
        fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes")

    players = fetch_players()
    by_norm = {}
    for p in players:
        nm = normalize_name(p.get("name", ""))
        if nm:
            by_norm.setdefault(nm, []).append(p)

    matched = 0
    upserted = 0
    errors = 0
    league_summary = {}

    print(f"[sync-understat] {len(LEAGUES)} ligues × season={SEASON_UNDERSTAT}, "
          f"target={SEASON_DB}, delay={DELAY_SEC}s entre ligues")

    for code, name, tier in LEAGUES:
        understat_players = fetch_league_players(code)
        league_summary[name] = (len(understat_players), 0)
        print(f"  [{name}] {len(understat_players)} joueurs Understat")

        in_league = 0
        for up in understat_players:
            up_name = up.get("player_name", "")
            nm = normalize_name(up_name)
            hits = by_norm.get(nm, [])
            if not hits:
                continue
            chosen = hits[0]  # Si plusieurs : on prend le premier (cas rares)
            pid = chosen["id"]

            if args.dry_run:
                print(f"    [dry] {up_name:30} → pid={pid} ({name})")
                in_league += 1
                continue

            # Update understat_id si manquant
            if not chosen.get("understat_id"):
                update_understat_id(pid, str(up["id"]))
                chosen["understat_id"] = str(up["id"])

            # Upsert stats
            if upsert_stats(pid, name, tier, up):
                upserted += 1
                in_league += 1
            else:
                errors += 1

            matched += 1

        league_summary[name] = (len(understat_players), in_league)
        time.sleep(DELAY_SEC)

    print(f"\n[sync-understat] === Résumé ===")
    for name, (total, hits) in league_summary.items():
        print(f"  {name:18} {hits:3} Léopards / {total} joueurs")
    print(f"  Total : {matched} matchs, {upserted} upserts, {errors} erreurs")

    if not args.dry_run:
        log_sync(upserted, errors, matched)
    return 0


if __name__ == "__main__":
    sys.exit(main())
