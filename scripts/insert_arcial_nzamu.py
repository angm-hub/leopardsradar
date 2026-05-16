#!/usr/bin/env python3
"""
Léopards Radar — Insertion manuelle d'Arcial Guylain Nzamu Ena (TM 1472856).

Signalé par Alexandre le 2026-05-16 comme manquant en BDD.
Profil : jeune talent diaspora — né en France 11/06/2009, milieu offensif,
FC Lorient U17, droitier. TM ne déclare que la nationalité française mais
le nom Nzamu Ena rend la racine RDC sans ambiguïté → à classer en radar
potentially_eligible, base juridique RDC à instruire (père/mère).

Idempotent (ON CONFLICT DO NOTHING via on_conflict=transfermarkt_id).

Usage :
  SUPABASE_URL=https://pvpshyoaregroihwglye.supabase.co \\
  SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
  python insert_arcial_nzamu.py

Ou depuis la racine :
  cd scripts && python insert_arcial_nzamu.py
"""

from __future__ import annotations

import sys

try:
    from supabase_client import SupabaseClient
except ImportError:
    print("ERREUR : supabase_client introuvable. Lance depuis scripts/", file=sys.stderr)
    sys.exit(1)

# Données vérifiées sur https://www.transfermarkt.fr/arcial-nzamu-ena/profil/spieler/1472856
# le 2026-05-16. Champs absents sur la fiche TM laissés à null pour pouvoir
# être enrichis par le sync hebdo Transfermarkt.
NZAMU_DATA = {
    "name": "Arcial Nzamu Ena",
    "slug": "arcial-nzamu-ena",
    "transfermarkt_id": "1472856",
    "current_club": "FC Lorient U17",
    "current_club_id": "99399",
    "date_of_birth": "2009-06-11",
    "country_of_birth": "France",
    "position": "Midfield",
    "foot": "right",
    "agent": "Classico",
    # TM ne déclare que France ; on consigne RDC en other_nationalities (à instruire).
    "nationalities": ["France"],
    "other_nationalities": ["DR Congo"],
    "is_binational": True,
    "player_category": "radar",
    "tier": "tier2",
    "eligibility_status": "potentially_eligible",
    "eligibility_note": (
        "Signalé manquant par Alexandre le 2026-05-16. "
        "Né en France le 11/06/2009 (16 ans), milieu offensif droitier, FC Lorient U17. "
        "TM ne déclare que la nationalité française ; le nom Nzamu Ena indique "
        "clairement une racine RDC (diaspora). "
        "À instruire : base juridique congolaise (parent né en RDC ?), "
        "caps France U-jeunes éventuels, fenêtre de switch FIFA art. 9. "
        "Agent : Classico."
    ),
    "source_urls": [
        "https://www.transfermarkt.fr/arcial-nzamu-ena/profil/spieler/1472856"
    ],
    "verified": False,
}


def main():
    print("=== Insertion Arcial Nzamu Ena (TM 1472856) ===")

    sb = SupabaseClient()
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"[Supabase] ERREUR auth : {e}", file=sys.stderr)
        sys.exit(1)

    existing = sb.select(
        "players",
        select="id,name,transfermarkt_id",
        transfermarkt_id=f"eq.{NZAMU_DATA['transfermarkt_id']}",
    )
    if existing:
        print(f"[Skip] Nzamu Ena déjà en BDD : id={existing[0]['id']}")
        _verify(sb)
        return

    result = sb.insert("players", NZAMU_DATA, on_conflict="transfermarkt_id")
    if not result:
        print("ERREUR : insertion échouée (réponse vide)", file=sys.stderr)
        sys.exit(1)

    row = result[0] if isinstance(result, list) else result
    print(
        f"[OK] Inséré : id={row.get('id')} | {row.get('name')} | "
        f"club={row.get('current_club')}"
    )

    _verify(sb)


def _verify(sb: SupabaseClient):
    rows = sb.select(
        "players",
        select=(
            "id,name,transfermarkt_id,current_club,position,date_of_birth,"
            "nationalities,other_nationalities,is_binational,"
            "player_category,eligibility_status"
        ),
        transfermarkt_id="eq.1472856",
    )
    if not rows:
        print("ERREUR : SELECT * FROM players WHERE transfermarkt_id = '1472856' → vide")
        return
    row = rows[0]
    print()
    print("=== Vérification SELECT ===")
    for k, v in row.items():
        print(f"  {k:25} : {v}")


if __name__ == "__main__":
    main()
