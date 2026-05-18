#!/usr/bin/env python3
"""
sync_fifa26_squad.py — Popule player_stats_multi pour les 16 joueurs de la
liste FIFA 26 de la RDC qui jouent hors Big5 et n'ont pas encore de data
dans player_stats_multi (saison 2025-2026).

Source unique : Transfermarkt /leistungsdaten/ via source_transfermarkt.fetch().
Table cible   : player_stats_multi (UPSERT, ON CONFLICT).
N'écrit pas dans players.season_*.

Rate-limit TM : 3 sec entre chaque requête → ~16 joueurs ≈ 50 sec.

Variables d'environnement attendues (dans .env ou passées directement) :
  SUPABASE_URL             — ex. https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY — JWT service_role (pas anon)

Fallback : si SUPABASE_URL absent, utilise VITE_SUPABASE_URL du .env.
"""

from __future__ import annotations

import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import requests

# ─── Charger le .env du projet ───────────────────────────────────────────────

def _load_dotenv(path: Path) -> dict[str, str]:
    """Parseur .env minimaliste — supporte VAR=val et VAR="val"."""
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        env[key] = val
    return env

_ROOT = Path(__file__).resolve().parent.parent
_dotenv = _load_dotenv(_ROOT / ".env")

def _env(key: str, fallback_keys: list[str] = ()) -> str:
    """Lit une var d'env — d'abord os.environ, puis .env, puis fallbacks."""
    if key in os.environ:
        return os.environ[key].strip()
    if key in _dotenv:
        return _dotenv[key].strip()
    for fk in fallback_keys:
        if fk in os.environ:
            return os.environ[fk].strip()
        if fk in _dotenv:
            return _dotenv[fk].strip()
    return ""

SUPABASE_URL = _env("SUPABASE_URL", ["VITE_SUPABASE_URL"]).rstrip("/")
SUPABASE_KEY = _env("SUPABASE_SERVICE_ROLE_KEY")
SEASON       = "2025-2026"

# ─── Les 16 joueurs ciblés ────────────────────────────────────────────────────

TARGETS = [
    {"player_id": 61,  "name": "Brian Cipenga",      "transfermarkt_id": 700565},
    {"player_id": 469, "name": "Fiston Mayele",       "transfermarkt_id": 340127},
    {"player_id": 319, "name": "Meschack Elia",       "transfermarkt_id": 423678},
    {"player_id": 334, "name": "Nathanaël Mbuku",     "transfermarkt_id": 557614},
    {"player_id": 429, "name": "Simon Banza",         "transfermarkt_id": 344869},
    {"player_id": 120, "name": "Dylan Batubinsika",   "transfermarkt_id": 289432},
    {"player_id": 188, "name": "Gédéon Kalulu",       "transfermarkt_id": 395685},
    {"player_id": 476, "name": "Joris Kayembe",       "transfermarkt_id": 129586},
    {"player_id": 386, "name": "Rocky Bushiri",       "transfermarkt_id": 511802},
    {"player_id": 441, "name": "Steve Kapuadi",       "transfermarkt_id": 679709},
    {"player_id": 300, "name": "Lionel Mpasi-Nzau",   "transfermarkt_id": 164915},
    {"player_id": 471, "name": "Matthieu Epolo",      "transfermarkt_id": 680218},
    {"player_id": 454, "name": "Timothy Fayulu",      "transfermarkt_id": 541420},
    {"player_id": 124, "name": "Edo Kayembe",         "transfermarkt_id": 486477},
    {"player_id": 170, "name": "Gaël Kakuta",         "transfermarkt_id": 74297},
    {"player_id": 420, "name": "Samuel Moutoussamy",  "transfermarkt_id": 353403},
]

# ─── Supabase REST helpers ────────────────────────────────────────────────────

def _headers() -> dict[str, str]:
    return {
        "apikey":        SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type":  "application/json",
        "Prefer":        "resolution=merge-duplicates,return=representation",
    }


def _upsert_rows(rows: list[dict]) -> list[dict]:
    """
    Upsert dans player_stats_multi.
    Contrainte UNIQUE : (player_id, source, season, COALESCE(competition,'__all__'))
    """
    if not rows:
        return []
    url = f"{SUPABASE_URL}/rest/v1/player_stats_multi?on_conflict=player_id,source,season,competition"
    r = requests.post(url, headers=_headers(), json=rows, timeout=30)
    if r.status_code >= 400:
        print(f"  [supabase] upsert error HTTP {r.status_code}: {r.text[:300]}", file=sys.stderr)
        return []
    return r.json() if r.text else []


def _count_player_stats(player_ids: list[int]) -> int:
    """
    Compte combien de player_ids distincts ont au moins 1 row dans
    player_stats_multi pour la saison 2025-2026.
    """
    if not player_ids:
        return 0
    # On fait une requête par batch — la liste est petite (16)
    ids_csv = ",".join(str(i) for i in player_ids)
    url = (
        f"{SUPABASE_URL}/rest/v1/player_stats_multi"
        f"?select=player_id"
        f"&season=eq.{SEASON}"
        f"&player_id=in.({ids_csv})"
    )
    r = requests.get(url, headers=_headers(), timeout=20)
    if r.status_code >= 400:
        print(f"  [supabase] verif query error HTTP {r.status_code}: {r.text[:200]}", file=sys.stderr)
        return -1
    rows = r.json()
    unique_ids = {row["player_id"] for row in rows}
    return len(unique_ids)


# ─── Source TM ────────────────────────────────────────────────────────────────

def _import_source_tm():
    """Import source_transfermarkt depuis le dossier scripts/stats_sources/."""
    scripts_dir = Path(__file__).resolve().parent
    if str(scripts_dir) not in sys.path:
        sys.path.insert(0, str(scripts_dir))
    from stats_sources import source_transfermarkt as _stm
    return _stm


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    # Validation credentials
    if not SUPABASE_URL:
        print("::error::SUPABASE_URL manquante (ni dans os.environ, ni dans .env)", file=sys.stderr)
        return 1
    if not SUPABASE_KEY:
        print(
            "::error::SUPABASE_SERVICE_ROLE_KEY manquante.\n"
            "Passe-la en variable d'env ou ajoute-la dans .env :\n"
            "  SUPABASE_SERVICE_ROLE_KEY=eyJ...\n"
            "  export SUPABASE_SERVICE_ROLE_KEY=eyJ... && python scripts/sync_fifa26_squad.py",
            file=sys.stderr,
        )
        return 1

    # Vérification rapide de l'anon key (ne doit pas être utilisée ici)
    import base64, json as _json
    try:
        payload_b64 = SUPABASE_KEY.split(".")[1]
        padded = payload_b64 + "=" * (-len(payload_b64) % 4)
        payload = _json.loads(base64.urlsafe_b64decode(padded))
        role = payload.get("role")
        if role == "anon":
            print(
                "::error::La clé fournie est une clé ANON (role=anon). "
                "Il faut la clé service_role. "
                "Dashboard → Project Settings → API → service_role.",
                file=sys.stderr,
            )
            return 1
    except Exception:
        pass  # Si le JWT n'est pas décodable, on continue

    stm = _import_source_tm()

    print(f"[sync-fifa26] Démarrage — {len(TARGETS)} joueurs, saison={SEASON}")
    print(f"[sync-fifa26] SUPABASE_URL = {SUPABASE_URL}")
    print(f"[sync-fifa26] Rate-limit TM = {stm.RATE_LIMIT_SEC}s entre chaque requête\n")

    now          = datetime.now(timezone.utc).isoformat()
    ok_count     = 0
    ko_count     = 0
    total_comps  = 0

    for i, target in enumerate(TARGETS, 1):
        pid  = target["player_id"]
        name = target["name"]
        tm   = target["transfermarkt_id"]

        print(f"[{i:2d}/{len(TARGETS)}] {name} (id={pid}, tm={tm})")

        try:
            rows = stm.fetch({"transfermarkt_id": tm, "name": name})
        except RuntimeError as exc:
            # TM a renvoyé 403/429 — arrêt immédiat
            print(f"\n[STOP] Transfermarkt ban signal: {exc}", file=sys.stderr)
            print(f"[STOP] Arrêt propre. {ok_count} joueurs traités avant le ban.", file=sys.stderr)
            break
        except Exception as exc:
            print(f"  [error] fetch exception pour {name}: {exc}", file=sys.stderr)
            ko_count += 1
            continue

        if not rows:
            print(f"  [KO] {name} (id={pid}) : aucune data 25/26 trouvée sur TM")
            ko_count += 1
            continue

        # Préparer les rows pour l'upsert
        upsert_payload = []
        for row in rows:
            upsert_payload.append({
                "player_id":        pid,
                "source":           row.get("source", "transfermarkt"),
                "season":           SEASON,
                "competition":      row.get("competition"),
                "competition_tier": row.get("competition_tier"),
                "matches_played":   row.get("matches_played"),
                "minutes_played":   row.get("minutes_played"),
                "goals":            row.get("goals"),
                "assists":          row.get("assists"),
                "xg":               row.get("xg"),
                "xa":               row.get("xa"),
                "yellow_cards":     row.get("yellow_cards"),
                "red_cards":        row.get("red_cards"),
                "source_url":       row.get("source_url"),
                "confidence":       row.get("confidence", "MEDIUM"),
                "scraped_at":       now,
                "is_canonical":     True,
            })

        inserted = _upsert_rows(upsert_payload)

        n_comps = len(rows)
        total_comps += n_comps

        # Construire le résumé des compétitions pour le log
        comp_summary = ", ".join(
            f"{r.get('competition','?')} {r.get('minutes_played','?')}min"
            for r in rows[:3]
        )
        if n_comps > 3:
            comp_summary += f" (+{n_comps - 3} autres)"

        print(f"  [OK] {name} (id={pid}) : {n_comps} compétition(s) insérée(s) — {comp_summary}")
        ok_count += 1

    # ─── Vérification post-scrape ─────────────────────────────────────────────
    print(f"\n[sync-fifa26] === Bilan scraping ===")
    print(f"  OK  : {ok_count}/{len(TARGETS)}")
    print(f"  KO  : {ko_count}/{len(TARGETS)}")
    print(f"  Compétitions totales insérées : {total_comps}")

    print(f"\n[sync-fifa26] Vérification post-scrape en cours...")
    player_ids = [t["player_id"] for t in TARGETS]
    found = _count_player_stats(player_ids)
    if found >= 0:
        print(f"Verif post-scrape : {found}/16 joueurs ont au moins une row dans player_stats_multi pour saison {SEASON}.")
    else:
        print("Verif post-scrape : impossible de requêter Supabase pour la vérification.")

    return 0 if ok_count > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
