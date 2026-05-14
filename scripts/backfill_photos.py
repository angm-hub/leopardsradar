#!/usr/bin/env python3
"""
Léopards Radar — Backfill photos depuis Wikipedia / Wikidata.

Contexte : 859 joueurs radar sans image_url ni image_url_alt.
Transfermarkt ne fournit pas de photo pour tous les joueurs peu connus —
Wikipedia et Wikidata sont les seules sources libres de droits accessibles
sans authentification.

Stratégie de cascade pour chaque joueur :
  A) Wikipedia EN pageimages API  (la plus complète)
  B) Wikipedia FR pageimages API  (complémentaire pour les Francophones)
  C) Wikidata SPARQL property P18 (Commons — dernier recours)

On écrit dans image_url_alt (PAS image_url, réservée Transfermarkt).
Batch de 50/run → ~17 semaines pour couvrir les 859 joueurs.

Usage :
  python backfill_photos.py [--dry-run]

Variables d'env :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys
import time
import traceback
import urllib.parse
from typing import Optional

import requests

from supabase_client import SupabaseClient

BATCH_SIZE = int(os.environ.get("BATCH_SIZE", "50"))
RATE_LIMIT = 0.5   # secondes entre chaque appel API — assez doux pour Wikipedia/Wikidata
JOB_NAME = "backfill-photos"

# Placeholder Wikipedia qu'on refuse (Commons default "no image")
WIKIPEDIA_PLACEHOLDER_FRAGMENTS = [
    "Question_mark",
    "No_image",
    "Missing_image",
    "Replacement_character",
]

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
USER_AGENT = "leopards-radar-bot/1.0 (alexandre@withkaira.com; github.com/leopardsradar)"


def is_placeholder_url(url: str) -> bool:
    """
    Rejette les URLs de placeholder Wikipedia/Commons qui ne sont pas
    de vraies photos de personnes.
    """
    if not url:
        return True
    return any(frag.lower() in url.lower() for frag in WIKIPEDIA_PLACEHOLDER_FRAGMENTS)


def fetch_wikipedia_image(name: str, lang: str = "en") -> Optional[str]:
    """
    Appelle l'API pageimages de Wikipedia pour récupérer la photo principale
    d'un article. On demande une miniature 400px pour valider l'existence,
    mais on retourne l'URL originale (sans /thumb/) quand possible.

    Retourne l'URL de l'image ou None si introuvable / placeholder.
    """
    encoded = urllib.parse.quote(name)
    api_url = f"https://{lang}.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "prop": "pageimages",
        "format": "json",
        "pithumbsize": 400,
        "titles": name,
        "redirects": 1,  # suivre les redirects (ex: "Jean Kasusula" → "Jean Kasusula (footballer)")
    }
    try:
        r = requests.get(
            api_url,
            params=params,
            headers={"User-Agent": USER_AGENT},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        pages = data.get("query", {}).get("pages", {})
        for page_id, page in pages.items():
            if page_id == "-1":
                # Page inexistante sur cette Wikipedia
                return None
            thumb = page.get("thumbnail", {})
            url = thumb.get("source")
            if url and not is_placeholder_url(url):
                return url
    except Exception:
        # On absorbe silencieusement — Wikipedia peut timeout ou 503 ponctuellement
        pass
    return None


def fetch_wikidata_image(name: str) -> Optional[str]:
    """
    Cherche l'image (P18) d'une personne via SPARQL Wikidata.
    On matche sur le label anglais du nom. Approximatif mais rapide.
    Retourne l'URL Commons Special:FilePath ou None.
    """
    # On échappe les guillemets dans le nom pour éviter l'injection SPARQL
    safe_name = name.replace('"', '\\"')
    query = f"""
SELECT ?img WHERE {{
  ?person wdt:P31 wd:Q5 ;
          rdfs:label "{safe_name}"@en ;
          wdt:P18 ?img .
}} LIMIT 1
"""
    try:
        r = requests.get(
            WIKIDATA_SPARQL,
            params={"query": query, "format": "json"},
            headers={
                "Accept": "application/sparql-results+json",
                "User-Agent": USER_AGENT,
            },
            timeout=15,
        )
        r.raise_for_status()
        bindings = r.json().get("results", {}).get("bindings", [])
        if bindings:
            img_uri = bindings[0].get("img", {}).get("value")
            if img_uri and not is_placeholder_url(img_uri):
                # Wikidata retourne http://commons.wikimedia.org/wiki/Special:FilePath/Foo.jpg
                # C'est une URL valide et stable.
                return img_uri
    except Exception:
        pass
    return None


def find_photo(player: dict) -> Optional[str]:
    """
    Cascade A → B → C pour trouver une photo pour le joueur donné.
    Retourne l'URL trouvée ou None.
    """
    name = player.get("name", "")
    if not name:
        return None

    # A) Wikipedia EN
    time.sleep(RATE_LIMIT)
    url = fetch_wikipedia_image(name, lang="en")
    if url:
        return url

    # B) Wikipedia FR — utile pour les joueurs francophones peu connus en anglais
    time.sleep(RATE_LIMIT)
    url = fetch_wikipedia_image(name, lang="fr")
    if url:
        return url

    # C) Wikidata SPARQL — dernier recours, plus lent
    time.sleep(RATE_LIMIT)
    url = fetch_wikidata_image(name)
    if url:
        return url

    return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche ce qui serait mis à jour sans écrire en base",
    )
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Backfill Photos ===")
    print(f"Start : {started_at.isoformat()}Z | Dry run : {args.dry_run} | Batch : {BATCH_SIZE}")

    sb = SupabaseClient()

    # Valider l'auth avant de commencer — évite de processer 50 joueurs
    # pour rien si le secret Supabase est cassé dans l'env CI.
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"!!! ABORTING: {e}", file=sys.stderr)
        sys.exit(1)

    # Charger les joueurs sans photo, priorité aux joueurs roster puis aux
    # joueurs à haute market_value (plus susceptibles d'avoir une page Wikipedia).
    players = sb.select(
        "players",
        select="id,name,slug,transfermarkt_id,date_of_birth",
        image_url="is.null",
        image_url_alt="is.null",
        order="player_category.asc,market_value_eur.desc.nullslast",
        limit=str(BATCH_SIZE),
    )

    print(f"Joueurs à traiter : {len(players)}")

    stats = {
        "players_processed": 0,
        "players_updated": 0,
        "errors_count": 0,
        "error_details": [],
    }

    for i, player in enumerate(players, 1):
        try:
            print(f"  [{i:>3}/{len(players)}] {player['name']} (id={player['id']})", end=" ... ")

            photo_url = find_photo(player)

            if photo_url:
                print(f"TROUVÉE")
                if not args.dry_run:
                    sb.update(
                        "players",
                        {"id": f"eq.{player['id']}"},
                        {"image_url_alt": photo_url},
                    )
                else:
                    print(f"    [dry-run] image_url_alt = {photo_url}")
                stats["players_updated"] += 1
            else:
                print(f"non trouvée")

            stats["players_processed"] += 1

        except Exception as e:
            # Un joueur qui échoue ne doit pas stopper le batch entier.
            print(f"ERREUR")
            stats["errors_count"] += 1
            stats["error_details"].append({
                "player_id": player.get("id"),
                "name": player.get("name"),
                "error": f"{type(e).__name__}: {e}",
                "traceback": traceback.format_exc()[-400:],
            })

    # Calcul du statut global
    if stats["errors_count"] == 0:
        log_status = "success"
    elif stats["players_updated"] > 0:
        log_status = "partial"
    else:
        log_status = "failure"

    finished_at = dt.datetime.utcnow()
    duration_seconds = int((finished_at - started_at).total_seconds())

    # Log dans sync_logs (même si dry-run — utile pour tracer les runs de test)
    if not args.dry_run:
        sb.insert("sync_logs", {
            "job_name": JOB_NAME,
            "status": log_status,
            "players_processed": stats["players_processed"],
            "players_updated": stats["players_updated"],
            "candidates_discovered": 0,
            "errors_count": stats["errors_count"],
            "error_details": stats["error_details"][:50],
            "started_at": started_at.isoformat() + "Z",
            "finished_at": finished_at.isoformat() + "Z",
            "duration_seconds": duration_seconds,
            "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        })

    print(f"\n=== Récap ===")
    print(f"Status    : {log_status}")
    print(f"Traités   : {stats['players_processed']}")
    print(f"Avec photo: {stats['players_updated']}")
    print(f"Sans photo: {stats['players_processed'] - stats['players_updated']}")
    print(f"Erreurs   : {stats['errors_count']}")
    print(f"Durée     : {duration_seconds}s")

    if stats["players_processed"] == 0 and stats["errors_count"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
