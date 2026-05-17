#!/usr/bin/env python3
"""
scrape_rdc_lineups.py — Historique compositions RDC A depuis Transfermarkt.

Source principale : Transfermarkt spielplandatum (liste des matchs RDC).
URL : https://www.transfermarkt.com/demokratische-republik-kongo/spielplandatum/verein/3854

Pour chaque match, on fetch la page aufstellung (composition) :
URL : https://www.transfermarkt.com/demokratische-republik-kongo/aufstellung/verein/3854/saison_id/0/datum/{YYYY-MM-DD}/gegner_id/{opp_id}

Strategy :
  1. Fetch la page spielplandatum pour obtenir la liste de matchs
  2. Filtrer depuis DESABRE_START (2022-08-07)
  3. Pour chaque match, fetch la page aufstellung et extraire le XI de depart
  4. Matcher les joueurs contre la table players (par nom + TM ID si connu)
  5. Inserer dans national_lineups (upsert idempotent)

Limite : TM 3s rate-limit stricte + 1 requete en moins grace au scraping
du spielplandatum qui liste deja adversaire + resultat.

Confidence matching joueur :
  - HIGH : TM link /profil/spieler/{tm_id} + joueur en BDD avec ce TM ID
  - MEDIUM : match par nom normalise uniquement
  - LOW : joueur dans composition TM mais pas en BDD

Les joueurs LOW sont quand meme stockes (player_id = NULL, nom brut dans
une colonne de debug) — on ne perd pas la composition.

Usage :
  python scrape_rdc_lineups.py [--dry-run] [--limit N] [--from-date YYYY-MM-DD]
  python scrape_rdc_lineups.py --from-date 2024-01-01   # CAN 2024 uniquement

Variables :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import os
import random
import re
import sys
import time
import unicodedata
from datetime import date, datetime, timezone
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(__file__))
from supabase_client import SupabaseClient

# ─── Config ───────────────────────────────────────────────────────────────────

BASE = "https://www.transfermarkt.com"
RDC_TM_ID = "3854"
DESABRE_START = date(2022, 8, 7)   # Source : Wikipedia FR + TM leistungsdatenDetail
RATE_LIMIT_SEC = 3.0
RUN_URL = os.environ.get("GITHUB_RUN_URL", "")

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
]

_session: Optional[requests.Session] = None
_last_req_at: float = 0.0


# ─── HTTP ─────────────────────────────────────────────────────────────────────

def _get_session() -> requests.Session:
    global _session
    if _session is None:
        _session = requests.Session()
    return _session


def _get(url: str) -> Optional[str]:
    global _last_req_at
    elapsed = time.time() - _last_req_at
    if elapsed < RATE_LIMIT_SEC:
        time.sleep(RATE_LIMIT_SEC - elapsed)

    sess = _get_session()
    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
    }
    try:
        r = sess.get(url, headers=headers, timeout=25)
        _last_req_at = time.time()
        if r.status_code == 200:
            return r.text
        elif r.status_code == 404:
            print(f"  [tm] 404 {url}")
            return None
        elif r.status_code in (403, 429):
            print(f"  [tm] BAN {r.status_code} — pause 30s")
            time.sleep(30)
            return None
        else:
            print(f"  [tm] HTTP {r.status_code} {url}")
            return None
    except requests.RequestException as exc:
        print(f"  [tm] network error: {exc}")
        return None


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _normalize(s: str) -> str:
    nfd = unicodedata.normalize("NFD", s or "")
    no_acc = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9 ]+", " ", no_acc.lower())).strip()


def _parse_tm_date(s: str) -> Optional[date]:
    """Parse 'Oct 13, 2023' ou '13.10.23' ou '2023-10-13' -> date."""
    s = s.strip()
    # ISO
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})", s)
    if m:
        return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
    # Anglais "Oct 13, 2023"
    m = re.match(r"(\w{3})\s+(\d{1,2}),\s+(\d{4})", s)
    if m:
        month_map = {"Jan":1,"Feb":2,"Mar":3,"Apr":4,"May":5,"Jun":6,
                     "Jul":7,"Aug":8,"Sep":9,"Oct":10,"Nov":11,"Dec":12}
        mm = month_map.get(m.group(1)[:3])
        if mm:
            return date(int(m.group(3)), mm, int(m.group(2)))
    # DD.MM.YY ou DD.MM.YYYY
    m = re.match(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})", s)
    if m:
        y = int(m.group(3))
        if y < 100:
            y += 2000
        return date(y, int(m.group(2)), int(m.group(1)))
    return None


def _parse_result(s: str) -> Optional[str]:
    """Parse '2:1' ou '2-1' en 'W 2-1' / 'D 1-1' / 'L 0-2'."""
    s = s.strip()
    m = re.match(r"(\d+)\s*[:\-]\s*(\d+)", s)
    if not m:
        return s or None
    a, b = int(m.group(1)), int(m.group(2))
    prefix = "W" if a > b else ("D" if a == b else "L")
    return f"{prefix} {a}-{b}"


def _classify_competition(text: str, category: str = "") -> tuple[str, bool]:
    """
    Retourne (competition_name_normalise, is_official).
    is_official=False pour les amicaux hors fenetre FIFA.
    """
    t = text.lower()
    if "friendly" in t or "amical" in t or "test match" in t:
        return ("Friendly", False)
    if "africa cup" in t or "afcon" in t or "can" in t or "cup of nations" in t:
        return ("Africa Cup of Nations", True)
    if "world cup qual" in t or "wcq" in t or "qualification" in t or "qualif" in t:
        return ("WCQ 2026", True)
    if "chan" in t:
        return ("CHAN", True)
    if "cosafa" in t:
        return ("COSAFA Cup", True)
    return (text.strip() or "Unknown", True)


# ─── Fetch liste des matchs ───────────────────────────────────────────────────

def _fetch_match_list(from_date: date) -> list[dict]:
    """
    Crawl la page spielplandatum de la RDC et retourne la liste
    des matchs depuis from_date.

    Retourne une liste de dicts :
      {match_date, opponent, opponent_tm_id, competition, result, is_official, source_url}
    """
    results = []
    # TM pagine par saison dans cette URL
    # On cible les saisons pertinentes depuis 2022
    current_year = datetime.now().year
    seasons = list(range(2022, current_year + 1))

    for season_year in seasons:
        url = (
            f"{BASE}/demokratische-republik-kongo/spielplandatum/"
            f"verein/{RDC_TM_ID}/saison_id/{season_year - 1}"
        )
        print(f"  [matches] fetch saison {season_year - 1}/{season_year} : {url}")
        html = _get(url)
        if not html:
            continue

        soup = BeautifulSoup(html, "html.parser")

        # Tableau des matchs
        for tr in soup.select("table.items tbody tr"):
            cells = tr.find_all("td")
            if len(cells) < 5:
                continue

            # Date (col 0 ou 1 selon le layout)
            date_text = ""
            for cell in cells[:3]:
                ct = cell.get_text(strip=True)
                if re.search(r"\d{1,2}[./]\d{1,2}", ct) or re.search(r"[A-Za-z]{3}\s+\d+,\s+\d{4}", ct):
                    date_text = ct
                    break

            match_date = _parse_tm_date(date_text)
            if not match_date:
                continue
            if match_date < from_date:
                continue

            # Competition (cellule contenant img de competition)
            comp_text = ""
            comp_cell_idx = 2
            if comp_cell_idx < len(cells):
                comp_text = cells[comp_cell_idx].get_text(separator=" ", strip=True)

            # Adversaire (lien vers une equipe)
            opponent = ""
            opponent_id = ""
            for cell in cells[2:]:
                link = cell.select_one("a[href*='/verein/']")
                if link and link.get_text(strip=True) and "kongo" not in link.get_text(strip=True).lower():
                    opponent = link.get_text(strip=True)
                    href = link.get("href", "")
                    m_id = re.search(r"/verein/(\d+)", href)
                    if m_id:
                        opponent_id = m_id.group(1)
                    break

            if not opponent:
                continue

            # Resultat (cellule avec score)
            result_text = ""
            for cell in cells:
                ct = cell.get_text(strip=True)
                if re.match(r"^\d+\s*[:\-]\s*\d+", ct):
                    result_text = ct
                    break

            comp_name, is_official = _classify_competition(comp_text)

            results.append({
                "match_date":      match_date.isoformat(),
                "opponent":        opponent,
                "opponent_tm_id":  opponent_id,
                "competition":     comp_name,
                "result":          _parse_result(result_text),
                "is_official":     is_official,
                "source_url":      url,
            })

    # Dedup sur (match_date, opponent)
    seen = set()
    unique = []
    for r in results:
        key = (r["match_date"], r["opponent"])
        if key not in seen:
            seen.add(key)
            unique.append(r)

    return sorted(unique, key=lambda x: x["match_date"])


# ─── Fetch composition d'un match ─────────────────────────────────────────────

def _fetch_lineup(match_date: str, opponent_id: str) -> dict:
    """
    Fetch la page aufstellung TM pour un match et retourne :
      {starting_xi_raw: list[{tm_id, name}], substitutes_in: list, formation: str}

    starting_xi_raw : joueurs identifiables par leur TM link.
    """
    # Page aufstellung — TM peut avoir differentes URL structures
    url = (
        f"{BASE}/demokratische-republik-kongo/aufstellung/"
        f"verein/{RDC_TM_ID}/saison_id/0"
    )
    if opponent_id:
        url += f"/gegner_id/{opponent_id}"

    html = _get(url)
    if not html:
        return {"starting_xi_raw": [], "substitutes_in": [], "formation": None}

    soup = BeautifulSoup(html, "html.parser")

    starting_xi = []
    substitutes = []
    formation = None

    # Formation — parfois dans le titre ou un h2
    for tag in soup.select("h2, h3, .formation"):
        t = tag.get_text(strip=True)
        m = re.search(r"\d-\d[-\d]*", t)
        if m:
            formation = m.group(0)
            break

    # Joueurs dans le tableau aufstellung
    # TM liste les titulaires dans un tableau avec class "aufstellung-table" ou similaire
    for table in soup.select("table"):
        rows = table.select("tr")
        for tr in rows:
            cells = tr.find_all("td")
            for cell in cells:
                link = cell.select_one("a[href*='/profil/spieler/']")
                if not link:
                    continue
                href = link.get("href", "")
                m_id = re.search(r"/profil/spieler/(\d+)", href)
                if not m_id:
                    continue
                tm_player_id = m_id.group(1)
                player_name = link.get_text(strip=True)
                if not player_name:
                    continue

                # Distinguer titulaires vs remplacants selon la position dans la page
                # TM separe souvent avec un libelle "Starting lineup" / "Substitutes"
                section_header = ""
                prev = tr.find_previous("tr")
                if prev:
                    section_header = prev.get_text(strip=True).lower()

                entry = {"tm_id": tm_player_id, "name": player_name}
                if "sub" in section_header or "remplacant" in section_header or "ersatz" in section_header:
                    if entry not in substitutes:
                        substitutes.append(entry)
                else:
                    if entry not in starting_xi and len(starting_xi) < 11:
                        starting_xi.append(entry)

    return {
        "starting_xi_raw": starting_xi,
        "substitutes_in":  substitutes,
        "formation":       formation,
    }


# ─── Match TM players contre BDD ─────────────────────────────────────────────

def _build_player_index(sb: SupabaseClient) -> dict:
    """
    Construit 2 index depuis la table players :
      by_tm_id : {transfermarkt_id: player_id}
      by_norm  : {normalized_name: [player_id]}
    """
    players = sb.select(
        "players",
        select="id,name,transfermarkt_id",
        order="id.asc",
    )
    by_tm_id: dict[str, int] = {}
    by_norm:  dict[str, list[int]] = {}

    for p in players:
        tm_id = p.get("transfermarkt_id")
        if tm_id:
            by_tm_id[str(tm_id)] = p["id"]
        nm = _normalize(p["name"])
        by_norm.setdefault(nm, []).append(p["id"])

    return {"by_tm_id": by_tm_id, "by_norm": by_norm}


def _resolve_player_id(tm_id: str, name: str, idx: dict) -> Optional[int]:
    """
    Tente de retrouver le player.id depuis le TM link ou le nom.
    Retourne None si non trouve.
    """
    pid = idx["by_tm_id"].get(str(tm_id))
    if pid:
        return pid

    nm = _normalize(name)
    hits = idx["by_norm"].get(nm, [])
    if hits:
        return hits[0]  # premier match (cas rares de doublons)

    return None


# ─── Persist ──────────────────────────────────────────────────────────────────

def _upsert_lineup(sb: SupabaseClient, match: dict, lineup: dict, idx: dict, dry_run: bool) -> bool:
    """
    Construit la row national_lineups et l'insere via upsert.
    Retourne True si insertion OK.
    """
    starting_xi_raw = lineup.get("starting_xi_raw", [])

    # Resolver les IDs
    starting_xi_ids = []
    unresolved = []
    for entry in starting_xi_raw[:11]:  # max 11
        pid = _resolve_player_id(entry["tm_id"], entry["name"], idx)
        if pid:
            starting_xi_ids.append(pid)
        else:
            unresolved.append(entry["name"])

    subs_ids = []
    for entry in lineup.get("substitutes_in", []):
        pid = _resolve_player_id(entry["tm_id"], entry["name"], idx)
        if pid:
            subs_ids.append(pid)

    if len(starting_xi_ids) < 7:
        print(
            f"  [lineup] {match['match_date']} vs {match['opponent']} : "
            f"seulement {len(starting_xi_ids)}/11 joueurs resolus — skip"
        )
        return False

    row = {
        "match_date":     match["match_date"],
        "opponent":       match["opponent"][:200],
        "competition":    match.get("competition", "Unknown"),
        "result":         match.get("result"),
        "formation":      lineup.get("formation"),
        "starting_xi":    starting_xi_ids,
        "substitutes_in": subs_ids or None,
        "coach":          "Desabre",
        "is_official":    match.get("is_official", True),
        "source":         "transfermarkt",
        "source_url":     match.get("source_url", ""),
    }

    if dry_run:
        n_res = len(starting_xi_ids)
        n_unr = len(unresolved)
        print(
            f"  [dry] {match['match_date']} vs {match['opponent']} : "
            f"{n_res} resolved, {n_unr} unresolved ({', '.join(unresolved[:3])})"
        )
        return True

    try:
        sb.insert(
            "national_lineups",
            row,
            on_conflict="match_date,opponent",
        )
        print(
            f"  [ok] {match['match_date']} vs {match['opponent']} "
            f"({match.get('competition', '?')}) : {len(starting_xi_ids)}/11 resolved"
        )
        if unresolved:
            print(f"    [warn] non resolus: {', '.join(unresolved)}")
        return True
    except Exception as exc:
        print(f"  [error] {match['match_date']} vs {match['opponent']}: {exc}", file=sys.stderr)
        return False


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description="Scrape historique compositions RDC A (Desabre)")
    ap.add_argument("--dry-run",   action="store_true")
    ap.add_argument("--limit",     type=int,  default=None, help="Limite le nombre de matchs")
    ap.add_argument("--from-date", type=str,  default=DESABRE_START.isoformat(),
                    help=f"Date de debut (defaut: {DESABRE_START.isoformat()})")
    args = ap.parse_args()

    from_date = date.fromisoformat(args.from_date)
    print(f"[scrape-rdc-lineups] from_date={from_date} (Desabre debut: {DESABRE_START})")

    if not args.dry_run and (
        not os.environ.get("SUPABASE_URL")
        or not os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    ):
        print("::error::SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquantes", file=sys.stderr)
        return 1

    sb = SupabaseClient() if not args.dry_run else None
    idx = _build_player_index(sb) if sb else {"by_tm_id": {}, "by_norm": {}}

    # 1. Liste des matchs
    print("\n[scrape-rdc-lineups] fetching match list from TM...")
    matches = _fetch_match_list(from_date)
    print(f"[scrape-rdc-lineups] {len(matches)} matchs trouves depuis {from_date}")

    if args.limit:
        matches = matches[:args.limit]
        print(f"[scrape-rdc-lineups] limite a {args.limit} matchs")

    # 2. Pour chaque match, fetch la composition
    inserted = skipped = errors = 0
    for i, match in enumerate(matches, 1):
        print(f"\n  [{i}/{len(matches)}] {match['match_date']} vs {match['opponent']} ({match.get('competition', '?')})")

        lineup = _fetch_lineup(match["match_date"], match.get("opponent_tm_id", ""))

        if not lineup["starting_xi_raw"]:
            print(f"  [skip] pas de composition disponible")
            skipped += 1
            continue

        ok = _upsert_lineup(sb, match, lineup, idx, args.dry_run)
        if ok:
            inserted += 1
        else:
            skipped += 1

    print(f"\n[scrape-rdc-lineups] done — {inserted} inseres, {skipped} skipped, {errors} erreurs")

    if sb:
        try:
            now = datetime.now(timezone.utc).isoformat()
            sb.insert("sync_logs", {
                "job_name":          "scrape-rdc-lineups",
                "status":            "success" if errors == 0 else "partial",
                "started_at":        now,
                "finished_at":       now,
                "players_processed": inserted,
                "players_updated":   inserted,
                "errors_count":      errors,
                "github_run_url":    RUN_URL,
            })
        except Exception as exc:
            print(f"[warn] sync_logs write failed: {exc}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
