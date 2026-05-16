#!/usr/bin/env python3
"""
Applique un fichier SQL de migration en l'envoyant à la RPC exec_admin_ddl
(SECURITY DEFINER, réservée au service_role).

Pré-requis : la RPC public.exec_admin_ddl(text) doit exister en BDD.
Setup unique : bundle SQL `sql_bundle_to_paste.sql` collé une fois dans Studio.

Usage :
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python apply_migration.py scripts/migrations/2026_05_16_discovery_method.sql

  # Splits par ; — utile si une migration contient plusieurs statements
  python apply_migration.py path/to/migration.sql --split

  # Exécute en bloc dans un seul EXECUTE plpgsql (par défaut, plus safe)
  python apply_migration.py path/to/migration.sql
"""

from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

try:
    from supabase_client import SupabaseClient
except ImportError:
    sys.path.insert(0, str(Path(__file__).parent))
    from supabase_client import SupabaseClient


def strip_sql_comments(sql: str) -> str:
    """Retire les commentaires SQL -- et /* ... */ pour réduire la taille."""
    # Block comments
    sql = re.sub(r"/\*.*?\*/", "", sql, flags=re.DOTALL)
    # Line comments (mais préserver les chaînes contenant --)
    lines = []
    for line in sql.split("\n"):
        # Naïve mais OK pour nos migrations sans -- dans des strings
        idx = line.find("--")
        if idx >= 0:
            line = line[:idx]
        lines.append(line)
    return "\n".join(lines).strip()


def split_statements(sql: str) -> list[str]:
    """Découpe par ; en respectant les blocs DO $$ ... $$ et CREATE FUNCTION."""
    statements = []
    current = []
    in_dollar = False
    dollar_tag = None
    i = 0
    while i < len(sql):
        ch = sql[i]
        if not in_dollar:
            # Détecte début de $tag$ ou $$
            m = re.match(r"\$([A-Za-z_]\w*)?\$", sql[i:])
            if m:
                in_dollar = True
                dollar_tag = m.group(0)
                current.append(dollar_tag)
                i += len(dollar_tag)
                continue
            if ch == ";":
                stmt = "".join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []
                i += 1
                continue
        else:
            # En mode dollar quote, on cherche la fermeture
            if sql[i: i + len(dollar_tag)] == dollar_tag:
                current.append(dollar_tag)
                i += len(dollar_tag)
                in_dollar = False
                dollar_tag = None
                continue
        current.append(ch)
        i += 1
    last = "".join(current).strip()
    if last:
        statements.append(last)
    return statements


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("migration_file", help="Chemin vers le fichier .sql")
    parser.add_argument("--split", action="store_true",
                        help="Découpe en statements individuels et exec chacun.")
    parser.add_argument("--dry-run", action="store_true",
                        help="Affiche le SQL sans l'envoyer.")
    args = parser.parse_args()

    p = Path(args.migration_file)
    if not p.exists():
        print(f"ERROR: file not found: {p}", file=sys.stderr)
        sys.exit(1)
    sql = p.read_text(encoding="utf-8")
    print(f"=== apply_migration {p.name} ({len(sql)} chars) ===", flush=True)

    if args.dry_run:
        print("--- SQL (dry-run, not sent) ---")
        print(sql)
        return

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK", flush=True)

    if args.split:
        stmts = split_statements(strip_sql_comments(sql))
        print(f"Split into {len(stmts)} statement(s)", flush=True)
    else:
        stmts = [sql]
        print("Sending as single block", flush=True)

    ok_count = 0
    fail_count = 0
    for i, stmt in enumerate(stmts, 1):
        preview = re.sub(r"\s+", " ", stmt)[:120]
        print(f"\n[{i}/{len(stmts)}] {preview}...", flush=True)
        try:
            res = sb.rpc("exec_admin_ddl", {"query": stmt})
            if isinstance(res, dict) and not res.get("ok", True):
                print(f"  FAIL: {res.get('error')} (sqlstate={res.get('sqlstate')})", flush=True)
                fail_count += 1
            else:
                print(f"  OK : {json.dumps(res, ensure_ascii=False)[:200]}", flush=True)
                ok_count += 1
        except Exception as e:
            print(f"  EXCEPTION: {e}", flush=True)
            fail_count += 1

    print(f"\n=== Done: {ok_count} OK, {fail_count} FAIL ===", flush=True)
    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
