#!/usr/bin/env python3
"""
compute_scores.py — Sprint 4 du brief Léopards Radar v3 (2026-05-15).

Recalcule les Léopards Scores hexagonaux pour tous les joueurs scoreables.
Appelle la RPC SQL public.compute_leopards_scores_all() qui itère sur
chaque joueur ayant au moins 1 axe disponible.

Cron : dimanche 10h UTC, après sync-transfermarkt (02h), refresh-levels
(03h, legacy), sync-fbref (04h), sync-matches (06h). Donc les scores
reflètent les données les plus fraîches avant la newsletter du soir.

v1 : utilise les colonnes existantes de players (season_minutes, goals,
assists, market_value_eur, caps_*) — donne des scores partiels
(axes_available 1-4) pour ~293 joueurs. v2 ajoutera les axes positionnels
P1/P2 quand player_stats_advanced sera densifié par le cron sync-fbref.
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

import requests


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
SEASON = "2025-2026"


def fail(msg: str, code: int = 1) -> None:
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(code)


def main() -> int:
    if not SUPABASE_URL or not SUPABASE_KEY:
        fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes")

    print(f"[compute-scores] starting season={SEASON}")
    res = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/compute_leopards_scores_all",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={"p_season": SEASON},
        timeout=300,
    )
    if res.status_code >= 400:
        fail(f"RPC compute_leopards_scores_all failed: HTTP {res.status_code} {res.text[:300]}")

    scored = res.json()
    print(f"[compute-scores] {scored} players scored")

    # Log dans sync_logs
    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/sync_logs",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal",
            },
            json={
                "job_name": "compute-scores",
                "status": "success",
                "ran_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "season": SEASON,
                    "players_scored": scored,
                    "run_url": RUN_URL,
                },
            },
            timeout=15,
        )
    except Exception as exc:
        print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
