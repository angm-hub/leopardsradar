"""
source_understat.py — Stats via l'endpoint AJAX Understat.

Refactoring de sync_understat.py pour s'integrer dans le pipeline multi-source.
Understat couvre 6 ligues Big 5 + RFPL. Tres fiable pour xG/xA.

Contrainte : matching par nom uniquement (pas d'ID stable pour le lookup).
On retourne la liste de stats pour le joueur si le nom matche.
"""

from __future__ import annotations

import re
import time
import unicodedata
from typing import Optional

import requests

SEASON_UNDERSTAT = "2025"   # Understat note la saison par l'annee de debut
TARGET_SEASON = "2025-2026"
RATE_LIMIT_SEC = 2.0

LEAGUES = [
    ("EPL",        "Premier League", 1),
    ("La_Liga",    "La Liga",        1),
    ("Bundesliga", "Bundesliga",     1),
    ("Serie_A",    "Serie A",        1),
    ("Ligue_1",    "Ligue 1",        1),
    ("RFPL",       "RFPL",           2),
]

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

_cache: dict[str, list[dict]] = {}   # league_code -> players list
_last_at: float = 0.0


def _normalize_name(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s)
    no_acc = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Z0-9 ]+", " ", no_acc.lower())).strip()


def _fetch_league(code: str) -> list[dict]:
    """Fetch la liste complete des joueurs d'une ligue Understat (cached)."""
    global _last_at
    if code in _cache:
        return _cache[code]

    elapsed = time.time() - _last_at
    if elapsed < RATE_LIMIT_SEC:
        time.sleep(RATE_LIMIT_SEC - elapsed)

    try:
        r = requests.post(
            "https://understat.com/main/getPlayersStats/",
            data=f"league={code}&season={SEASON_UNDERSTAT}",
            headers={
                "User-Agent": USER_AGENT,
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": f"https://understat.com/league/{code}/{SEASON_UNDERSTAT}",
            },
            timeout=30,
        )
        _last_at = time.time()
        if r.status_code != 200:
            print(f"  [understat] {code} HTTP {r.status_code}")
            _cache[code] = []
            return []
        data = r.json()
        players = data.get("players", []) if data.get("success") else []
        _cache[code] = players
        return players
    except Exception as exc:
        print(f"  [understat] {code} error: {exc}")
        _cache[code] = []
        return []


def fetch(player: dict) -> list[dict]:
    """
    Cherche le joueur dans Understat par matching de nom.

    Retourne une liste avec au maximum une entry par ligue trouvee.
    Si le joueur est dans plusieurs ligues (improbable mais possible),
    on retourne toutes les entries.
    """
    name = player.get("name", "")
    if not name:
        return []

    name_norm = _normalize_name(name)
    out = []

    for code, league_name, tier in LEAGUES:
        players = _fetch_league(code)
        for up in players:
            up_name = up.get("player_name", "")
            if _normalize_name(up_name) == name_norm:
                def to_int(s) -> Optional[int]:
                    try: return int(str(s)) if s not in (None, "") else None
                    except (ValueError, TypeError): return None

                def to_float(s) -> Optional[float]:
                    try: return float(str(s)) if s not in (None, "") else None
                    except (ValueError, TypeError): return None

                goals   = to_int(up.get("goals"))
                assists = to_int(up.get("assists"))
                apps    = to_int(up.get("games"))
                mins    = to_int(up.get("time"))
                xg      = to_float(up.get("xG"))
                xa      = to_float(up.get("xA"))

                has_core = all(v is not None for v in [goals, assists, apps, mins])
                confidence = "HIGH" if has_core else "MEDIUM"

                out.append({
                    "source":           "understat",
                    "season":           TARGET_SEASON,
                    "competition":      league_name,
                    "competition_tier": tier,
                    "matches_played":   apps,
                    "minutes_played":   mins,
                    "goals":            goals,
                    "assists":          assists,
                    "xg":               xg,
                    "xa":               xa,
                    "yellow_cards":     None,   # Understat ne fournit pas les cartons
                    "red_cards":        None,
                    "source_url":       f"https://understat.com/player/{up.get('id','')}",
                    "confidence":       confidence,
                })
                # Un joueur = un club = une ligue (sauf transfers)
                # On continue quand meme pour les autres ligues au cas ou.
                break

    if out:
        print(f"  [understat] {len(out)} match(es) pour {name}")
    else:
        print(f"  [understat] not found: {name} (Big5+RFPL seulement)")

    return out
