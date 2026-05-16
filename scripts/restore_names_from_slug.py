#!/usr/bin/env python3
"""
Restaure les noms ecrases en "Unknown XXX" depuis le slug intact.

Incident 2026-05-16 : sync_transfermarkt Playwright run #9 (500 joueurs)
a ecrase tous les noms en "Unknown {tm_id}" car le parser n'a pas trouve
le H1 (Chromium headless detecte par Cloudflare ?). Le slug n'a pas ete
touche, on peut reconstruire le name.

Algorithme : `david-irimia` -> "David Irimia"
Particules conservees minuscules : de, da, di, du, van, von, der, la, le,
el, al, bin, ben.

Usage :
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python restore_names_from_slug.py [--dry-run]
"""

from __future__ import annotations
import argparse
import sys
import requests

try:
    from supabase_client import SupabaseClient
except ImportError:
    sys.path.insert(0, ".")
    from supabase_client import SupabaseClient

PARTICLES_LOWER = {"de", "da", "di", "du", "van", "von", "der", "la", "le",
                   "el", "al", "bin", "ben", "of", "the", "and"}


def slug_to_name(slug: str) -> str:
    if not slug:
        return ""
    tokens = slug.split("-")
    out = []
    for i, t in enumerate(tokens):
        if not t:
            continue
        if i > 0 and t.lower() in PARTICLES_LOWER:
            out.append(t.lower())
        else:
            out.append(t.capitalize())
    return " ".join(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = SupabaseClient()
    sb.ping()
    print("[Supabase] auth OK\n")

    # Fetch all Unknown players
    rows = sb.select(
        "players",
        select="id,name,slug,transfermarkt_id",
        name="like.Unknown *",
        limit="2000",
    )
    print(f"Joueurs avec name 'Unknown XXX' : {len(rows)}\n")

    ok = 0
    skip = 0
    fail = 0
    for p in rows:
        slug = p.get("slug") or ""
        restored = slug_to_name(slug)
        if not restored or len(restored) < 3:
            print(f"  [SKIP] id={p['id']} TM={p['transfermarkt_id']} slug={slug!r} (slug invalide)")
            skip += 1
            continue

        if args.dry_run:
            print(f"  [DRY] id={p['id']} '{p['name']}' -> '{restored}'")
            ok += 1
            continue

        r = requests.patch(
            f"{sb.url}/rest/v1/players?id=eq.{p['id']}",
            headers=sb.headers,
            json={"name": restored},
            timeout=20,
        )
        if r.status_code >= 400:
            print(f"  [FAIL] id={p['id']}: HTTP {r.status_code} {r.text[:160]}")
            fail += 1
            continue
        print(f"  [OK]   id={p['id']} '{p['name']}' -> '{restored}'")
        ok += 1

    print(f"\n=== Done: {ok} restaures, {skip} slugs invalides, {fail} fails ===")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
