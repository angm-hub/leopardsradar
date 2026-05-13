"""
Léopards Radar — Transfermarkt scraper (no-key, gratuit).

Stratégie :
  - HTTP via `requests` avec rotation user-agents (10 navigateurs récents)
  - Rate-limit strict 1 req / 3 sec (configurable)
  - Parse HTML via `BeautifulSoup`
  - Pas de browser headless (Transfermarkt est SSR)

Idéologie : tolérant aux changements HTML mineurs (sélecteurs robustes),
mais on log tout ce qui ne parse pas pour itérer rapidement.
"""

from __future__ import annotations

import random
import re
import time
from dataclasses import dataclass, field
from typing import Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (iPad; CPU OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

BASE = "https://www.transfermarkt.com"


@dataclass
class TmPlayer:
    """Profil joueur extrait de Transfermarkt."""
    transfermarkt_id: str
    name: str
    profile_url: str
    full_name: Optional[str] = None
    date_of_birth: Optional[str] = None         # ISO
    place_of_birth: Optional[str] = None
    country_of_birth: Optional[str] = None
    height_cm: Optional[int] = None
    foot: Optional[str] = None                  # 'left' | 'right' | 'both'
    nationalities: list = field(default_factory=list)
    position: Optional[str] = None              # 'Goalkeeper' | 'Defender' | 'Midfield' | 'Attack'
    current_club_name: Optional[str] = None
    current_club_id: Optional[str] = None
    contract_expires: Optional[str] = None      # ISO
    market_value_eur: Optional[int] = None
    agent: Optional[str] = None
    image_url: Optional[str] = None
    raw_html_excerpt: Optional[str] = None      # for debug


class TransfermarktClient:
    """
    Client HTTP rate-limited pour Transfermarkt.

    Usage :
        client = TransfermarktClient(rate_limit_seconds=3)
        player = client.fetch_player_profile("618472")  # Castello Lukeba TM ID
    """

    def __init__(self, rate_limit_seconds: float = 3.0, timeout: int = 20):
        self.rate_limit = rate_limit_seconds
        self.timeout = timeout
        self.session = requests.Session()
        self._last_request_at = 0.0

    def _sleep_if_needed(self):
        elapsed = time.time() - self._last_request_at
        if elapsed < self.rate_limit:
            time.sleep(self.rate_limit - elapsed)

    def _headers(self) -> dict:
        return {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9,fr;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "DNT": "1",
            "Upgrade-Insecure-Requests": "1",
        }

    def _get(self, url: str) -> Optional[str]:
        self._sleep_if_needed()
        try:
            r = self.session.get(url, headers=self._headers(), timeout=self.timeout)
            self._last_request_at = time.time()
            if r.status_code == 200:
                return r.text
            elif r.status_code == 404:
                print(f"[TM] 404 NOT FOUND: {url}")
                return None
            elif r.status_code in (403, 429):
                print(f"[TM] BAN signal {r.status_code} on {url} — aborting")
                raise RuntimeError(f"Transfermarkt ban signal: HTTP {r.status_code}")
            else:
                print(f"[TM] HTTP {r.status_code} on {url}")
                return None
        except requests.RequestException as e:
            print(f"[TM] Network error on {url}: {e}")
            return None

    # ─────────────────────────────────────────────────────────────────
    # Profile parser
    # ─────────────────────────────────────────────────────────────────
    def fetch_player_profile(self, tm_id: str) -> Optional[TmPlayer]:
        """
        Fetch + parse un profil joueur Transfermarkt.

        URL pattern : https://www.transfermarkt.com/-/profil/spieler/{ID}

        Note : sans slug placeholder ("-"), TM renvoie 404. Avec "-" il fait
        un 301 vers la bonne URL canonique, qu'on suit (allow_redirects=True
        par défaut sur requests).
        """
        url = f"{BASE}/-/profil/spieler/{tm_id}"
        html = self._get(url)
        if not html:
            return None

        soup = BeautifulSoup(html, "html.parser")

        # Identité — utiliser separator=" " pour éviter "FirstNameLastName" collé
        # quand le numéro de maillot et le nom sont dans des spans séparés.
        name_tag = soup.select_one("h1.data-header__headline-wrapper")
        name = name_tag.get_text(separator=" ", strip=True) if name_tag else f"Unknown {tm_id}"
        # Strip leading "#7" et normalise les espaces multiples
        name = re.sub(r"^#\d+\s*", "", name)
        name = re.sub(r"\s+", " ", name).strip()

        player = TmPlayer(transfermarkt_id=tm_id, name=name, profile_url=url)

        # Infos via spanlists
        info_items = soup.select("li.data-header__label, span.info-table__content")
        for li in info_items:
            text = li.get_text(separator=" ", strip=True)
            if not text:
                continue

            lower = text.lower()
            if "date of birth" in lower or "born" in lower:
                m = re.search(r"(\d{1,2})[\./\-]?(\w+)\s+(\d{4})", text)
                if m:
                    # Tentative parse anglais
                    pass  # On utilise plutôt le sélecteur dédié plus bas

        # Sélecteurs dédiés (plus fiables)
        # DOB
        dob_tag = soup.select_one("span[itemprop='birthDate']")
        if dob_tag:
            dob_raw = dob_tag.get_text(strip=True)
            # ex: "Dec 17, 2002 (23)"
            m = re.match(r"(\w+)\s+(\d{1,2}),\s+(\d{4})", dob_raw)
            if m:
                month_map = {
                    "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
                    "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
                    "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
                }
                mm = month_map.get(m.group(1)[:3])
                if mm:
                    player.date_of_birth = f"{m.group(3)}-{mm}-{int(m.group(2)):02d}"

        # Place of birth
        pob_tag = soup.select_one("span[itemprop='birthPlace']")
        if pob_tag:
            player.place_of_birth = pob_tag.get_text(strip=True)

        # Country of birth (image flag adjacent)
        if pob_tag:
            country_img = pob_tag.find_next("img")
            if country_img and country_img.get("title"):
                player.country_of_birth = country_img["title"]

        # Height
        height_tag = soup.select_one("span[itemprop='height']")
        if height_tag:
            h_text = height_tag.get_text(strip=True)
            m = re.search(r"(\d),(\d{2})", h_text)  # ex: "1,87 m"
            if m:
                player.height_cm = int(m.group(1)) * 100 + int(m.group(2))

        # Foot
        for li in soup.select("li.data-header__label"):
            label = li.get_text(separator=" ", strip=True).lower()
            if "foot" in label:
                if "left" in label:
                    player.foot = "left"
                elif "right" in label:
                    player.foot = "right"
                elif "both" in label:
                    player.foot = "both"

        # Nationalities — sélecteur cible le <span> qui suit "Citizenship:"
        # (on évite les drapeaux de logo club qui pollueraient la liste).
        seen = set()
        for span in soup.select("span.info-table__content--regular"):
            label = span.get_text(strip=True).lower()
            if "citizenship" not in label:
                continue
            value_span = span.find_next_sibling("span", class_="info-table__content--bold")
            if not value_span:
                continue
            for img in value_span.select("img.flaggenrahmen"):
                title = img.get("title") or img.get("alt")
                if title and title not in seen:
                    player.nationalities.append(title)
                    seen.add(title)
            break  # une seule section Citizenship

        # Position
        pos_tag = soup.select_one("dd.detail-position__position")
        if pos_tag:
            pos_text = pos_tag.get_text(strip=True).lower()
            if "goalkeeper" in pos_text:
                player.position = "Goalkeeper"
            elif "back" in pos_text or "defender" in pos_text:
                player.position = "Defender"
            elif "midfield" in pos_text:
                player.position = "Midfield"
            elif "forward" in pos_text or "winger" in pos_text or "striker" in pos_text or "attack" in pos_text:
                player.position = "Attack"

        # Current club + ID
        club_link = soup.select_one("span.data-header__club a")
        if club_link:
            player.current_club_name = club_link.get_text(strip=True)
            href = club_link.get("href", "")
            club_match = re.search(r"/verein/(\d+)", href)
            if club_match:
                player.current_club_id = club_match.group(1)

        # Contract expires
        for span in soup.select("span.data-header__label"):
            if "Contract expires" in span.get_text(strip=True):
                content = span.find_next("span", class_="data-header__content")
                if content:
                    contract_str = content.get_text(strip=True)
                    # ex: "Jun 30, 2029"
                    m = re.match(r"(\w+)\s+(\d{1,2}),\s+(\d{4})", contract_str)
                    if m:
                        month_map = {
                            "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
                            "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
                            "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
                        }
                        mm = month_map.get(m.group(1)[:3])
                        if mm:
                            player.contract_expires = f"{m.group(3)}-{mm}-{int(m.group(2)):02d}"

        # Market value
        mv_tag = soup.select_one("a.data-header__market-value-wrapper")
        if mv_tag:
            mv_text = mv_tag.get_text(strip=True)
            # ex: "€40.00m" ou "€500k"
            m_eur = re.search(r"€\s*([\d\.,]+)\s*(m|k)?", mv_text, re.IGNORECASE)
            if m_eur:
                num = float(m_eur.group(1).replace(",", ".").replace(" ", ""))
                unit = (m_eur.group(2) or "").lower()
                multiplier = 1_000_000 if unit == "m" else (1_000 if unit == "k" else 1)
                player.market_value_eur = int(num * multiplier)

        # Image
        img_tag = soup.select_one("img.data-header__profile-image")
        if img_tag:
            src = img_tag.get("src") or img_tag.get("data-src")
            if src:
                player.image_url = urljoin(BASE, src)

        # Agent
        for li in soup.select("li.data-header__label"):
            label = li.get_text(separator=" ", strip=True)
            if label.startswith("Player agent:"):
                player.agent = label.replace("Player agent:", "").strip()

        # Sauvegarde un extrait HTML pour debug si parse fail
        if not player.date_of_birth or not player.position:
            player.raw_html_excerpt = html[:5000]

        return player

    # ─────────────────────────────────────────────────────────────────
    # National team appearances (sélections internationales)
    # ─────────────────────────────────────────────────────────────────
    def fetch_player_national_appearances(self, tm_id: str) -> list:
        """
        Fetch la page "national team" du joueur — historique sélections.

        URL : https://www.transfermarkt.com/-/nationalmannschaft/spieler/{ID}

        Retourne une liste de dicts compatibles `selections` :
          { federation_code, category, competition, is_major_competition, match_date, opponent, source_url }
        """
        url = f"{BASE}/-/nationalmannschaft/spieler/{tm_id}"
        html = self._get(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "html.parser")
        results = []

        # Tableaux de matchs internationaux (un par sélection)
        match_rows = soup.select("table.items tbody tr")
        for row in match_rows:
            cells = row.find_all("td")
            if len(cells) < 6:
                continue

            # Date (col 0 typiquement)
            date_text = cells[0].get_text(strip=True)
            match_date = self._parse_tm_date(date_text)
            if not match_date:
                continue

            # Compétition (col contenant un img + label)
            comp_text = ""
            comp_cell = cells[2] if len(cells) > 2 else None
            if comp_cell:
                comp_text = comp_cell.get_text(separator=" ", strip=True)

            # Adversaire
            opp_text = ""
            opp_cell = cells[3] if len(cells) > 3 else None
            if opp_cell:
                opp_text = opp_cell.get_text(strip=True)

            # Catégorisation
            comp_lower = comp_text.lower()
            category = "A_OFFICIAL"
            if "friendly" in comp_lower or "amical" in comp_lower:
                category = "A_FRIENDLY"
            elif any(kw in comp_lower for kw in ["u21", "u-21"]):
                category = "U21"
            elif any(kw in comp_lower for kw in ["u20", "u-20"]):
                category = "U20"
            elif any(kw in comp_lower for kw in ["u19", "u-19"]):
                category = "U19"
            elif any(kw in comp_lower for kw in ["u18", "u-18"]):
                category = "U18"
            elif any(kw in comp_lower for kw in ["u17", "u-17"]):
                category = "U17"
            elif any(kw in comp_lower for kw in ["u23", "u-23"]):
                category = "U23"

            # Major comp
            is_major = any(kw in comp_lower for kw in [
                "world cup", "wc qualif", "afcon", "africa cup", "euro", "copa américa",
                "copa america", "concacaf gold", "asian cup", "nations cup", "qualif"
            ])

            # Federation : on infère depuis le contexte de la page (à compléter)
            # Pour MVP, on laisse vide et on enrichira via Wikidata ensuite
            federation_code = self._infer_federation_from_page(soup)

            results.append({
                "federation_code": federation_code,
                "category": category,
                "competition": comp_text[:200],
                "is_major_competition": is_major,
                "opponent": opp_text[:100],
                "match_date": match_date,
                "source_url": url,
            })

        return results

    @staticmethod
    def _parse_tm_date(date_text: str) -> Optional[str]:
        """Parse 'Oct 13, 2023' → '2023-10-13'"""
        m = re.match(r"(\w+)\s+(\d{1,2}),\s+(\d{4})", date_text.strip())
        if not m:
            return None
        month_map = {
            "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
            "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
            "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
        }
        mm = month_map.get(m.group(1)[:3])
        if not mm:
            return None
        return f"{m.group(3)}-{mm}-{int(m.group(2)):02d}"

    @staticmethod
    def _infer_federation_from_page(soup) -> Optional[str]:
        """
        Tente d'inférer la fédération principale depuis la page.
        À enrichir : multi-fédération si le joueur a joué pour plusieurs nations.
        """
        # Sélecteur indicatif — le HTML TM peut varier
        flag = soup.select_one("h2.content-box-headline img.flaggenrahmen")
        if flag and flag.get("title"):
            country_name = flag["title"]
            # On retourne le nom brut, le caller mappera vers ISO
            return country_name
        return None

    # ─────────────────────────────────────────────────────────────────
    # Discovery — RDC pool
    # ─────────────────────────────────────────────────────────────────
    def discover_rdc_pool(self) -> list:
        """
        Crawl la page Transfermarkt qui liste les joueurs avec nationalité RDC.

        URL : https://www.transfermarkt.com/spieler-statistik/wertvollstespieler/marktwertetop?land_id=140

        (140 = code Transfermarkt pour DR Congo)
        """
        results = []
        for page in range(1, 11):  # 10 pages × 25 = 250 candidats max par run
            url = f"{BASE}/spieler-statistik/wertvollstespieler/marktwertetop?land_id=140&page={page}"
            html = self._get(url)
            if not html:
                break

            soup = BeautifulSoup(html, "html.parser")
            rows = soup.select("table.items tbody tr.odd, table.items tbody tr.even")
            if not rows:
                break

            for row in rows:
                link = row.select_one("a.spielprofil_tooltip")
                if not link:
                    continue
                href = link.get("href", "")
                m = re.search(r"/spieler/(\d+)", href)
                if not m:
                    continue
                tm_id = m.group(1)
                name = link.get_text(strip=True)
                results.append({"transfermarkt_id": tm_id, "name": name, "profile_url": urljoin(BASE, href)})
        return results
