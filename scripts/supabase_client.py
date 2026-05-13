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
        # Trim trailing newline / whitespace that copy-paste in GH Secrets
        # often introduces, then strip slashes
        raw_url = (url or os.environ.get("SUPABASE_URL", "")).strip()
        raw_key = (service_role_key or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")).strip()
        self.url = raw_url.rstrip("/")
        self.key = raw_key

        if not self.url:
            raise RuntimeError("SUPABASE_URL is missing or empty.")
        if not self.key:
            raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is missing or empty.")

        # Heuristic warnings: catch the most common copy-paste mistakes.
        if self.key.startswith("sb_publishable_"):
            raise RuntimeError(
                "SUPABASE_SERVICE_ROLE_KEY looks like a PUBLISHABLE (anon) key — "
                "it starts with 'sb_publishable_'. We need the SECRET / service_role "
                "key (starts with 'sb_secret_' or 'eyJ...' with role:service_role). "
                "Get it from Dashboard → Project Settings → API → 'service_role' / 'secret'."
            )
        if self.key.startswith("eyJ"):
            # Decode the JWT payload (no signature check) just to read the role claim
            try:
                import base64, json
                payload_b64 = self.key.split(".")[1]
                # Pad base64 to multiple of 4
                padded = payload_b64 + "=" * (-len(payload_b64) % 4)
                payload = json.loads(base64.urlsafe_b64decode(padded))
                role = payload.get("role")
                if role == "anon":
                    raise RuntimeError(
                        "SUPABASE_SERVICE_ROLE_KEY contains an ANON JWT (role=anon). "
                        "We need the service_role JWT. "
                        "Get it from Dashboard → Project Settings → API → 'service_role' / 'secret'."
                    )
                elif role and role != "service_role":
                    print(f"[Supabase] WARNING: JWT role is '{role}', expected 'service_role'.")
            except RuntimeError:
                raise
            except Exception as e:
                print(f"[Supabase] WARNING: could not decode JWT to verify role: {e}")

        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def ping(self) -> None:
        """Sanity check: hit /rest/v1/ to validate URL + key before doing real work."""
        r = requests.get(f"{self.url}/rest/v1/", headers=self.headers, timeout=10)
        if r.status_code == 401:
            raise RuntimeError(
                f"Supabase auth FAILED (HTTP 401). The SUPABASE_SERVICE_ROLE_KEY "
                f"is invalid for this project. Check the key in GitHub Secrets. "
                f"Body: {r.text[:200]}"
            )
        if r.status_code >= 400:
            raise RuntimeError(
                f"Supabase ping failed (HTTP {r.status_code}). URL={self.url}. "
                f"Body: {r.text[:200]}"
            )

    def select(self, table: str, **params) -> list:
        r = requests.get(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=params,
            timeout=30,
        )
        if r.status_code == 401:
            raise RuntimeError(
                f"Supabase auth FAILED on SELECT {table} (HTTP 401). "
                f"The SUPABASE_SERVICE_ROLE_KEY is rejected. Body: {r.text[:200]}"
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
        """match = filter ex {'id': 'eq.42'}. Returns rows updated, raises on 401."""
        r = requests.patch(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            params=match,
            json=patch,
            timeout=30,
        )
        if r.status_code == 401:
            raise RuntimeError(
                f"Supabase auth FAILED on UPDATE {table} (HTTP 401). Body: {r.text[:200]}"
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
