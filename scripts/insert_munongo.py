#!/usr/bin/env python3
"""
Léopards Radar — Insertion manuelle de Believe Munongo (TM 1297673).

Ce script est un one-shot : insère Munongo en BDD puis vérifie le résultat.
Il est idempotent (ON CONFLICT DO NOTHING).

Usage :
  SUPABASE_URL=https://pvpshyoaregroihwglye.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \
  python insert_munongo.py

Ou depuis la racine du projet :
  cd scripts && python insert_munongo.py
"""

from __future__ import annotations

import json
import sys

# Imports locaux
try:
    from supabase_client import SupabaseClient
except ImportError:
    print("ERREUR : supabase_client introuvable. Lance depuis scripts/", file=sys.stderr)
    sys.exit(1)

# Données Munongo — vérifiées sur TM le 2026-05-15
MUNONGO_DATA = {
    "name": "Believe Munongo",
    "slug": "believe-munongo",
    "transfermarkt_id": "1297673",
    "current_club": "FC Metz",
    "current_club_id": "347",
    "date_of_birth": "2009-11-23",
    "place_of_birth": "Metz",
    "country_of_birth": "France",
    "height_cm": 191,
    "position": "Midfield",
    # Deux nationalités déclarées sur TM : France (primary) + DR Congo (secondary)
    "nationalities": ["France", "DR Congo"],
    "other_nationalities": ["DR Congo"],
    "is_binational": True,
    "player_category": "radar",
    "eligibility_status": "potentially_eligible",
    "eligibility_note": (
        "Découvert via méthode E (squad scan multi-nats, 2026-05-15). "
        "Nationalité France (primary) + DR Congo (secondary) sur Transfermarkt. "
        "Né à Metz le 23/11/2009. Valeur marchande 10M€ (mars 2026). "
        "Potentiellement éligible RDC si aucune sélection A France. "
        "À instruire : base juridique congolaise (père/mère ?) + caps France U-jeunes."
    ),
    "market_value_eur": 10_000_000,
    "source_urls": ["https://www.transfermarkt.com/believe-munongo/profil/spieler/1297673"],
    "verified": False,
}


def main():
    print("=== Insertion Believe Munongo (TM 1297673) ===")

    sb = SupabaseClient()
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"[Supabase] ERREUR auth : {e}", file=sys.stderr)
        sys.exit(1)

    # Vérifie si Munongo existe déjà
    existing = sb.select(
        "players",
        select="id,name,transfermarkt_id",
        transfermarkt_id=f"eq.{MUNONGO_DATA['transfermarkt_id']}",
    )
    if existing:
        print(f"[Skip] Munongo déjà en BDD : id={existing[0]['id']}")
        _verify(sb)
        return

    # Insertion
    result = sb.insert("players", MUNONGO_DATA, on_conflict="transfermarkt_id")
    if not result:
        print("ERREUR : insertion échouée (réponse vide)", file=sys.stderr)
        sys.exit(1)

    row = result[0] if isinstance(result, list) else result
    print(f"[OK] Inséré : id={row.get('id')} | {row.get('name')} | club={row.get('current_club')}")

    _verify(sb)


def _verify(sb: SupabaseClient):
    """Affiche le résultat final depuis la BDD."""
    rows = sb.select(
        "players",
        select="id,name,transfermarkt_id,current_club,nationalities,other_nationalities,is_binational,eligibility_status",
        transfermarkt_id="eq.1297673",
    )
    if not rows:
        print("ERREUR : SELECT * FROM players WHERE transfermarkt_id = '1297673' → vide")
        return
    row = rows[0]
    print()
    print("=== Vérification SELECT ===")
    for k, v in row.items():
        print(f"  {k:30} : {v}")


if __name__ == "__main__":
    main()
