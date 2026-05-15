#!/usr/bin/env python3
"""
match_fbref_via_wikidata.py — populate players.fbref_id automatiquement.

Sprint 3.1 du brief Léopards Radar v3 (2026-05-15).

Plutôt que de remplir 150 fbref_id manuellement (proposition initiale du
brief), on interroge Wikidata via SPARQL : la propriété P5750 expose le
FBref player ID pour des milliers de joueurs déjà cross-référencés.

Logique :
  1. SPARQL : tous les humains avec citoyenneté COD (Q974) OU équipe
     nationale RDC (P54 Q200912 ou similaires) ET ayant un fbref_id (P5750).
  2. Pour chaque résultat : matching par nom (normalisé) contre players.
     - Match exact normalisé → UPDATE players SET fbref_id = ?, wikidata_id = ?
     - Match fuzzy (Levenshtein < 0.15) → UPDATE en notant 'fuzzy' dans field_freshness
     - Pas de match → ignored, mais loggé pour vérification manuelle
  3. Idempotent : ne touche que les rows où fbref_id IS NULL ET (match exact OU fuzzy).

Usage :
  python scripts/match_fbref_via_wikidata.py [--dry-run] [--limit 500]

Env :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY  (UPDATE players nécessite service_role)
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


SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
WIKIDATA_USER_AGENT = "LeopardsRadar/1.0 (https://angm-hub.github.io/leopardsradar; alexandre@withkaira.com)"


# ── SPARQL query : COD nationals avec fbref_id ──────────────────────────────
# Couvre :
#   - P31 wd:Q5 = personne (humain)
#   - P5750 = FBref player ID
#   - P27 wd:Q974 (citoyenneté COD = République démocratique du Congo)
#     OU P1532 wd:Q974 (sport country représenté)
#     OU P54 wd:Q204698 (équipe RDC senior masculin)
SPARQL_QUERY = """
SELECT DISTINCT ?person ?personLabel ?fbref ?birth WHERE {
  ?person wdt:P31 wd:Q5 ;
          wdt:P5750 ?fbref .
  {
    ?person wdt:P27 wd:Q974 .       # citoyenneté COD
  } UNION {
    ?person wdt:P1532 wd:Q974 .     # représente la COD en sport
  } UNION {
    ?person wdt:P54 wd:Q204698 .    # joue/jouait pour l'équipe nationale RDC
  }
  OPTIONAL { ?person wdt:P569 ?birth . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en" . }
}
LIMIT %LIMIT%
"""


def fail(msg: str, code: int = 1) -> None:
    print(f"::error::{msg}", file=sys.stderr)
    sys.exit(code)


def normalize_name(name: str) -> str:
    """Normalise un nom pour matching :
    - lowercase
    - retire accents (NFD)
    - retire ponctuation et caractères non alphanumériques sauf espaces
    - collapse espaces multiples
    """
    if not name:
        return ""
    nfd = unicodedata.normalize("NFD", name)
    no_accents = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    cleaned = re.sub(r"[^a-zA-Z0-9 ]+", " ", no_accents.lower())
    return re.sub(r"\s+", " ", cleaned).strip()


def levenshtein_ratio(a: str, b: str) -> float:
    """Retourne 1 - distance/max(len) ∈ [0, 1]. 1 = identique."""
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    # Implémentation iterative simple suffisante pour des noms (< 50 chars)
    la, lb = len(a), len(b)
    if abs(la - lb) > min(la, lb) * 0.4:
        return 0.0  # Tailles trop différentes, skip vite
    prev = list(range(lb + 1))
    for i in range(1, la + 1):
        cur = [i] + [0] * lb
        for j in range(1, lb + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            cur[j] = min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
        prev = cur
    return 1 - prev[lb] / max(la, lb)


# ── Wikidata SPARQL ─────────────────────────────────────────────────────────

def fetch_wikidata(limit: int) -> list[dict]:
    print(f"[wikidata] SPARQL — limit {limit}")
    res = requests.get(
        WIKIDATA_ENDPOINT,
        params={"query": SPARQL_QUERY.replace("%LIMIT%", str(limit)), "format": "json"},
        headers={"User-Agent": WIKIDATA_USER_AGENT, "Accept": "application/json"},
        timeout=120,
    )
    if res.status_code != 200:
        fail(f"Wikidata SPARQL failed: HTTP {res.status_code} — {res.text[:300]}")
    bindings = res.json().get("results", {}).get("bindings", [])
    out = []
    for b in bindings:
        qid = b["person"]["value"].rsplit("/", 1)[1]
        out.append({
            "qid": qid,
            "fbref_id": b["fbref"]["value"],
            "name": b.get("personLabel", {}).get("value", "").strip(),
            "birth": b.get("birth", {}).get("value", "").strip()[:10],  # YYYY-MM-DD
        })
    print(f"[wikidata] {len(out)} candidats")
    return out


# ── Supabase REST ───────────────────────────────────────────────────────────

def supa_request(method: str, path: str, **kwargs) -> requests.Response:
    headers = kwargs.pop("headers", {})
    headers.update({
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
    })
    return requests.request(
        method,
        f"{SUPABASE_URL}{path}",
        headers=headers,
        timeout=60,
        **kwargs,
    )


def fetch_players() -> list[dict]:
    """Récupère tous les players (id, name, slug, date_of_birth, fbref_id)."""
    print("[supabase] fetching all players")
    all_rows = []
    PAGE = 1000
    for page in range(0, 50):
        r = supa_request(
            "GET",
            "/rest/v1/players?select=id,name,slug,date_of_birth,fbref_id,wikidata_id"
            f"&order=id.asc",
            headers={"Range-Unit": "items", "Range": f"{page * PAGE}-{(page + 1) * PAGE - 1}"},
        )
        if r.status_code >= 400:
            fail(f"fetch_players failed: HTTP {r.status_code} {r.text[:200]}")
        rows = r.json()
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < PAGE:
            break
    print(f"[supabase] {len(all_rows)} players in DB")
    return all_rows


def update_player(player_id: int, fbref_id: str, wikidata_id: str, dry_run: bool) -> bool:
    if dry_run:
        return True
    r = supa_request(
        "PATCH",
        f"/rest/v1/players?id=eq.{player_id}",
        headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
        json={"fbref_id": fbref_id, "wikidata_id": wikidata_id},
    )
    if r.status_code >= 400:
        print(f"[error] update player {player_id} failed: HTTP {r.status_code}", file=sys.stderr)
        return False
    return True


def log_sync(matched: int, fuzzy: int, unmatched: int, dry_run: bool) -> None:
    if dry_run or not SUPABASE_URL or not SUPABASE_KEY:
        return
    try:
        supa_request(
            "POST",
            "/rest/v1/sync_logs",
            headers={"Content-Type": "application/json", "Prefer": "return=minimal"},
            json={
                "job_name": "match-fbref-via-wikidata",
                "status": "success",
                "ran_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "matched_exact": matched,
                    "matched_fuzzy": fuzzy,
                    "unmatched": unmatched,
                },
            },
        )
    except Exception as exc:
        print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)


# ── Matching ────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="Aucune écriture en BDD")
    ap.add_argument("--limit", type=int, default=2000, help="Limit SPARQL Wikidata")
    ap.add_argument("--fuzzy-threshold", type=float, default=0.88,
                    help="Score Levenshtein min pour accepter un fuzzy match")
    args = ap.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes")

    candidates = fetch_wikidata(args.limit)
    players = fetch_players()

    # Index players par nom normalisé pour lookup O(1)
    by_norm = {}
    for p in players:
        if not p.get("name"):
            continue
        norm = normalize_name(p["name"])
        if norm:
            by_norm.setdefault(norm, []).append(p)

    matched_exact = 0
    matched_fuzzy = 0
    unmatched = []
    skipped_already_set = 0

    for cand in candidates:
        norm_cand = normalize_name(cand["name"])
        if not norm_cand:
            continue

        # Match exact ?
        hits = by_norm.get(norm_cand, [])
        chosen = None
        match_type = None

        if len(hits) == 1:
            chosen = hits[0]
            match_type = "exact"
        elif len(hits) > 1:
            # Plusieurs joueurs même nom — choisir par date de naissance si possible
            for h in hits:
                if cand["birth"] and h.get("date_of_birth", "")[:10] == cand["birth"]:
                    chosen = h
                    match_type = "exact_birth"
                    break
            if not chosen:
                chosen = hits[0]  # Pas de critère, on prend le premier
                match_type = "exact_ambiguous"
        else:
            # Fuzzy match : on parcourt linéairement (cher mais bornée à ~1075)
            best_score = 0.0
            best_hit = None
            for norm, ps in by_norm.items():
                if abs(len(norm) - len(norm_cand)) > 8:
                    continue
                score = levenshtein_ratio(norm, norm_cand)
                if score > best_score:
                    best_score = score
                    best_hit = ps[0]
            if best_score >= args.fuzzy_threshold and best_hit:
                chosen = best_hit
                match_type = f"fuzzy({best_score:.2f})"

        if not chosen:
            unmatched.append(cand)
            continue

        # Skip si fbref_id déjà set
        if chosen.get("fbref_id"):
            skipped_already_set += 1
            continue

        # Update
        ok = update_player(chosen["id"], cand["fbref_id"], cand["qid"], args.dry_run)
        if ok:
            if match_type.startswith("fuzzy"):
                matched_fuzzy += 1
                print(f"  [fuzzy] {chosen['name']:35} ← {cand['name']:35} fbref={cand['fbref_id']} ({match_type})")
            else:
                matched_exact += 1

    print()
    print(f"=== Résultat — {'DRY RUN' if args.dry_run else 'WRITE'} ===")
    print(f"  Wikidata candidats     : {len(candidates)}")
    print(f"  Players DB             : {len(players)}")
    print(f"  Match exact            : {matched_exact}")
    print(f"  Match fuzzy            : {matched_fuzzy}")
    print(f"  Déjà settés (skip)     : {skipped_already_set}")
    print(f"  Pas de match (Wikidata exclus) : {len(unmatched)}")

    log_sync(matched_exact, matched_fuzzy, len(unmatched), args.dry_run)

    # Affiche un échantillon des unmatched pour info
    if unmatched and len(unmatched) <= 20:
        print("\n  Unmatched candidates (besoin de cross-ref ou hors vivier) :")
        for c in unmatched[:20]:
            print(f"    {c['qid']:10} {c['fbref_id']:10} {c['name']}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
