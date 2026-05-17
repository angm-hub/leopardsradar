"""
source_fbref.py — Scraper FBRef via Playwright (Cloudflare bypass).

Refactoring du sync_fbref_stats.py existant pour s'integrer dans le
pipeline multi-source. Le context Playwright est cree et passe en parametre
par l'orchestrateur sync_stats_multi.py (session partagee = moins de
Cloudflare challenges).

Retourne une liste de dicts (une par competition) ou [] si rien trouve.
"""

from __future__ import annotations

import re
import time
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from playwright.sync_api import Page

SEASON = "2025-2026"
DELAY_SEC = 2
CF_WAIT_MS = 30_000
PAGE_TIMEOUT_MS = 45_000

TIER_BY_LEAGUE: dict[str, int] = {
    "Premier League": 1, "La Liga": 1, "Bundesliga": 1, "Serie A": 1, "Ligue 1": 1,
    "Champions League": 1, "Europa League": 2, "Conference League": 3,
    "Pro League": 2, "Eredivisie": 2, "Primeira Liga": 2, "Super Lig": 2,
    "Championship": 3, "Ligue 2": 3, "Serie B": 3, "Segunda Division": 3,
    "2. Bundesliga": 3, "MLS": 3, "Saudi Pro League": 3,
    "Linafoot": 4, "Botola Pro": 4, "Egyptian Premier League": 4,
    "Israeli Premier League": 4, "Cypriot First Division": 4,
}

EXTRACT_JS = """
(season) => {
  const std = document.querySelector('table#stats_standard_dom_lg')
           || document.querySelector('table#stats_standard');
  if (!std) return { rows: [], reason: 'no_table' };

  const out = [];
  for (const tr of std.querySelectorAll('tbody tr')) {
    const yearCell = tr.querySelector('th[data-stat="year_id"], th[data-stat="season"]');
    if (!yearCell || yearCell.textContent.trim() !== season) continue;

    const cell = (s) => {
      const c = tr.querySelector(`td[data-stat="${s}"]`);
      return c ? c.textContent.trim() : '';
    };
    out.push({
      season,
      competition: cell('comp_level') || cell('comp_name') || cell('comp'),
      games:       cell('games'),
      minutes:     cell('minutes'),
      goals:       cell('goals'),
      assists:     cell('assists'),
      xg:          cell('xg'),
      xag:         cell('xg_assist'),
      yellow:      cell('cards_yellow'),
      red:         cell('cards_red'),
    });
  }
  return { rows: out, reason: out.length === 0 ? 'no_season_row' : 'ok' };
}
"""


def _parse_int(s: str) -> Optional[int]:
    if not s or s in ("—", "-"):
        return None
    try:
        return int(s.strip().replace(",", "").replace(" ", ""))
    except ValueError:
        return None


def _parse_float(s: str) -> Optional[float]:
    if not s or s in ("—", "-"):
        return None
    try:
        return float(s.strip().replace(",", ""))
    except ValueError:
        return None


def _clean_competition(name: str) -> str:
    """Strip prefixes 'N. ' type Soccerway ('1. Premier League' -> 'Premier League')."""
    return re.sub(r"^\d+\.\s*", "", name or "").strip() or "Unknown"


def fetch(player: dict, page: "Page") -> list[dict]:
    """
    Scrape FBRef via une page Playwright existante.

    :param player: dict avec au minimum {'id', 'name', 'fbref_id'}
    :param page: Playwright Page object (session partagee, Cloudflare deja resolu)
    :returns: liste de dicts normalises (une par competition) ou [] si echec.
    """
    fbref_id = player.get("fbref_id")
    if not fbref_id:
        return []

    url = f"https://fbref.com/en/players/{fbref_id}/"

    try:
        from playwright.sync_api import TimeoutError as PWTimeout

        page.goto(url, timeout=PAGE_TIMEOUT_MS, wait_until="domcontentloaded")

        # Cloudflare challenge check
        title = (page.title() or "").lower()
        if "moment" in title or "instant" in title or "just a moment" in title:
            page.wait_for_function(
                "() => !document.title.toLowerCase().includes('moment') "
                "&& !document.title.toLowerCase().includes('instant')",
                timeout=CF_WAIT_MS,
            )

        result = page.evaluate(EXTRACT_JS, SEASON)
        rows = result.get("rows", [])

        if not rows:
            print(f"  [fbref] no {SEASON} rows ({result.get('reason', '?')}) for {player.get('name')}")
            return []

        out = []
        for r in rows:
            comp = _clean_competition(r.get("competition", ""))
            goals   = _parse_int(r.get("goals", ""))
            assists = _parse_int(r.get("assists", ""))
            mins    = _parse_int(r.get("minutes", ""))
            games   = _parse_int(r.get("games", ""))

            # Confidence HIGH si goals+assists+minutes tous presents
            has_core = all(v is not None for v in [goals, assists, mins, games])
            confidence = "HIGH" if has_core else "MEDIUM"

            out.append({
                "source":           "fbref",
                "season":           SEASON,
                "competition":      comp,
                "competition_tier": TIER_BY_LEAGUE.get(comp, 4),
                "matches_played":   games,
                "minutes_played":   mins,
                "goals":            goals,
                "assists":          assists,
                "xg":               _parse_float(r.get("xg", "")),
                "xa":               _parse_float(r.get("xag", "")),
                "yellow_cards":     _parse_int(r.get("yellow", "")),
                "red_cards":        _parse_int(r.get("red", "")),
                "source_url":       url,
                "confidence":       confidence,
            })

        print(f"  [fbref] {len(out)} rows pour {player.get('name')} ({fbref_id})")
        time.sleep(DELAY_SEC)
        return out

    except Exception as exc:
        print(f"  [fbref] error for {player.get('name')} ({fbref_id}): {exc}")
        return []
