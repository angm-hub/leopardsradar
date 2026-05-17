"""
source_sofascore.py — Stats club via l'API JSON publique de Sofascore.

Sofascore expose une API JSON non documentee mais stable.
Elle couvre presque tous les championnats mondiaux, y compris les ligues
africaines et "exotiques" absentes de FBRef.

Endpoint principal :
  https://api.sofascore.com/api/v1/player/{sofascore_id}/statistics/seasons

Retourne les stats aggregees de toutes les saisons du joueur.
On filtre sur la saison 2025 (id Sofascore) ou le label "25/26".

Strategy :
  1. Si player.sofascore_id connu : fetch direct
  2. Sinon : recherche par nom via l'API de search
     https://api.sofascore.com/api/v1/search/players?q={name}

Politique d'utilisation : API publique, non documentee. On respecte
3 sec de rate-limit (plus prudent que FBRef vu que pas de CF challenge).
Pas de cle requise, mais on set un UA realiste.

Confidence : HIGH si goals+assists+minutes tous presents. MEDIUM sinon.
"""

from __future__ import annotations

import re
import time
import unicodedata
from typing import Optional
from urllib.parse import quote_plus

import requests

TARGET_TOURNAMENT_SEASONS = ["25/26", "2025/2026", "2025-26"]
RATE_LIMIT_SEC = 3.0
BASE_API = "https://api.sofascore.com/api/v1"

TIER_BY_LEAGUE: dict[str, int] = {
    "premier league": 1, "la liga": 1, "bundesliga": 1, "serie a": 1, "ligue 1": 1,
    "champions league": 1, "europa league": 2, "conference league": 3,
    "pro league": 2, "eredivisie": 2, "primeira liga": 2, "super lig": 2,
    "championship": 3, "ligue 2": 3, "serie b": 3, "2. bundesliga": 3,
    "mls": 3, "saudi pro league": 3,
    "linafoot": 4, "botola pro": 4, "egyptian premier league": 4,
    "prime minister cup egypt": 4, "israel premier league": 4,
    "1. liga israel": 4, "first division cyprus": 4,
}

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"

_session: Optional[requests.Session] = None
_last_at: float = 0.0


def _get_session() -> requests.Session:
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update({
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.sofascore.com/",
            "Origin": "https://www.sofascore.com",
        })
    return _session


def _get_json(path: str) -> Optional[dict]:
    global _last_at
    elapsed = time.time() - _last_at
    if elapsed < RATE_LIMIT_SEC:
        time.sleep(RATE_LIMIT_SEC - elapsed)

    url = f"{BASE_API}{path}"
    sess = _get_session()
    try:
        r = sess.get(url, timeout=20)
        _last_at = time.time()
        if r.status_code == 200:
            return r.json()
        elif r.status_code == 404:
            return None
        elif r.status_code in (429, 503):
            print(f"  [sofascore] rate limited: HTTP {r.status_code} — waiting 15s")
            time.sleep(15)
            return None
        else:
            print(f"  [sofascore] HTTP {r.status_code} {url}")
            return None
    except (requests.RequestException, ValueError) as exc:
        print(f"  [sofascore] error {url}: {exc}")
        return None


def _normalize_name(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s)
    no_acc = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", no_acc.lower())).strip()


def _search_player_id(name: str, dob: Optional[str] = None) -> Optional[str]:
    """
    Recherche un joueur par nom sur Sofascore.
    Retourne son sofascore_id (string) ou None.

    Si dob est donne (format YYYY-MM-DD), on l'utilise comme tie-breaker
    quand plusieurs joueurs ont le meme nom.
    """
    data = _get_json(f"/search/players?q={quote_plus(name)}")
    if not data:
        return None

    players_raw = data.get("players", [])
    if not players_raw:
        return None

    name_norm = _normalize_name(name)
    best_id: Optional[str] = None
    best_score = 0

    for p in players_raw:
        p_name = p.get("name", "") or ""
        p_norm = _normalize_name(p_name)
        name_words = set(name_norm.split())
        p_words = set(p_norm.split())
        common = name_words & p_words
        score = len(common) / max(len(name_words), 1)

        # Bonus si DOB match
        if dob and p.get("dateOfBirthTimestamp"):
            import datetime
            ts = p["dateOfBirthTimestamp"]
            p_dob = datetime.datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
            if p_dob == dob:
                score += 0.5

        if score > best_score:
            best_score = score
            best_id = str(p.get("id", ""))

    # Seuil de confiance minimum
    if best_score < 0.6:
        return None

    return best_id


def fetch(player: dict) -> list[dict]:
    """
    Scrape Sofascore pour les stats 2025/26 du joueur.

    player doit avoir 'sofascore_id' (direct) ou 'name' (recherche auto).
    Retourne [] si rien trouve ou si le joueur n'a pas de stats 25/26.
    """
    sofascore_id = player.get("sofascore_id")
    name = player.get("name", "")

    if not sofascore_id:
        if not name:
            return []
        print(f"  [sofascore] searching for {name}")
        dob = player.get("date_of_birth")
        sofascore_id = _search_player_id(name, dob)
        if not sofascore_id:
            print(f"  [sofascore] not found: {name}")
            return []
        print(f"  [sofascore] found id={sofascore_id} for {name}")

    # Fetch les statistiques par saison
    data = _get_json(f"/player/{sofascore_id}/statistics/seasons")
    if not data:
        return []

    seasons_data = data.get("statistics", []) or data.get("data", [])
    if not seasons_data:
        # Try alternate endpoint
        alt = _get_json(f"/player/{sofascore_id}/unique-tournament-statistics")
        if not alt:
            return []
        seasons_data = alt.get("statistics", []) or []

    out = []

    for season_block in seasons_data:
        # La structure varie selon l'endpoint. On cherche le label de saison.
        season_name = ""
        # Cas 1 : {season: {year: "25/26"}} ou {season: {name: "2025/2026"}}
        if isinstance(season_block.get("season"), dict):
            s = season_block["season"]
            season_name = s.get("year", "") or s.get("name", "")
        # Cas 2 : {seasonName: "25/26"}
        season_name = season_name or season_block.get("seasonName", "") or season_block.get("year", "")

        # Filtre sur la saison cible
        if not any(lbl in season_name for lbl in TARGET_TOURNAMENT_SEASONS):
            continue

        # Competition name
        comp_name = ""
        if isinstance(season_block.get("tournament"), dict):
            comp_name = season_block["tournament"].get("name", "")
        elif isinstance(season_block.get("uniqueTournament"), dict):
            comp_name = season_block["uniqueTournament"].get("name", "")
        comp_name = comp_name or season_block.get("tournamentName", "Unknown")

        # Stats
        stats = season_block.get("statistics", {})
        if not stats:
            stats = season_block  # dans certains endpoints les stats sont directement dans le bloc

        def to_int(key: str) -> Optional[int]:
            v = stats.get(key)
            if v is None:
                return None
            try:
                return int(v)
            except (ValueError, TypeError):
                return None

        def to_float(key: str) -> Optional[float]:
            v = stats.get(key)
            if v is None:
                return None
            try:
                return float(v)
            except (ValueError, TypeError):
                return None

        goals   = to_int("goals")
        assists = to_int("assists")
        apps    = to_int("appearances") or to_int("matches")
        mins    = to_int("minutesPlayed")
        yellow  = to_int("yellowCards")
        red     = to_int("redCards")
        xg      = to_float("expectedGoals") or to_float("xg")
        xa      = to_float("expectedAssists") or to_float("xa")

        comp_lower = comp_name.lower()
        tier = next(
            (v for k, v in TIER_BY_LEAGUE.items() if k in comp_lower),
            4,
        )

        has_core = all(v is not None for v in [goals, assists, apps])
        confidence = "HIGH" if (has_core and mins is not None) else ("MEDIUM" if has_core else "LOW")

        if apps is not None and comp_name:
            source_url = f"https://www.sofascore.com/player/{sofascore_id}"
            out.append({
                "source":           "sofascore",
                "season":           "2025-2026",
                "competition":      comp_name,
                "competition_tier": tier,
                "matches_played":   apps,
                "minutes_played":   mins,
                "goals":            goals,
                "assists":          assists,
                "xg":               xg,
                "xa":               xa,
                "yellow_cards":     yellow,
                "red_cards":        red,
                "source_url":       source_url,
                "confidence":       confidence,
            })

    if out:
        print(f"  [sofascore] {len(out)} competitions pour {name} (id={sofascore_id})")
    else:
        print(f"  [sofascore] no 25/26 data pour {name} (id={sofascore_id})")

    return out
