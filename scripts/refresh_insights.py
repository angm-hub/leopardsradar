#!/usr/bin/env python3
"""
refresh_insights.py — refresh hebdo des vues matérialisées Sprint 5.

Sprint 5 du brief Léopards Radar v3 (2026-05-15). Appelle la fonction
SQL public.refresh_sprint5_insights() qui regenère les 3 vues :
  - mv_eligibility_pipeline
  - mv_club_concentration
  - mv_profile_insights

Tourne le dimanche à 14h UTC, après les syncs Transfermarkt (02h) +
match snapshots (06h) + level bands (03h) — donc les vues reflètent
l'état le plus frais possible avant le récap du dimanche soir.

Utilise la SERVICE_ROLE_KEY (pas anon) car la fonction de refresh
est verrouillée pour anon/authenticated (REVOKE EXECUTE).
"""

from __future__ import annotations

import json
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


def fail(msg: str, code: int = 1) -> None:
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(code)


def call_refresh() -> list[dict]:
    """Appelle la RPC refresh_sprint5_insights et retourne les rows."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes")

    url = f"{SUPABASE_URL}/rest/v1/rpc/refresh_sprint5_insights"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    res = requests.post(url, headers=headers, json={}, timeout=120)
    if res.status_code >= 400:
        fail(f"RPC refresh_sprint5_insights failed: HTTP {res.status_code} {res.text[:300]}")
    return res.json() or []


def log_sync(rows: list[dict]) -> None:
    """Persiste un log dans sync_logs (best-effort, non-fatal)."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    url = f"{SUPABASE_URL}/rest/v1/sync_logs"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    try:
        requests.post(
            url,
            headers=headers,
            json={
                "job_name": "refresh-insights",
                "status": "success",
                "ran_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "views_refreshed": [r.get("view_name") for r in rows],
                    "run_url": RUN_URL,
                },
            },
            timeout=15,
        )
    except Exception as exc:  # log seulement, ne fait pas échouer le job
        print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)


def main() -> int:
    print(f"[refresh-insights] starting at {datetime.now(timezone.utc).isoformat()}")
    rows = call_refresh()
    for r in rows:
        print(f"  {r.get('view_name')} → {r.get('status')} @ {r.get('refreshed_at')}")
    log_sync(rows)
    print(f"[refresh-insights] done — {len(rows)} views refreshed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
