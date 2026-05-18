"""dump_fifa26_tm.py — Scrape TM /leistungsdaten/ pour les 16 joueurs FIFA
sans FBRef, et dump le resultat en JSON sur stdout. Pas d'ecriture DB
(la cle service_role n'est pas dispo localement) — c'est Claude qui INSERT
ensuite via le MCP Supabase.

Usage : python scripts/dump_fifa26_tm.py > /tmp/fifa26_tm.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

# Make stats_sources importable
sys.path.insert(0, str(Path(__file__).parent))

from stats_sources.source_transfermarkt import fetch as tm_fetch  # noqa: E402

PLAYERS = [
    (61,  "Brian Cipenga",        "700565"),
    (469, "Fiston Mayele",        "340127"),
    (319, "Meschack Elia",        "423678"),
    (334, "Nathanael Mbuku",      "557614"),
    (429, "Simon Banza",          "344869"),
    (120, "Dylan Batubinsika",    "289432"),
    (188, "Gedeon Kalulu",        "395685"),
    (476, "Joris Kayembe",        "129586"),
    (386, "Rocky Bushiri",        "511802"),
    (441, "Steve Kapuadi",        "679709"),
    (300, "Lionel Mpasi-Nzau",    "164915"),
    (471, "Matthieu Epolo",       "680218"),
    (454, "Timothy Fayulu",       "541420"),
    (124, "Edo Kayembe",          "486477"),
    (170, "Gael Kakuta",          "74297"),
    (420, "Samuel Moutoussamy",   "353403"),
]

def main():
    out = []
    for player_id, name, tm_id in PLAYERS:
        print(f"[scrape] {name} (id={player_id} tm={tm_id})", file=sys.stderr)
        try:
            rows = tm_fetch({"transfermarkt_id": tm_id, "name": name})
        except RuntimeError as e:
            print(f"  STOP : {e}", file=sys.stderr)
            break
        for row in rows:
            row["player_id"] = player_id
            row["player_name"] = name
            out.append(row)
        if not rows:
            print(f"  → 0 comp", file=sys.stderr)
        else:
            print(f"  → {len(rows)} comp", file=sys.stderr)

    json.dump(out, sys.stdout, ensure_ascii=False, indent=2)
    print(f"\n[done] {len(out)} rows total", file=sys.stderr)

if __name__ == "__main__":
    main()
