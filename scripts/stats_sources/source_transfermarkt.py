"""
source_transfermarkt.py — Stats club via la page /leistungsdaten/ de Transfermarkt.

URL pattern :
  https://www.transfermarkt.com/{slug}/leistungsdaten/spieler/{tm_id}/plus/1

La page /leistungsdaten/ liste toutes les saisons et competitions du joueur
avec G/A/apps/minutes/cards par competition — sans xG (TM ne fournit pas xG).
On filtre la saison 2025-2026.

Anti-bot : TM utilise Cloudflare mais avec une rotation d'UA et 3s de rate-limit
les requetes requests passent generalement. On utilise requests (pas Playwright)
pour rester dans les limites de la session FBRef (Playwright est reserve a FBRef).

Confidence : MEDIUM (pas de xG). HIGH si goals+assists+minutes sont tous presents.
"""

from __future__ import annotations

import random
import re
import time
from typing import Optional

import requests
from bs4 import BeautifulSoup

SEASON_LABEL = "25/26"  # Format affiche par TM dans le tableau
TARGET_SEASON = "2025-2026"

RATE_LIMIT_SEC = 3.0
BASE = "https://www.transfermarkt.com"

TIER_BY_LEAGUE: dict[str, int] = {
    "premier league": 1, "la liga": 1, "bundesliga": 1, "serie a": 1, "ligue 1": 1,
    "champions league": 1, "europa league": 2, "conference league": 3,
    "pro league": 2, "eredivisie": 2, "primeira liga": 2, "super lig": 2,
    "championship": 3, "ligue 2": 3, "serie b": 3, "2. bundesliga": 3,
    "mls": 3, "saudi pro league": 3,
    "linafoot": 4, "botola pro": 4, "egyptian premier league": 4,
    "israeli premier league": 4, "cypriot first division": 4,
}

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
]

_last_request_at: float = 0.0


def _get_html(url: str, session: Optional[requests.Session] = None) -> Optional[str]:
    global _last_request_at
    elapsed = time.time() - _last_request_at
    if elapsed < RATE_LIMIT_SEC:
        time.sleep(RATE_LIMIT_SEC - elapsed)

    sess = session or requests.Session()
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
    }
    try:
        r = sess.get(url, headers=headers, timeout=20)
        _last_request_at = time.time()
        if r.status_code == 200:
            return r.text
        elif r.status_code == 404:
            print(f"  [tm_stats] 404 {url}")
            return None
        elif r.status_code in (403, 429):
            print(f"  [tm_stats] BAN {r.status_code} — stopping TM source")
            raise RuntimeError(f"Transfermarkt ban signal: HTTP {r.status_code}")
        else:
            print(f"  [tm_stats] HTTP {r.status_code} {url}")
            return None
    except RuntimeError:
        raise
    except requests.RequestException as exc:
        print(f"  [tm_stats] network error {url}: {exc}")
        return None


def _parse_int(s: str) -> Optional[int]:
    if not s or s in ("-", "—", ".", ""):
        return None
    # TM utilise '.' comme separateur de milliers en anglais, ',' en allemand
    cleaned = s.strip().replace(".", "").replace(",", "").replace("'", "")
    try:
        return int(cleaned)
    except ValueError:
        return None


def _parse_minutes(s: str) -> Optional[int]:
    """Parse '1.234' ou '1,234' ou '90' → int minutes."""
    if not s or s in ("-", "—", ".", ""):
        return None
    cleaned = s.strip().replace(".", "").replace(",", "").replace("'", "").replace("’", "")
    try:
        return int(cleaned)
    except ValueError:
        return None


def fetch(player: dict, session: Optional[requests.Session] = None) -> list[dict]:
    """
    Scrape la page /leistungsdaten/ de TM pour le joueur.

    Retourne une liste de dicts normalises (une par competition 25/26)
    ou [] si tm_id absent ou parsing echoue.
    """
    tm_id = player.get("transfermarkt_id")
    if not tm_id:
        return []

    # Avec slug "-" TM fait un 301 vers la bonne URL canonique
    url = f"{BASE}/-/leistungsdaten/spieler/{tm_id}/plus/1"
    html = _get_html(url, session)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")

    # TM /leistungsdaten/ structure :
    # <table class="items"> avec des lignes groupees par saison.
    # Chaque groupe saison a un <tr class="..."> avec la saison dans la 1re cellule.
    # Les rows competition dans ce groupe ont 1 cellule de season vide.
    #
    # Strategy : parcourir toutes les <tr> du tableau, detecter les pivots de
    # saison (cellule contenant "25/26"), collecter les rows competition suivantes
    # jusqu'au prochain pivot.

    out = []
    table = soup.select_one("table.items")
    if not table:
        print(f"  [tm_stats] no items table for TM {tm_id}")
        return []

    in_target_season = False

    for tr in table.select("tbody tr"):
        cells = tr.find_all("td")
        if not cells:
            continue

        # Detecter le pivot de saison (premiere cellule = "25/26")
        first_text = cells[0].get_text(strip=True)
        if SEASON_LABEL in first_text:
            in_target_season = True
            continue
        # Si on rencontre un autre label saison type "24/25", on sort
        if in_target_season and re.match(r"\d{2}/\d{2}", first_text):
            break

        if not in_target_season:
            continue

        # Row competition : extraire les stats
        # Ordre typique des colonnes TM /leistungsdaten/ :
        # [0]=vide (season) [1]=competition_img+nom [2]=club [3]=apps [4]=goals
        # [5]=assists [6]=own_goals [7]=sub_in [8]=sub_out [9]=yellow
        # [10]=yellow_red [11]=red [12]=minutes_played
        # (peut varier selon la page — on utilise les data-stat quand dispo,
        # sinon positionnement)

        if len(cells) < 6:
            continue

        # Competition name — dans la cellule avec un lien de competition
        comp_name = ""
        for cell in cells:
            links = cell.select("a[href*='/wettbewerb/']")
            if links:
                comp_name = links[0].get_text(strip=True)
                break
        if not comp_name:
            continue  # pas une row competition

        # Selon le layout reel, les stats sont en position variable.
        # On se base sur les 12 dernieres colonnes pour extraire dans l'ordre.
        # TM a typiquement 12 colonnes de stats hors competition+club.
        # On cible par position relative en repartant de la fin.
        # Positions (0-indexed depuis la fin) :
        #   -1 = minutes, -3 = red, -4 = yellow_red, -5 = yellow
        #   -7 = sub_out, -8 = sub_in, -9 = own_goals
        #   -10 = assists (parfois), -11 = goals, -12 = apps
        # Ces offsets sont frag iles si TM ajoute des colonnes.
        # On parse d'abord apps/goals/assists dans l'ordre croissant d'index.

        n = len(cells)
        # La colonne apps est generalement la 4e (index 3) apres [season][comp][club]
        def text_at(idx: int) -> str:
            return cells[idx].get_text(strip=True) if 0 <= idx < n else ""

        apps     = _parse_int(text_at(3))
        goals    = _parse_int(text_at(4))
        assists  = _parse_int(text_at(5))
        # yellow et red sont vers la fin du tableau
        yellow   = _parse_int(text_at(n - 5))
        red      = _parse_int(text_at(n - 3))
        minutes  = _parse_minutes(text_at(n - 1))

        comp_lower = comp_name.lower()
        tier = next(
            (v for k, v in TIER_BY_LEAGUE.items() if k in comp_lower),
            4,
        )

        has_core = all(v is not None for v in [goals, assists, minutes, apps])
        confidence = "HIGH" if has_core else "MEDIUM"

        out.append({
            "source":           "transfermarkt",
            "season":           TARGET_SEASON,
            "competition":      comp_name,
            "competition_tier": tier,
            "matches_played":   apps,
            "minutes_played":   minutes,
            "goals":            goals,
            "assists":          assists,
            "xg":               None,   # TM ne fournit pas xG
            "xa":               None,
            "yellow_cards":     yellow,
            "red_cards":        red,
            "source_url":       url,
            "confidence":       confidence,
        })

    if out:
        print(f"  [tm_stats] {len(out)} competitions pour TM {tm_id} ({player.get('name')})")
    else:
        print(f"  [tm_stats] no 25/26 data pour TM {tm_id} ({player.get('name')})")

    return out
