#!/usr/bin/env python3
"""
Léopards Radar — Sprint 2 : Backfill historique de carrière dans player_clubs.

Objectif :
  Pour chaque joueur prioritaire (roster + top 100 radar par valeur marchande),
  scrape la page "career history" Transfermarkt et insère les passages en club
  dans la table player_clubs. Idempotent grâce à UPSERT ON CONFLICT.

Flux principal :
  1. Charge env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  2. Sélectionne les 165 joueurs prioritaires depuis players
  3. Pour chaque joueur → fetch TM career history → parse les passages
  4. Pour chaque passage → match ou crée le club dans clubs
  5. UPSERT dans player_clubs (ON CONFLICT idempotent)
  6. Log dans sync_logs

Variables d'environnement requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Options CLI :
  --dry-run         Affiche sans écrire en base
  --priority-only   Traite uniquement les 165 joueurs prioritaires (défaut: True)
  --all-players     Traite tous les joueurs (override --priority-only)
  --batch-size N    Nombre max de joueurs à traiter (défaut: 165, max: 500)

Usage local :
  cd scripts && python backfill_player_clubs.py --dry-run
  cd scripts && python backfill_player_clubs.py
  cd scripts && python backfill_player_clubs.py --all-players --batch-size 300
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import traceback
import unicodedata
from dataclasses import dataclass, field
from typing import Optional

import requests
from bs4 import BeautifulSoup

from supabase_client import SupabaseClient
from transfermarkt_client import USER_AGENTS

# ─────────────────────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────────────────────

JOB_NAME = "backfill-player-clubs"

# Rate-limit entre joueurs : 1 seconde (TM tolère mieux une pause constante
# qu'un burst puis silence — pattern plus naturel qu'un bot agressif).
RATE_LIMIT_PLAYER = float(os.environ.get("RATE_LIMIT_SECONDS", "1.0"))

TM_BASE = "https://www.transfermarkt.com"

# Types de transfert Transfermarkt → valeurs normalisées pour player_clubs.transfer_type
# Ces mappings couvrent les labels anglais affichés par TM dans le tableau carrière.
TRANSFER_TYPE_MAP = {
    "loan": "loan",
    "loan transfer": "loan",
    "end of loan": "return",
    "return from loan": "return",
    "free transfer": "free",
    "free agent": "free",
    "youth": "youth",
    "promotion": "promotion",
    "draft": "transfer",
    "transfer": "transfer",
    "": "transfer",  # par défaut si pas de type affiché
}


# ─────────────────────────────────────────────────────────────────────────────
# Dataclass passage carrière
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class CareerEntry:
    """Un passage d'un joueur dans un club, extrait de TM."""
    club_name: str
    club_tm_id: Optional[str]
    date_from: Optional[str]     # ISO 'YYYY-MM-DD' ou None si inconnu
    date_to: Optional[str]       # ISO 'YYYY-MM-DD' ou None si club actuel
    transfer_type: str           # 'transfer' | 'loan' | 'free' | 'youth' | 'return' | 'promotion'
    fee_eur: Optional[int]       # None si free / inconnu


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def normalize_name(name: str) -> str:
    """
    Normalise un nom pour le matching flou :
    lowercase, sans accents (NFD→ASCII), strip whitespace.
    Utilisé pour chercher un club par name_normalized dans Supabase.
    """
    nfd = unicodedata.normalize("NFD", name)
    ascii_only = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return ascii_only.lower().strip()


def random_ua() -> str:
    """Retourne un User-Agent aléatoire depuis la liste partagée du client TM."""
    import random
    return random.choice(USER_AGENTS)


def tm_get(url: str, session: requests.Session, last_request_at: list) -> Optional[str]:
    """
    GET rate-limité vers Transfermarkt.
    Lève RuntimeError sur signal de ban (403/429) pour stopper le job proprement.
    """
    elapsed = time.time() - last_request_at[0]
    if elapsed < RATE_LIMIT_PLAYER:
        time.sleep(RATE_LIMIT_PLAYER - elapsed)

    headers = {
        "User-Agent": random_ua(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
        "Upgrade-Insecure-Requests": "1",
    }
    try:
        r = session.get(url, headers=headers, timeout=20)
        last_request_at[0] = time.time()
        if r.status_code == 200:
            return r.text
        elif r.status_code == 404:
            print(f"  [TM] 404 NOT FOUND: {url}")
            return None
        elif r.status_code in (403, 429):
            # Signal de ban → arrêt immédiat pour ne pas aggraver la situation
            raise RuntimeError(f"Transfermarkt ban signal: HTTP {r.status_code}")
        else:
            print(f"  [TM] HTTP {r.status_code} on {url}")
            return None
    except RuntimeError:
        raise
    except requests.RequestException as e:
        print(f"  [TM] Network error on {url}: {e}")
        return None


def parse_tm_date(text: str) -> Optional[str]:
    """
    Parse une date Transfermarkt vers ISO 'YYYY-MM-DD'.
    Formats rencontrés : 'Jul 1, 2019', '01/07/19', 'Sep 2015', '2019'.
    Retourne None si non parseable.
    """
    text = text.strip()
    if not text or text in ("-", "—", "?", "???"):
        return None

    MONTH_MAP = {
        "jan": "01", "feb": "02", "mar": "03", "apr": "04",
        "may": "05", "jun": "06", "jul": "07", "aug": "08",
        "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    }

    # Format "Jul 1, 2019" ou "Sep 2015"
    m = re.match(r"(\w{3})\s+(\d{1,2})?,?\s*(\d{4})", text, re.IGNORECASE)
    if m:
        mon = MONTH_MAP.get(m.group(1).lower()[:3])
        if mon:
            day = m.group(2) or "01"
            return f"{m.group(3)}-{mon}-{int(day):02d}"

    # Format "DD/MM/YY" ou "DD/MM/YYYY"
    m = re.match(r"(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2,4})", text)
    if m:
        day, month, year = m.group(1), m.group(2), m.group(3)
        if len(year) == 2:
            year = "20" + year if int(year) < 50 else "19" + year
        return f"{year}-{int(month):02d}-{int(day):02d}"

    # Année seule "2019" → on prend le 1er juillet (milieu de saison)
    m = re.match(r"^(\d{4})$", text)
    if m:
        return f"{m.group(1)}-07-01"

    return None


def parse_fee(text: str) -> Optional[int]:
    """
    Parse un montant de transfert Transfermarkt vers entier EUR.
    Ex: '€40.00m' → 40_000_000, '€500k' → 500_000, 'free transfer' → None.
    """
    text = text.strip().lower()
    if not text or "free" in text or "loan" in text or "-" in text or "?" in text:
        return None

    m = re.search(r"([\d\.,]+)\s*(m|k|bn)?", text)
    if not m:
        return None

    try:
        num = float(m.group(1).replace(",", "").replace(" ", ""))
        unit = (m.group(2) or "").lower()
        if unit == "bn":
            return int(num * 1_000_000_000)
        elif unit == "m":
            return int(num * 1_000_000)
        elif unit == "k":
            return int(num * 1_000)
        else:
            return int(num)
    except (ValueError, OverflowError):
        return None


def normalize_transfer_type(raw: str) -> str:
    """
    Normalise le label de type de transfert TM vers les valeurs player_clubs.
    Retourne 'transfer' par défaut si le label n'est pas reconnu.
    """
    raw_lower = raw.strip().lower()
    for key, val in TRANSFER_TYPE_MAP.items():
        if key in raw_lower:
            return val
    return "transfer"


# ─────────────────────────────────────────────────────────────────────────────
# Parsing de la page career history TM
# ─────────────────────────────────────────────────────────────────────────────

def fetch_career_history(tm_id: str, session: requests.Session, last_request_at: list) -> list[CareerEntry]:
    """
    Fetch et parse la page 'career history' Transfermarkt d'un joueur.

    URL pattern : https://www.transfermarkt.com/-/leistungsdaten/spieler/{ID}
    (la page de stats par saison expose le tableau de carrière le plus complet)

    Fallback vers la page profil standard si la page leistungsdaten ne contient
    pas le tableau carrière.

    Retourne une liste de CareerEntry, vide si pas de données ou erreur fetch.
    """
    # Essai 1 : page de stats par saison (contient le tableau carrière complet)
    url = f"{TM_BASE}/-/leistungsdaten/spieler/{tm_id}/plus/0?saison=ges"
    html = tm_get(url, session, last_request_at)
    if html:
        entries = _parse_career_table(html, tm_id, url)
        if entries:
            return entries

    # Fallback : page profil standard (onglet "Career" peut y figurer)
    url_profile = f"{TM_BASE}/-/profil/spieler/{tm_id}"
    html2 = tm_get(url_profile, session, last_request_at)
    if html2:
        entries2 = _parse_career_table(html2, tm_id, url_profile)
        if entries2:
            return entries2

    return []


def _parse_career_table(html: str, tm_id: str, source_url: str) -> list[CareerEntry]:
    """
    Parse le tableau de carrière depuis le HTML d'une page TM.
    Cible les tableaux avec class 'items' contenant des colonnes club/date.
    Retourne une liste de CareerEntry (peut être vide si pas de tableau).
    """
    soup = BeautifulSoup(html, "html.parser")
    entries: list[CareerEntry] = []

    # Le tableau de carrière TM a la structure :
    #   <table class="items"> <tbody> <tr> <td class="hauptlink">Club</td>... </tr>
    # On cherche tous les tableaux items et on identifie ceux qui ont des dates.
    for table in soup.select("table.items"):
        rows = table.select("tbody tr")
        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue

            # Extraction du nom et TM ID du club depuis les liens dans la ligne
            club_name = None
            club_tm_id = None

            # Le nom du club est dans un <td class="hauptlink"> contenant un <a>
            # avec href pattern '/startseite/verein/{ID}'
            hauptlink = row.select_one("td.hauptlink a[href*='/startseite/verein/']")
            if not hauptlink:
                # Fallback : n'importe quel lien vers un verein dans la ligne
                hauptlink = row.select_one("a[href*='/startseite/verein/']")
            if hauptlink:
                club_name = hauptlink.get_text(strip=True)
                href = hauptlink.get("href", "")
                m = re.search(r"/startseite/verein/(\d+)", href)
                if m:
                    club_tm_id = m.group(1)

            if not club_name:
                continue

            # Extraction des dates : chercher 2 cellules consécutives qui ressemblent
            # à des dates. Stratégie : on parse toutes les cellules textuelles
            # et on garde les 2 premières qui correspondent au pattern date.
            date_texts = []
            for cell in cells:
                # On exclut les cellules qui contiennent un lien club (déjà traité)
                if cell.select_one("a[href*='/startseite/verein/']"):
                    continue
                text = cell.get_text(separator=" ", strip=True)
                # Heuristique : une date TM commence par un mois abrégé, chiffre, ou année
                if re.match(r"(\w{3}\s+\d|[\d]{1,2}[/\-\.][\d]|^\d{4}$)", text):
                    date_texts.append(text)

            date_from = parse_tm_date(date_texts[0]) if len(date_texts) > 0 else None
            date_to = parse_tm_date(date_texts[1]) if len(date_texts) > 1 else None

            # Si date_from n'est pas parseable, on essaie de récupérer au moins
            # l'année depuis les balises "saison" (ex: "16/17" → 2016-07-01)
            if not date_from:
                saison_cell = row.select_one("td.zentriert")
                if saison_cell:
                    saison_text = saison_cell.get_text(strip=True)
                    # Format "16/17" ou "2016/17"
                    m_saison = re.match(r"(\d{2,4})[/\-](\d{2,4})", saison_text)
                    if m_saison:
                        yr = m_saison.group(1)
                        full_yr = f"20{yr}" if len(yr) == 2 else yr
                        date_from = f"{full_yr}-07-01"

            # Si on n'a toujours pas de date_from, on skip ce passage
            # (un passage sans date ne peut pas être UPSERT'd proprement)
            if not date_from:
                continue

            # Extraction du type de transfert (souvent dans un title d'icône)
            transfer_type = "transfer"
            for icon in row.select("i[title], span[title]"):
                title = icon.get("title", "").strip()
                if title:
                    transfer_type = normalize_transfer_type(title)
                    break

            # Extraction du fee (colonne "Transfer fee")
            fee_eur = None
            for cell in cells:
                text = cell.get_text(separator=" ", strip=True)
                # Le fee contient généralement "€" ou "m" ou "k"
                if "€" in text or (re.search(r"\d+[mk]?\s*$", text.lower()) and "€" in text):
                    fee_eur = parse_fee(text)
                    if fee_eur is not None:
                        break

            entries.append(CareerEntry(
                club_name=club_name,
                club_tm_id=club_tm_id,
                date_from=date_from,
                date_to=date_to,  # None = club actuel
                transfer_type=transfer_type,
                fee_eur=fee_eur,
            ))

    return entries


# ─────────────────────────────────────────────────────────────────────────────
# Récupération ou création d'un club dans Supabase
# ─────────────────────────────────────────────────────────────────────────────

def get_or_create_club(
    entry: CareerEntry,
    sb: SupabaseClient,
    club_id_by_tm_id: dict[str, int],
    session: requests.Session,
    last_request_at: list,
    dry: bool,
) -> Optional[int]:
    """
    Retourne l'id Supabase d'un club, en le créant à la volée si nécessaire.

    Ordre de résolution :
    1. Lookup par club.transfermarkt_id dans le cache club_id_by_tm_id
    2. Si pas de TM ID ou pas en cache → recherche par name_normalized dans clubs
    3. Si toujours pas trouvé → fetch la page TM du club et upsert dans clubs
    4. Si pas de TM ID du tout → créer un club minimal par nom uniquement

    On met à jour club_id_by_tm_id en place pour éviter les re-fetches si
    le même club apparaît plusieurs fois dans la carrière d'un joueur.
    """
    # 1. Lookup rapide par TM ID
    if entry.club_tm_id and entry.club_tm_id in club_id_by_tm_id:
        return club_id_by_tm_id[entry.club_tm_id]

    if not dry:
        # 2. Chercher en base par transfermarkt_id (frais depuis Supabase)
        if entry.club_tm_id:
            existing = sb.select(
                "clubs",
                select="id,transfermarkt_id",
                transfermarkt_id=f"eq.{entry.club_tm_id}",
            )
            if existing:
                club_db_id = existing[0]["id"]
                club_id_by_tm_id[entry.club_tm_id] = club_db_id
                return club_db_id

        # 3. Chercher par name_normalized
        nn = normalize_name(entry.club_name)
        existing_by_name = sb.select(
            "clubs",
            select="id,name_normalized,transfermarkt_id",
            name_normalized=f"eq.{nn}",
            limit="1",
        )
        if existing_by_name:
            club_db_id = existing_by_name[0]["id"]
            # Enrichir le cache avec le TM ID récupéré si disponible
            if existing_by_name[0].get("transfermarkt_id") and entry.club_tm_id:
                club_id_by_tm_id[entry.club_tm_id] = club_db_id
            return club_db_id

    # 4. Le club n'est pas en base → le créer à la volée
    if dry:
        print(f"      [dry-run] Nouveau club à créer : {entry.club_name} (TM {entry.club_tm_id})")
        return None

    new_club_row = _build_club_row(entry, session, last_request_at)
    # UPSERT sur transfermarkt_id si disponible, sinon on insère (risque de doublon
    # géré par name_normalized mais on préfère TM ID pour la fiabilité)
    if entry.club_tm_id:
        result = sb.upsert("clubs", [new_club_row], on_conflict="transfermarkt_id")
    else:
        # Sans TM ID, on essaie sur (name_normalized, league_id) — mais league_id est
        # NULL pour les clubs créés à la volée. On fait un simple insert avec gestion
        # d'erreur (doublon = on récupère l'existant).
        result = sb.insert("clubs", [new_club_row])
        if not result:
            # Peut être un conflit — retenter le lookup par nom
            fallback = sb.select(
                "clubs",
                select="id",
                name_normalized=f"eq.{normalize_name(entry.club_name)}",
                limit="1",
            )
            return fallback[0]["id"] if fallback else None

    if result and len(result) > 0:
        new_id = result[0]["id"]
        if entry.club_tm_id:
            club_id_by_tm_id[entry.club_tm_id] = new_id
        print(f"      → Club créé à la volée : {entry.club_name} (id={new_id}, TM={entry.club_tm_id})")
        return new_id

    return None


def _build_club_row(entry: CareerEntry, session: requests.Session, last_request_at: list) -> dict:
    """
    Construit le dictionnaire pour insérer un club dans Supabase.
    Si entry.club_tm_id est disponible, on fetch la page TM pour enrichir
    avec pays et logo. Sinon on crée un enregistrement minimal.
    """
    name_norm = normalize_name(entry.club_name)

    base_row = {
        "name": entry.club_name,
        "name_normalized": name_norm,
        "transfermarkt_id": entry.club_tm_id,
        "updated_at": dt.datetime.utcnow().isoformat() + "Z",
    }

    if not entry.club_tm_id:
        return base_row

    # Fetch la page club TM pour enrichir avec pays + logo
    try:
        url = f"{TM_BASE}/-/startseite/verein/{entry.club_tm_id}"
        html = tm_get(url, session, last_request_at)
        if not html:
            return base_row

        soup = BeautifulSoup(html, "html.parser")

        # Nom officiel TM (plus fiable que celui du tableau carrière)
        h1 = soup.select_one("h1.data-header__headline-wrapper")
        if h1:
            official_name = h1.get_text(separator=" ", strip=True)
            if official_name:
                base_row["name"] = official_name
                base_row["name_normalized"] = normalize_name(official_name)

        # Logo
        logo_img = (
            soup.select_one("img.data-header__profile-image")
            or soup.select_one("img.tm-club-header-image__image")
        )
        if logo_img:
            src = logo_img.get("src") or logo_img.get("data-src")
            if src and src.startswith("http"):
                base_row["logo_url"] = src

        # Pays
        for span in soup.select("span.info-table__content--regular"):
            label = span.get_text(strip=True).lower()
            if "country" in label or "nation" in label:
                next_span = span.find_next_sibling("span", class_="info-table__content--bold")
                if next_span:
                    country_link = next_span.select_one("a")
                    if country_link:
                        base_row["country_code"] = _country_name_to_iso2(
                            country_link.get_text(strip=True)
                        )
                break

        # Flag fallback
        if "country_code" not in base_row:
            flag = soup.select_one("span.data-header__club-info img.flaggenrahmen")
            if flag:
                base_row["country_code"] = _country_name_to_iso2(
                    flag.get("title") or flag.get("alt") or ""
                )

    except RuntimeError:
        # Ban signal — on propage pour stopper le job
        raise
    except Exception as e:
        print(f"      [warn] Fetch club TM échoué pour {entry.club_tm_id}: {e}")

    return base_row


# Correspondances pays TM → code ISO2 (partagé avec sync_clubs.py)
_COUNTRY_ISO2 = {
    "France": "FR", "Germany": "DE", "England": "GB", "Spain": "ES",
    "Italy": "IT", "Portugal": "PT", "Belgium": "BE", "Netherlands": "NL",
    "Turkey": "TR", "Switzerland": "CH", "Sweden": "SE", "Norway": "NO",
    "Scotland": "GB", "United States": "US", "Brazil": "BR",
    "DR Congo": "CD", "Congo DR": "CD", "Congo": "CD",
    "Cameroon": "CM", "Morocco": "MA", "Algeria": "DZ", "Tunisia": "TN",
    "Egypt": "EG", "Senegal": "SN", "South Africa": "ZA", "Angola": "AO",
    "Zambia": "ZM", "Tanzania": "TZ", "Kenya": "KE", "Ghana": "GH",
    "Ivory Coast": "CI", "Nigeria": "NG", "Burkina Faso": "BF",
    "Saudi Arabia": "SA", "Qatar": "QA", "UAE": "AE",
    "China": "CN", "Japan": "JP", "South Korea": "KR",
    "Mexico": "MX", "Argentina": "AR", "Colombia": "CO",
    "Austria": "AT", "Croatia": "HR", "Greece": "GR", "Romania": "RO",
    "Denmark": "DK", "Poland": "PL", "Czech Republic": "CZ",
    "Hungary": "HU", "Serbia": "RS", "Russia": "RU", "Ukraine": "UA",
    "Israel": "IL", "Luxembourg": "LU", "Ireland": "IE", "Finland": "FI",
}


def _country_name_to_iso2(name: str) -> Optional[str]:
    return _COUNTRY_ISO2.get(name.strip())


# ─────────────────────────────────────────────────────────────────────────────
# Sélection des joueurs prioritaires
# ─────────────────────────────────────────────────────────────────────────────

def select_priority_players(sb: SupabaseClient, batch_size: int) -> list[dict]:
    """
    Retourne les joueurs prioritaires dans l'ordre :
    1. roster (tous, triés par market_value_eur DESC)
    2. radar top 100 par market_value_eur DESC

    On utilise deux requêtes séparées pour rester dans les limites de l'API
    REST Supabase (pas de UNION dans le client REST simple).
    """
    # Roster : tous les joueurs de la sélection nationale actuelle
    roster = sb.select(
        "players",
        select="id,name,slug,transfermarkt_id,player_category,market_value_eur",
        player_category="eq.roster",
        order="market_value_eur.desc.nullslast",
    )

    # Radar top 100 par valeur marchande
    radar = sb.select(
        "players",
        select="id,name,slug,transfermarkt_id,player_category,market_value_eur",
        player_category="eq.radar",
        order="market_value_eur.desc.nullslast",
        limit="100",
    )

    # Déduplique sur id (un joueur ne peut pas être roster ET radar,
    # mais on se protège contre un éventuel doublon de données)
    seen = set()
    combined = []
    for p in (roster + radar):
        if p["id"] not in seen:
            seen.add(p["id"])
            combined.append(p)

    # Respect du batch_size demandé
    return combined[:batch_size]


# ─────────────────────────────────────────────────────────────────────────────
# Fonction principale
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Léopards Radar — Backfill historique de carrière player_clubs"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche sans écrire en base",
    )
    parser.add_argument(
        "--all-players",
        action="store_true",
        help="Traite tous les joueurs (override priority-only)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=int(os.environ.get("BATCH_SIZE", "165")),
        help="Nombre max de joueurs à traiter (défaut: 165, max: 500)",
    )
    args = parser.parse_args()

    # Protection contre un batch_size aberrant
    batch_size = min(args.batch_size, 500)
    priority_only = not args.all_players
    dry = args.dry_run

    started_at = dt.datetime.utcnow()
    print("=== Léopards Radar — Backfill Player Clubs ===")
    print(f"Start        : {started_at.isoformat()}Z")
    print(f"Dry run      : {dry}")
    print(f"Priority only: {priority_only}")
    print(f"Batch size   : {batch_size}")

    # ── Connexion Supabase ─────────────────────────────────────────────────
    sb = SupabaseClient()
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"!!! ABORTING: {e}", file=sys.stderr)
        sys.exit(1)

    stats = {
        "players_processed": 0,
        "players_updated": 0,
        "candidates_discovered": 0,   # clubs créés à la volée
        "errors_count": 0,
        "error_details": [],
    }

    # ── Sélection des joueurs à traiter ────────────────────────────────────
    print(f"\n[1/4] Sélection des joueurs ({'' if priority_only else 'TOUS — '}batch={batch_size})...")

    if priority_only:
        players = select_priority_players(sb, batch_size)
    else:
        # Mode all-players : on prend tous les joueurs avec transfermarkt_id
        players = sb.select(
            "players",
            select="id,name,slug,transfermarkt_id,player_category,market_value_eur",
            order="market_value_eur.desc.nullslast",
            limit=str(batch_size),
        )

    print(f"  {len(players)} joueurs sélectionnés")
    stats["players_processed"] = len(players)

    # ── Chargement du référentiel clubs (cache) ────────────────────────────
    print("\n[2/4] Chargement du référentiel clubs...")
    existing_clubs = sb.select("clubs", select="id,transfermarkt_id")
    # Index par transfermarkt_id pour lookup O(1)
    # Ce cache est mis à jour en place lors des créations à la volée
    club_id_by_tm_id: dict[str, int] = {
        c["transfermarkt_id"].strip(): c["id"]
        for c in existing_clubs
        if c.get("transfermarkt_id")
    }
    print(f"  {len(existing_clubs)} clubs en base, {len(club_id_by_tm_id)} avec TM ID")

    # ── Traitement joueur par joueur ───────────────────────────────────────
    print(f"\n[3/4] Fetch TM + UPSERT player_clubs...")

    session = requests.Session()
    last_request_at = [0.0]  # état rate-limit mutable sans classe

    clubs_created_this_run = 0

    for idx, player in enumerate(players, 1):
        tm_id = (player.get("transfermarkt_id") or "").strip()
        player_name = player.get("name", f"id={player['id']}")

        print(f"\n  [{idx:>3}/{len(players)}] {player_name}", end="")

        # Skip si pas de TM ID — impossible de fetch l'historique sans ça
        if not tm_id:
            print(" → SKIP (pas de transfermarkt_id)")
            stats["error_details"].append({
                "player_id": player["id"],
                "player_name": player_name,
                "reason": "no_transfermarkt_id",
            })
            stats["errors_count"] += 1
            continue

        print(f" (TM {tm_id})")

        try:
            # Fetch l'historique de carrière depuis TM
            entries = fetch_career_history(tm_id, session, last_request_at)

            if not entries:
                print(f"      → no_career (0 passages trouvés)")
                stats["error_details"].append({
                    "player_id": player["id"],
                    "player_name": player_name,
                    "reason": "no_career",
                })
                continue

            print(f"      → {len(entries)} passages trouvés")

            passages_upserted = 0
            for entry in entries:
                # Résolution du club_id (avec création à la volée si nécessaire)
                club_db_id = get_or_create_club(
                    entry, sb, club_id_by_tm_id, session, last_request_at, dry
                )

                if club_db_id is None and not dry:
                    print(f"      ! club_id introuvable pour '{entry.club_name}' — passage ignoré")
                    continue

                # Construction de la ligne player_clubs
                source_url = f"{TM_BASE}/-/leistungsdaten/spieler/{tm_id}/plus/0?saison=ges"
                row = {
                    "player_id": player["id"],
                    "club_id": club_db_id if club_db_id else 0,  # placeholder en dry-run
                    "transfer_type": entry.transfer_type,
                    "date_from": entry.date_from,
                    "date_to": entry.date_to,
                    "fee_eur": entry.fee_eur,
                    "source_url": source_url,
                }

                if dry:
                    print(f"      [dry-run] UPSERT player_clubs: "
                          f"{entry.club_name} {entry.date_from}→{entry.date_to or 'présent'} "
                          f"type={entry.transfer_type} fee={entry.fee_eur}")
                    passages_upserted += 1
                    continue

                # UPSERT idempotent sur (player_id, club_id, date_from)
                result = sb.upsert(
                    "player_clubs",
                    [row],
                    on_conflict="player_id,club_id,date_from",
                )
                if result is not None:
                    passages_upserted += 1

            print(f"      → {passages_upserted} passages upserted")
            if passages_upserted > 0:
                stats["players_updated"] += 1

        except RuntimeError as e:
            # Ban TM → arrêt immédiat
            print(f"\n!!! BAN SIGNAL: {e}")
            stats["error_details"].append({"global_error": str(e)})
            stats["errors_count"] += 1
            break

        except Exception as e:
            print(f"      ERREUR: {e}")
            stats["errors_count"] += 1
            stats["error_details"].append({
                "player_id": player["id"],
                "player_name": player_name,
                "error": f"{type(e).__name__}: {e}",
                "traceback": traceback.format_exc()[-400:],
            })

        # Pause rate-limit entre joueurs (en plus de la pause interne tm_get)
        time.sleep(RATE_LIMIT_PLAYER)

    stats["candidates_discovered"] = clubs_created_this_run

    # ── Log sync_logs ──────────────────────────────────────────────────────
    print("\n[4/4] Log sync_logs...")
    finished_at = dt.datetime.utcnow()
    duration_s = int((finished_at - started_at).total_seconds())

    if stats["errors_count"] == 0:
        log_status = "success"
    elif stats["players_updated"] > 0:
        log_status = "partial"
    else:
        log_status = "failure"

    log_row = {
        "job_name": JOB_NAME,
        "status": log_status,
        "players_processed": stats["players_processed"],
        "players_updated": stats["players_updated"],
        "candidates_discovered": stats["candidates_discovered"],
        "errors_count": stats["errors_count"],
        "error_details": {
            "errors": stats["error_details"][:50],
            "clubs_created_count": clubs_created_this_run,
        },
        "started_at": started_at.isoformat() + "Z",
        "finished_at": finished_at.isoformat() + "Z",
        "duration_seconds": duration_s,
        "github_run_url": os.environ.get("GITHUB_RUN_URL"),
    }

    if not dry:
        sb.insert("sync_logs", log_row)
    else:
        print(f"  [dry-run] sync_logs (non écrit) : {json.dumps(log_row, indent=2, default=str)[:600]}")

    # ── Récap final ────────────────────────────────────────────────────────
    print(f"\n=== Récap ===")
    print(f"Status           : {log_status}")
    print(f"Joueurs traités  : {stats['players_processed']}")
    print(f"Joueurs enrichis : {stats['players_updated']}")
    print(f"Clubs créés      : {clubs_created_this_run}")
    print(f"Erreurs          : {stats['errors_count']}")
    print(f"Durée            : {duration_s}s")

    no_career = [e for e in stats["error_details"] if e.get("reason") == "no_career"]
    if no_career:
        print(f"\nSans carrière TM (extrait) :")
        for e in no_career[:5]:
            print(f"  - {e['player_name']}")
        if len(no_career) > 5:
            print(f"  ... et {len(no_career) - 5} autres")

    sys.exit(1 if log_status == "failure" else 0)


if __name__ == "__main__":
    main()
