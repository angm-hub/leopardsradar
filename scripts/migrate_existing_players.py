#!/usr/bin/env python3
"""
Léopards Radar — Migration des données existantes vers le nouveau schema.

Parse les colonnes legacy de `players` (eligibility_note texte libre, nationalities JSON,
caps_rdc compteur) et les transforme en lignes structurées dans :
  - nationality_basis (1 ligne par base juridique)
  - selections (1 ligne par cap inférée depuis la note)
  - eligibility_log (entrée 'manual_migration')

Usage :
    export SUPABASE_URL=https://xxx.supabase.co
    export SUPABASE_SERVICE_ROLE_KEY=eyJ...
    python migrate_existing_players.py [--dry-run] [--player-id N]

Le script est IDEMPOTENT : peut être rejoué sans dupliquer les lignes.
"""

import argparse
import os
import re
import sys
from datetime import date
from typing import Optional

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not (SUPABASE_URL and SERVICE_KEY):
    print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set", file=sys.stderr)
    sys.exit(1)

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

# ──────────────────────────────────────────────────────────────────────
# Mapping pays nom → code ISO-3 (basé sur playerHelpers.ts du front)
# ──────────────────────────────────────────────────────────────────────
NATIONALITY_TO_ISO = {
    "DR Congo": "COD", "Congo": "COD",
    "Congo-Brazzaville": "COG", "Republic of Congo": "COG",
    "France": "FRA", "Belgium": "BEL", "Belgique": "BEL",
    "England": "ENG", "Angleterre": "ENG",
    "Scotland": "SCO", "Wales": "WAL", "Ireland": "IRL",
    "Spain": "ESP", "Espagne": "ESP",
    "Portugal": "PRT", "Switzerland": "CHE", "Suisse": "CHE",
    "Netherlands": "NLD", "Pays-Bas": "NLD",
    "Germany": "DEU", "Allemagne": "DEU",
    "Italy": "ITA", "Italie": "ITA",
    "Greece": "GRC", "Grèce": "GRC",
    "Turkey": "TUR", "Turquie": "TUR",
    "Russia": "RUS", "Russie": "RUS",
    "Poland": "POL", "Pologne": "POL",
    "Egypt": "EGY", "Égypte": "EGY",
    "Morocco": "MAR", "Maroc": "MAR",
    "Tunisia": "TUN", "Tunisie": "TUN",
    "Algeria": "DZA", "Algérie": "DZA",
    "Zambia": "ZMB", "Zambie": "ZMB",
    "South Africa": "ZAF", "Afrique du Sud": "ZAF",
    "USA": "USA", "United States": "USA", "Canada": "CAN",
    "Brazil": "BRA", "Brésil": "BRA", "Argentina": "ARG", "Colombia": "COL",
    "Denmark": "DNK", "Sweden": "SWE", "Norway": "NOR", "Finland": "FIN",
    "Austria": "AUT", "Autriche": "AUT",
    "Cameroon": "CMR", "Cameroun": "CMR",
    "Senegal": "SEN", "Sénégal": "SEN",
    "Ivory Coast": "CIV", "Côte d'Ivoire": "CIV",
    "Ghana": "GHA", "Nigeria": "NGA", "Mali": "MLI",
    "Burkina Faso": "BFA", "Guinea": "GIN", "Guinée": "GIN",
    "Angola": "AGO", "Gabon": "GAB",
    "Australia": "AUS", "Japan": "JPN", "South Korea": "KOR",
    "Saudi Arabia": "SAU", "Qatar": "QAT", "UAE": "ARE",
    "Israel": "ISR", "Cyprus": "CYP",
}

# ──────────────────────────────────────────────────────────────────────
# Regex patterns pour parser les eligibility_note
# ──────────────────────────────────────────────────────────────────────
# Patterns tirés de l'examen des notes existantes :
# "17 caps England A senior + squad WC 2026. Cap-tied."
# "1 cap France A amical (oct 2023 vs Écosse). Amical = pas cap-tied."
# "5+ caps Suisse A. Cap-tied Suisse."
# "2 caps France A (oct 2025). Avait 28 ans au 1er cap → règle FIFA <21 ans non remplie."
RE_CAPS_NATION_TYPE = re.compile(
    r"(\d+)\s*\+?\s*caps?\s+(?P<nation>[A-Za-zÀ-ÿ' ]+?)\s+A\s+(?P<type>senior|amical|officiel)?",
    re.IGNORECASE
)
RE_DATE_MONTH_YEAR = re.compile(
    r"(?P<month>jan|fév|fev|mar|avr|mai|juin|juil|aoû|aou|sep|oct|nov|déc|dec|"
    r"january|february|march|april|june|july|august|september|october|november|december)"
    r"\.?\s*(?P<year>\d{4})",
    re.IGNORECASE
)
MONTH_TO_NUM = {
    "jan": 1, "january": 1,
    "fev": 2, "fév": 2, "february": 2,
    "mar": 3, "march": 3,
    "avr": 4, "april": 4,
    "mai": 5, "may": 5,
    "juin": 6, "june": 6,
    "juil": 7, "july": 7,
    "aou": 8, "aoû": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "déc": 12, "december": 12,
}

# Mots-clés indiquant une compétition majeure (cap-tying immédiat)
MAJOR_COMP_KEYWORDS = [
    "WC", "World Cup", "Mondial", "CDM",
    "EURO", "Euro 20", "Euro 21", "Euro 22", "Euro 23", "Euro 24", "Euro 25", "Euro 26",
    "AFCON", "CAN 2", "CAN U",
    "Copa América", "Copa America", "CONCACAF Gold", "Asian Cup", "Nations Cup",
    "Qual.", "qualif",
]

# ──────────────────────────────────────────────────────────────────────
# Helpers Supabase REST
# ──────────────────────────────────────────────────────────────────────
def supabase_select(table: str, **params) -> list:
    """SELECT via Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    r = requests.get(url, headers=HEADERS, params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def supabase_insert(table: str, rows: list, on_conflict: Optional[str] = None) -> list:
    """INSERT via Supabase REST API. Idempotent si on_conflict est fourni."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = dict(HEADERS)
    if on_conflict:
        url += f"?on_conflict={on_conflict}"
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    r = requests.post(url, headers=headers, json=rows, timeout=30)
    if r.status_code >= 400:
        print(f"INSERT {table} failed: {r.status_code} {r.text[:200]}", file=sys.stderr)
        return []
    return r.json()


def supabase_rpc(fn_name: str, payload: dict) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/rpc/{fn_name}"
    r = requests.post(url, headers=HEADERS, json=payload, timeout=30)
    r.raise_for_status()
    return r.json()


# ──────────────────────────────────────────────────────────────────────
# Parsing de l'eligibility_note
# ──────────────────────────────────────────────────────────────────────
def parse_caps_from_note(note: str, dob: Optional[date]) -> list:
    """
    Extrait les sélections inférées depuis le texte libre eligibility_note.

    Retourne une liste de dicts compatibles avec la table `selections` :
        { federation_code, category, competition, is_major_competition, match_date, source_url, notes }
    """
    if not note:
        return []

    selections = []

    for m in RE_CAPS_NATION_TYPE.finditer(note):
        count_str = m.group(1)
        nation_raw = m.group("nation").strip()
        cap_type = (m.group("type") or "").lower()

        # Normalize nation
        nation_norm = nation_raw.replace("England", "England").strip()
        fed_code = NATIONALITY_TO_ISO.get(nation_norm)
        if not fed_code:
            # Try with first word only (ex: "France A" → "France")
            first_word = nation_norm.split()[0]
            fed_code = NATIONALITY_TO_ISO.get(first_word)
        if not fed_code:
            continue

        try:
            count = int(count_str)
        except ValueError:
            continue

        # Determine category
        if "amical" in cap_type or "friendly" in note.lower()[max(0, m.start()-20):m.end()+20]:
            category = "A_FRIENDLY"
        else:
            category = "A_OFFICIAL"

        # Detect major competition mention
        is_major = any(kw.lower() in note.lower() for kw in MAJOR_COMP_KEYWORDS)

        # Try to extract a date
        match_date = None
        date_match = RE_DATE_MONTH_YEAR.search(note[max(0, m.start()-50):m.end()+100])
        if date_match:
            month_str = date_match.group("month").lower()[:3]
            year = int(date_match.group("year"))
            month_num = MONTH_TO_NUM.get(month_str, 1)
            try:
                match_date = date(year, month_num, 15)  # mid-month default
            except ValueError:
                pass

        # Fallback : si pas de date, on met une date générique récente
        if not match_date:
            match_date = date(2024, 6, 1)

        # On crée 1 ligne par cap (jusqu'à 5 max pour éviter bloat ; on note le total dans notes)
        max_to_create = min(count, 5)
        for i in range(max_to_create):
            selections.append({
                "federation_code": fed_code,
                "category": category,
                "competition": "Inferred from legacy note",
                "is_major_competition": is_major and category == "A_OFFICIAL",
                "match_date": match_date.isoformat(),
                "notes": f"[migration] inferred from note: '{note[:200]}'. Cap {i+1}/{count}.",
            })
        if count > 5:
            # Marqueur pour indiquer qu'il y en a plus
            selections.append({
                "federation_code": fed_code,
                "category": category,
                "competition": f"Additional caps marker (+{count - 5})",
                "is_major_competition": is_major and category == "A_OFFICIAL",
                "match_date": match_date.isoformat(),
                "notes": f"[migration] {count - 5} additional caps not individually recorded. Total observed: {count}.",
            })

    return selections


def infer_basis_from_player(player: dict) -> list:
    """
    Infère les bases juridiques RDC depuis les colonnes existantes :
      - country_of_birth = 'DR Congo' → BIRTH
      - 'DR Congo' dans nationalities/other_nationalities → UNKNOWN par défaut
      - eligibility_note contient 'mère' / 'mother' → MOTHER
      - eligibility_note contient 'père' / 'father' → FATHER
      - eligibility_note contient 'grand' → GRANDPARENT_*
    """
    bases = []
    note = (player.get("eligibility_note") or "").lower()

    # Birth
    if (player.get("country_of_birth") or "").lower() in ("dr congo", "congo", "zaire"):
        bases.append({
            "nationality_code": "COD",
            "basis": "BIRTH",
            "evidence_quote": f"country_of_birth = '{player.get('country_of_birth')}'",
            "confidence": "HIGH",
        })

    # Note keywords
    if any(kw in note for kw in ["mère", "mother", "mum", "maman"]):
        if "rdc" in note or "congo" in note:
            bases.append({
                "nationality_code": "COD",
                "basis": "MOTHER",
                "evidence_quote": player.get("eligibility_note", "")[:300],
                "confidence": "MEDIUM",
            })

    if any(kw in note for kw in ["père", "father", "dad", "papa"]):
        if "rdc" in note or "congo" in note:
            bases.append({
                "nationality_code": "COD",
                "basis": "FATHER",
                "evidence_quote": player.get("eligibility_note", "")[:300],
                "confidence": "MEDIUM",
            })

    if any(kw in note for kw in ["grand-père", "grandfather", "grand père"]):
        if "rdc" in note or "congo" in note:
            bases.append({
                "nationality_code": "COD",
                "basis": "GRANDPARENT_PATERNAL_GRANDFATHER",
                "evidence_quote": player.get("eligibility_note", "")[:300],
                "confidence": "MEDIUM",
            })

    if any(kw in note for kw in ["grand-mère", "grandmother", "grand mère"]):
        if "rdc" in note or "congo" in note:
            bases.append({
                "nationality_code": "COD",
                "basis": "GRANDPARENT_PATERNAL_GRANDMOTHER",
                "evidence_quote": player.get("eligibility_note", "")[:300],
                "confidence": "MEDIUM",
            })

    # Fallback : si DR Congo dans nationalities mais aucune base trouvée
    nationalities = player.get("nationalities") or []
    other_nat = player.get("other_nationalities") or []
    all_nat = (nationalities if isinstance(nationalities, list) else []) + \
              (other_nat if isinstance(other_nat, list) else [])

    if any(n in ("DR Congo", "Congo") for n in all_nat) and not bases:
        bases.append({
            "nationality_code": "COD",
            "basis": "UNKNOWN",
            "evidence_quote": f"DR Congo listed in nationalities: {all_nat}",
            "confidence": "LOW",
        })

    # Bases pour autres nationalités (au moins UNKNOWN pour tracer les engagements)
    for nat_name in all_nat:
        if nat_name in ("DR Congo", "Congo"):
            continue
        iso = NATIONALITY_TO_ISO.get(nat_name)
        if iso:
            # Si country_of_birth match → BIRTH
            if (player.get("country_of_birth") or "").lower() == nat_name.lower():
                bases.append({
                    "nationality_code": iso,
                    "basis": "BIRTH",
                    "evidence_quote": f"country_of_birth = '{nat_name}'",
                    "confidence": "HIGH",
                })
            else:
                bases.append({
                    "nationality_code": iso,
                    "basis": "UNKNOWN",
                    "evidence_quote": f"{nat_name} listed in nationalities",
                    "confidence": "LOW",
                })

    return bases


# ──────────────────────────────────────────────────────────────────────
# Main migration loop
# ──────────────────────────────────────────────────────────────────────
def migrate_player(player: dict, dry_run: bool = False) -> dict:
    """Migre un joueur. Retourne stats."""
    pid = player["id"]
    stats = {"player_id": pid, "name": player.get("name"), "bases": 0, "selections": 0, "errors": []}

    # 1. Parse date_of_birth
    dob_str = player.get("date_of_birth")
    dob = None
    if dob_str:
        try:
            dob = date.fromisoformat(dob_str[:10])
        except ValueError:
            stats["errors"].append(f"Invalid DOB: {dob_str}")

    # 2. Bases juridiques
    bases = infer_basis_from_player(player)
    if bases and not dry_run:
        rows = [{**b, "player_id": pid} for b in bases]
        inserted = supabase_insert("nationality_basis", rows, on_conflict="player_id,nationality_code,basis")
        stats["bases"] = len(inserted)
    elif bases:
        stats["bases"] = len(bases)

    # 3. Sélections (inférées depuis note + caps_rdc compteur)
    selections = parse_caps_from_note(player.get("eligibility_note") or "", dob)

    # Caps RDC depuis compteur
    caps_rdc = player.get("caps_rdc") or 0
    if caps_rdc > 0:
        rdc_caps_to_add = min(caps_rdc, 5)
        for i in range(rdc_caps_to_add):
            selections.append({
                "federation_code": "COD",
                "category": "A_OFFICIAL",
                "competition": "RDC senior (legacy counter)",
                "is_major_competition": False,
                "match_date": "2024-01-15",  # placeholder, à enrichir manuellement plus tard
                "notes": f"[migration] from caps_rdc={caps_rdc} legacy counter. Cap {i+1}/{caps_rdc}.",
            })

    if selections and not dry_run:
        rows = [{**s, "player_id": pid} for s in selections]
        # Pas d'unique constraint sur selections → on accepte les doublons à la migration
        # mais on filtre côté client pour ne pas réinsérer si déjà migré
        existing = supabase_select(
            "selections",
            **{"player_id": f"eq.{pid}", "notes": "like.[migration]*"}
        )
        if not existing:
            inserted = supabase_insert("selections", rows)
            stats["selections"] = len(inserted)
        else:
            stats["selections"] = 0
            stats["errors"].append("Already migrated, skipping selections")
    elif selections:
        stats["selections"] = len(selections)

    return stats


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Don't write to DB")
    parser.add_argument("--player-id", type=int, help="Migrate only one player by ID")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of players")
    args = parser.parse_args()

    print(f"=== Léopards Radar — Migration data legacy → schema éligibilité ===")
    print(f"Supabase URL : {SUPABASE_URL}")
    print(f"Dry run      : {args.dry_run}")

    # Charger les joueurs
    params = {"select": "*", "order": "id"}
    if args.player_id:
        params["id"] = f"eq.{args.player_id}"
    if args.limit:
        params["limit"] = str(args.limit)

    players = supabase_select("players", **params)
    print(f"Joueurs à traiter : {len(players)}")

    total_bases = 0
    total_selections = 0
    errors = []

    for i, p in enumerate(players, 1):
        stats = migrate_player(p, dry_run=args.dry_run)
        total_bases += stats["bases"]
        total_selections += stats["selections"]
        if stats["errors"]:
            errors.append(stats)
        if i % 50 == 0:
            print(f"  ... {i}/{len(players)} joueurs traités. Bases: {total_bases}, Sélections: {total_selections}")

    print(f"\n=== Récap ===")
    print(f"Joueurs traités       : {len(players)}")
    print(f"Bases juridiques      : {total_bases}")
    print(f"Sélections inférées   : {total_selections}")
    print(f"Erreurs               : {len(errors)}")

    for e in errors[:10]:
        print(f"  - Player #{e['player_id']} ({e['name']}): {e['errors']}")

    # Recompute global éligibilité
    if not args.dry_run:
        print(f"\nRecompute éligibilité globale...")
        try:
            result = supabase_rpc("recompute_all_eligibility", {})
            print(f"  → {result} joueurs recalculés")
        except Exception as e:
            print(f"  → ERROR: {e}")


if __name__ == "__main__":
    main()
