"""
source_soccerway.py — Stats club via Soccerway.

Soccerway couvre tres bien les ligues africaines, le Proche-Orient et les
championnats "exotiques" absents de FBRef (Egypte, Chypre, Israel, Linafoot).
Utile comme fallback pour les joueurs qui ne matchent pas sur FBRef.

Strategy : fetch la page du joueur via son slug Soccerway ou en cherchant
par nom sur le moteur de recherche interne.

URL pattern :
  https://int.soccerway.com/players/{slug}/{id}/

Ou via la recherche :
  https://int.soccerway.com/search/?q={nom}

Stats : apps / goals / assists / yellow / red par competition.
Pas de xG — Soccerway ne fournit pas de stats avancees.

Confidence : MEDIUM (pas de xG, parsing plus fragile que FBRef).
"""

from __future__ import annotations

import random
import re
import time
import unicodedata
from typing import Optional
from urllib.parse import urljoin, quote_plus

import requests
from bs4 import BeautifulSoup

TARGET_SEASON_LABELS = ["2025/2026", "2025-2026", "25/26", "2025"]
BASE = "https://int.soccerway.com"
RATE_LIMIT_SEC = 3.0

TIER_BY_LEAGUE: dict[str, int] = {
    "premier league": 1, "la liga": 1, "bundesliga": 1, "serie a": 1, "ligue 1": 1,
    "champions league": 1, "europa league": 2, "conference league": 3,
    "pro league": 2, "eredivisie": 2, "primeira liga": 2, "super lig": 2,
    "championship": 3, "ligue 2": 3, "serie b": 3, "2. bundesliga": 3,
    "mls": 3, "saudi pro league": 3,
    "linafoot": 4, "botola pro": 4, "egyptian premier league": 4,
    "premier league egypt": 4, "1. liga israel": 4,
    "first division cyprus": 4, "cypriot first division": 4,
}

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
]

_session: Optional[requests.Session] = None
_last_at: float = 0.0


def _get_session() -> requests.Session:
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update({
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
        })
    return _session


def _get(url: str) -> Optional[str]:
    global _last_at
    elapsed = time.time() - _last_at
    if elapsed < RATE_LIMIT_SEC:
        time.sleep(RATE_LIMIT_SEC - elapsed)
    sess = _get_session()
    sess.headers["User-Agent"] = random.choice(USER_AGENTS)
    try:
        r = sess.get(url, timeout=20)
        _last_at = time.time()
        if r.status_code == 200:
            return r.text
        elif r.status_code == 404:
            return None
        elif r.status_code in (403, 429, 503):
            print(f"  [sw] rate limited / blocked: HTTP {r.status_code}")
            time.sleep(10)
            return None
        else:
            print(f"  [sw] HTTP {r.status_code} {url}")
            return None
    except requests.RequestException as exc:
        print(f"  [sw] network error {url}: {exc}")
        return None


def _normalize_name(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s)
    no_acc = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", no_acc.lower())).strip()


def _parse_int(s: str) -> Optional[int]:
    if not s or s in ("-", "—", "0-0"):
        return None
    try:
        return int(s.strip().replace(",", ""))
    except ValueError:
        return None


def _search_player(name: str) -> Optional[str]:
    """Cherche le joueur sur Soccerway et retourne l'URL de sa page."""
    url = f"{BASE}/search/?q={quote_plus(name)}"
    html = _get(url)
    if not html:
        return None
    soup = BeautifulSoup(html, "html.parser")
    # Les resultats de recherche sont dans des liens /players/{slug}/{id}
    name_norm = _normalize_name(name)
    for link in soup.select('a[href*="/players/"]'):
        href = link.get("href", "")
        if not re.search(r"/players/[^/]+/\d+/", href):
            continue
        link_text = _normalize_name(link.get_text(strip=True))
        # Match flou : au moins 60% des mots du nom retrouves
        name_words = set(name_norm.split())
        link_words = set(link_text.split())
        if len(name_words & link_words) >= max(1, len(name_words) * 0.6):
            return urljoin(BASE, href)
    return None


def _parse_player_page(html: str, player_url: str) -> list[dict]:
    """Parse la page joueur Soccerway et retourne les stats 2025/26."""
    soup = BeautifulSoup(html, "html.parser")
    out = []

    # Tableau de stats : cherche les tableaux avec les colonnes competition / saison
    # Soccerway a un tableau "appearances" par competition
    for table in soup.select("table.playerstats"):
        rows = table.select("tr")
        if not rows:
            continue

        for tr in rows:
            cells = tr.find_all("td")
            if len(cells) < 4:
                continue

            # Colonne saison : souvent la 2e ou 3e cellule
            season_text = ""
            for i, cell in enumerate(cells[:3]):
                ct = cell.get_text(strip=True)
                if any(lbl in ct for lbl in TARGET_SEASON_LABELS):
                    season_text = ct
                    break
            if not season_text:
                continue

            # Competition : en general dans un lien ou la cellule precedent la saison
            comp_name = ""
            comp_cell = cells[0]
            comp_link = comp_cell.select_one("a")
            if comp_link:
                comp_name = comp_link.get_text(strip=True)
            else:
                comp_name = comp_cell.get_text(strip=True)

            # Stats dans les cellules suivantes (ordre Soccerway variable)
            # On cherche Apps / Goals / Assists / Yellow / Red par position
            n = len(cells)
            apps    = _parse_int(cells[3].get_text(strip=True)) if n > 3 else None
            goals   = _parse_int(cells[4].get_text(strip=True)) if n > 4 else None
            assists = _parse_int(cells[5].get_text(strip=True)) if n > 5 else None
            yellow  = _parse_int(cells[-3].get_text(strip=True)) if n > 6 else None
            red     = _parse_int(cells[-1].get_text(strip=True)) if n > 6 else None

            comp_lower = comp_name.lower()
            tier = next(
                (v for k, v in TIER_BY_LEAGUE.items() if k in comp_lower),
                4,
            )

            has_core = all(v is not None for v in [goals, assists, apps])
            confidence = "MEDIUM" if has_core else "LOW"

            if comp_name and apps is not None:
                out.append({
                    "source":           "soccerway",
                    "season":           "2025-2026",
                    "competition":      comp_name,
                    "competition_tier": tier,
                    "matches_played":   apps,
                    "minutes_played":   None,   # SW n'affiche pas les minutes par defaut
                    "goals":            goals,
                    "assists":          assists,
                    "xg":               None,
                    "xa":               None,
                    "yellow_cards":     yellow,
                    "red_cards":        red,
                    "source_url":       player_url,
                    "confidence":       confidence,
                })

    return out


def fetch(player: dict) -> list[dict]:
    """
    Scrape Soccerway pour les stats 2025/26 du joueur.

    Prerequis : player doit avoir 'soccerway_url' ou 'name' pour la recherche.
    Retourne [] si rien trouve.
    """
    soccerway_url = player.get("soccerway_url")

    if not soccerway_url:
        name = player.get("name", "")
        if not name:
            return []
        print(f"  [sw] searching for {name}")
        soccerway_url = _search_player(name)
        if not soccerway_url:
            print(f"  [sw] player not found: {name}")
            return []

    html = _get(soccerway_url)
    if not html:
        return []

    results = _parse_player_page(html, soccerway_url)
    if results:
        print(f"  [sw] {len(results)} competitions pour {player.get('name')}")
    else:
        print(f"  [sw] no 25/26 data pour {player.get('name')} ({soccerway_url})")

    return results
