"""
Léopards Radar — Wrapper Supabase REST API léger.

Le SDK officiel `supabase-py` ajoute des dépendances lourdes (httpx, pydantic).
Pour un job GitHub Actions avec rate-limiting strict, on garde `requests` direct.
"""

import os
import sys
from typing import Optional

import requests


class SupabaseClient:
    def __init__(self, url: Optional[str] = None, service_role_key: Optional[str] = None):
        self.url = (url or os.environ.get("SUPABASE_URL", "")).rstrip("/")
        self.key = service_role_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not (self.url and self.key):
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def select(self, table: str, **params) -> list:
        r = requests.get(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=params,
            timeout=30,
        )
        r.raise_for_status()
        return r.json()

    def insert(self, table: str, rows, on_conflict: Optional[str] = None) -> list:
        if not isinstance(rows, list):
            rows = [rows]
        if not rows:
            return []
        url = f"{self.url}/rest/v1/{table}"
        headers = dict(self.headers)
        if on_conflict:
            url += f"?on_conflict={on_conflict}"
            headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        r = requests.post(url, headers=headers, json=rows, timeout=30)
        if r.status_code >= 400:
            print(f"[Supabase] INSERT {table} failed: {r.status_code} {r.text[:300]}", file=sys.stderr)
            return []
        return r.json()

    def update(self, table: str, match: dict, patch: dict) -> list:
        """match = filter ex {'id': 'eq.42'}"""
        r = requests.patch(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=match,
            json=patch,
            timeout=30,
        )
        if r.status_code >= 400:
            print(f"[Supabase] UPDATE {table} failed: {r.status_code} {r.text[:300]}", file=sys.stderr)
            return []
        return r.json()

    def upsert(self, table: str, rows, on_conflict: str) -> list:
        """Insert with merge-duplicates on conflict columns (comma-separated)."""
        return self.insert(table, rows, on_conflict=on_conflict)

    def rpc(self, fn_name: str, payload: dict = None) -> dict:
        r = requests.post(
            f"{self.url}/rest/v1/rpc/{fn_name}",
            headers=self.headers,
            json=payload or {},
            timeout=60,
        )
        r.raise_for_status()
        return r.json()
