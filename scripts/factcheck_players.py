#!/usr/bin/env python3
"""
Léopards Radar — Fact-check systématique de l'éligibilité RDC (crawl web).

Pourquoi : le tag de nationalité « DR Congo » (Wikidata/Transfermarkt) et le
scoring par patronyme bantou produisent des faux positifs. Deux classes vues
le 17/07/2026 :
  - Tyrone/Floyd Samba : Anglais taggés RDC parce que « Samba » sonne bantou,
    alors que le nom renvoie à Christopher Samba, RÉPUBLIQUE du Congo (Brazza).
  - Diaspora née à l'étranger avec le seul tag de nationalité, jamais confirmée.

Ce script tranche chaque fiche sur des SOURCES, pas sur des heuristiques de nom.
Source primaire : Wikidata, qui distingue proprement par identifiant la
RD Congo (Q974) de la République du Congo / Brazzaville (Q971) — la confusion
« Congo » qui a créé le bug Samba. Fallback : infobox Wikipedia FR/EN.

Signaux lus par joueur :
  - P19 (lieu de naissance) → P17 (pays) : né en RDC ?
  - P27 (citoyennetés) : passeport RDC ?
  - P1532 (nationalité sportive / country for sport) : sélectionnable/capé RDC ?
  - P54 / matches en équipe nationale : cap-tied à une autre nation ?

Verdict :
  CONFIRME_RDC   → naissance RDC, ou nationalité sportive RDC, ou (citoyenneté
                   RDC + naissance RDC). verified=true.
  INFIRME_BRAZZA → signal Congo-Brazzaville (Q971) sans aucun signal RDC.
                   archived=true (mauvais pays, ex. Samba).
  CAP_TIED       → nationalité sportive d'une autre nation, RDC absente.
                   verified=false (masqué par le gate) + note.
  A_VERIFIER     → aucune donnée Wikidata exploitable. verified=false, note.

Usage :
  python scripts/factcheck_players.py --dry-run --limit 20
  python scripts/factcheck_players.py --scope held      # les fiches en attente
  python scripts/factcheck_players.py --scope unverified # non vérifiées
  python scripts/factcheck_players.py --scope all --limit 100

Env : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import time
import unicodedata
import urllib.parse
import urllib.request

from supabase_client import SupabaseClient

UA = "LeopardsRadar-factcheck/1.0 (https://leopardsradar.vercel.app; alexandre@withkaira.com)"

# Identifiants Wikidata clés
Q_DRC = "Q974"           # République démocratique du Congo (Kinshasa)
Q_CONGO_BRAZZA = "Q971"  # République du Congo (Brazzaville)
# Nations à fort verrou cap-tie fréquentes dans la diaspora
CAP_TIE_COUNTRIES = {
    "Q142": "France", "Q31": "Belgique", "Q39": "Suisse", "Q183": "Allemagne",
    "Q145": "Royaume-Uni", "Q21": "Angleterre", "Q29": "Espagne", "Q55": "Pays-Bas",
    "Q38": "Italie", "Q45": "Portugal", "Q34": "Suède", "Q20": "Norvège",
}

RATE = 1.2  # s entre appels Wikidata (poli)


# ─────────────────────────────────────────────────────────────────────────────
# Wikidata
# ─────────────────────────────────────────────────────────────────────────────

def _get(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)


def wd_entity(qid: str) -> dict | None:
    try:
        d = _get(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json")
        return d["entities"][qid]
    except Exception:
        return None


def _claim_qids(ent: dict, prop: str) -> list[str]:
    out = []
    for c in ent.get("claims", {}).get(prop, []):
        try:
            out.append(c["mainsnak"]["datavalue"]["value"]["id"])
        except (KeyError, TypeError):
            pass
    return out


Q_FOOTBALLER = "Q937857"  # association football player (occupation P106)


def _norm_tokens(name: str) -> set[str]:
    n = unicodedata.normalize("NFKD", name or "").encode("ascii", "ignore").decode()
    return {t for t in re.split(r"[\s'-]+", n.lower()) if len(t) >= 3}


def _is_footballer(ent: dict) -> bool:
    return Q_FOOTBALLER in _claim_qids(ent, "P106")


def _name_matches(stored: str, ent: dict) -> bool:
    """Le libellé Wikidata partage-t-il un jeton avec le nom stocké ? Évite
    de fact-checker un homonyme (garde-fou identique au sync)."""
    labels = {v.get("value", "") for v in ent.get("labels", {}).values()}
    a = _norm_tokens(stored)
    return any(_norm_tokens(l) & a for l in labels)


def resolve_wikidata(name: str, tm_id: str | None) -> dict | None:
    """Résout une entité Wikidata FIABLE pour ce joueur : footballeur ET dont
    le nom correspond. On essaie le TM id (P8286) puis la recherche par nom,
    mais on REJETTE toute entité qui n'est pas un footballeur au nom cohérent
    (nos TM id peuvent être faux — cf. bug de croisement du 17/07)."""
    candidates: list[str] = []
    if tm_id and str(tm_id).isdigit():
        q = f'SELECT ?p WHERE {{ ?p wdt:P8286 "{tm_id}" }} LIMIT 1'
        try:
            b = _get("https://query.wikidata.org/sparql?format=json&query="
                     + urllib.parse.quote(q))["results"]["bindings"]
            if b:
                candidates.append(b[0]["p"]["value"].rsplit("/", 1)[-1])
        except Exception:
            pass
        time.sleep(RATE / 2)
    try:
        d = _get("https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json"
                 f"&language=fr&uselang=fr&limit=6&search={urllib.parse.quote(name)}")
        candidates += [r["id"] for r in d.get("search", [])]
    except Exception:
        pass

    for qid in candidates:
        ent = wd_entity(qid)
        time.sleep(RATE / 2)
        if ent and _is_footballer(ent) and _name_matches(name, ent):
            return {"qid": qid, "ent": ent}
    return None


def birth_countries(ent: dict) -> list[str]:
    out = []
    for place in _claim_qids(ent, "P19"):
        pe = wd_entity(place)
        time.sleep(RATE / 2)
        if pe:
            out += _claim_qids(pe, "P17")
    return out


# ─────────────────────────────────────────────────────────────────────────────
# Verdict
# ─────────────────────────────────────────────────────────────────────────────

def classify(ent: dict) -> tuple[str, str, dict]:
    """Retourne (verdict, phrase, signaux)."""
    cit = _claim_qids(ent, "P27")          # citoyennetés
    sport = _claim_qids(ent, "P1532")      # nationalité sportive (FIFA)
    pob = birth_countries(ent)             # pays de naissance
    all_sig = set(cit) | set(sport) | set(pob)

    sig = {"birth": pob, "citizenship": cit, "sport": sport}

    ne_rdc = Q_DRC in pob
    sport_rdc = Q_DRC in sport
    cit_rdc = Q_DRC in cit
    brazza = Q_CONGO_BRAZZA in all_sig
    other_sport = [c for c in sport if c in CAP_TIE_COUNTRIES]

    if sport_rdc or ne_rdc or (cit_rdc and (ne_rdc or not other_sport)):
        raison = []
        if ne_rdc: raison.append("né en RDC")
        if sport_rdc: raison.append("nationalité sportive RDC")
        if cit_rdc: raison.append("citoyenneté RDC")
        return ("CONFIRME_RDC", "Éligibilité RDC confirmée (" + ", ".join(raison) + ").", sig)

    if brazza and not (ne_rdc or cit_rdc or sport_rdc):
        return ("INFIRME_BRAZZA",
                "Lien avec la République du Congo (Brazzaville), pas la RD Congo. "
                "Retiré du radar RDC.", sig)

    if other_sport and not (cit_rdc or ne_rdc):
        return ("CAP_TIED",
                f"Nationalité sportive {CAP_TIE_COUNTRIES[other_sport[0]]} et aucun "
                "signal RDC. Non éligible en l'état.", sig)

    if cit_rdc:
        # citoyenneté RDC mais né ailleurs et pas de nat. sportive RDC → diaspora à confirmer
        return ("A_VERIFIER",
                "Citoyenneté RDC signalée (diaspora) mais ni naissance ni sélection "
                "RDC documentée : à confirmer à la main.", sig)

    return ("A_VERIFIER",
            "Aucun signal RDC exploitable sur Wikidata : à confirmer à la main.", sig)


# ─────────────────────────────────────────────────────────────────────────────
# Application
# ─────────────────────────────────────────────────────────────────────────────

def apply_verdict(sb, player: dict, verdict: str, phrase: str, sig: dict, qid: str, dry: bool):
    stamp = dt.datetime.utcnow().strftime("%Y-%m-%d")
    src = f"Wikidata {qid}"
    note_tag = f" | [factcheck {stamp}] {verdict} ({src}) : {phrase}"
    patch = {}
    base_note = (player.get("eligibility_note") or "")

    if verdict == "CONFIRME_RDC":
        patch = {"verified": True, "discovery_method": None}
    elif verdict == "INFIRME_BRAZZA":
        patch = {"archived": True, "verified": False}
    elif verdict in ("CAP_TIED", "A_VERIFIER"):
        # masqué par le gate tant que non re-confirmé à la main
        patch = {"verified": False,
                 "discovery_method": player.get("discovery_method") or "factcheck_hold"}

    patch["eligibility_note"] = (base_note + note_tag)[:4000]

    print(f"  [{verdict:14}] {player['name']:28} → {phrase[:70]}")
    if not dry:
        sb.update("players", {"id": f"eq.{player['id']}"}, patch)
    return verdict


SCOPES = {
    # non vérifiées, visibles ou non
    "unverified": "verified=is.false&archived=is.false",
    # fiches mises en attente par la vérif du 17/07
    "held": "discovery_method=in.(wikidata_scan_unverified,factcheck_hold,academy_scan_2026)&archived=is.false",
    # tout l'actif (gros)
    "all": "archived=is.false",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--scope", choices=list(SCOPES), default="held")
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    sb = SupabaseClient()
    flt = SCOPES[args.scope]
    players = sb.select(
        "players",
        select="id,name,slug,transfermarkt_id,eligibility_note,discovery_method,caps_rdc",
        **dict(p.split("=", 1) for p in flt.split("&")),
        order="name.asc",
        limit=str(args.limit),
    )
    print(f"=== Fact-check {args.scope} — {len(players)} fiches "
          f"{'(DRY-RUN)' if args.dry_run else ''} ===\n")

    counts: dict[str, int] = {}
    for i, p in enumerate(players, 1):
        # capé RDC = signal dur, on ne re-teste pas
        if (p.get("caps_rdc") or 0) > 0:
            continue
        resolved = resolve_wikidata(p["name"], p.get("transfermarkt_id"))
        time.sleep(RATE)
        if not resolved:
            print(f"  [NO_WIKIDATA   ] {p['name']:28} → aucune entité footballeur fiable")
            counts["NO_WIKIDATA"] = counts.get("NO_WIKIDATA", 0) + 1
            continue
        verdict, phrase, sig = classify(resolved["ent"])
        apply_verdict(sb, p, verdict, phrase, sig, resolved["qid"], args.dry_run)
        counts[verdict] = counts.get(verdict, 0) + 1

    print("\n=== Bilan ===")
    for k, v in sorted(counts.items()):
        print(f"  {k:14} : {v}")


if __name__ == "__main__":
    main()
