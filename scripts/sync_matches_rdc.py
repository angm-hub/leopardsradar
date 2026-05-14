#!/usr/bin/env python3
"""
Leopards Radar -- Sync quotidien des matchs RDC depuis Wikipedia (Mediawiki API).

Source primaire retenue : Wikipedia Mediawiki API (gratuit, automatisable, sans cle)
  - Page cible : "DR Congo national football team results (2020-present)"
  - Endpoint : https://en.wikipedia.org/w/api.php?action=parse&prop=wikitext
  - Complete par : "2026 FIFA World Cup Group K" pour les matchs Mondial confirmes

Pourquoi Wikipedia :
  - Seule source GRATUITE + sans compte + automatisable au 14 mai 2026
  - La page "results" est mise a jour par des contributeurs dans les heures suivant
    chaque match ou annonce officielle
  - Contient le wikitext structure ({{Football box collapsible}}) facilement parseable
  - La page Groupe K contient les heures UTC exactes et les stades confirmes par FIFA

Limites :
  - Les matchs amicaux annonces mais non encore documentes sur Wikipedia (< 24h)
    ne seront pas detectes -> fallback manuel via seed_matches.py
  - Les horaires sont parfois en heure locale (UTC-5 / UTC-6 / UTC-4) -> conversion
    appliquee automatiquement
  - Rate limit Wikipedia : pas de limite officielle mais on attend 1s entre appels

Variables d'env requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  GITHUB_RUN_URL (optionnel, fourni par GH Actions)

Usage :
  python sync_matches_rdc.py [--dry-run]
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
import time
from typing import Optional

import requests

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient

# ─────────────────────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────────────────────

JOB_NAME = "sync-matches-rdc"

# Pages Wikipedia a parser (dans l'ordre de priorite)
WIKI_PAGES = [
    # Page 1 -- Resultats 2020-present : matchs passes ET fixtures a venir
    {
        "url": "https://en.wikipedia.org/w/api.php",
        "params": {
            "action": "parse",
            "page": "DR Congo national football team results (2020–present)",
            "prop": "wikitext",
            "format": "json",
        },
        "label": "results_2020",
    },
    # Page 2 -- Groupe K Mondial 2026 : donnees FIFA officielles (heure, stade)
    {
        "url": "https://en.wikipedia.org/w/api.php",
        "params": {
            "action": "parse",
            "page": "2026 FIFA World Cup Group K",
            "prop": "wikitext",
            "format": "json",
        },
        "label": "wc2026_group_k",
    },
]

# Mapping code pays -> emoji drapeau (ISO 3166-1 alpha-3)
FLAG_MAP = {
    "POR": "\U0001f1f5\U0001f1f9",
    "COL": "\U0001f1e8\U0001f1f4",
    "UZB": "\U0001f1fa\U0001f1ff",
    "DEN": "\U0001f1e9\U0001f1f0",
    "MAR": "\U0001f1f2\U0001f1e6",
    "MLI": "\U0001f1f2\U0001f1f1",
    "MAD": "\U0001f1f2\U0001f1ec",
    "CMR": "\U0001f1e8\U0001f1f2",
    "NGA": "\U0001f1f3\U0001f1ec",
    "GAB": "\U0001f1ec\U0001f1e6",
    "CIV": "\U0001f1e8\U0001f1ee",
    "SEN": "\U0001f1f8\U0001f1f3",
    "GHA": "\U0001f1ec\U0001f1ed",
    "EGY": "\U0001f1ea\U0001f1ec",
    "ALG": "\U0001f1e9\U0001f1ff",
    "TUN": "\U0001f1f9\U0001f1f3",
    "ETH": "\U0001f1ea\U0001f1f9",
    "ZIM": "\U0001f1ff\U0001f1fc",
    "ZMB": "\U0001f1ff\U0001f1f2",
    "UGA": "\U0001f1fa\U0001f1ec",
    "KEN": "\U0001f1f0\U0001f1ea",
    "BEN": "\U0001f1e7\U0001f1ef",
    "TOG": "\U0001f1f9\U0001f1ec",
    "MTN": "\U0001f1f2\U0001f1f7",
    "SDN": "\U0001f1f8\U0001f1e9",
    "SSD": "\U0001f1f8\U0001f1f8",
    "CPV": "\U0001f1e8\U0001f1fb",
    "RSA": "\U0001f1ff\U0001f1e6",
    "BOT": "\U0001f1e7\U0001f1fc",
    "FRA": "\U0001f1eb\U0001f1f7",
    "BEL": "\U0001f1e7\U0001f1ea",
    "ESP": "\U0001f1ea\U0001f1f8",
    "ITA": "\U0001f1ee\U0001f1f9",
    "GER": "\U0001f1e9\U0001f1ea",
    "ENG": "\U0001f1ec\U0001f1e7",
    "BRA": "\U0001f1e7\U0001f1f7",
    "ARG": "\U0001f1e6\U0001f1f7",
    "USA": "\U0001f1fa\U0001f1f8",
    "MEX": "\U0001f1f2\U0001f1fd",
    "CAN": "\U0001f1e8\U0001f1e6",
    "KOR": "\U0001f1f0\U0001f1f7",
    "JPN": "\U0001f1ef\U0001f1f5",
    "JAM": "\U0001f1ef\U0001f1f2",
    "HTI": "\U0001f1ed\U0001f1f9",
    "IRQ": "\U0001f1ee\U0001f1f6",
}

# Mapping code Wikipedia -> (code ISO3 standard, nom public francais)
TEAM_MAP = {
    "POR": ("POR", "Portugal"),
    "COL": ("COL", "Colombie"),
    "UZB": ("UZB", "Ouzbekistan"),
    "DEN": ("DEN", "Danemark"),
    "MAR": ("MAR", "Maroc"),
    "MLI": ("MLI", "Mali"),
    "MAD": ("MAD", "Madagascar"),
    "CMR": ("CMR", "Cameroun"),
    "NGA": ("NGA", "Nigeria"),
    "GAB": ("GAB", "Gabon"),
    "CIV": ("CIV", "Cote d'Ivoire"),
    "SEN": ("SEN", "Senegal"),
    "GHA": ("GHA", "Ghana"),
    "EGY": ("EGY", "Egypte"),
    "ALG": ("ALG", "Algerie"),
    "TUN": ("TUN", "Tunisie"),
    "ETH": ("ETH", "Ethiopie"),
    "ZIM": ("ZIM", "Zimbabwe"),
    "ZMB": ("ZMB", "Zambie"),
    "UGA": ("UGA", "Ouganda"),
    "KEN": ("KEN", "Kenya"),
    "BEN": ("BEN", "Benin"),
    "TOG": ("TOG", "Togo"),
    "MTN": ("MTN", "Mauritanie"),
    "SDN": ("SDN", "Soudan"),
    "SSD": ("SSD", "Soudan du Sud"),
    "CPV": ("CPV", "Cap-Vert"),
    "RSA": ("RSA", "Afrique du Sud"),
    "BOT": ("BOT", "Botswana"),
    "FRA": ("FRA", "France"),
    "BEL": ("BEL", "Belgique"),
    "ESP": ("ESP", "Espagne"),
    "ITA": ("ITA", "Italie"),
    "GER": ("GER", "Allemagne"),
    "ENG": ("ENG", "Angleterre"),
    "BRA": ("BRA", "Bresil"),
    "ARG": ("ARG", "Argentine"),
    "USA": ("USA", "Etats-Unis"),
    "MEX": ("MEX", "Mexique"),
    "CAN": ("CAN", "Canada"),
    "KOR": ("KOR", "Coree du Sud"),
    "JPN": ("JPN", "Japon"),
    "JAM": ("JAM", "Jamaique"),
    "HTI": ("HTI", "Haiti"),
    "IRQ": ("IRQ", "Irak"),
    "DRC": ("COD", "RD Congo"),   # alias Wikipedia pour la RDC
    "COD": ("COD", "RD Congo"),   # code propre RDC -- a filtrer (c'est nous)
}

# Mapping round Wikipedia -> label public Leopards Radar
COMPETITION_MAP = {
    "2026 world cup - gs": "Coupe du Monde 2026 - Phase de groupes",
    "2026 world cup group stage": "Coupe du Monde 2026 - Phase de groupes",
    "2026 fifa world cup": "Coupe du Monde 2026 - Phase de groupes",
    "friendly": "Match amical",
    "exhibition match": "Match amical",
    "exhibition game": "Match amical",
    "2025 afcon rr": "CAN 2025 - Phase de groupes",
    "2025 africa cup": "CAN 2025 - Phase de groupes",
    "2026 fifa wc qualifier": "Eliminatoires Coupe du Monde 2026",
    "2026 world cup qualification": "Eliminatoires Coupe du Monde 2026",
    "2026 fifa world cup qualification": "Eliminatoires Coupe du Monde 2026",
    "2027 afcon qualifier": "Eliminatoires CAN 2027",
    "2027 africa cup": "Eliminatoires CAN 2027",
}

# Fenetre de deduplication en heures : kickoff_at +/- DEDUP_WINDOW_HOURS
DEDUP_WINDOW_HOURS = 12


# ─────────────────────────────────────────────────────────────────────────────
# Fetch Wikipedia
# ─────────────────────────────────────────────────────────────────────────────

def fetch_wikipedia_wikitext(page_config: dict) -> Optional[str]:
    """
    Appelle l'API Mediawiki et retourne le wikitext brut de la page.
    Retourne None si la page est introuvable ou en cas d'erreur reseau.
    """
    try:
        r = requests.get(
            page_config["url"],
            params=page_config["params"],
            headers={
                "User-Agent": (
                    "LeopardsRadar/1.0 (https://leopardsradar.com; "
                    "contact@leopardsradar.com) python-requests"
                )
            },
            timeout=30,
        )
        r.raise_for_status()
        data = r.json()

        if "error" in data:
            print(f"  [Wiki] Erreur page '{page_config['label']}': {data['error'].get('info', '?')}")
            return None

        return data.get("parse", {}).get("wikitext", {}).get("*", "")
    except requests.RequestException as e:
        print(f"  [Wiki] Erreur reseau pour '{page_config['label']}': {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Parsing du wikitext
# ─────────────────────────────────────────────────────────────────────────────

def parse_utc_offset(time_str: str) -> int:
    """
    Extrait l'offset UTC en heures depuis une chaine comme:
      '12:00 p.m. UTC-5', '8:00 p.m. UTC-6', '7:30 p.m. UTC-4'
    Gere le tiret Unicode U+2212 (moins mathematique) et le tiret ASCII.
    Retourne 0 si non trouve.
    """
    # U+2212 = tiret moins mathematique utilise sur Wikipedia pour UTC-N
    m = re.search(r"UTC[−\-](\d+)", time_str)
    if m:
        return -int(m.group(1))
    m = re.search(r"UTC\+(\d+)", time_str)
    if m:
        return int(m.group(1))
    return 0


def parse_time_12h(time_str: str) -> tuple:
    """
    Convertit '12:00 p.m.', '8:00 p.m.', '7:30 p.m.' en (heure, minute) 24h.
    Retourne (0, 0) si non parseable -- sera interprete comme minuit UTC.
    """
    # Normaliser les espaces insecables et les esperluettes HTML
    clean = time_str.replace(" ", " ").replace("&nbsp;", " ").strip()
    m = re.search(r"(\d+):(\d+)\s*(a\.?m\.?|p\.?m\.?)", clean, re.IGNORECASE)
    if not m:
        # Essayer format 24h directement (ex: "20:00")
        m24 = re.search(r"(\d{1,2}):(\d{2})", clean)
        if m24:
            return int(m24.group(1)), int(m24.group(2))
        return 0, 0
    h, mn = int(m.group(1)), int(m.group(2))
    meridiem = m.group(3).lower().replace(".", "")
    if meridiem == "pm" and h != 12:
        h += 12
    if meridiem == "am" and h == 12:
        h = 0
    return h, mn


def parse_kickoff_utc(date_str: str, time_str: str) -> Optional[str]:
    """
    Convertit date + heure locale -> timestamp ISO 8601 UTC.

    Formats date supportes (par ordre de priorite) :
      1. {{Start date|2026|6|17}}   -- format Wikipedia pour matchs futures
      2. YYYY-MM-DD                 -- ISO
      3. '17 June' ou 'June 17'    -- format texte anglais

    Formats time supportes :
      - '12:00 p.m. UTC-5'         -- 12h + offset explicite (matchs Mondial)
      - '20:00' ou '{{UTZ|20:00|0}}' -- 24h
      - ''                          -- minuit UTC par defaut

    Retourne None si la date est incomplete (ex: 'September' sans jour).
    """
    # ── Nettoyer time_str ──────────────────────────────────────────────────
    # Supprimer {{UTZ|HH:MM|offset}} ou {{UTZ|HH:MM}}
    time_clean = re.sub(r"\{\{UTZ\|([^|]+)\|[^}]*\}\}", r"\1", time_str)
    time_clean = re.sub(r"\{\{UTZ\|([^}]+)\}\}", r"\1", time_clean)
    # Nettoyer les wikilinks [[UTC-05:00|UTC-5]] -> UTC-5
    time_clean = re.sub(r"\[\[[^\]|]+\|([^\]]+)\]\]", r"\1", time_clean)
    time_clean = re.sub(r"\[\[([^\]]+)\]\]", r"\1", time_clean)
    # Normaliser espaces
    time_clean = time_clean.replace(" ", " ").replace("&nbsp;", " ").strip()

    # ── Extraire la date ───────────────────────────────────────────────────
    date_raw = date_str.strip()

    months = {
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }
    year = 2026  # Ce job traite exclusivement la saison 2026
    day: Optional[int] = None
    month: Optional[int] = None

    # Priorite 1 : {{Start date|YYYY|M|D}} -- format Wikipedia pour matchs futures
    m_start = re.search(r"\{\{Start date\|(\d{4})\|(\d{1,2})\|(\d{1,2})", date_raw, re.IGNORECASE)
    if m_start:
        year = int(m_start.group(1))
        month = int(m_start.group(2))
        day = int(m_start.group(3))
    else:
        # Priorite 2 : ISO YYYY-MM-DD
        m_iso = re.match(r"(\d{4})-(\d{2})-(\d{2})", date_raw)
        if m_iso:
            year, month, day = int(m_iso.group(1)), int(m_iso.group(2)), int(m_iso.group(3))
        else:
            # Priorite 3 : "DD Month YYYY" (ex: '15 November 2023') -- matchs passes
            m_dmy_full = re.match(r"(\d{1,2})\s+(\w+)\s+(\d{4})", date_raw)
            # Priorite 4 : "DD Month" (ex: '17 June') sans annee -- section Forthcoming fixtures
            m_dmy = re.match(r"(\d{1,2})\s+(\w+)", date_raw)
            # Priorite 5 : "Month DD" (ex: 'June 17')
            m_mdy = re.match(r"(\w+)\s+(\d{1,2})", date_raw)

            if m_dmy_full:
                # Format avec annee explicite (matchs passes)
                day = int(m_dmy_full.group(1))
                month = months.get(m_dmy_full.group(2).lower())
                year = int(m_dmy_full.group(3))
            elif m_dmy:
                day = int(m_dmy.group(1))
                month = months.get(m_dmy.group(2).lower())
                # Annee par defaut : 2026 (section Forthcoming fixtures)
            elif m_mdy:
                month = months.get(m_mdy.group(1).lower())
                day = int(m_mdy.group(2))
                # Annee par defaut : 2026
            # Sinon : date incomplete (ex: 'September' seul) -> None

    if day is None or month is None:
        return None

    # ── Calculer l'heure UTC ───────────────────────────────────────────────
    h, mn = parse_time_12h(time_clean)
    offset = parse_utc_offset(time_clean)

    try:
        local_dt = dt.datetime(year, month, day, h, mn, 0)
        # Soustraire l'offset (negatif pour UTC-N) pour obtenir UTC
        utc_dt = local_dt - dt.timedelta(hours=offset)
        return utc_dt.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    except (ValueError, OverflowError):
        return None


def extract_opponent_code(team_str: str) -> Optional[str]:
    """
    Extrait le code ISO3 d'une chaine wikitext pour identifier l'equipe.

    Formats supportes (vus dans les pages Wikipedia RDC) :
      {{fb-rt|POR}}                          -- ancien format
      {{fb|COD}}                             -- ancien format
      {{#invoke:flag|fb-rt|POR}}             -- nouveau format (pages Mondial 2026)
      {{#invoke:flag|fb|COD}}                -- nouveau format
      {{flagdeco|COD}} DR Congo              -- format resultats
      {{#invoke:flagg|main|unpe|COD|avar=fb}} -- format tableau equipes

    Retourne None si aucun code ISO3 ne peut etre extrait.
    """
    # Patron 1 : {{fb-rt|XYZ}} ou {{fb|XYZ}}
    m = re.search(r"\{\{fb(?:-rt)?\|([A-Z]{2,3})\}\}", team_str)
    if m:
        return m.group(1)

    # Patron 2 : {{#invoke:flag|fb-rt|XYZ}} ou {{#invoke:flag|fb|XYZ}}
    m2 = re.search(r"\{\{#invoke:flag\|fb(?:-rt)?\|([A-Z]{2,3})\}\}", team_str)
    if m2:
        return m2.group(1)

    # Patron 3 : {{flagdeco|XYZ}}
    m3 = re.search(r"\{\{flagdeco\|([A-Z]{2,3})\}\}", team_str)
    if m3:
        return m3.group(1)

    # Patron 4 : {{#invoke:flagg|main|unpe|XYZ|avar=fb}}
    m4 = re.search(r"\{\{#invoke:flagg\|[^|]+\|[^|]+\|([A-Z]{2,3})\|", team_str)
    if m4:
        return m4.group(1)

    # Patron 5 : chercher un code ISO3 precedant ou suivant les pipes
    # (fallback general : tout code 2-3 lettres majuscules apres un pipe)
    m5 = re.search(r"\|([A-Z]{2,3})\b", team_str)
    if m5 and m5.group(1) not in ("COD", "DRC"):  # Exclure la RDC elle-meme
        return m5.group(1)

    return None


def normalize_competition_label(round_raw: str) -> str:
    """
    Convertit un round Wikipedia en label public Leopards Radar.
    Nettoie d'abord les wikilinks [[...]] puis cherche dans COMPETITION_MAP.
    """
    # Nettoyer wikilinks [[target|display]] -> display ou target
    clean = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", round_raw)
    clean = re.sub(r"\[\[([^\]]+)\]\]", r"\1", clean).strip()

    # Chercher dans le mapping (insensible a la casse)
    clean_lower = clean.lower()
    for key, label in COMPETITION_MAP.items():
        if key in clean_lower:
            return label

    # Fallback : retourner le label nettoye tel quel
    return clean


def is_rdc_team(code: Optional[str]) -> bool:
    """Retourne True si le code correspond a la RDC."""
    return code in ("COD", "DRC", "RDC")


def parse_football_boxes(wikitext: str, source_label: str) -> list:
    """
    Parse les blocs {{Football box collapsible}} et {{#invoke:football box|main}}
    et retourne une liste de matchs ou la RDC est impliquee.

    Strategie : extraction manuelle des blocs en comptant les accolades,
    puis extraction des champs cles par regex sur chaque bloc isole.

    Un match est retenu si :
      - team1 ou team2 est COD/DRC
      - La date est complete (jour + mois au minimum)
      - L'adversaire est identifiable

    Format de sortie de chaque dict :
      kickoff_at     : str ISO 8601 UTC ou None
      date_raw       : str
      time_raw       : str
      opponent_code  : str ou None
      opponent_name  : str
      competition    : str
      venue          : str ou None
      city           : str ou None
      country        : str ou None
      home_or_away   : 'home' | 'away' | 'neutral'
      status         : 'scheduled' | 'finished' | 'live'
      score_rdc      : int ou None
      score_opponent : int ou None
      source         : str
    """
    results = []

    # Normaliser les sauts de ligne
    text = wikitext.replace("\r\n", "\n").replace("\r", "\n")

    # Parcourir le texte pour extraire les blocs Football box
    pos = 0
    while pos < len(text):
        # Chercher le debut d'un bloc Football box (insensible a la casse)
        m_start = re.search(
            r"\{\{(?:Football box collapsible|football box collapsible|#invoke:football box\|main)",
            text[pos:],
            re.IGNORECASE,
        )
        if not m_start:
            break

        start = pos + m_start.start()

        # Extraire le bloc en comptant les accolades ouvrantes/fermantes
        depth = 0
        i = start
        block_end = -1
        while i < len(text):
            if text[i: i + 2] == "{{":
                depth += 1
                i += 2
            elif text[i: i + 2] == "}}":
                depth -= 1
                i += 2
                if depth == 0:
                    block_end = i
                    break
            else:
                i += 1

        if block_end == -1:
            # Bloc non ferme -> avancer et continuer
            pos = start + 2
            continue

        block = text[start:block_end]
        pos = block_end

        # Filtrer rapidement : la RDC doit etre mentionnee dans le bloc
        # Supporte {{fb|COD}}, {{#invoke:flag|fb|COD}}, {{flagdeco|COD}}
        if not re.search(r"(?:\||\b)(?:COD|DRC|RDC)\b", block, re.IGNORECASE):
            continue

        # ── Extraction des champs du bloc ─────────────────────────────────
        def extract_field(name: str, blk: str) -> str:
            """Extrait la valeur du champ |name=... du wikitext du bloc."""
            pattern = re.compile(
                r"\|" + re.escape(name) + r"\s*=\s*(.*?)(?=\n\s*\||\n\s*\}\}|$)",
                re.DOTALL | re.IGNORECASE,
            )
            m = pattern.search(blk)
            if m:
                val = m.group(1).strip()
                # Supprimer les commentaires HTML
                val = re.sub(r"<!--.*?-->", "", val, flags=re.DOTALL).strip()
                return val
            return ""

        date_raw = extract_field("date", block)
        time_raw = extract_field("time", block)
        team1_raw = extract_field("team1", block)
        team2_raw = extract_field("team2", block)
        score_raw = extract_field("score", block)
        stadium_raw = extract_field("stadium", block)
        location_raw = extract_field("location", block)
        round_raw = extract_field("round", block)
        result_raw = extract_field("result", block).strip().upper()

        # ── Identifier les equipes ────────────────────────────────────────
        team1_code = extract_opponent_code(team1_raw)
        team2_code = extract_opponent_code(team2_raw)

        if not team1_code or not team2_code:
            continue

        # Determiner qui est la RDC
        if is_rdc_team(team1_code):
            opponent_code_raw = team2_code
        elif is_rdc_team(team2_code):
            opponent_code_raw = team1_code
        else:
            continue  # Aucun n'est la RDC -> ignorer

        # Resoudre code -> (iso3, nom public)
        opponent_iso, opponent_name = TEAM_MAP.get(
            opponent_code_raw, (opponent_code_raw, opponent_code_raw)
        )

        # Sanity check : si l'adversaire est aussi la RDC -> match bizarre, ignorer
        if is_rdc_team(opponent_iso):
            continue

        # ── Parser kickoff_at UTC ─────────────────────────────────────────
        # Nettoyer date_raw des eventuels wikilinks avant parsing
        date_clean = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", date_raw)
        date_clean = re.sub(r"\[\[([^\]]+)\]\]", r"\1", date_clean).strip()

        kickoff_utc = parse_kickoff_utc(date_raw, time_raw)  # date_raw brut pour {{Start date}}

        # ── Status ────────────────────────────────────────────────────────
        status = "scheduled"
        if result_raw in ("W", "D", "L"):
            # Le champ |result= indique le resultat final -> match termine
            status = "finished"
        elif re.search(r"LIVE|EN COURS", block, re.IGNORECASE):
            status = "live"
        # Si kickoff dans le passe et pas de result -> on laisse "scheduled"
        # (peut etre un match recent sans result encore saisi sur Wikipedia)

        # ── Scores ────────────────────────────────────────────────────────
        score_rdc = None
        score_opponent = None

        # Score format : "2-1" ou "2-1 (a.e.t.)"
        score_match = re.search(r"(\d+)\s*[–\-]\s*(\d+)", score_raw) if score_raw else None
        if score_match:
            s1, s2 = int(score_match.group(1)), int(score_match.group(2))
            if is_rdc_team(team1_code):
                score_rdc, score_opponent = s1, s2
            else:
                score_opponent, score_rdc = s1, s2
            if status == "scheduled":
                status = "finished"

        # ── Competition ───────────────────────────────────────────────────
        competition = normalize_competition_label(round_raw)

        # ── Venue, ville, pays ────────────────────────────────────────────
        def clean_wiki(s: str) -> str:
            """Nettoie les refs, wikilinks et templates d'une chaine."""
            s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.DOTALL)
            s = re.sub(r"<ref[^/]*/?>", "", s)
            s = re.sub(r"\[\[([^\]|]+)\|([^\]]+)\]\]", r"\2", s)
            s = re.sub(r"\[\[([^\]]+)\]\]", r"\1", s)
            # Supprimer les templates {{...}} residuels
            s = re.sub(r"\{\{[^{}]*\}\}", "", s)
            return s.strip()

        venue_clean = clean_wiki(stadium_raw) or None
        location_clean = clean_wiki(location_raw)

        city = None
        country = None

        # Location format : "Houston, United States" ou "Zapopan, Mexico"
        if location_clean:
            parts = [p.strip() for p in location_clean.split(",")]
            if len(parts) >= 2:
                city = parts[0]
                country = parts[-1]
            elif len(parts) == 1 and parts[0]:
                city = parts[0]

        # Fallback : si location vide mais stade contient "Stadium, City"
        # ex: "[[NRG Stadium]], [[Houston]]" -> venue=NRG Stadium, city=Houston
        if not city and venue_clean and "," in stadium_raw:
            # Le stade raw peut contenir [[NRG Stadium]], [[Houston]]
            parts_raw = re.split(r",\s*", clean_wiki(stadium_raw))
            if len(parts_raw) >= 2:
                # Le premier est le stade, le second est la ville
                venue_clean = parts_raw[0].strip() or venue_clean
                city = parts_raw[1].strip() or city

        # home_or_away : home si Kinshasa/Lubumbashi, neutral sinon
        home_or_away = "neutral"
        if city and any(x in city.lower() for x in ["kinshasa", "lubumbashi"]):
            home_or_away = "home"

        results.append({
            "kickoff_at": kickoff_utc,
            "date_raw": date_clean,
            "time_raw": time_raw,
            "opponent_code": opponent_iso,
            "opponent_name": opponent_name,
            "competition": competition,
            "venue": venue_clean,
            "city": city,
            "country": country,
            "home_or_away": home_or_away,
            "status": status,
            "score_rdc": score_rdc,
            "score_opponent": score_opponent,
            "source": source_label,
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Logique d'injection Supabase
# ─────────────────────────────────────────────────────────────────────────────

def find_existing_match(sb: SupabaseClient, kickoff_at: str, opponent_name: str) -> Optional[dict]:
    """
    Cherche un match existant a kickoff_at +/- DEDUP_WINDOW_HOURS avec adversaire similaire.

    La fenetre large (+/- 12h) absorbe les decalages d'horaire en cas de correction
    de fuseau horaire sans creer de doublon.

    Retourne le premier match trouve ou None.
    """
    try:
        kickoff_dt = dt.datetime.fromisoformat(kickoff_at.replace("+00:00", ""))
    except ValueError:
        return None

    lo = (kickoff_dt - dt.timedelta(hours=DEDUP_WINDOW_HOURS)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    hi = (kickoff_dt + dt.timedelta(hours=DEDUP_WINDOW_HOURS)).strftime("%Y-%m-%dT%H:%M:%S+00:00")

    # Recuperer les matchs dans la fenetre temporelle
    rows = sb.select(
        "matches",
        **{
            "kickoff_at": f"gte.{lo}",
            "select": "id,kickoff_at,opponent_name,status,score_rdc,score_opponent,venue",
        },
    )
    # Filtrer ceux qui depassent la borne haute
    rows = [
        r for r in rows
        if r.get("kickoff_at", "") <= hi.replace("+00:00", "Z") or
           r.get("kickoff_at", "") <= hi
    ]

    if not rows:
        return None

    # Affiner par adversaire (correspondance partielle tolerante)
    opponent_lower = opponent_name.lower()
    for row in rows:
        existing_lower = (row.get("opponent_name") or "").lower()
        # Correspondance directe ou partielle (au moins 4 chars en commun)
        if (opponent_lower in existing_lower or
                existing_lower in opponent_lower or
                any(w in existing_lower for w in opponent_lower.split() if len(w) >= 4)):
            return row

    # Si la fenetre contient un seul match -> probable meme match, retourner
    if len(rows) == 1:
        return rows[0]

    return None


def build_match_row(parsed: dict) -> dict:
    """
    Construit un dict pret pour l'insertion Supabase depuis un match parse.
    Ajoute le drapeau emoji via FLAG_MAP.
    """
    code = parsed.get("opponent_code")
    flag = FLAG_MAP.get(code, "\U0001f3f4") if code else "\U0001f30d"

    row = {
        "kickoff_at": parsed["kickoff_at"],
        "opponent_name": parsed["opponent_name"],
        "opponent_code": code,
        "opponent_flag": flag,
        "competition": parsed["competition"],
        "venue": parsed.get("venue"),
        "city": parsed.get("city"),
        "country": parsed.get("country"),
        "home_or_away": parsed.get("home_or_away", "neutral"),
        "status": parsed.get("status", "scheduled"),
        "is_published": True,
    }

    # Ajouter les scores si disponibles
    if parsed.get("score_rdc") is not None:
        row["score_rdc"] = parsed["score_rdc"]
    if parsed.get("score_opponent") is not None:
        row["score_opponent"] = parsed["score_opponent"]

    return row


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sync matchs RDC depuis Wikipedia Mediawiki API -> Supabase"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche ce qui serait fait sans ecrire en base",
    )
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    print("=== Leopards Radar -- Sync Matchs RDC ===")
    print(f"Start    : {started_at.isoformat()}Z")
    print(f"Dry run  : {args.dry_run}")
    print(f"Source   : Wikipedia Mediawiki API (sans cle)")

    # ── Auth Supabase ──────────────────────────────────────────────────────
    sb = SupabaseClient()
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"!!! ABORTING: {e}", file=sys.stderr)
        sys.exit(1)

    stats = {
        "matches_found": 0,
        "matches_inserted": 0,
        "matches_updated": 0,
        "matches_skipped": 0,
        "matches_no_date": 0,
        "errors_count": 0,
        "error_details": [],
    }

    all_parsed = []

    # ── Etape 1 : Fetcher les pages Wikipedia ─────────────────────────────
    for page_cfg in WIKI_PAGES:
        print(f"\n[Wiki] Fetching '{page_cfg['label']}'...")
        wikitext = fetch_wikipedia_wikitext(page_cfg)
        if not wikitext:
            print(f"  [Wiki] Impossible de recuperer la page -- skip")
            continue

        parsed = parse_football_boxes(wikitext, page_cfg["label"])
        print(f"  [Wiki] {len(parsed)} matchs RDC trouves")
        all_parsed.extend(parsed)

        # Politesse envers Wikipedia : 1 seconde entre les appels
        time.sleep(1)

    # ── Etape 2 : Deduplication inter-sources ─────────────────────────────
    # Un match peut apparaitre a la fois dans results_2020 et wc2026_group_k
    seen_keys: set = set()
    unique_parsed = []
    for m in all_parsed:
        if not m.get("kickoff_at"):
            stats["matches_no_date"] += 1
            continue
        # Cle de dedup : heure arrondie a l'heure + code adversaire
        key = (m["kickoff_at"][:13], m.get("opponent_code") or m["opponent_name"][:8])
        if key not in seen_keys:
            seen_keys.add(key)
            unique_parsed.append(m)

    print(f"\n[Dedup] {len(all_parsed)} matchs bruts -> {len(unique_parsed)} matchs uniques")
    print(f"[Dedup] {stats['matches_no_date']} matchs sans date complete ignores")
    stats["matches_found"] = len(unique_parsed)

    if not unique_parsed:
        print("\n[INFO] Aucun match a synchroniser.")

    # ── Etape 3 : Injection Supabase ──────────────────────────────────────
    for match in unique_parsed:
        kickoff = match["kickoff_at"]
        opponent = match["opponent_name"]
        label = f"{kickoff[:10]} vs {opponent}"

        try:
            print(f"\n  {label}")
            print(f"    competition : {match['competition']}")
            print(f"    venue       : {match.get('venue')} | {match.get('city')}, {match.get('country')}")
            print(f"    status      : {match.get('status')} | {match.get('home_or_away')}")
            if match.get("score_rdc") is not None:
                print(f"    score RDC   : {match['score_rdc']}-{match['score_opponent']}")

            if args.dry_run:
                print(f"    [DRY-RUN] serait traite")
                stats["matches_skipped"] += 1
                continue

            # Chercher si le match existe deja
            existing = find_existing_match(sb, kickoff, opponent)

            row = build_match_row(match)

            if existing is None:
                # INSERT -- nouveau match
                result = sb.insert("matches", row)
                if result:
                    print(f"    -> INSERE (id={result[0].get('id')})")
                    stats["matches_inserted"] += 1
                else:
                    print(f"    -> ECHEC INSERT")
                    stats["errors_count"] += 1
                    stats["error_details"].append({"match": label, "error": "insert_failed"})
            else:
                # Calculer le patch minimal
                patch = {}

                # Status : passer a 'finished' si le match est termine
                if match.get("status") == "finished" and existing.get("status") == "scheduled":
                    patch["status"] = "finished"

                # Scores : ajouter si disponibles et absents en base
                if match.get("score_rdc") is not None and existing.get("score_rdc") is None:
                    patch["score_rdc"] = match["score_rdc"]
                    patch["score_opponent"] = match.get("score_opponent")

                # kickoff_at : mettre a jour si decale de plus de 30 minutes
                existing_kickoff = existing.get("kickoff_at", "")
                if existing_kickoff:
                    try:
                        # Normaliser les deux formats (Z et +00:00)
                        k1 = kickoff.replace("+00:00", "").replace("Z", "")
                        k2 = existing_kickoff.replace("+00:00", "").replace("Z", "")
                        diff = abs(
                            (dt.datetime.fromisoformat(k1) - dt.datetime.fromisoformat(k2)).total_seconds()
                        )
                        if diff > 1800:  # 30 minutes
                            patch["kickoff_at"] = kickoff
                    except (ValueError, AttributeError):
                        pass

                # Venue : ajouter si nouvellement disponible
                if row.get("venue") and not existing.get("venue"):
                    patch["venue"] = row["venue"]

                if patch:
                    sb.update("matches", {"id": f"eq.{existing['id']}"}, patch)
                    print(f"    -> MIS A JOUR (id={existing['id']}) : {list(patch.keys())}")
                    stats["matches_updated"] += 1
                else:
                    print(f"    -> DEJA A JOUR (id={existing['id']}) -- skip")
                    stats["matches_skipped"] += 1

        except Exception as e:
            msg = f"Erreur sur '{label}': {e}"
            print(f"    !!! {msg}", file=sys.stderr)
            stats["errors_count"] += 1
            stats["error_details"].append({"match": label, "error": str(e)})

    # ── Etape 4 : Log dans sync_logs ──────────────────────────────────────
    finished_at = dt.datetime.utcnow()
    duration = int((finished_at - started_at).total_seconds())

    if not args.dry_run:
        log_status = "success" if stats["errors_count"] == 0 else "partial"
        sb.insert("sync_logs", {
            "job_name": JOB_NAME,
            "status": log_status,
            "players_processed": stats["matches_found"],
            "players_updated": stats["matches_updated"],
            "candidates_discovered": stats["matches_inserted"],
            "errors_count": stats["errors_count"],
            "error_details": stats["error_details"] if stats["error_details"] else None,
            "started_at": started_at.isoformat() + "Z",
            "finished_at": finished_at.isoformat() + "Z",
            "duration_seconds": duration,
            "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        })

    # ── Recap ─────────────────────────────────────────────────────────────
    print(f"\n=== Recap ===")
    print(f"Matchs trouves    : {stats['matches_found']}")
    print(f"Inseres           : {stats['matches_inserted']}")
    print(f"Mis a jour        : {stats['matches_updated']}")
    print(f"Deja a jour       : {stats['matches_skipped']}")
    print(f"Sans date         : {stats['matches_no_date']}")
    print(f"Erreurs           : {stats['errors_count']}")
    print(f"Duree             : {duration}s")

    if stats["errors_count"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
