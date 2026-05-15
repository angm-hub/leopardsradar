#!/usr/bin/env python3
"""
Léopards Radar — Discovery v2 : multi-source comprehensive.

Pourquoi ce script existe :
  Believe Munongo (TM 1297673, Lorient, Ligue 1) n'a pas été capturé par les
  scripts existants car :
  1. discover_candidates.py : filtre land_id=193 (nationalité RDC déclarée) →
     un binational non encore international RDC est invisible.
  2. discover_by_surname.py : crawle les sélections jeunes EU et quelques
     académies → Lorient n'est PAS dans la liste des clubs scannés.
  3. discover_wikidata.py : cherche P19=COD ou P27=COD → Munongo né en
     Europe + pas encore de citizenship RDC sur Wikidata → invisible.

Ce script comble ces 3 gaps avec 4 méthodes complémentaires :
  A. Scan des rosters des clubs pros des ligues FR/BE/NL/DE/UK/PT/L2 FR
     → capture tous les joueurs à patronyme bantu dans les clubs pros,
       y compris Lorient, Metz, Clermont, etc.
  B. Wikipedia categories scraping (API Mediawiki)
     → catégories "Footballeur français d'origine congolaise", etc.
  C. Wikidata SPARQL étendu (P22 père / P25 mère / P735 prénom / P734 nom)
     → attrape les joueurs dont UNE DES DEUX PARENTS est congolais.
  D. Patronymes bantu étendus × Transfermarkt search
     → liste de 90+ patronymes, search TM direct par nom.

Usage :
  python comprehensive_discovery.py [--dry-run] [--methods A,B,C,D]

Variables d'env :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
import time
import unicodedata
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup

# Imports locaux (même dossier)
try:
    from supabase_client import SupabaseClient
    from transfermarkt_client import TransfermarktClient
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

JOB_NAME = "comprehensive-discovery"
RATE_LIMIT = float(os.environ.get("RATE_LIMIT_SECONDS", "1.5"))

# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE A — Clubs pros Top European Leagues
# IDs Transfermarkt confirmés. Périmètre : Ligue 1, L2 (top 8), Pro League BE,
# Eredivisie, 2.Bundesliga, Championship, Liga Portugal Bwin, Süper Lig (top 4)
# ─────────────────────────────────────────────────────────────────────────────
TOP_LEAGUE_CLUBS = [
    # ── Ligue 1 France (2024-25, 18 clubs) ──
    {"id": "583",    "name": "Paris Saint-Germain",   "league": "L1"},
    {"id": "162",    "name": "Olympique de Marseille", "league": "L1"},
    {"id": "168",    "name": "Olympique Lyonnais",    "league": "L1"},
    {"id": "1158",   "name": "AS Monaco",             "league": "L1"},
    {"id": "415",    "name": "LOSC Lille",            "league": "L1"},
    {"id": "995",    "name": "Stade Rennais",         "league": "L1"},
    {"id": "1136",   "name": "RC Lens",               "league": "L1"},
    {"id": "394",    "name": "OGC Nice",              "league": "L1"},
    {"id": "379",    "name": "Stade de Reims",        "league": "L1"},
    {"id": "533",    "name": "Toulouse FC",           "league": "L1"},
    {"id": "182",    "name": "Le Havre AC",           "league": "L1"},
    {"id": "514",    "name": "Nantes",                "league": "L1"},
    {"id": "5765",   "name": "Montpellier HSC",       "league": "L1"},
    {"id": "3522",   "name": "Brest",                 "league": "L1"},
    {"id": "1104",   "name": "Strasbourg",            "league": "L1"},
    {"id": "130",    "name": "Girondins de Bordeaux", "league": "L1"},
    {"id": "432",    "name": "FC Lorient",            "league": "L1"},
    {"id": "347",    "name": "FC Metz",               "league": "L1"},  # ID corrigé (était 391 = club allemand)
    {"id": "17750",  "name": "Clermont Foot",         "league": "L1"},
    {"id": "1169",   "name": "Angers SCO",            "league": "L1"},
    {"id": "12312",  "name": "Saint-Etienne",         "league": "L1"},
    {"id": "1234",   "name": "Auxerre",               "league": "L1"},
    # ── L2 France top 8 (forte présence joueurs binationaux) ──
    {"id": "1104",   "name": "Strasbourg L2",         "league": "L2"},
    {"id": "3066",   "name": "Valenciennes FC",       "league": "L2"},
    {"id": "2511",   "name": "FC Sochaux",            "league": "L2"},
    {"id": "381",    "name": "Amiens SC",             "league": "L2"},
    {"id": "2745",   "name": "Laval",                 "league": "L2"},
    {"id": "2815",   "name": "Caen",                  "league": "L2"},
    {"id": "2796",   "name": "Pau FC",                "league": "L2"},
    {"id": "2814",   "name": "Grenoble",              "league": "L2"},
    # ── Pro League Belgium (16 clubs, 2024-25) ──
    {"id": "232",    "name": "RSC Anderlecht",        "league": "BEL1"},
    {"id": "1286",   "name": "Club Brugge",           "league": "BEL1"},
    {"id": "2282",   "name": "Union Saint-Gilloise",  "league": "BEL1"},
    {"id": "241",    "name": "KRC Genk",              "league": "BEL1"},
    {"id": "3050",   "name": "Gent",                  "league": "BEL1"},
    {"id": "2281",   "name": "Standard Liège",        "league": "BEL1"},
    {"id": "3065",   "name": "Charleroi",             "league": "BEL1"},
    {"id": "5577",   "name": "Cercle Brugge",         "league": "BEL1"},
    {"id": "2273",   "name": "OH Leuven",             "league": "BEL1"},
    {"id": "2289",   "name": "KV Mechelen",           "league": "BEL1"},
    {"id": "7817",   "name": "Sint-Truiden",          "league": "BEL1"},
    {"id": "2280",   "name": "Westerlo",              "league": "BEL1"},
    {"id": "2272",   "name": "Mouscron",              "league": "BEL1"},
    {"id": "5571",   "name": "KV Kortrijk",           "league": "BEL1"},
    {"id": "2276",   "name": "KAS Eupen",             "league": "BEL1"},
    {"id": "3043",   "name": "Beerschot VA",          "league": "BEL1"},
    {"id": "2293",   "name": "RWDM",                  "league": "BEL1"},
    # ── Eredivisie Netherlands ──
    {"id": "610",    "name": "Ajax Amsterdam",        "league": "NL1"},
    {"id": "435",    "name": "PSV Eindhoven",         "league": "NL1"},
    {"id": "320",    "name": "Feyenoord",             "league": "NL1"},
    {"id": "681",    "name": "AZ Alkmaar",            "league": "NL1"},
    {"id": "368",    "name": "FC Utrecht",            "league": "NL1"},
    {"id": "2010",   "name": "FC Twente",             "league": "NL1"},
    {"id": "421",    "name": "Sparta Rotterdam",      "league": "NL1"},
    {"id": "384",    "name": "RKC Waalwijk",          "league": "NL1"},
    {"id": "684",    "name": "Vitesse",               "league": "NL1"},
    {"id": "673",    "name": "NEC Nijmegen",          "league": "NL1"},
    {"id": "418",    "name": "Almere City",           "league": "NL1"},
    {"id": "420",    "name": "Heracles Almelo",       "league": "NL1"},
    # ── 2. Bundesliga Germany ──
    {"id": "63",     "name": "1. FC Kaiserslautern",  "league": "GER2"},
    {"id": "39",     "name": "Karlsruher SC",         "league": "GER2"},
    {"id": "14",     "name": "Hamburger SV",          "league": "GER2"},
    {"id": "79",     "name": "Hannover 96",           "league": "GER2"},
    {"id": "3",      "name": "1. FC Magdeburg",       "league": "GER2"},
    {"id": "150",    "name": "Darmstadt 98",          "league": "GER2"},
    {"id": "48",     "name": "Fortuna Düsseldorf",    "league": "GER2"},
    {"id": "16",     "name": "Schalke 04",            "league": "GER2"},
    {"id": "761",    "name": "Hertha BSC",            "league": "GER2"},
    {"id": "15",     "name": "SC Paderborn",          "league": "GER2"},
    {"id": "91",     "name": "1. FC Nürnberg",        "league": "GER2"},
    # ── Championship England ──
    {"id": "1075",   "name": "Leeds United",          "league": "ENG2"},
    {"id": "1031",   "name": "Middlesbrough",         "league": "ENG2"},
    {"id": "1218",   "name": "Sunderland",            "league": "ENG2"},
    {"id": "988",    "name": "Sheffield United",      "league": "ENG2"},
    {"id": "703",    "name": "Preston North End",     "league": "ENG2"},
    {"id": "1015",   "name": "West Brom",             "league": "ENG2"},
    {"id": "779",    "name": "Millwall",              "league": "ENG2"},
    {"id": "972",    "name": "Coventry City",         "league": "ENG2"},
    {"id": "1011",   "name": "Derby County",          "league": "ENG2"},
    {"id": "1043",   "name": "Cardiff City",          "league": "ENG2"},
    {"id": "985",    "name": "Plymouth Argyle",       "league": "ENG2"},
    {"id": "1049",   "name": "Queens Park Rangers",   "league": "ENG2"},
    {"id": "699",    "name": "Bristol City",          "league": "ENG2"},
    # ── Liga Portugal Bwin ──
    {"id": "720",    "name": "SL Benfica",            "league": "POR1"},
    {"id": "336",    "name": "FC Porto",              "league": "POR1"},
    {"id": "1108",   "name": "Sporting CP",           "league": "POR1"},
    {"id": "5780",   "name": "SC Braga",              "league": "POR1"},
    {"id": "7460",   "name": "Vitória SC",            "league": "POR1"},
    {"id": "6833",   "name": "Moreirense",            "league": "POR1"},
    {"id": "4924",   "name": "Famalicão",             "league": "POR1"},
    {"id": "5588",   "name": "Gil Vicente",           "league": "POR1"},
    # ── Süper Lig Turkey (top 4, diaspora africaine présente) ──
    {"id": "244",    "name": "Galatasaray",           "league": "TUR1"},
    {"id": "114",    "name": "Fenerbahçe",            "league": "TUR1"},
    {"id": "45",     "name": "Beşiktaş",             "league": "TUR1"},
    {"id": "716",    "name": "Trabzonspor",           "league": "TUR1"},
    # ── Serie A Italy (top 6 pour binationaux) ──
    {"id": "5",      "name": "AC Milan",              "league": "ITA1"},
    {"id": "46",     "name": "Juventus",              "league": "ITA1"},
    {"id": "7",      "name": "Inter Milan",           "league": "ITA1"},
    {"id": "12321",  "name": "Atalanta",              "league": "ITA1"},
    {"id": "398",    "name": "AS Roma",               "league": "ITA1"},
    {"id": "506",    "name": "SS Lazio",              "league": "ITA1"},
]

# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE B — Wikipedia categories (FR + EN)
# Ces catégories listent les footballeurs binationaux déclarés congolais.
# Mediawiki API : action=query&list=categorymembers
# ─────────────────────────────────────────────────────────────────────────────
WIKIPEDIA_CATEGORIES = [
    # Catégories FR
    {"lang": "fr", "title": "Catégorie:Footballeur_français_d'origine_congolaise_(RDC)"},
    {"lang": "fr", "title": "Catégorie:Footballeur_français_d'origine_congolaise"},
    {"lang": "fr", "title": "Catégorie:Footballeur_belge_d'origine_congolaise_(RDC)"},
    {"lang": "fr", "title": "Catégorie:Footballeur_belge_d'origine_congolaise"},
    {"lang": "fr", "title": "Catégorie:Footballeur_néerlandais_d'origine_congolaise"},
    {"lang": "fr", "title": "Catégorie:Footballeur_congolais_(RDC)"},
    {"lang": "fr", "title": "Catégorie:Footballeur_congolais_(rdc)"},
    # Catégories EN
    {"lang": "en", "title": "Category:Democratic_Republic_of_the_Congo_international_footballers"},
    {"lang": "en", "title": "Category:Belgian_people_of_Democratic_Republic_of_the_Congo_descent"},
    {"lang": "en", "title": "Category:French_people_of_Democratic_Republic_of_the_Congo_descent"},
    {"lang": "en", "title": "Category:Dutch_people_of_Democratic_Republic_of_the_Congo_descent"},
    {"lang": "en", "title": "Category:English_people_of_Democratic_Republic_of_the_Congo_descent"},
]

# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE C — Wikidata SPARQL étendu
# Ajoute P22 (père) et P25 (mère) pour attraper les joueurs dont UNE DES PARENTS
# est congolaise, même si eux-mêmes n'ont pas P27=RDC.
# ─────────────────────────────────────────────────────────────────────────────
SPARQL_EXTENDED_QUERY = """
SELECT DISTINCT ?player ?playerLabel ?tmId ?birthPlaceLabel WHERE {
  ?player wdt:P31 wd:Q5 ;
          wdt:P106 wd:Q937857 .
  {
    ?player wdt:P27 wd:Q974 .
  } UNION {
    ?player wdt:P19 ?bp . ?bp wdt:P17 wd:Q974 .
  } UNION {
    ?player wdt:P22 ?father .
    { ?father wdt:P27 wd:Q974 . }
    UNION
    { ?father wdt:P19 ?fbp . ?fbp wdt:P17 wd:Q974 . }
  } UNION {
    ?player wdt:P25 ?mother .
    { ?mother wdt:P27 wd:Q974 . }
    UNION
    { ?mother wdt:P19 ?mbp . ?mbp wdt:P17 wd:Q974 . }
  }
  OPTIONAL { ?player wdt:P2446 ?tmId . }
  OPTIONAL { ?player wdt:P19 ?birthPlace . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "fr,en". }
}
LIMIT 8000
"""

# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE D — Patronymes bantu étendus × Transfermarkt search
# 90+ patronymes RDC connus — liste consolidée depuis :
# - bantou_surnames.json existant (HIGH/MEDIUM)
# - noms de familles les plus fréquents RDC (Wikipedia, DataNomes)
# - noms de joueurs connus de la diaspora non encore en BDD
# ─────────────────────────────────────────────────────────────────────────────
EXTENDED_PATRONYMES = [
    # Noms très spécifiques RDC (quasi aucun faux positif)
    "Munongo",       # ← CAS MUNONGO — le déclencheur de ce script
    "Kabambi",
    "Kabeya",
    "Kabungo",
    "Kadima",
    "Kakudji",
    "Kakuta",
    "Kalombo",
    "Kalonji",
    "Kalulu",
    "Kamanda",
    "Kambayi",
    "Kanda",
    "Kanku",
    "Kasongo",
    "Kayembe",
    "Kayombo",
    "Kazadi",
    "Kebano",
    "Kitolano",
    "Kompany",
    "Kongolo",
    "Konsa",
    "Lukaku",
    "Lukeba",
    "Lukebakio",
    "Lukoki",
    "Lusamba",
    "Maghoma",
    "Makengo",
    "Mandanda",
    "Mateta",
    "Mayele",
    "Mayulu",
    "Mbala",
    "Mbangula",
    "Mbemba",
    "Mbokani",
    "Mboyo",
    "Mbuyi",
    "Mokio",
    "Mpoyi",
    "Mputu",
    "Muamba",
    "Mubama",
    "Muhindo",
    "Mujinga",
    "Mukiele",
    "Mukoko",
    "Mulamba",
    "Mutombo",
    "Mwamba",
    "Ndongala",
    "Ngakia",
    "Ngoy",
    "Ngoyi",
    "Nsiala",
    "Nsimba",
    "Nsingi",
    "Ntumba",
    "Numbi",
    "Nyembo",
    "Nzuzi",
    "Pembele",
    "Sambi",
    "Shabani",
    "Tambwe",
    "Tshibanda",
    "Tshibangu",
    "Tshilombo",
    "Tshimanga",
    "Tshituka",
    "Tuanzebe",
    "Tumba",
    "Wan-Bissaka",
    "Wissa",
    "Ilunga",
    "Kabamba",
    "Kabangu",
    "Kabasele",
    "Kabongo",
    "Kabuya",
    "Bakambu",
    "Benteke",
    "Bitshiabu",
    "Bolasie",
    "Bombito",
    "Bondo",
    "Bongonda",
    "Disasi",
    "Feza",
    "Lavia",
    "Lema",
    "Lokonga",
    "Lotomba",
    "Mamba",
    "Matondo",
    "Mbala",
    "Banza",
    "Bakwa",
    # Patronymes MEDIUM - rares hors RDC
    "Mulongo",
    "Mulumba",
    "Mumbere",
    "Munganga",
    "Muntu",
    "Muteba",
    "Muya",
    "Muzinga",
    "Mvete",
    "Mwanga",
    "Mwanze",
    "Kalala",
    "Kalamba",
    "Kalemba",
    "Kalenga",
    "Kalunga",
    "Kamanga",
    "Kamba",
    "Kaninda",
    "Kapinga",
    "Kasekwa",
    "Kasereka",
    "Katalayi",
    "Kenda",
    "Kinkela",
    "Kitenge",
    "Kitoko",
    "Limbombe",
    "Lokando",
    "Lombe",
    "LuaLua",
    "Lubaki",
    "Lumbala",
    "Lusala",
    "Lutete",
    "Mabiala",
    "Mafuta",
    "Maheshe",
    "Makelele",
    "Malamba",
    "Maloba",
    "Mambo",
    "Masudi",
    "Matumona",
    "Mayombo",
    "Mbaki",
    "Mbamba",
    "Mbayo",
    "Mbele",
    "Mbombo",
    "Milambo",
    "Mirindi",
    "Moke",
    "Moleka",
    "Morisho",
    "Mpaka",
    "Mpolo",
    "Muadi",
    "Muana",
    "Mubenga",
    "Mudiay",
    "Mukadi",
    "Mukeba",
    "Mukenge",
    "Mukuna",
    "Mulanga",
    "Muleka",
    "Mulonda",
    "Ndjoli",
    "Ndongo",
    "Ngabu",
    "Ngandu",
    "Ngimbi",
    "Ngindu",
    "Ngoie",
    "Ngongo",
    "Nkongolo",
    "Nkulu",
    "Nkumu",
    "Nsimire",
    "Nsona",
    "Ntambwe",
    "Nzau",
    "Nzeza",
    "Nzita",
    "Okito",
    "Paluku",
    "Sangwa",
    "Senga",
    "Siwako",
    "Tabu",
    "Tanda",
    "Tshibuabua",
    "Tshiembe",
    "Tshilumba",
    "Zakuani",
    "Zinga",
    "Bolingoli",
    "Engwanda",
    "Eyenga",
    "Idumbo",
    "Ilongo",
    "Kabemba",
    "Kalema",
    "Kalambayi",
    "Badibanga",
    "Badiashile",
    "Bakasu",
    "Bakola",
    "Balagizi",
    "Baleke",
    "Balenga",
    "Balikwisha",
    "Baningime",
    "Bisimwa",
    "Bofunda",
    "Bokila",
    "Bola",
    "Bolamba",
    "Bolongo",
    "Bonga",
    "Bukasa",
    "Bula",
    "Bushiri",
]

# Dédupliquer la liste (des noms peuvent apparaître plusieurs fois)
EXTENDED_PATRONYMES = list(dict.fromkeys(EXTENDED_PATRONYMES))


# ─────────────────────────────────────────────────────────────────────────────
# Utilitaires
# ─────────────────────────────────────────────────────────────────────────────

def strip_accents(s: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c)
    )


def slugify(name: str) -> str:
    s = strip_accents(name).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "unknown"


def extract_surname(full_name: str) -> str:
    """Dernier mot du nom de famille, normalisé sans accents."""
    if not full_name:
        return ""
    parts = full_name.strip().split()
    if not parts:
        return ""
    last = parts[-1]
    last = re.sub(r"[^A-Za-zÀ-ÿ\-]", "", last)
    return strip_accents(last).lower()


class RateLimiter:
    """Respecte un délai minimum entre les requêtes HTTP."""
    def __init__(self, min_delay: float = 1.5):
        self.min_delay = min_delay
        self._last = 0.0

    def wait(self):
        elapsed = time.time() - self._last
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self._last = time.time()


# Whitelist minimale pour la méthode A (évite d'insérer n'importe quoi)
# On réutilise les mêmes patronymes que la méthode D pour la cohérence.
_PATRONYMES_SET = {strip_accents(p).lower() for p in EXTENDED_PATRONYMES}


def surname_is_bantu(full_name: str) -> bool:
    """Retourne True si le nom de famille est dans la liste étendue de patronymes."""
    surname = extract_surname(full_name)
    if not surname or len(surname) < 4:
        return False
    return surname in _PATRONYMES_SET


# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE A — Scan clubs pros (roster complet)
# ─────────────────────────────────────────────────────────────────────────────

def method_a_club_scan(
    existing_ids: set,
    rate_limiter: RateLimiter,
    dry_run: bool = False,
) -> list:
    """
    Crawl le roster de chaque club de TOP_LEAGUE_CLUBS via Transfermarkt.
    Pour chaque joueur : vérifie si son patronyme est dans la liste bantu.
    Retourne la liste des candidats nouveaux.
    """
    print("\n═══ MÉTHODE A — Scan clubs pros top ligues européennes ═══")
    # On crée un client TM dédié avec le rate limiter injecté
    headers_pool = [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    ]

    import random
    session = requests.Session()
    candidates = []
    seen_tm_ids = set()

    # Dédupliquer les clubs (même ID peut apparaître deux fois dans la liste)
    seen_club_ids = set()
    clubs_to_scan = []
    for club in TOP_LEAGUE_CLUBS:
        if club["id"] not in seen_club_ids:
            seen_club_ids.add(club["id"])
            clubs_to_scan.append(club)

    print(f"Clubs à scanner : {len(clubs_to_scan)}")

    for i, club in enumerate(clubs_to_scan, 1):
        rate_limiter.wait()
        url = f"https://www.transfermarkt.com/-/startseite/verein/{club['id']}"
        try:
            r = session.get(
                url,
                headers={
                    "User-Agent": random.choice(headers_pool),
                    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
                    "DNT": "1",
                },
                timeout=20,
            )
            if r.status_code in (403, 429):
                print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : BAN SIGNAL {r.status_code}, pause 30s")
                time.sleep(30)
                continue
            if r.status_code == 404:
                print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : 404, skip")
                continue
            if r.status_code != 200:
                print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : HTTP {r.status_code}, skip")
                continue
        except requests.RequestException as e:
            print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : network error {e}, skip")
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        club_matches = 0
        for link in soup.select('a[href*="/profil/spieler/"]'):
            href = link.get("href", "")
            m = re.search(r"/profil/spieler/(\d+)", href)
            if not m:
                continue
            tm_id = m.group(1)
            if tm_id in seen_tm_ids:
                continue
            seen_tm_ids.add(tm_id)

            name_text = link.get_text(strip=True)
            if not name_text or len(name_text) < 2:
                continue

            # Filtre : patronyme bantu connu
            if not surname_is_bantu(name_text):
                continue

            # Filtre : déjà en BDD
            if tm_id in existing_ids:
                continue

            profile_url = f"https://www.transfermarkt.com/-/profil/spieler/{tm_id}"
            candidates.append({
                "transfermarkt_id": tm_id,
                "name": name_text,
                "profile_url": profile_url,
                "method": "A",
                "source": f"Club scan: {club['name']} ({club['league']})",
                "surname": extract_surname(name_text),
            })
            club_matches += 1

        if club_matches > 0:
            print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']:30} : +{club_matches} candidat(s) bantu")
        elif i % 10 == 0:
            print(f"  [{i:>3}/{len(clubs_to_scan)}] progression...")

    print(f"Méthode A : {len(candidates)} candidats nouvellement détectés")
    return candidates


# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE B — Wikipedia categories scraping
# ─────────────────────────────────────────────────────────────────────────────

def method_b_wikipedia(
    existing_ids: set,
    rate_limiter: RateLimiter,
    dry_run: bool = False,
) -> list:
    """
    Scrape les catégories Wikipedia (FR + EN) pour trouver des footballeurs
    d'origine congolaise. Pour chaque membre trouvé :
    1. Extract le nom
    2. Cherche sur TM search
    3. Si trouvé et pas en BDD → candidat
    """
    print("\n═══ MÉTHODE B — Wikipedia categories scraping ═══")
    candidates = []
    seen_names = set()
    wiki_session = requests.Session()
    wiki_headers = {"User-Agent": "leopards-radar/2.0 (alexandre@withkaira.com)"}

    for cat in WIKIPEDIA_CATEGORIES:
        rate_limiter.wait()
        lang = cat["lang"]
        title = cat["title"]
        url = f"https://{lang}.wikipedia.org/w/api.php"
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": title,
            "cmlimit": "500",
            "cmtype": "page",
            "format": "json",
        }
        try:
            r = wiki_session.get(url, params=params, headers=wiki_headers, timeout=15)
            if r.status_code != 200:
                print(f"  [{lang}] {title[:60]} : HTTP {r.status_code}, skip")
                continue
            data = r.json()
            members = data.get("query", {}).get("categorymembers", [])
            if not members:
                print(f"  [{lang}] {title[:60]} : 0 membres, skip (catégorie inexistante ou vide)")
                continue
            print(f"  [{lang}] {title[:60]} : {len(members)} membres")
        except Exception as e:
            print(f"  [{lang}] {title[:60]} : erreur {e}, skip")
            continue

        # Pour chaque membre : chercher sur TM
        for member in members:
            name = member.get("title", "")
            if not name or name in seen_names:
                continue
            seen_names.add(name)

            # Cherche sur Transfermarkt via search
            rate_limiter.wait()
            tm_result = _tm_search(name, wiki_session)
            if not tm_result:
                continue
            tm_id = tm_result["tm_id"]
            if tm_id in existing_ids:
                continue

            candidates.append({
                "transfermarkt_id": tm_id,
                "name": tm_result["name"],
                "profile_url": f"https://www.transfermarkt.com/-/profil/spieler/{tm_id}",
                "method": "B",
                "source": f"Wikipedia [{lang}]: {title[:60]}",
                "wiki_page": name,
            })

    print(f"Méthode B : {len(candidates)} candidats nouvellement détectés")
    return candidates


def _tm_search(player_name: str, session: requests.Session) -> Optional[dict]:
    """
    Cherche un joueur sur Transfermarkt par nom.
    Retourne {"tm_id": str, "name": str} ou None.
    """
    url = "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche"
    params = {"query": player_name, "Datei": ""}
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Referer": "https://www.transfermarkt.com/",
    }
    try:
        r = session.get(url, params=params, headers=headers, timeout=15)
        if r.status_code != 200:
            return None
        soup = BeautifulSoup(r.text, "html.parser")
        # Chercher le premier lien vers un profil joueur
        for link in soup.select('a[href*="/profil/spieler/"]'):
            href = link.get("href", "")
            m = re.search(r"/profil/spieler/(\d+)", href)
            if m:
                tm_id = m.group(1)
                name_text = link.get_text(strip=True)
                if name_text and len(name_text) > 1:
                    return {"tm_id": tm_id, "name": name_text}
        return None
    except Exception:
        return None


# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE C — Wikidata SPARQL étendu (P22 père / P25 mère)
# ─────────────────────────────────────────────────────────────────────────────

def method_c_wikidata_extended(
    existing_ids: set,
    dry_run: bool = False,
) -> list:
    """
    Query Wikidata SPARQL avec extension P22/P25 (père/mère congolais).
    Retourne les candidats avec TM ID trouvés et pas encore en BDD.
    """
    print("\n═══ MÉTHODE C — Wikidata SPARQL étendu (P22/P25 parents) ═══")
    candidates = []
    headers = {
        "Accept": "application/sparql-results+json",
        "User-Agent": "leopards-radar/2.0 (alexandre@withkaira.com)",
    }
    try:
        r = requests.get(
            "https://query.wikidata.org/sparql",
            params={"query": SPARQL_EXTENDED_QUERY},
            headers=headers,
            timeout=120,
        )
        r.raise_for_status()
        rows = r.json().get("results", {}).get("bindings", [])
        print(f"  Wikidata returned {len(rows)} rows (avant dédup)")
    except Exception as e:
        print(f"  Erreur SPARQL Wikidata : {e} — méthode C ignorée")
        return []

    # Agréger par TM ID
    by_tm: dict = {}
    for row in rows:
        tm_id = row.get("tmId", {}).get("value")
        if not tm_id:
            continue
        name = row.get("playerLabel", {}).get("value", "")
        if not name or (name.startswith("Q") and name[1:].isdigit()):
            continue
        if tm_id not in by_tm:
            by_tm[tm_id] = {
                "tm_id": tm_id,
                "name": name,
                "birth_place": row.get("birthPlaceLabel", {}).get("value"),
            }

    print(f"  Wikidata : {len(by_tm)} joueurs uniques avec TM ID")
    for tm_id, p in by_tm.items():
        if tm_id in existing_ids:
            continue
        candidates.append({
            "transfermarkt_id": tm_id,
            "name": p["name"],
            "profile_url": f"https://www.transfermarkt.com/-/profil/spieler/{tm_id}",
            "method": "C",
            "source": f"Wikidata SPARQL étendu (P22/P25/P27)",
            "birth_place": p.get("birth_place"),
        })

    print(f"Méthode C : {len(candidates)} candidats nouvellement détectés")
    return candidates


# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE D — Patronymes étendus × Transfermarkt search
# ─────────────────────────────────────────────────────────────────────────────

def method_d_patronymes_search(
    existing_ids: set,
    rate_limiter: RateLimiter,
    dry_run: bool = False,
) -> list:
    """
    Pour chaque patronyme bantu de la liste étendue :
    Cherche sur Transfermarkt search et récupère les profils trouvés.
    Filtre sur transfermarkt_id pas en BDD.
    """
    print(f"\n═══ MÉTHODE D — Patronymes étendus ({len(EXTENDED_PATRONYMES)} noms) × TM search ═══")
    candidates = []
    seen_tm_ids = set()
    session = requests.Session()

    for i, patronyme in enumerate(EXTENDED_PATRONYMES, 1):
        rate_limiter.wait()
        url = "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche"
        params = {"query": patronyme, "Datei": ""}
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
            "Referer": "https://www.transfermarkt.com/",
        }
        try:
            r = session.get(url, params=params, headers=headers, timeout=15)
            if r.status_code in (403, 429):
                print(f"  [{i:>3}/{len(EXTENDED_PATRONYMES)}] {patronyme:20} : BAN, pause 30s")
                time.sleep(30)
                continue
            if r.status_code != 200:
                continue
        except requests.RequestException:
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        patronyme_matches = 0
        for link in soup.select('a[href*="/profil/spieler/"]'):
            href = link.get("href", "")
            m = re.search(r"/profil/spieler/(\d+)", href)
            if not m:
                continue
            tm_id = m.group(1)
            if tm_id in seen_tm_ids or tm_id in existing_ids:
                continue
            seen_tm_ids.add(tm_id)

            name_text = link.get_text(strip=True)
            if not name_text or len(name_text) < 2:
                continue

            candidates.append({
                "transfermarkt_id": tm_id,
                "name": name_text,
                "profile_url": f"https://www.transfermarkt.com/-/profil/spieler/{tm_id}",
                "method": "D",
                "source": f"TM search: patronyme '{patronyme}'",
                "matched_patronyme": patronyme,
            })
            patronyme_matches += 1

        if patronyme_matches > 0:
            print(f"  [{i:>3}/{len(EXTENDED_PATRONYMES)}] {patronyme:20} : +{patronyme_matches} résultat(s) TM")

    print(f"Méthode D : {len(candidates)} candidats nouvellement détectés")
    return candidates


# ─────────────────────────────────────────────────────────────────────────────
# MÉTHODE E — Scan squad complet + fiche individuelle (multi-nats)
#
# Pourquoi cette méthode existe :
#   Les méthodes A-D ratent les joueurs dont la nationalité primaire est FR/BE/DE
#   mais qui ont RDC en position secondaire sur Transfermarkt.
#   Ex : Believe Munongo (TM 1297673) = France primary + DR Congo secondary.
#   La méthode A ne filtre que sur le patronyme bantu (correct), mais ce filtre
#   peut rater des joueurs avec des noms européens.
#   La méthode E va plus loin : pour chaque joueur du squad (inconnu en BDD),
#   elle fetch sa fiche individuelle et vérifie si COD apparaît en n'importe
#   quelle position de nationalité. Aucun filtre patronyme = zéro blind spot.
#
# Coût : ~1.5s par joueur → ~500 joueurs/club × 100 clubs = 14h pour tout le périmètre.
# En pratique : 20 clubs L1 × ~30 joueurs = ~15 min pour la Ligue 1 seule.
# ─────────────────────────────────────────────────────────────────────────────

# Variantes connues de "DR Congo" sur Transfermarkt selon la langue de la page
# et les différentes appellations historiques utilisées sur TM.
COD_NATIONALITY_VARIANTS = {
    "DR Congo",
    "DR Congo (Zaire)",
    "Democratic Republic of Congo",
    "Democratic Republic of the Congo",
    "Republic of the Congo (Léopoldville)",
    "Belgian Congo",
    "Congo DR",
    "RD Congo",       # version française TM
    "Congo, DR",
    "Congo (RDC)",
    "République démocratique du Congo",
    "DRC",
}


def _is_cod_nationality(nat: str) -> bool:
    """
    Retourne True si la nationalité correspond à la RD Congo,
    quelle que soit la variante d'écriture utilisée par Transfermarkt.
    """
    nat_lower = nat.lower().strip()
    for variant in COD_NATIONALITY_VARIANTS:
        if variant.lower() in nat_lower or nat_lower in variant.lower():
            return True
    # Filet de sécurité : présence de "congo" + ("democratic" ou "rd" ou "rdc" ou "dr")
    if "congo" in nat_lower and any(kw in nat_lower for kw in ["democrat", " rd ", " dr ", "rdc", "(rdc)"]):
        return True
    return False


def method_e_full_squad_nationality_scan(
    clubs_list: list,
    existing_ids: set,
    rate_limiter: RateLimiter,
    dry_run: bool = False,
    test_player_id: Optional[str] = None,
    leagues_filter: Optional[set] = None,
) -> list:
    """
    Pour chaque club de clubs_list, crawl le roster complet TM puis fetch
    la fiche individuelle de chaque joueur INCONNU en BDD.
    Si COD apparaît dans n'importe quelle nationalité → candidat.

    :param clubs_list: liste de dicts {id, name, league} (même format que TOP_LEAGUE_CLUBS)
    :param existing_ids: set de TM IDs déjà en BDD (pour skip)
    :param rate_limiter: RateLimiter partagé
    :param dry_run: si True, n'insère rien mais loggue les trouvailles
    :param test_player_id: si défini, force le fetch de ce TM ID individuel pour test
    :param leagues_filter: si défini, ne scanne que les clubs dont league est dans ce set
    :return: liste de dicts candidats (même format que méthodes A-D)
    """
    print("\n═══ MÉTHODE E — Scan squad complet + fiche individuelle (multi-nats) ═══")

    # Mode test : fetch direct d'un joueur spécifique, ignore les clubs
    if test_player_id:
        print(f"\n[MODE TEST] Fetch fiche individuelle TM {test_player_id}")
        tm_client = TransfermarktClient(rate_limit_seconds=rate_limiter.min_delay)
        details = tm_client.fetch_player_details(test_player_id)
        if not details:
            print(f"  ERREUR : impossible de charger la fiche TM {test_player_id}")
            return []
        nats = details.get("nationalities", [])
        other = details.get("other_nationalities", [])
        all_nats = nats
        cod_found = any(_is_cod_nationality(n) for n in all_nats)
        print(f"  Nom       : {details['name']}")
        print(f"  Club      : {details.get('current_club_name')} (ID={details.get('current_club_id')})")
        print(f"  Naissance : {details.get('date_of_birth')} à {details.get('place_of_birth')}")
        print(f"  Nats      : {all_nats}")
        print(f"  Hauteur   : {details.get('height_cm')} cm")
        print(f"  Pied      : {details.get('foot')}")
        print(f"  Position  : {details.get('position')}")
        print(f"  Valeur    : {details.get('market_value_eur')} €")
        print(f"  COD détecté : {'OUI ✓' if cod_found else 'NON ✗'}")
        if not cod_found:
            return []
        # Retourne comme candidat même en mode test
        return [{
            "transfermarkt_id": test_player_id,
            "name": details["name"],
            "profile_url": details["profile_url"],
            "method": "E",
            "source": f"Test unitaire : fiche individuelle TM {test_player_id}",
            "nationalities": nats,
            "other_nationalities": other,
            "is_binational": len(nats) > 1,
            "current_club": details.get("current_club_name"),
            "date_of_birth": details.get("date_of_birth"),
            "place_of_birth": details.get("place_of_birth"),
            "height_cm": details.get("height_cm"),
            "foot": details.get("foot"),
            "position": details.get("position"),
            "market_value_eur": details.get("market_value_eur"),
        }]

    # Dédupliquer les clubs (même ID peut apparaître deux fois)
    seen_club_ids: set = set()
    clubs_to_scan = []
    for club in clubs_list:
        if leagues_filter and club.get("league") not in leagues_filter:
            continue
        if club["id"] not in seen_club_ids:
            seen_club_ids.add(club["id"])
            clubs_to_scan.append(club)

    if leagues_filter:
        print(f"Filtre ligues : {', '.join(sorted(leagues_filter))}")
    print(f"Clubs à scanner : {len(clubs_to_scan)}")

    tm_client = TransfermarktClient(rate_limit_seconds=rate_limiter.min_delay)

    candidates = []
    seen_tm_ids: set = set()
    total_players_scanned = 0
    total_squads_fetched = 0
    errors_count = 0

    for i, club in enumerate(clubs_to_scan, 1):
        # Fetch le roster du club
        rate_limiter.wait()
        squad_url = f"https://www.transfermarkt.com/-/startseite/verein/{club['id']}"
        try:
            import random
            r = requests.get(
                squad_url,
                headers={
                    "User-Agent": random.choice([
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
                    ]),
                    "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
                    "Accept-Language": "en-US,en;q=0.9",
                    "DNT": "1",
                },
                timeout=20,
            )
        except requests.RequestException as e:
            print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : network error {e}, skip")
            errors_count += 1
            continue

        if r.status_code in (403, 429):
            print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : BAN {r.status_code}, pause 45s")
            time.sleep(45)
            continue
        if r.status_code != 200:
            print(f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']} : HTTP {r.status_code}, skip")
            errors_count += 1
            continue

        soup = BeautifulSoup(r.text, "html.parser")

        # Extraire tous les joueurs du roster
        squad_player_ids = []
        for link in soup.select('a[href*="/profil/spieler/"]'):
            href = link.get("href", "")
            m = re.search(r"/profil/spieler/(\d+)", href)
            if not m:
                continue
            tm_id = m.group(1)
            if tm_id not in squad_player_ids:
                squad_player_ids.append(tm_id)

        total_squads_fetched += 1
        club_candidates = 0
        club_scanned = 0
        club_skipped_db = 0

        for tm_id in squad_player_ids:
            # Skip si déjà en BDD ou déjà traité dans ce run
            if tm_id in existing_ids:
                club_skipped_db += 1
                continue
            if tm_id in seen_tm_ids:
                continue
            seen_tm_ids.add(tm_id)

            # Fetch la fiche individuelle pour avoir TOUTES les nationalités.
            # Le rate-limit est géré par TransfermarktClient._sleep_if_needed()
            # (configuré avec le même min_delay que le rate_limiter global).
            try:
                details = tm_client.fetch_player_details(tm_id)
            except Exception as exc:
                print(f"    TM {tm_id} : erreur fetch — {exc}, skip")
                errors_count += 1
                continue

            if not details:
                continue

            club_scanned += 1
            total_players_scanned += 1

            all_nats = details.get("nationalities", [])

            # Vérification COD en n'importe quelle position de nationalité
            if any(_is_cod_nationality(n) for n in all_nats):
                nats = details["nationalities"]
                other_nats = details.get("other_nationalities", [])
                cand = {
                    "transfermarkt_id": tm_id,
                    "name": details["name"],
                    "profile_url": details["profile_url"],
                    "method": "E",
                    "source": f"Squad scan méthode E : {club['name']} ({club['league']})",
                    "nationalities": nats,
                    "other_nationalities": other_nats,
                    "is_binational": len(nats) > 1,
                    "current_club": details.get("current_club_name"),
                    "date_of_birth": details.get("date_of_birth"),
                    "place_of_birth": details.get("place_of_birth"),
                    "height_cm": details.get("height_cm"),
                    "foot": details.get("foot"),
                    "position": details.get("position"),
                    "market_value_eur": details.get("market_value_eur"),
                }
                candidates.append(cand)
                club_candidates += 1
                print(f"    ✓ TROUVÉ : {details['name']} ({club['name']}) | nats={all_nats}")

        status_line = (
            f"  [{i:>3}/{len(clubs_to_scan)}] {club['name']:30} "
            f"squad={len(squad_player_ids):>3} scannés={club_scanned:>3} "
            f"skip_db={club_skipped_db:>3} COD={club_candidates:>2}"
        )
        print(status_line)

    print(
        f"\nMéthode E : {len(candidates)} candidats COD détectés "
        f"({total_players_scanned} fiches scannées, {total_squads_fetched} clubs, "
        f"{errors_count} erreurs)"
    )
    return candidates


# ─────────────────────────────────────────────────────────────────────────────
# Insertion Supabase
# ─────────────────────────────────────────────────────────────────────────────

def build_player_row(cand: dict) -> dict:
    """
    Construit le row pour insérer un candidat en base.

    La méthode E enrichit le dict candidat avec les données de la fiche
    individuelle (nationalités, club, DOB, etc.) — on les propage ici
    pour éviter un sync TM supplémentaire.
    """
    method = cand.get("method", "?")

    # Nationalités : la méthode E les a déjà parsées ; les autres méthodes laissent vide.
    nationalities = cand.get("nationalities", [])
    other_nationalities = cand.get("other_nationalities", [])
    is_binational = cand.get("is_binational", False)

    row = {
        "name": cand["name"],
        "slug": slugify(cand["name"]) or f"tm-{cand['transfermarkt_id']}",
        "transfermarkt_id": cand["transfermarkt_id"],
        "player_category": "radar",
        "eligibility_status": "unknown",
        "eligibility_note": (
            f"Découvert via comprehensive-discovery v3 (méthode {method}). "
            f"Source : {cand.get('source', '?')}. "
            f"À vérifier : origine RDC à confirmer, éligibilité à instruire."
        ),
        "verified": False,
        "nationalities": nationalities,
        "other_nationalities": other_nationalities,
        "is_binational": is_binational,
        "source_urls": [cand["profile_url"]],
    }

    # Champs enrichis depuis la fiche individuelle (méthode E uniquement)
    if method == "E":
        if cand.get("current_club"):
            row["current_club"] = cand["current_club"]
        if cand.get("date_of_birth"):
            row["date_of_birth"] = cand["date_of_birth"]
        if cand.get("place_of_birth"):
            row["place_of_birth"] = cand["place_of_birth"]
        if cand.get("height_cm"):
            row["height_cm"] = cand["height_cm"]
        if cand.get("foot"):
            row["foot"] = cand["foot"]
        if cand.get("position"):
            row["position"] = cand["position"]
        if cand.get("market_value_eur"):
            row["market_value_eur"] = cand["market_value_eur"]

    return row


def insert_candidates(sb, candidates: list, dry_run: bool) -> int:
    """
    Insère les candidats en base par batches de 200.
    Idempotent : ON CONFLICT DO NOTHING sur transfermarkt_id.
    """
    if not candidates:
        return 0

    # Dédup sur transfermarkt_id (plusieurs méthodes peuvent trouver le même joueur)
    seen = set()
    deduped = []
    for c in candidates:
        if c["transfermarkt_id"] not in seen:
            seen.add(c["transfermarkt_id"])
            deduped.append(c)

    print(f"\n→ {len(candidates)} candidats bruts, {len(deduped)} après dédup TM ID")

    if dry_run:
        print("DRY RUN — aucune insertion. Aperçu (25 premiers) :")
        for c in deduped[:25]:
            print(f"  TM {c['transfermarkt_id']:>10} | M{c['method']} | {c['name'][:40]:40} | {c.get('source', '')[:50]}")
        return 0

    inserted = 0
    for batch_start in range(0, len(deduped), 200):
        batch = deduped[batch_start:batch_start + 200]
        rows = [build_player_row(c) for c in batch]
        result = sb.insert("players", rows, on_conflict="transfermarkt_id")
        batch_inserted = len(result) if result else 0
        inserted += batch_inserted
        print(f"  Batch {batch_start // 200 + 1}: +{batch_inserted} insérés (cumul {inserted})")

    return inserted


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Léopards Radar — Discovery v3 : multi-source comprehensive (méthodes A-E)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Liste les candidats sans insérer en base",
    )
    parser.add_argument(
        "--methods",
        default="A,B,C,D",
        help="Méthodes à exécuter, séparées par virgules : A,B,C,D,E (default : A,B,C,D)",
    )
    parser.add_argument(
        "--test-player",
        default=None,
        metavar="TM_ID",
        help="[Méthode E] Teste le fetch d'un joueur spécifique par TM ID (ex: 1297673 = Munongo)",
    )
    parser.add_argument(
        "--leagues",
        default=None,
        metavar="LEAGUES",
        help="[Méthode E] Filtre sur des ligues spécifiques (ex: 'L1' ou 'L1,BEL1')",
    )
    args = parser.parse_args()

    methods = {m.strip().upper() for m in args.methods.split(",")}
    started_at = dt.datetime.utcnow()

    leagues_filter = None
    if args.leagues:
        leagues_filter = {l.strip().upper() for l in args.leagues.split(",")}

    print("═══════════════════════════════════════════════════════")
    print("  Léopards Radar — Discovery v3 : comprehensive")
    print("═══════════════════════════════════════════════════════")
    print(f"  Start        : {started_at.isoformat()}Z")
    print(f"  Méthodes     : {', '.join(sorted(methods))}")
    print(f"  Dry run      : {args.dry_run}")
    if args.test_player:
        print(f"  Test player  : TM {args.test_player}")
    if leagues_filter:
        print(f"  Ligues filtre: {', '.join(sorted(leagues_filter))}")
    print("═══════════════════════════════════════════════════════")

    # Init Supabase (optionnel en dry-run si pas de secrets)
    sb = None
    existing_ids: set = set()

    if SUPABASE_AVAILABLE:
        try:
            sb = SupabaseClient()
            sb.ping()
            print("[Supabase] auth OK")
            # Charger les TM IDs déjà en base
            offset = 0
            while True:
                batch = sb.select("players", select="transfermarkt_id", limit="1000", offset=str(offset))
                if not batch:
                    break
                existing_ids.update(p["transfermarkt_id"] for p in batch if p.get("transfermarkt_id"))
                if len(batch) < 1000:
                    break
                offset += 1000
            print(f"[Supabase] {len(existing_ids)} TM IDs déjà en base")
        except Exception as e:
            if args.dry_run:
                print(f"[Supabase] non disponible ({e}) — dry-run sans filtre BDD")
            else:
                print(f"[Supabase] ERREUR : {e}")
                sys.exit(1)
    else:
        if not args.dry_run:
            print("ERREUR : supabase_client introuvable et --dry-run non activé")
            sys.exit(1)
        print("[Supabase] non disponible — mode dry-run sans filtre BDD")

    rate_limiter = RateLimiter(min_delay=RATE_LIMIT)
    all_candidates = []
    errors_by_method = {}

    # Méthode A — Scan clubs pros
    if "A" in methods:
        try:
            cands_a = method_a_club_scan(existing_ids, rate_limiter, args.dry_run)
            all_candidates.extend(cands_a)
        except Exception as e:
            print(f"[Méthode A] ERREUR : {e}")
            errors_by_method["A"] = str(e)

    # Méthode B — Wikipedia categories
    if "B" in methods:
        try:
            cands_b = method_b_wikipedia(existing_ids, rate_limiter, args.dry_run)
            all_candidates.extend(cands_b)
        except Exception as e:
            print(f"[Méthode B] ERREUR : {e}")
            errors_by_method["B"] = str(e)

    # Méthode C — Wikidata SPARQL étendu
    if "C" in methods:
        try:
            cands_c = method_c_wikidata_extended(existing_ids, args.dry_run)
            all_candidates.extend(cands_c)
        except Exception as e:
            print(f"[Méthode C] ERREUR : {e}")
            errors_by_method["C"] = str(e)

    # Méthode D — Patronymes étendus × TM search
    if "D" in methods:
        try:
            cands_d = method_d_patronymes_search(existing_ids, rate_limiter, args.dry_run)
            all_candidates.extend(cands_d)
        except Exception as e:
            print(f"[Méthode D] ERREUR : {e}")
            errors_by_method["D"] = str(e)

    # Méthode E — Squad scan complet + fiche individuelle (multi-nats)
    # Attrape les joueurs avec nationalité primaire FR/BE/DE et COD en secondaire.
    if "E" in methods:
        try:
            cands_e = method_e_full_squad_nationality_scan(
                clubs_list=TOP_LEAGUE_CLUBS,
                existing_ids=existing_ids,
                rate_limiter=rate_limiter,
                dry_run=args.dry_run,
                test_player_id=args.test_player,
                leagues_filter=leagues_filter,
            )
            all_candidates.extend(cands_e)
        except Exception as e:
            print(f"[Méthode E] ERREUR : {e}")
            errors_by_method["E"] = str(e)

    # Résultats par méthode
    print("\n══════════════════════════")
    print("  Résumé par méthode")
    print("══════════════════════════")
    for method in sorted(methods):
        count = sum(1 for c in all_candidates if c.get("method") == method)
        status = "ERREUR" if method in errors_by_method else "OK"
        print(f"  Méthode {method} : {count:>4} candidats — {status}")

    # Vérification Munongo (preuve que le script fonctionne)
    munongo_found = any(
        "munongo" in c["name"].lower() or c["transfermarkt_id"] == "1297673"
        for c in all_candidates
    )
    print(f"\n  Vérification Munongo (TM 1297673) : {'TROUVÉ ✓' if munongo_found else 'NON TROUVÉ — vérifier méthode A/D'}")

    # Insertion en base
    inserted = 0
    if sb or args.dry_run:
        inserted = insert_candidates(sb, all_candidates, args.dry_run)

    # Log dans sync_logs
    finished_at = dt.datetime.utcnow()
    duration_seconds = int((finished_at - started_at).total_seconds())

    if sb and not args.dry_run:
        try:
            sb.insert("sync_logs", {
                "job_name": JOB_NAME,
                "status": "success" if not errors_by_method else "partial",
                "players_processed": len(all_candidates),
                "players_updated": 0,
                "candidates_discovered": inserted,
                "errors_count": len(errors_by_method),
                "error_details": [
                    {"method": m, "error": e}
                    for m, e in errors_by_method.items()
                ] + [{"breakdown": {
                    "method_a": sum(1 for c in all_candidates if c.get("method") == "A"),
                    "method_b": sum(1 for c in all_candidates if c.get("method") == "B"),
                    "method_c": sum(1 for c in all_candidates if c.get("method") == "C"),
                    "method_d": sum(1 for c in all_candidates if c.get("method") == "D"),
                    "method_e": sum(1 for c in all_candidates if c.get("method") == "E"),
                    "munongo_found": munongo_found,
                }}],
                "started_at": started_at.isoformat() + "Z",
                "finished_at": finished_at.isoformat() + "Z",
                "duration_seconds": duration_seconds,
                "github_run_url": os.environ.get("GITHUB_RUN_URL"),
            })
        except Exception as e:
            print(f"[sync_logs] Erreur d'écriture : {e}")

    print("\n══════════════════════════════════════════════")
    print("  RÉCAP FINAL")
    print("══════════════════════════════════════════════")
    print(f"  Candidats découverts : {len(all_candidates)} (bruts)")
    print(f"  Insérés en base      : {inserted}")
    print(f"  Erreurs de méthode   : {len(errors_by_method)}")
    print(f"  Durée                : {duration_seconds}s")
    print(f"  Mode                 : {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("══════════════════════════════════════════════")


if __name__ == "__main__":
    main()
