#!/usr/bin/env python3
"""
Léopards Radar — Seed one-shot des matchs RDC 2026.

Lit `data/initial_matches_rdc_2026.sql`, parse les valeurs INSERT, et
les insère une par une avec vérification d'idempotence (SELECT avant INSERT).
Un match est considéré comme doublon si kickoff_at + opponent_name existent déjà.

Usage : exécution manuelle one-shot par Alexandre quand les détails du
tirage Mondial sont confirmés (pour mettre à jour opponent_name et venue).

  python seed_matches.py [--dry-run]

Variables d'env :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
from pathlib import Path
from typing import Optional

from supabase_client import SupabaseClient

JOB_NAME = "seed-matches"

# Chemin vers le fichier SQL de seed (relatif au script)
SQL_FILE = Path(__file__).parent / "data" / "initial_matches_rdc_2026.sql"

# Correspondance entre les colonnes du SQL et les clés Python.
# L'ordre DOIT correspondre à l'ordre dans le VALUES du SQL.
COLUMNS = [
    "kickoff_at",
    "opponent_name",
    "opponent_code",
    "opponent_flag",
    "competition",
    "venue",
    "city",
    "country",
    "home_or_away",
    "status",
    "is_published",
]


def parse_sql_values(sql: str) -> list[dict]:
    """
    Parse les tuples VALUES d'un INSERT SQL et retourne une liste de dicts.

    On n'utilise pas un vrai parser SQL pour éviter des dépendances.
    Le format du fichier est maîtrisé — chaque tuple VALUES est sur
    plusieurs lignes et les valeurs sont soit des littéraux SQL (string,
    NULL, boolean) soit des timestamps avec timezone.
    """
    # Extraire le bloc VALUES global (tout ce qui suit VALUES jusqu'au ;)
    match = re.search(r"VALUES\s*(.*?);", sql, re.DOTALL | re.IGNORECASE)
    if not match:
        raise ValueError("Aucun bloc VALUES trouvé dans le SQL")

    values_block = match.group(1).strip()

    # Séparer les tuples — chaque tuple commence par ( et finit par )
    # On découpe sur les ),\n  ( pour ne pas casser les valeurs avec des virgules internes
    # Regex : trouver chaque groupe (...) en tenant compte que les strings peuvent contenir des virgules
    tuples_raw = re.findall(r"\(([^()]+)\)", values_block, re.DOTALL)
    if not tuples_raw:
        raise ValueError("Aucun tuple trouvé dans le bloc VALUES")

    rows = []
    for raw in tuples_raw:
        # Séparer les valeurs — CSV avec possibles espaces et newlines
        # On split sur virgule mais en ignorant les virgules dans les strings SQL
        # Format simple : 'string', 'string', NULL, true/false
        parts = split_sql_values(raw.strip())
        if len(parts) != len(COLUMNS):
            raise ValueError(
                f"Tuple avec {len(parts)} valeurs, attendu {len(COLUMNS)}: {raw[:100]}"
            )
        row = {}
        for col, val in zip(COLUMNS, parts):
            row[col] = parse_sql_value(val.strip())
        rows.append(row)

    return rows


def split_sql_values(s: str) -> list[str]:
    """
    Découpe une chaîne CSV SQL en respectant les strings entre guillemets simples.
    Ex: "'foo, bar', 'baz', NULL" → ["'foo, bar'", "'baz'", "NULL"]
    """
    parts = []
    current = []
    in_string = False
    i = 0
    while i < len(s):
        c = s[i]
        if c == "'" and not in_string:
            in_string = True
            current.append(c)
        elif c == "'" and in_string:
            # Escaped quote '' dans SQL
            if i + 1 < len(s) and s[i + 1] == "'":
                current.append("'")
                i += 1  # sauter le deuxième guillemet
            else:
                in_string = False
                current.append(c)
        elif c == "," and not in_string:
            parts.append("".join(current).strip())
            current = []
        else:
            current.append(c)
        i += 1
    if current:
        parts.append("".join(current).strip())
    return parts


def parse_sql_value(val: str):
    """
    Convertit une valeur SQL brute en valeur Python.
    'string' → str, NULL → None, true/false → bool
    """
    if val.upper() == "NULL":
        return None
    if val.lower() == "true":
        return True
    if val.lower() == "false":
        return False
    # String SQL entourée de guillemets simples
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1].replace("''", "'")  # unescape ''
    # Fallback : retourner tel quel (nombres, etc.)
    return val


def match_exists(sb: SupabaseClient, kickoff_at: str, opponent_name: Optional[str]) -> bool:
    """
    Vérifie si un match existe déjà en base via kickoff_at + opponent_name.
    Pour les matchs "À confirmer", on compare uniquement sur kickoff_at + competition
    (opponent_name est NULL).
    """
    if opponent_name is None:
        # Pour les matchs sans adversaire (placeholder Mondial/CAN), on compare
        # uniquement sur kickoff_at. Si on a le même créneau, c'est un doublon.
        results = sb.select(
            "matches",
            **{
                "kickoff_at": f"eq.{kickoff_at}",
                "select": "id",
                "limit": "1",
            },
        )
    else:
        results = sb.select(
            "matches",
            **{
                "kickoff_at": f"eq.{kickoff_at}",
                "opponent_name": f"eq.{opponent_name}",
                "select": "id",
                "limit": "1",
            },
        )
    return len(results) > 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche ce qui serait inséré sans écrire en base",
    )
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Seed Matchs RDC 2026 ===")
    print(f"Start : {started_at.isoformat()}Z | Dry run : {args.dry_run}")
    print(f"Fichier SQL : {SQL_FILE}")

    if not SQL_FILE.exists():
        print(f"!!! Fichier SQL introuvable : {SQL_FILE}", file=sys.stderr)
        sys.exit(1)

    sb = SupabaseClient()
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"!!! ABORTING: {e}", file=sys.stderr)
        sys.exit(1)

    # Parser le SQL
    sql_content = SQL_FILE.read_text(encoding="utf-8")
    try:
        rows = parse_sql_values(sql_content)
    except ValueError as e:
        print(f"!!! Erreur de parsing SQL : {e}", file=sys.stderr)
        sys.exit(1)

    print(f"\n{len(rows)} matchs à traiter :")

    inserted = 0
    skipped = 0

    for row in rows:
        kickoff = row.get("kickoff_at")
        opponent = row.get("opponent_name")
        label = f"{kickoff} vs {opponent or '(TBD)'}"

        print(f"  {label}", end=" ... ")

        if not args.dry_run and match_exists(sb, kickoff, opponent):
            print("DÉJÀ EN BASE — skip")
            skipped += 1
            continue

        if args.dry_run:
            print(f"[dry-run] serait inséré")
            inserted += 1
            continue

        result = sb.insert("matches", row)
        if result:
            print(f"INSÉRÉ (id={result[0].get('id')})")
            inserted += 1
        else:
            print(f"ÉCHEC (voir logs Supabase)")

    finished_at = dt.datetime.utcnow()
    duration_seconds = int((finished_at - started_at).total_seconds())

    if not args.dry_run:
        sb.insert("sync_logs", {
            "job_name": JOB_NAME,
            "status": "success",
            "players_processed": 0,
            "players_updated": 0,
            "candidates_discovered": inserted,
            "errors_count": 0,
            "started_at": started_at.isoformat() + "Z",
            "finished_at": finished_at.isoformat() + "Z",
            "duration_seconds": duration_seconds,
            "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        })

    print(f"\n=== Récap ===")
    print(f"Insérés : {inserted}")
    print(f"Skippés : {skipped}")
    print(f"Durée   : {duration_seconds}s")


if __name__ == "__main__":
    main()
