#!/usr/bin/env python3
"""
Léopards Radar — Sprint 1 : Peuplement du référentiel clubs.

Objectif :
  Transformer les ~250 strings distinctes dans players.current_club
  en entités normalisées dans la table clubs, puis poser la FK
  players.current_club_fk → clubs.id pour chaque joueur.

Flux principal :
  1. Charger toutes les paires (current_club TEXT, current_club_id TEXT TM)
     depuis players — sans doublons.
  2. Pour chaque club avec un TM ID connu → fetch direct TM /startseite/verein/{id}
  3. Pour chaque club sans TM ID → tentative de recherche TM schnellsuche
     (uniquement si --no-search n'est pas passé)
  4. Insérer/mettre à jour clubs avec ON CONFLICT (transfermarkt_id)
  5. Backfill players.current_club_fk en matchant players.current_club_id
     (TEXT) contre clubs.transfermarkt_id
  6. Logger dans sync_logs

Variables d'environnement requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Options CLI :
  --dry-run         Affiche sans écrire en base
  --no-search       Saute la recherche TM pour les clubs sans ID (plus rapide)
  --force-resync    Refetch Transfermarkt même pour les clubs déjà en base

Usage local :
  cd scripts && python sync_clubs.py --dry-run
  cd scripts && python sync_clubs.py --force-resync
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

JOB_NAME = "sync-clubs"

# Rate-limit plus stricte qu'un profil joueur : on fait moins de calls
# mais la recherche TM est plus sensible aux bans (endpoint search).
RATE_LIMIT = float(os.environ.get("RATE_LIMIT_SECONDS", "1.0"))

TM_BASE = "https://www.transfermarkt.com"
TM_SEARCH_BASE = "https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche"

# Mots-clés indiquant une équipe réserve / jeunes — utilisés pour is_reserve
RESERVE_KEYWORDS = re.compile(
    r"\b(u\s*\d{2}|u21|u23|ii\b|b-team|reserves?|primavera|espoirs|jeunes?|academy|youth|under[-\s]?\d{2})\b",
    re.IGNORECASE,
)

# Correspondances pays TM (nom affiché → code ISO2)
# On ne peut pas être exhaustif ici, mais on couvre les cas fréquents
# dans le pool RDC (joueurs évoluant en Europe et en Afrique).
TM_COUNTRY_TO_ISO2: dict[str, str] = {
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
    "Chile": "CL", "Uruguay": "UY", "Paraguay": "PY",
    "Austria": "AT", "Croatia": "HR", "Greece": "GR", "Romania": "RO",
    "Denmark": "DK", "Poland": "PL", "Czech Republic": "CZ",
    "Hungary": "HU", "Slovakia": "SK", "Serbia": "RS",
    "Russia": "RU", "Ukraine": "UA", "Israel": "IL",
    "Cyprus": "CY", "Malta": "MT", "Luxembourg": "LU",
    "Ireland": "IE", "Finland": "FI", "Estonia": "EE",
    "Latvia": "LV", "Lithuania": "LT", "Georgia": "GE",
    "Azerbaijan": "AZ", "Armenia": "AM", "Kazakhstan": "KZ",
}


# ─────────────────────────────────────────────────────────────────────────────
# Dataclass résultat parsing club TM
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class TmClub:
    transfermarkt_id: str
    name: str
    country_name: Optional[str] = None
    country_code: Optional[str] = None
    tm_competition_id: Optional[str] = None  # ex: 'GB1', 'FR1'
    logo_url: Optional[str] = None
    short_code: Optional[str] = None
    is_reserve: bool = False


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def normalize_name(name: str) -> str:
    """
    Produit un nom normalisé pour le matching flou :
    - lowercase
    - sans accents (NFD → ASCII)
    - strip whitespace
    Utilisé pour name_normalized dans clubs.
    """
    nfd = unicodedata.normalize("NFD", name)
    ascii_only = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return ascii_only.lower().strip()


def random_ua() -> str:
    import random
    return random.choice(USER_AGENTS)


def tm_get(url: str, session: requests.Session, last_request_at: list) -> Optional[str]:
    """
    GET rate-limité vers Transfermarkt. last_request_at est une liste à 1 élément
    pour permettre la mutation depuis la fonction (pattern pauvre-homme pour éviter
    une classe entière juste pour l'état du rate-limit).
    """
    elapsed = time.time() - last_request_at[0]
    if elapsed < RATE_LIMIT:
        time.sleep(RATE_LIMIT - elapsed)

    headers = {
        "User-Agent": random_ua(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
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
            # Signal de ban → on propage pour stopper le job proprement
            raise RuntimeError(f"Transfermarkt ban signal: HTTP {r.status_code} — arrêt préventif")
        else:
            print(f"  [TM] HTTP {r.status_code} on {url}")
            return None
    except RuntimeError:
        raise
    except requests.RequestException as e:
        print(f"  [TM] Network error on {url}: {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Parsing de la page club TM
# ─────────────────────────────────────────────────────────────────────────────

def parse_club_page(tm_id: str, html: str) -> TmClub:
    """
    Parse la page /startseite/verein/{tm_id} de Transfermarkt.
    Extrait : nom officiel, pays, ID compétition actuelle, logo.

    Le HTML TM évolue régulièrement — on utilise des sélecteurs robustes
    avec fallbacks pour résister aux petites modifications de structure.
    """
    soup = BeautifulSoup(html, "html.parser")

    # ── Nom officiel ──────────────────────────────────────────────────────────
    name = f"Club {tm_id}"  # fallback si rien ne parse
    # Sélecteur principal : h1 avec le nom du club
    h1 = soup.select_one("h1.data-header__headline-wrapper")
    if h1:
        name = h1.get_text(separator=" ", strip=True)
    else:
        # Fallback : title de page (contient souvent "Nom | Transfermarkt")
        title_tag = soup.find("title")
        if title_tag:
            raw_title = title_tag.get_text(strip=True)
            name = raw_title.split("|")[0].strip() or name

    club = TmClub(transfermarkt_id=tm_id, name=name)

    # ── Logo ──────────────────────────────────────────────────────────────────
    # Le logo du club est dans un <img> avec class "data-header__profile-image"
    # ou dans le header avec class "tm-club-header-image__image"
    logo_selectors = [
        "img.data-header__profile-image",
        "img.tm-club-header-image__image",
        "img[class*='club-logo']",
    ]
    for sel in logo_selectors:
        img = soup.select_one(sel)
        if img:
            src = img.get("src") or img.get("data-src")
            if src and src.startswith("http"):
                club.logo_url = src
                break

    # ── Pays ──────────────────────────────────────────────────────────────────
    # La page club affiche le pays dans la zone info-table
    # Pattern : label "Country:" suivi d'un lien avec le drapeau
    for span in soup.select("span.info-table__content--regular"):
        label = span.get_text(strip=True).lower()
        if "country" in label or "nation" in label:
            next_span = span.find_next_sibling("span", class_="info-table__content--bold")
            if next_span:
                # Chercher le texte du lien pays
                country_link = next_span.select_one("a")
                if country_link:
                    club.country_name = country_link.get_text(strip=True)
                else:
                    img_country = next_span.select_one("img")
                    if img_country:
                        club.country_name = img_country.get("title") or img_country.get("alt")
            break

    # Fallback pays via le drapeau dans le header
    if not club.country_name:
        flag = soup.select_one("span.data-header__club-info img.flaggenrahmen")
        if flag:
            club.country_name = flag.get("title") or flag.get("alt")

    if club.country_name:
        club.country_code = TM_COUNTRY_TO_ISO2.get(club.country_name)

    # ── Ligue / Compétition ───────────────────────────────────────────────────
    # L'ID de compétition TM est visible dans le lien vers la ligue du club
    # Pattern href : "/wettbewerb/{competition_id}" ou "/X/staffel/..."
    for a in soup.select("a[href*='/wettbewerb/']"):
        href = a.get("href", "")
        m = re.search(r"/wettbewerb/([A-Z0-9a-z_-]+)", href)
        if m:
            club.tm_competition_id = m.group(1).upper()
            break

    # Fallback : chercher dans les liens de la section "Leagues"
    if not club.tm_competition_id:
        for a in soup.select("div.data-header a[href*='/spielplan/verein/']"):
            # Ces liens ne donnent pas l'ID compétition directement
            pass

    # ── is_reserve ────────────────────────────────────────────────────────────
    club.is_reserve = bool(RESERVE_KEYWORDS.search(name))

    # ── short_code ────────────────────────────────────────────────────────────
    # TM ne fournit pas de short_code officiel — on l'infère depuis le nom
    # via les abréviations connues ou en prenant les initiales (3 premiers caractères)
    club.short_code = _infer_short_code(name)

    return club


def _infer_short_code(name: str) -> Optional[str]:
    """
    Infère un short_code (3 lettres max) depuis le nom du club.
    Pas de short_code officiel TM — c'est une approximation pour l'UI.
    Les overrides manuels via Supabase restent possibles.
    """
    KNOWN_CODES: dict[str, str] = {
        "Paris Saint-Germain": "PSG",
        "Paris Saint Germain": "PSG",
        "Manchester United": "MNU",
        "Manchester City": "MCI",
        "Chelsea": "CHE",
        "Arsenal": "ARS",
        "Liverpool": "LIV",
        "Tottenham Hotspur": "TOT",
        "Real Madrid": "RMA",
        "FC Barcelona": "BAR",
        "Atlético de Madrid": "ATL",
        "Atletico Madrid": "ATL",
        "Bayern München": "FCB",
        "Bayern Munich": "FCB",
        "Borussia Dortmund": "BVB",
        "Juventus": "JUV",
        "AC Milan": "MIL",
        "Inter Milan": "INT",
        "AS Roma": "ROM",
        "SSC Napoli": "NAP",
        "Atalanta BC": "ATA",
        "Olympique de Marseille": "OM",
        "Olympique Lyonnais": "OL",
        "RC Lens": "LEN",
        "Stade Rennais": "REN",
        "AS Monaco": "MON",
        "LOSC Lille": "LIL",
        "TP Mazembe": "TPM",
        "AS Vita Club": "VIT",
        "DC Motema Pembe": "DCP",
        "Ajax": "AJX",
        "Feyenoord": "FEY",
        "PSV": "PSV",
        "Benfica": "SLB",
        "Porto": "POR",
        "Sporting CP": "SCP",
        "Club Brugge": "BRU",
        "Anderlecht": "AND",
        "Galatasaray": "GAL",
        "Fenerbahçe": "FEN",
        "Besiktas": "BJK",
        "FC Basel": "FCB",
    }
    if name in KNOWN_CODES:
        return KNOWN_CODES[name]
    # Fallback : initiales des 3 premiers mots significatifs
    # "FC Real Madrid" → "RMA" n'est pas idéal, donc on skip les préfixes communs
    IGNORE_PREFIXES = {"FC", "AC", "AS", "SS", "SSC", "SL", "SC", "RC", "GD", "CD", "CF", "RB", "US", "VfB", "VfL"}
    words = [w for w in name.split() if w not in IGNORE_PREFIXES and len(w) > 1]
    if words:
        code = "".join(w[0].upper() for w in words[:3])
        return code if len(code) >= 2 else None
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Recherche TM (schnellsuche) pour les clubs sans ID connu
# ─────────────────────────────────────────────────────────────────────────────

def search_club_tm(
    name: str,
    session: requests.Session,
    last_request_at: list,
) -> Optional[str]:
    """
    Cherche un club sur Transfermarkt via l'endpoint schnellsuche.
    Retourne l'ID TM (string) du premier résultat si confidence suffisante,
    sinon None.

    Confidence = on ne garde que les résultats dont le nom normalisé contient
    le nom cherché normalisé (ou vice-versa). Pas de matching flou avancé —
    on préfère logguer "unmatched" plutôt que matcher une mauvaise entité.
    """
    params = {
        "query": name,
        "Verein_page": "0",  # page clubs dans les résultats schnellsuche
    }
    headers = {
        "User-Agent": random_ua(),
        "Accept": "application/json, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": TM_BASE,
    }

    elapsed = time.time() - last_request_at[0]
    if elapsed < RATE_LIMIT:
        time.sleep(RATE_LIMIT - elapsed)

    try:
        r = session.get(TM_SEARCH_BASE, params=params, headers=headers, timeout=20)
        last_request_at[0] = time.time()

        if r.status_code in (403, 429):
            raise RuntimeError(f"Transfermarkt ban signal: HTTP {r.status_code}")
        if r.status_code != 200:
            return None

        # La schnellsuche retourne du HTML (pas JSON)
        soup = BeautifulSoup(r.text, "html.parser")

        # Les résultats clubs sont dans une table sous "Clubs" ou "Vereine"
        # On cherche des liens href contenant "/startseite/verein/"
        name_normalized = normalize_name(name)

        for a in soup.select('a[href*="/startseite/verein/"]'):
            href = a.get("href", "")
            m = re.search(r"/startseite/verein/(\d+)", href)
            if not m:
                continue
            result_name = a.get_text(strip=True)
            result_normalized = normalize_name(result_name)
            # Confidence : le nom cherché doit être contenu dans le résultat
            # (ou l'inverse). On évite les faux positifs.
            if name_normalized in result_normalized or result_normalized in name_normalized:
                return m.group(1)

        return None

    except RuntimeError:
        raise
    except Exception as e:
        print(f"  [TM search] erreur sur '{name}': {e}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Fonction principale
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Léopards Radar — Sync clubs depuis Transfermarkt"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche sans écrire en base",
    )
    parser.add_argument(
        "--no-search",
        action="store_true",
        help="Saute la recherche TM pour les clubs sans ID (plus rapide, réduit le risque de ban)",
    )
    parser.add_argument(
        "--force-resync",
        action="store_true",
        help="Refetch Transfermarkt même pour les clubs déjà présents en base",
    )
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    dry = args.dry_run
    print("=== Léopards Radar — Sync Clubs ===")
    print(f"Start     : {started_at.isoformat()}Z")
    print(f"Dry run   : {dry} | No search : {args.no_search} | Force resync : {args.force_resync}")

    # ── Connexion Supabase ────────────────────────────────────────────────────
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
        "candidates_discovered": 0,
        "errors_count": 0,
        "error_details": [],
        "unmatched_clubs": [],
    }

    # ── 1. Charger les clubs distincts depuis players ─────────────────────────
    # On sélectionne current_club (TEXT name) + current_club_id (TEXT TM ID)
    # group par paire unique pour éviter les doublons et minimiser les appels TM.
    print("\n[1/5] Chargement des clubs distincts depuis players...")
    all_players = sb.select(
        "players",
        select="id,current_club,current_club_id",
        # On prend TOUS les joueurs — current_club peut être NULL pour certains
    )
    stats["players_processed"] = len(all_players)

    # Dédupliquer : on construit un dict {tm_id: (name, tm_id_text)} et
    # un second dict {name_normalized: (name, None)} pour les sans-ID.
    # Le tm_id est la clé primaire de déduplication — si plusieurs joueurs
    # pointent vers le même TM ID, c'est le même club.
    clubs_by_tmid: dict[str, str] = {}     # tm_id → name (dernier vu)
    clubs_without_id: dict[str, str] = {}  # name_normalized → name original

    for p in all_players:
        name = (p.get("current_club") or "").strip()
        tm_id = (p.get("current_club_id") or "").strip()
        if not name:
            continue
        if tm_id:
            clubs_by_tmid[tm_id] = name
        else:
            nn = normalize_name(name)
            clubs_without_id[nn] = name

    print(f"  Clubs avec TM ID connu  : {len(clubs_by_tmid)}")
    print(f"  Clubs sans TM ID        : {len(clubs_without_id)}")

    # ── 2. Charger les leagues existantes pour le matching ───────────────────
    print("\n[2/5] Chargement des leagues depuis Supabase...")
    leagues = sb.select("leagues", select="id,transfermarkt_competition_id,name,country_code")
    # Index par transfermarkt_competition_id pour lookup O(1)
    league_by_tm_comp: dict[str, int] = {}
    for lg in leagues:
        tc = (lg.get("transfermarkt_competition_id") or "").strip().upper()
        if tc:
            league_by_tm_comp[tc] = lg["id"]
    print(f"  {len(leagues)} leagues chargées, {len(league_by_tm_comp)} avec TM competition ID")

    # ── 3. Charger les clubs déjà en base (pour mode non-force) ─────────────
    print("\n[3/5] Chargement des clubs existants en base...")
    existing_clubs = sb.select("clubs", select="id,transfermarkt_id,name_normalized")
    existing_tm_ids: set[str] = set()
    existing_normalized: set[str] = set()
    for c in existing_clubs:
        if c.get("transfermarkt_id"):
            existing_tm_ids.add(c["transfermarkt_id"].strip())
        if c.get("name_normalized"):
            existing_normalized.add(c["name_normalized"].strip())
    print(f"  {len(existing_clubs)} clubs déjà en base")

    # ── 4. Fetch et upsert chaque club ────────────────────────────────────────
    print(f"\n[4/5] Fetch Transfermarkt + upsert clubs...")

    session = requests.Session()
    last_request_at = [0.0]  # liste à 1 élément pour mutation dans tm_get()

    inserted_count = 0
    unmatched_count = 0

    def upsert_club(tm_club: TmClub) -> Optional[int]:
        """
        Insère ou met à jour un club dans la table clubs.
        Retourne l'ID Supabase du club upserted (None en dry-run ou erreur).
        """
        nonlocal inserted_count

        # Match league_id depuis le competition ID TM
        league_id = None
        if tm_club.tm_competition_id:
            league_id = league_by_tm_comp.get(tm_club.tm_competition_id.upper())

        # On gère le cas où name_normalized + league_id (potentiellement NULL)
        # crée un conflit avec la contrainte UNIQUE(name_normalized, league_id).
        # L'UPSERT se fait sur transfermarkt_id qui est une colonne unique distincte.
        row = {
            "name": tm_club.name,
            "name_normalized": normalize_name(tm_club.name),
            "short_code": tm_club.short_code,
            "country_code": tm_club.country_code,
            "transfermarkt_id": tm_club.transfermarkt_id,
            "logo_url": tm_club.logo_url,
            "league_id": league_id,
            "is_reserve": tm_club.is_reserve,
            "updated_at": dt.datetime.utcnow().isoformat() + "Z",
        }

        if dry:
            print(f"    [dry-run] UPSERT clubs: {tm_club.name} (TM {tm_club.transfermarkt_id})"
                  f" league_id={league_id} country={tm_club.country_code}")
            inserted_count += 1
            return None

        try:
            # ON CONFLICT sur transfermarkt_id — idempotence garantie
            result = sb.upsert("clubs", [row], on_conflict="transfermarkt_id")
            if result and len(result) > 0:
                inserted_count += 1
                return result[0]["id"]
        except Exception as e:
            print(f"    ! UPSERT club failed ({tm_club.name}): {e}", file=sys.stderr)
            stats["errors_count"] += 1
            stats["error_details"].append({
                "club_name": tm_club.name,
                "tm_id": tm_club.transfermarkt_id,
                "error": f"{type(e).__name__}: {e}",
            })
        return None

    # 4a. Clubs avec TM ID connu → fetch direct
    total_with_id = len(clubs_by_tmid)
    for idx, (tm_id, club_name) in enumerate(clubs_by_tmid.items(), 1):
        print(f"  [{idx:>3}/{total_with_id}] TM {tm_id:>6} — {club_name}", end=" ... ")
        try:
            # Si déjà en base et pas force-resync → on skip le fetch TM
            # mais on upsert quand même pour mettre à jour les métadonnées
            if tm_id in existing_tm_ids and not args.force_resync:
                print("déjà en base (skip fetch TM)")
                continue

            url = f"{TM_BASE}/-/startseite/verein/{tm_id}"
            html = tm_get(url, session, last_request_at)
            if not html:
                print("fetch échoué — skip")
                unmatched_count += 1
                stats["unmatched_clubs"].append({
                    "club_name": club_name, "tm_id": tm_id, "reason": "fetch_failed"
                })
                continue

            tm_club = parse_club_page(tm_id, html)
            # Le nom TM est plus fiable que celui dans players.current_club
            # (encodage correct, accents, etc.) — on le préfère.
            print(f"OK → {tm_club.name} [{tm_club.country_code or '?'}] comp={tm_club.tm_competition_id or '?'}")

            upsert_club(tm_club)
            stats["candidates_discovered"] += 1

        except RuntimeError as e:
            # Ban TM → arrêt immédiat pour ne pas aggraver la situation
            print(f"\n!!! BAN SIGNAL: {e}")
            stats["error_details"].append({"global_error": str(e)})
            stats["errors_count"] += 1
            break
        except Exception as e:
            print(f"ERREUR: {e}")
            stats["errors_count"] += 1
            stats["error_details"].append({
                "club_name": club_name,
                "tm_id": tm_id,
                "error": f"{type(e).__name__}: {e}",
                "traceback": traceback.format_exc()[-400:],
            })

    # 4b. Clubs sans TM ID → tentative de recherche (sauf si --no-search)
    if not args.no_search and clubs_without_id:
        print(f"\n  Recherche TM pour les {len(clubs_without_id)} clubs sans ID...")
        total_without = len(clubs_without_id)
        for idx, (nn, original_name) in enumerate(clubs_without_id.items(), 1):
            print(f"  [{idx:>3}/{total_without}] Search: {original_name}", end=" ... ")

            # Skip si déjà en base par nom normalisé
            if nn in existing_normalized and not args.force_resync:
                print("déjà en base (skip search)")
                continue

            try:
                found_id = search_club_tm(original_name, session, last_request_at)
                if not found_id:
                    print("non trouvé → unmatched")
                    unmatched_count += 1
                    stats["unmatched_clubs"].append({
                        "club_name": original_name, "tm_id": None, "reason": "no_search_result"
                    })
                    continue

                # On a un ID → fetch le profil complet
                url = f"{TM_BASE}/-/startseite/verein/{found_id}"
                html = tm_get(url, session, last_request_at)
                if not html:
                    print(f"ID trouvé ({found_id}) mais fetch profil échoué → unmatched")
                    unmatched_count += 1
                    stats["unmatched_clubs"].append({
                        "club_name": original_name, "tm_id": found_id, "reason": "profile_fetch_failed"
                    })
                    continue

                tm_club = parse_club_page(found_id, html)
                print(f"OK → {tm_club.name} (TM {found_id})")
                upsert_club(tm_club)
                stats["candidates_discovered"] += 1

            except RuntimeError as e:
                print(f"\n!!! BAN SIGNAL: {e}")
                stats["error_details"].append({"global_error": str(e)})
                stats["errors_count"] += 1
                break
            except Exception as e:
                print(f"ERREUR: {e}")
                stats["errors_count"] += 1
                stats["error_details"].append({
                    "club_name": original_name,
                    "error": f"{type(e).__name__}: {e}",
                    "traceback": traceback.format_exc()[-400:],
                })

    elif args.no_search and clubs_without_id:
        print(f"\n  {len(clubs_without_id)} clubs sans ID ignorés (--no-search actif)")
        for nn, original_name in clubs_without_id.items():
            stats["unmatched_clubs"].append({
                "club_name": original_name, "tm_id": None, "reason": "no_search_flag"
            })
        unmatched_count = len(clubs_without_id)

    print(f"\n  Clubs upserted : {inserted_count}")
    print(f"  Unmatched      : {unmatched_count}")

    # ── 5. Backfill players.current_club_fk ──────────────────────────────────
    print("\n[5/5] Backfill players.current_club_fk...")

    if not dry:
        # Recharger la table clubs après les upserts pour avoir tous les IDs
        clubs_in_db = sb.select("clubs", select="id,transfermarkt_id")
        # Index clubs par transfermarkt_id pour lookup O(1)
        club_id_by_tmid: dict[str, int] = {
            c["transfermarkt_id"].strip(): c["id"]
            for c in clubs_in_db
            if c.get("transfermarkt_id")
        }

        updated_players = 0
        # Pour chaque joueur qui a un current_club_id TEXT et un TM ID matchable
        for p in all_players:
            tm_id_text = (p.get("current_club_id") or "").strip()
            if not tm_id_text:
                continue
            club_db_id = club_id_by_tmid.get(tm_id_text)
            if not club_db_id:
                continue
            # Poser la FK numérique
            sb.update(
                "players",
                {"id": f"eq.{p['id']}"},
                {"current_club_fk": club_db_id},
            )
            updated_players += 1

        stats["players_updated"] = updated_players
        print(f"  players.current_club_fk posé : {updated_players} joueurs")
    else:
        # En dry-run : simuler le backfill et afficher les stats prévisionnelles
        clubs_in_db = sb.select("clubs", select="id,transfermarkt_id")
        club_id_by_tmid_dry: dict[str, int] = {
            c["transfermarkt_id"].strip(): c["id"]
            for c in clubs_in_db
            if c.get("transfermarkt_id")
        }
        matchable = sum(
            1 for p in all_players
            if (p.get("current_club_id") or "").strip() in club_id_by_tmid_dry
        )
        print(f"  [dry-run] {matchable} joueurs matchables (FK non écrite)")

    # ── 6. Log sync_logs ──────────────────────────────────────────────────────
    finished_at = dt.datetime.utcnow()
    duration_s = int((finished_at - started_at).total_seconds())

    if stats["errors_count"] == 0:
        log_status = "success"
    elif stats["candidates_discovered"] > 0 or stats["players_updated"] > 0:
        log_status = "partial"
    else:
        log_status = "failure"

    # error_details peut grossir si beaucoup de clubs — on tronque à 50
    trimmed_errors = stats["error_details"][:50]
    # On ajoute aussi le résumé des unmatched clubs (sans traceback, juste les noms)
    unmatched_summary = stats["unmatched_clubs"][:50]

    log_row = {
        "job_name": JOB_NAME,
        "status": log_status,
        "players_processed": stats["players_processed"],
        "players_updated": stats["players_updated"],
        "candidates_discovered": stats["candidates_discovered"],
        "errors_count": stats["errors_count"],
        "error_details": {
            "errors": trimmed_errors,
            "unmatched_clubs": unmatched_summary,
            "unmatched_count": unmatched_count,
        },
        "started_at": started_at.isoformat() + "Z",
        "finished_at": finished_at.isoformat() + "Z",
        "duration_seconds": duration_s,
        "github_run_url": os.environ.get("GITHUB_RUN_URL"),
    }

    if not dry:
        sb.insert("sync_logs", log_row)
    else:
        print(f"\n  [dry-run] sync_logs (non écrit) : {json.dumps(log_row, indent=2, default=str)[:500]}")

    # ── Récap final ───────────────────────────────────────────────────────────
    print(f"\n=== Récap ===")
    print(f"Status            : {log_status}")
    print(f"Joueurs scannés   : {stats['players_processed']}")
    print(f"Joueurs mis à jour: {stats['players_updated']}")
    print(f"Clubs upserted    : {stats['candidates_discovered']}")
    print(f"Unmatched         : {unmatched_count}")
    print(f"Erreurs           : {stats['errors_count']}")
    print(f"Durée             : {duration_s}s")

    if unmatched_count > 0:
        print(f"\nClubs non matchés (extrait) :")
        for u in stats["unmatched_clubs"][:10]:
            print(f"  - {u['club_name']} [{u['reason']}]")
        if unmatched_count > 10:
            print(f"  ... et {unmatched_count - 10} autres (voir sync_logs.error_details)")

    sys.exit(1 if log_status == "failure" else 0)


if __name__ == "__main__":
    main()
