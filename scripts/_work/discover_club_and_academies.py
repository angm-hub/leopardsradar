#!/usr/bin/env python3
"""
Découverte unifiée : pour chaque club pro listé, va sur TM search,
récupère le vrai verein_id du club pro + tous les verein_ids des académies
(U15/U16/U17/U18/U19/U21/B/II/Youth/Reserves) liés.

Produit `scripts/data/academy_map.json` :
{
  "FC Lorient": {
    "league": "L1",
    "pro_id": "1158",
    "pro_name": "FC Lorient",
    "academies": [
      {"id": "99399",  "name": "FC Lorient U17",  "level": "U17"},
      {"id": "11605",  "name": "FC Lorient U19",  "level": "U19"},
      {"id": "138219", "name": "FC Lorient U18",  "level": "U18"},
      {"id": "16662",  "name": "FC Lorient B",    "level": "B"},
      {"id": "100157", "name": "FC Lorient Youth","level": "Youth"}
    ]
  },
  ...
}

Pourquoi : la liste TOP_LEAGUE_CLUBS de comprehensive_discovery.py contient
des IDs incorrects (ex: 432 = Chicago Fire FC, pas FC Lorient). Cette
découverte produit la map fiable + capture les académies (le trou que le
scan A actuel ne couvre pas).
"""

from __future__ import annotations
import json
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent.parent  # scripts/
sys.path.insert(0, str(ROOT))

from transfermarkt_client import TransfermarktClient
from bs4 import BeautifulSoup

BASE = "https://www.transfermarkt.com"

# Liste cible : noms de clubs (le système identifie le vrai ID via search).
# Ligues couvertes : L1, L2, Pro League BE, Eredivisie, 1.+2. Bundesliga,
# Premier League, Championship.
CLUBS = [
    # ── Ligue 1 ──
    ("L1", "Paris Saint-Germain"), ("L1", "Olympique de Marseille"), ("L1", "Olympique Lyonnais"),
    ("L1", "AS Monaco"), ("L1", "LOSC Lille"), ("L1", "Stade Rennais"), ("L1", "RC Lens"),
    ("L1", "OGC Nice"), ("L1", "Stade de Reims"), ("L1", "Toulouse FC"), ("L1", "Le Havre AC"),
    ("L1", "FC Nantes"), ("L1", "Montpellier HSC"), ("L1", "Stade Brestois 29"),
    ("L1", "RC Strasbourg"), ("L1", "Girondins de Bordeaux"), ("L1", "FC Lorient"),
    ("L1", "FC Metz"), ("L1", "Clermont Foot"), ("L1", "Angers SCO"),
    ("L1", "AS Saint-Etienne"), ("L1", "AJ Auxerre"),
    # ── Ligue 2 ──
    ("L2", "Valenciennes FC"), ("L2", "FC Sochaux-Montbéliard"), ("L2", "Amiens SC"),
    ("L2", "Stade Lavallois"), ("L2", "SM Caen"), ("L2", "Pau FC"), ("L2", "Grenoble Foot 38"),
    ("L2", "AC Ajaccio"), ("L2", "EA Guingamp"), ("L2", "Dijon FCO"),
    ("L2", "Paris FC"), ("L2", "ESTAC Troyes"), ("L2", "FC Annecy"), ("L2", "Quevilly Rouen"),
    # ── Belgique Pro League ──
    ("BEL1", "RSC Anderlecht"), ("BEL1", "Club Brugge"), ("BEL1", "Union Saint-Gilloise"),
    ("BEL1", "KRC Genk"), ("BEL1", "KAA Gent"), ("BEL1", "Standard Liège"),
    ("BEL1", "Sporting Charleroi"), ("BEL1", "Cercle Brugge"), ("BEL1", "OH Leuven"),
    ("BEL1", "KV Mechelen"), ("BEL1", "Sint-Truiden VV"), ("BEL1", "KVC Westerlo"),
    ("BEL1", "KV Kortrijk"), ("BEL1", "Royal Antwerp"), ("BEL1", "Beerschot VA"),
    ("BEL1", "RWD Molenbeek"),
    # ── Eredivisie ──
    ("NL1", "Ajax Amsterdam"), ("NL1", "PSV Eindhoven"), ("NL1", "Feyenoord Rotterdam"),
    ("NL1", "AZ Alkmaar"), ("NL1", "FC Utrecht"), ("NL1", "FC Twente Enschede"),
    ("NL1", "Sparta Rotterdam"), ("NL1", "RKC Waalwijk"), ("NL1", "Vitesse Arnhem"),
    ("NL1", "NEC Nijmegen"), ("NL1", "Almere City FC"), ("NL1", "Heracles Almelo"),
    ("NL1", "PEC Zwolle"), ("NL1", "Go Ahead Eagles"), ("NL1", "Fortuna Sittard"),
    ("NL1", "FC Groningen"),
    # ── Bundesliga ──
    ("GER1", "Bayern Munich"), ("GER1", "Borussia Dortmund"), ("GER1", "RB Leipzig"),
    ("GER1", "Bayer 04 Leverkusen"), ("GER1", "Eintracht Frankfurt"), ("GER1", "VfB Stuttgart"),
    ("GER1", "Borussia Mönchengladbach"), ("GER1", "VfL Wolfsburg"), ("GER1", "SC Freiburg"),
    ("GER1", "TSG Hoffenheim"), ("GER1", "Werder Bremen"), ("GER1", "FC Augsburg"),
    ("GER1", "1. FC Heidenheim"), ("GER1", "1. FC Union Berlin"), ("GER1", "FC St. Pauli"),
    ("GER1", "VfL Bochum"), ("GER1", "1. FSV Mainz 05"), ("GER1", "Holstein Kiel"),
    # ── 2. Bundesliga (top 10 où diaspora congolaise présente) ──
    ("GER2", "1. FC Kaiserslautern"), ("GER2", "Karlsruher SC"), ("GER2", "Hamburger SV"),
    ("GER2", "Hannover 96"), ("GER2", "Fortuna Düsseldorf"), ("GER2", "FC Schalke 04"),
    ("GER2", "Hertha BSC"), ("GER2", "SC Paderborn 07"), ("GER2", "1. FC Nürnberg"),
    ("GER2", "1. FC Magdeburg"), ("GER2", "SV Darmstadt 98"),
    # ── Premier League ──
    ("ENG1", "Manchester City"), ("ENG1", "Arsenal FC"), ("ENG1", "Liverpool FC"),
    ("ENG1", "Manchester United"), ("ENG1", "Chelsea FC"), ("ENG1", "Tottenham Hotspur"),
    ("ENG1", "Newcastle United"), ("ENG1", "Aston Villa"), ("ENG1", "Brighton & Hove Albion"),
    ("ENG1", "West Ham United"), ("ENG1", "Crystal Palace"), ("ENG1", "Fulham FC"),
    ("ENG1", "Wolverhampton Wanderers"), ("ENG1", "Everton FC"), ("ENG1", "Brentford FC"),
    ("ENG1", "Nottingham Forest"), ("ENG1", "AFC Bournemouth"), ("ENG1", "Southampton FC"),
    ("ENG1", "Leicester City"), ("ENG1", "Ipswich Town"),
    # ── Championship (top 12 forte diaspora) ──
    ("ENG2", "Leeds United"), ("ENG2", "Middlesbrough FC"), ("ENG2", "Sunderland AFC"),
    ("ENG2", "Sheffield United"), ("ENG2", "Preston North End"), ("ENG2", "West Bromwich Albion"),
    ("ENG2", "Millwall FC"), ("ENG2", "Coventry City"), ("ENG2", "Cardiff City"),
    ("ENG2", "Plymouth Argyle"), ("ENG2", "Queens Park Rangers"), ("ENG2", "Bristol City"),
    ("ENG2", "Watford FC"), ("ENG2", "Norwich City"),
    # ── PHASE 2 (2026-05-16) ── Ligues secondaires + Italie/Espagne complétées
    # ── Liga Portugal Bwin ──
    ("POR1", "SL Benfica"), ("POR1", "FC Porto"), ("POR1", "Sporting CP"),
    ("POR1", "SC Braga"), ("POR1", "Vitória SC"), ("POR1", "Moreirense FC"),
    ("POR1", "FC Famalicão"), ("POR1", "Gil Vicente FC"), ("POR1", "Boavista Porto"),
    ("POR1", "Casa Pia AC"), ("POR1", "Estoril Praia"), ("POR1", "Rio Ave FC"),
    # ── Suisse Super League ──
    ("SUI1", "FC Basel"), ("SUI1", "Young Boys"), ("SUI1", "FC Zürich"),
    ("SUI1", "Servette FC"), ("SUI1", "Grasshopper Club Zürich"), ("SUI1", "FC Lugano"),
    ("SUI1", "FC Sion"), ("SUI1", "FC Lausanne-Sport"), ("SUI1", "FC Luzern"),
    ("SUI1", "FC St. Gallen"),
    # ── Turquie Süper Lig ──
    ("TUR1", "Galatasaray"), ("TUR1", "Fenerbahçe"), ("TUR1", "Beşiktaş JK"),
    ("TUR1", "Trabzonspor"), ("TUR1", "Başakşehir FK"), ("TUR1", "Adana Demirspor"),
    ("TUR1", "Konyaspor"), ("TUR1", "Antalyaspor"),
    # ── Autriche Bundesliga ──
    ("AUT1", "Red Bull Salzburg"), ("AUT1", "SK Sturm Graz"), ("AUT1", "SK Rapid Wien"),
    ("AUT1", "FK Austria Wien"), ("AUT1", "LASK Linz"), ("AUT1", "Wolfsberger AC"),
    # ── Italie Serie A (au-delà du top 6 déjà couvert ailleurs) ──
    ("ITA1", "Atalanta BC"), ("ITA1", "AC Milan"), ("ITA1", "Juventus FC"),
    ("ITA1", "FC Internazionale"), ("ITA1", "AS Roma"), ("ITA1", "SS Lazio"),
    ("ITA1", "Napoli SSC"), ("ITA1", "ACF Fiorentina"), ("ITA1", "Bologna FC"),
    ("ITA1", "Torino FC"), ("ITA1", "Udinese Calcio"), ("ITA1", "Genoa CFC"),
    ("ITA1", "Como 1907"), ("ITA1", "Hellas Verona"),
    # ── Espagne La Liga ──
    ("ESP1", "Real Madrid"), ("ESP1", "FC Barcelona"), ("ESP1", "Atlético Madrid"),
    ("ESP1", "Sevilla FC"), ("ESP1", "Villarreal CF"), ("ESP1", "Real Sociedad"),
    ("ESP1", "Athletic Club"), ("ESP1", "Real Betis Sevilla"), ("ESP1", "Valencia CF"),
    ("ESP1", "Celta de Vigo"), ("ESP1", "RCD Espanyol Barcelona"), ("ESP1", "Getafe CF"),
    ("ESP1", "CA Osasuna"), ("ESP1", "Rayo Vallecano"),
    # ── Pologne Ekstraklasa ──
    ("POL1", "Legia Warszawa"), ("POL1", "Lech Poznań"), ("POL1", "Pogoń Szczecin"),
    ("POL1", "Jagiellonia Białystok"), ("POL1", "Wisła Płock"),
    # ── Saudi Pro League (diaspora congolaise présente Wissa/Bakambu antérieurs) ──
    ("SAU1", "Al-Hilal SFC"), ("SAU1", "Al-Ittihad Jeddah"), ("SAU1", "Al-Nassr FC"),
    ("SAU1", "Al-Ahli Jeddah"),
    # ── Grèce Super League (académies grecques captent diaspora) ──
    ("GRE1", "Olympiacos Piraeus"), ("GRE1", "Panathinaikos Athens"),
    ("GRE1", "AEK Athens"), ("GRE1", "PAOK Thessaloniki"),
]

YOUTH_KEYWORDS_LEVELS = [
    ("U17", ["u17", "u-17", "u 17", "ub17"]),
    ("U18", ["u18", "u-18", "u 18", "ub18"]),
    ("U19", ["u19", "u-19", "u 19", "uefa u19", "ub19"]),
    ("U21", ["u21", "u-21", "u 21"]),
    ("U23", ["u23", "u-23", "u 23"]),
    ("U16", ["u16", "u-16", "u 16"]),
    ("U15", ["u15", "u-15", "u 15"]),
    ("B",   [" b ", "-b ", " b/", " bii", " ii ", " ii/"]),
    ("Reserves", ["reserve", "réserve", "reservas", "amateurs", "futures"]),
    ("Youth", ["youth", "jeune", "academy", "jugend"]),
]


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s.lower()).strip()


def classify_level(name: str) -> str | None:
    n = " " + normalize(name) + " "
    for level, kws in YOUTH_KEYWORDS_LEVELS:
        for kw in kws:
            if kw in n:
                return level
    return None


def search_club(tm: TransfermarktClient, query: str) -> list[dict]:
    url = f"{BASE}/schnellsuche/ergebnis/schnellsuche?query={query.replace(' ', '+')}"
    html = tm._get(url)
    if not html:
        return []
    soup = BeautifulSoup(html, "html.parser")
    hits = []
    seen = set()
    for cell in soup.select("td.hauptlink a[href*='/verein/']"):
        href = cell.get("href", "")
        text = cell.get_text(strip=True)
        m = re.search(r"/verein/(\d+)", href)
        if not m:
            continue
        cid = m.group(1)
        if cid in seen:
            continue
        seen.add(cid)
        hits.append({"id": cid, "name": text, "href": href})
    return hits


def name_matches(query: str, hit_name: str) -> bool:
    """Vérifie que le hit name commence par les mots-clés du query."""
    qn = normalize(query)
    hn = normalize(hit_name)
    # Au moins le premier mot du query doit être dans le hit
    first_word = qn.split()[0] if qn else ""
    if first_word and first_word not in hn:
        return False
    # Tous les mots significatifs du query (≥3 chars) doivent apparaître
    q_tokens = [t for t in re.split(r"\W+", qn) if len(t) >= 3 and t not in
                {"the", "fc", "ac", "ca", "as", "rc", "fk", "kv", "sv", "vfl",
                 "vfb", "tsg", "ssv", "vsc", "rsv", "kss", "ksc", "and"}]
    if not q_tokens:
        return True
    return all(t in hn for t in q_tokens)


def main():
    tm = TransfermarktClient(rate_limit_seconds=2.0)
    result: dict[str, dict] = {}

    print(f"=== Découverte clubs + académies pour {len(CLUBS)} clubs ===\n")
    fail = []
    no_academy = []

    for i, (league, query) in enumerate(CLUBS, 1):
        print(f"[{i:>3}/{len(CLUBS)}] {league} — {query!r}")
        hits = search_club(tm, query)
        if not hits:
            print(f"        FAIL — aucun résultat")
            fail.append((league, query))
            continue

        # Filter to hits that look like they match the query name
        relevant = [h for h in hits if name_matches(query, h["name"])]
        if not relevant:
            print(f"        FAIL — pas de hit pertinent (hits bruts: {[h['name'] for h in hits[:5]]})")
            fail.append((league, query))
            continue

        # Pro = premier hit sans suffix jeune
        pro = next((h for h in relevant if classify_level(h["name"]) is None), None)
        if not pro:
            # fallback : le 1er hit relevant
            pro = relevant[0]

        academies = []
        for h in relevant:
            if h["id"] == pro["id"]:
                continue
            level = classify_level(h["name"])
            if level is None:
                continue
            academies.append({"id": h["id"], "name": h["name"], "level": level})

        result[query] = {
            "league": league,
            "pro_id": pro["id"],
            "pro_name": pro["name"],
            "academies": academies,
        }

        ac_summary = ", ".join(f"{a['level']}={a['id']}" for a in academies) or "(none)"
        print(f"        pro=[{pro['id']}] {pro['name']!r}  acads: {ac_summary}")

        if not academies:
            no_academy.append((league, query, pro["id"]))

    # Save
    out_path = ROOT / "data" / "academy_map.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    # Report
    total_pro = len(result)
    total_acad = sum(len(v["academies"]) for v in result.values())
    print()
    print(f"=== DONE ===")
    print(f"  Clubs pro identifiés    : {total_pro}/{len(CLUBS)}")
    print(f"  Académies identifiées   : {total_acad}")
    print(f"  Clubs SANS académie     : {len(no_academy)}")
    print(f"  Clubs FAIL (no match)   : {len(fail)}")
    if fail:
        print(f"  Fails :")
        for league, q in fail:
            print(f"    - {league} : {q}")
    print(f"  Écrit : {out_path}")


if __name__ == "__main__":
    main()
