#!/usr/bin/env python3
"""
Génère le HTML de revue éditoriale par championnat.

Usage :
  python generate_revue_html.py --league L1 --output /tmp/revue_L1.html

  # Filtre custom (TM IDs explicites)
  python generate_revue_html.py --tm-ids 1234,5678 --output /tmp/revue_custom.html

Le HTML produit a 4 actions par profil (Confirmé, À creuser, Pas Léopard,
Archiver) + champ note libre. Bouton "copier" en bas qui assemble la commande
à coller dans le workflow bulk-action-players.
"""

from __future__ import annotations
import argparse
import json
import os
import html
import requests
import sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).parent.parent  # scripts/
DATA = ROOT / "data"


EU_CLUB_PATTERNS = {
    "L1": ["monaco","lyon","marseille","psg","paris saint","olympique","st-etienne",
           "saint-etienne","saint étienne","lille","losc","rennes","nantes","reims","metz",
           "lens","nice","brest","strasbourg","toulouse","montpellier","angers","auxerre",
           "clermont","le havre","bordeaux","lorient","red star","sm caen"],
    "L2": ["valenciennes","sochaux","amiens","laval","pau fc","grenoble","ajaccio","guingamp",
           "dijon","paris fc","troyes","annecy","quevilly","dunkerque","rodez","niort",
           "châteauroux","chateauroux","bastia","rouen","martigues"],
    "BEL1": ["anderlecht","club brugge","union saint-gilloise","genk","gent","standard liège",
             "standard liege","charleroi","cercle brugge","oh leuven","mechelen","sint-truiden",
             "westerlo","kortrijk","antwerp","beerschot","rwdm","molenbeek","royal léopold",
             "léopold fc","saint-gilles","rfc seraing","beveren"],
    "NL1": ["ajax amsterdam","psv","feyenoord","az alkmaar","utrecht","twente","sparta rotterdam",
            "rkc","vitesse","nec","heracles","almere city","go ahead","fortuna sittard","groningen",
            "pec zwolle","heerenveen","willem ii","volendam","excelsior"],
    "GER1": ["bayern münchen","bayern munich","dortmund","rb leipzig","leverkusen","eintracht",
             "vfb stuttgart","mönchengladbach","wolfsburg","freiburg","hoffenheim","werder",
             "augsburg","heidenheim","union berlin","st. pauli","st pauli","bochum","mainz",
             "holstein kiel"],
    "GER2": ["kaiserslautern","karlsruher","hamburger","hannover","fortuna düsseldorf","schalke",
             "hertha bsc","paderborn","nürnberg","magdeburg","darmstadt","greuther fürth"],
    "ENG1": ["manchester city","arsenal","liverpool","manchester united","chelsea","tottenham",
             "newcastle","aston villa","brighton","west ham","crystal palace","fulham","wolves",
             "wolverhampton","everton","brentford","nottingham","bournemouth","southampton",
             "leicester","ipswich","luton","sheffield united"],
    "ENG2": ["leeds","middlesbrough","sunderland","preston","west brom","millwall","coventry",
             "derby","cardiff","plymouth","qpr","queens park","bristol city","watford","norwich",
             "huddersfield","hull city","swansea","stoke","blackburn","birmingham city","rotherham",
             "reading","dagenham","crawley","cambridge united","peterborough"],
    "ITA1": ["ac milan","juventus","inter milan","internazionale","atalanta","as roma","ss lazio",
             "napoli","fiorentina","bologna","torino","udinese","genoa","como","hellas verona",
             "sassuolo","empoli","lecce","salernitana","venezia","monza","cagliari"],
    "ESP1": ["real madrid","barcelona","atlético madrid","atletico","sevilla","villarreal",
             "real sociedad","athletic club","real betis","valencia","celta de vigo","espanyol",
             "getafe","osasuna","rayo vallecano","mallorca","las palmas","leganés","girona","alavés"],
    "POR1": ["benfica","fc porto","sporting cp","sc braga","vitória","vitoria sc","moreirense",
             "famalicão","gil vicente","boavista","casa pia","estoril","rio ave"],
    "SUI1": ["fc basel","young boys","fc zürich","fc zurich","servette","grasshopper","fc lugano",
             "fc sion","lausanne","luzern","st. gallen","st gallen","yverdon","winterthur"],
    "TUR1": ["galatasaray","fenerbahçe","fenerbahce","beşiktaş","besiktas","trabzonspor",
             "başakşehir","konyaspor","antalyaspor","adana demirspor"],
    "AUT1": ["salzburg","sturm graz","rapid wien","austria wien","lask","wolfsberger"],
    "POL1": ["legia warszawa","lech poznań","pogoń szczecin","jagiellonia","wisła płock"],
    "SAU1": ["al-hilal","al-ittihad","al-nassr","al-ahli"],
    "GRE1": ["olympiacos","panathinaikos","aek athens","paok"],
    "Linafoot RDC": ["kinshasa","mazembe","vita club","daring","renaissance kin","sanga balende",
                     "lubumbashi","dcmp","as v.club","as v club","don bosco","lupopo","virunga",
                     "tshinkunku","linafoot","mwana","as kinshasa","fc msc","tp mazembe","tp molunge",
                     "ofima","saint éloi","bukavu dawa","celtic kasumbalesa","jsk","jeunesse sportive",
                     "rcd kin","muungano","vita kabasha","fc bilima","st michel","fc renaissance",
                     "fc rojolu","cs don bosco","as nika"],
    "Afrique": [
        # Égypte
        "al ahly","zamalek","pyramids","ittihad alex","ismaily","masry","wadi degla","al masry",
        "future fc","el gouna","ceramica cleopatra","aswan","modern sport","el dakhleya","enppi",
        # Maroc / Algérie / Tunisie
        "raja casa","wydad ac","wydad casa","fus rabat","fath us","far rabat","as far","moghreb","kac",
        "rs berkane","cr belouizdad","mc alger","mca","jsk kabyl","jsk","usm alger","es setif","es sétif",
        "es tunis","esperance","club africain","etoile sahel","cs sfaxien","cab","cs hammam",
        # Afrique du Sud
        "kaizer chiefs","orlando pirates","mamelodi sundowns","supersport","stellenbosch","royal am",
        "sekhukhune","chippa","richards bay","amazulu","golden arrows","cape town city","polokwane",
        # Angola
        "petro luanda","kabuscorp","interclube","sagrada","primeiro agosto","1º agosto","sporting cabinda",
        "recreativo libolo","atletico petroleos",
        # Nigeria / Ghana / Sénégal / Côte d'Ivoire / autres ouest
        "enyimba","akwa united","kano pillars","rivers united","plateau united","remo stars",
        "asec mimosas","africa sports","asecmimosas","stade abidjan","san pedro","sewe sport",
        "asante kotoko","hearts of oak","accra hearts","aduana stars","medeama","dreams fc",
        "casa sports","jaraaf","génération foot","generation foot","diambars","teungueth",
        # Congo Brazza
        "fc cara","cara brazzaville","etoile congo","diables noirs","ac léopards",
        # Cameroun (diaspora CM⇆RDC frontière)
        "coton sport","canon yaoundé","pwd bamenda","union douala","stade union","yoshep",
    ],
}


def fetch_all_players_with_club(url, key):
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    all_players = []
    offset = 0
    while True:
        endpoint = (
            f"{url}/rest/v1/players"
            "?current_club=not.is.null"
            "&select=id,name,transfermarkt_id,date_of_birth,position,current_club,current_club_id,"
            "country_of_birth,nationalities,other_nationalities,image_url,market_value_eur,"
            "discovery_method,verified,eligibility_status,caps_rdc,caps_other_count,caps_other_country"
            f"&limit=1000&offset={offset}"
        )
        r = requests.get(endpoint, headers=headers, timeout=20)
        if r.status_code >= 400:
            print(f"ERROR fetching: {r.status_code} {r.text[:200]}", file=sys.stderr)
            sys.exit(1)
        rows = r.json()
        all_players.extend(rows)
        if len(rows) < 1000:
            break
        offset += 1000
    return all_players


def player_in_league(p, league_code, acad_map):
    """Test si un joueur appartient à un championnat donné."""
    club_ids = set()
    for cn, info in acad_map.items():
        if info.get("league") != league_code:
            continue
        club_ids.add(str(info["pro_id"]))
        for ac in info["academies"]:
            club_ids.add(str(ac["id"]))
    cid = p.get("current_club_id")
    if cid and str(cid) in club_ids:
        return True
    keywords = EU_CLUB_PATTERNS.get(league_code, [])
    name = (p.get("current_club") or "").lower()
    return any(k in name for k in keywords)


def fetch_players_in_league(url, key, league_code, acad_map):
    """Charge tous les joueurs avec club connu + filtre côté Python par championnat."""
    all_players = fetch_all_players_with_club(url, key)
    return [p for p in all_players if player_in_league(p, league_code, acad_map)]


def fetch_players_other_europe(url, key, acad_map):
    """Charge les joueurs avec un club mais qui ne matchent AUCUN des 17 championnats
    déjà couverts. Couvre les ligues secondaires Europe (Belgique D2, Croatie, Suède,
    Norvège, Pays-Bas Eerste, Espagne Segunda, etc.) + MLS USA + Hors UE."""
    all_players = fetch_all_players_with_club(url, key)
    KNOWN_LEAGUES = set(EU_CLUB_PATTERNS.keys())
    out = []
    for p in all_players:
        matched = any(player_in_league(p, lg, acad_map) for lg in KNOWN_LEAGUES)
        if not matched:
            # Skip aussi "Hors club" / "Without Club" / career break
            name = (p.get("current_club") or "").lower()
            if any(k in name for k in ["without club", "career break", "retired", "no club", "free agent"]):
                continue
            out.append(p)
    return out


def classify_auto(players):
    """Sépare les joueurs en 3 groupes :
       - auto_confirm : caps_rdc > 0 (Léopards A existants ou passés)
       - auto_locked  : caps_other_count > 3 (FIFA Art 9 — verrouillés autre nation)
       - to_review    : reste (à arbitrer manuellement)
    """
    auto_confirm = []
    auto_locked = []
    to_review = []
    for p in players:
        caps_rdc = p.get("caps_rdc") or 0
        caps_other = p.get("caps_other_count") or 0
        if caps_rdc > 0:
            auto_confirm.append(p)
        elif caps_other > 3:
            auto_locked.append(p)
        else:
            to_review.append(p)
    return auto_confirm, auto_locked, to_review


def render(players, league_label, output):
    REPO_URL = "https://github.com/angm-hub/leopardsradar"
    DISPATCH_URL = f"{REPO_URL}/actions/workflows/bulk-action-players.yml"

    auto_confirm, auto_locked, to_review = classify_auto(players)
    confirm_ids = ",".join(p["transfermarkt_id"] for p in auto_confirm)
    locked_ids = ",".join(p["transfermarkt_id"] for p in auto_locked)
    confirm_names = " · ".join(p["name"] for p in auto_confirm)
    locked_names = " · ".join(
        f"{p['name']} ({p.get('caps_other_country') or '?'}, {p.get('caps_other_count') or 0} caps)"
        for p in auto_locked
    )

    def card(p):
        img = p.get("image_url") or ""
        name = html.escape(p["name"])
        tm_id = p["transfermarkt_id"]
        dob = p.get("date_of_birth") or "?"
        age = (2026 - int(dob[:4])) if dob != "?" and dob[:4].isdigit() else "?"
        club = html.escape(p.get("current_club") or "?")
        cob = html.escape(p.get("country_of_birth") or "—")
        pos = html.escape(p.get("position") or "—")
        nats = p.get("nationalities") or []
        others = [n for n in (p.get("other_nationalities") or []) if n not in nats]
        nats_str = " · ".join(nats + others)
        mv = p.get("market_value_eur")
        mv_s = f"{mv/1_000_000:.1f}M€" if mv and mv >= 1_000_000 else (f"{mv:,}€" if mv else "—")
        caps = p.get("caps_rdc") or 0
        cur_status = p.get("eligibility_status") or "—"
        cur_verified = "✓" if p.get("verified") else "—"
        archived = p.get("archived") or False
        editorial_note = html.escape(p.get("editorial_note") or "")
        is_rdc = "DR Congo" in (nats + others)
        rdc_badge = '<span class="rdc">RDC déclaré</span>' if is_rdc else ""
        caps_badge = f'<span class="caps">{caps} caps A</span>' if caps else ""
        already_verified = (
            '<span class="vrf">déjà verified</span>' if p.get("verified") else ""
        )
        archived_badge = '<span class="arc">archived</span>' if archived else ""

        img_tag = (
            f'<img src="{html.escape(img)}" alt="" onerror="this.style.display=\'none\'"/>'
            if img else '<div class="ph"></div>'
        )
        tm_url = f"https://www.transfermarkt.com/-/profil/spieler/{tm_id}"
        return f'''<article class="card" data-tm="{tm_id}" data-name="{html.escape(name)}">
  <div class="img">{img_tag}</div>
  <div class="meta">
    <div class="top">
      <h3 class="name">{name}</h3>
      <div class="badges">{rdc_badge}{caps_badge}{already_verified}{archived_badge}</div>
    </div>
    <div class="grid">
      <span class="k">Né</span><span class="v">{dob} · {age} ans</span>
      <span class="k">Pays naiss.</span><span class="v">{cob}</span>
      <span class="k">Club</span><span class="v">{club}</span>
      <span class="k">Poste</span><span class="v">{pos}</span>
      <span class="k">Nats</span><span class="v">{nats_str}</span>
      <span class="k">Valeur</span><span class="v">{mv_s}</span>
      <span class="k">Statut</span><span class="v">{cur_status} · verified={cur_verified}</span>
    </div>
    {"<div class='ed-note'>📝 " + editorial_note + "</div>" if editorial_note else ""}
    <a class="tm" href="{tm_url}" target="_blank" rel="noopener">Voir sur Transfermarkt ↗</a>
  </div>
  <div class="actions">
    <button class="act confirm"     data-act="confirm"     title="Léopard confirmé (verified+eligible)">✓ Confirmé</button>
    <button class="act investigate" data-act="investigate" title="À creuser (verified=false, potentially)">~ À creuser</button>
    <button class="act reject"      data-act="reject"      title="Pas Léopard (ineligible)">✗ Pas Léopard</button>
    <button class="act archive"     data-act="archive"     title="Archiver (masqué du front)">📦 Archiver</button>
  </div>
</article>'''

    cards_html = "\n".join(card(p) for p in to_review)

    out = f'''<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8">
<title>Revue éditoriale — {html.escape(league_label)} ({len(players)})</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;800&family=DM+Sans:wght@400;500;700&family=Space+Mono&display=swap" rel="stylesheet">
<style>
  :root {{
    --bg:#0c0d12; --surf:#15171f; --line:#23252e; --ink:#f1efe7; --muted:#878a96;
    --accent:#d9a017; --confirm:#3a9b51; --invest:#d9a017; --reject:#b13a3a; --archive:#5b6271;
    --cobalt:#2554c7;
  }}
  *{{box-sizing:border-box;margin:0;padding:0}}
  body{{font-family:'DM Sans',system-ui;background:var(--bg);color:var(--ink);min-height:100vh;padding:24px;font-size:14px}}
  .container{{max-width:1320px;margin:0 auto}}
  h1{{font-family:Fraunces;font-weight:800;font-size:34px;letter-spacing:-0.02em;margin-bottom:4px}}
  .sub{{color:var(--muted);font-size:13px;margin-bottom:24px;line-height:1.5}}
  .toolbar{{position:sticky;top:0;background:var(--bg);padding:14px 0;margin-bottom:20px;border-bottom:1px solid var(--line);z-index:10;display:flex;gap:10px;flex-wrap:wrap;align-items:center}}
  .toolbar input[type=text]{{font-family:'DM Sans';font-size:13px;padding:8px 12px;border:1px solid var(--line);background:var(--surf);color:var(--ink);min-width:260px;flex:1}}
  .btn{{font-family:'DM Sans';font-size:12px;font-weight:600;padding:8px 14px;border:1px solid var(--line);background:var(--surf);color:var(--ink);cursor:pointer;border-radius:2px;letter-spacing:.02em;text-transform:uppercase;transition:all .15s}}
  .btn:hover{{border-color:var(--accent)}}
  .btn.confirm{{background:var(--confirm);border-color:var(--confirm);color:#fff}}
  .btn.investigate{{background:var(--invest);border-color:var(--invest);color:#000}}
  .btn.reject{{background:var(--reject);border-color:var(--reject);color:#fff}}
  .btn.archive{{background:var(--archive);border-color:var(--archive);color:#fff}}
  .btn.primary{{background:var(--accent);border-color:var(--accent);color:#000}}
  .count{{font-family:'Space Mono';font-size:12px;color:var(--muted);margin-left:auto}}
  .count strong{{font-size:18px;margin-right:4px}}
  .count .c-confirm{{color:var(--confirm)}}
  .count .c-investigate{{color:var(--invest)}}
  .count .c-reject{{color:var(--reject)}}
  .count .c-archive{{color:var(--archive)}}
  .grid-wrap{{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:14px}}
  .card{{background:var(--surf);border:1px solid var(--line);padding:16px;display:flex;flex-direction:column;gap:12px;transition:border .15s;position:relative}}
  .card.act-confirm     {{border-color:var(--confirm);box-shadow:inset 4px 0 0 var(--confirm)}}
  .card.act-investigate {{border-color:var(--invest);box-shadow:inset 4px 0 0 var(--invest)}}
  .card.act-reject      {{border-color:var(--reject);box-shadow:inset 4px 0 0 var(--reject);opacity:.6}}
  .card.act-archive     {{border-color:var(--archive);box-shadow:inset 4px 0 0 var(--archive);opacity:.4}}
  .card .img{{width:64px;height:80px;background:#0a0b10;border:1px solid var(--line);overflow:hidden;float:left;margin-right:12px}}
  .card .img img{{width:100%;height:100%;object-fit:cover}}
  .card .img .ph{{width:100%;height:100%;background:linear-gradient(135deg,#1a1c25,#0d0e15)}}
  .meta{{display:flex;flex-direction:column;flex:1;min-width:0}}
  .top{{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}}
  .name{{font-family:Fraunces;font-weight:600;font-size:17px;line-height:1.2}}
  .badges{{display:flex;flex-wrap:wrap;gap:4px}}
  .badges span{{font-family:'Space Mono';font-size:9px;padding:2px 6px;text-transform:uppercase;letter-spacing:.05em}}
  .rdc{{background:#0a7c4a;color:#fff}}
  .caps{{background:var(--cobalt);color:#fff}}
  .vrf{{background:var(--accent);color:#000}}
  .arc{{background:var(--archive);color:#fff}}
  .grid{{display:grid;grid-template-columns:80px 1fr;gap:2px 8px;font-size:12px;margin-bottom:6px}}
  .k{{color:var(--muted);font-family:'Space Mono';font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding-top:1px}}
  .v{{color:var(--ink)}}
  .tm{{color:var(--cobalt);font-size:11px;text-decoration:none;display:inline-block;margin-top:4px}}
  .tm:hover{{text-decoration:underline}}
  .ed-note{{background:#1a1d27;padding:6px 10px;font-size:11px;color:var(--muted);border-left:2px solid var(--accent);margin-top:4px}}
  .actions{{display:flex;gap:4px;border-top:1px solid var(--line);padding-top:10px;clear:both}}
  .act{{flex:1;font-family:'DM Sans';font-size:11px;padding:7px 4px;border:1px solid var(--line);background:transparent;color:var(--ink);cursor:pointer;border-radius:2px;transition:all .12s}}
  .act:hover{{border-color:var(--accent)}}
  .act.confirm:hover{{background:var(--confirm);color:#fff;border-color:var(--confirm)}}
  .act.investigate:hover{{background:var(--invest);color:#000;border-color:var(--invest)}}
  .act.reject:hover{{background:var(--reject);color:#fff;border-color:var(--reject)}}
  .act.archive:hover{{background:var(--archive);color:#fff;border-color:var(--archive)}}
  .card.act-confirm     .act.confirm{{background:var(--confirm);color:#fff;border-color:var(--confirm)}}
  .card.act-investigate .act.investigate{{background:var(--invest);color:#000;border-color:var(--invest)}}
  .card.act-reject      .act.reject{{background:var(--reject);color:#fff;border-color:var(--reject)}}
  .card.act-archive     .act.archive{{background:var(--archive);color:#fff;border-color:var(--archive)}}
  .modal-bg{{position:fixed;inset:0;background:rgba(0,0,0,.85);display:none;align-items:center;justify-content:center;z-index:100;padding:24px}}
  .modal-bg.show{{display:flex}}
  .modal{{background:var(--surf);border:1px solid var(--line);padding:28px;max-width:680px;width:100%}}
  .modal h2{{font-family:Fraunces;font-weight:600;font-size:24px;margin-bottom:8px}}
  .modal .ml{{color:var(--muted);font-size:13px;margin-bottom:16px}}
  .modal textarea{{width:100%;font-family:'DM Sans';font-size:13px;padding:10px;background:var(--bg);border:1px solid var(--line);color:var(--ink);min-height:80px;margin-bottom:12px}}
  .modal pre{{background:var(--bg);border:1px solid var(--line);padding:12px;font-family:'Space Mono';font-size:11px;overflow-x:auto;max-height:200px;color:var(--accent);margin-bottom:16px;word-break:break-all;white-space:pre-wrap}}
  .modal .mb{{display:flex;gap:8px;justify-content:flex-end}}
  .auto-banner{{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:24px}}
  .ab-block{{background:var(--surf);border:1px solid var(--line);border-left:4px solid var(--confirm);padding:18px}}
  .ab-block.reject{{border-left-color:var(--reject)}}
  .ab-title{{font-family:Fraunces;font-weight:600;font-size:15px;margin-bottom:10px}}
  .ab-names{{font-size:11px;color:var(--muted);line-height:1.5;max-height:90px;overflow-y:auto;margin-bottom:12px;font-family:'Space Mono';padding-right:6px}}
  .ab-actions .btn:disabled{{opacity:.3;cursor:not-allowed}}
  @media (max-width:760px){{.auto-banner{{grid-template-columns:1fr}}}}
</style>
</head><body>
<div class="container">
<h1>Revue éditoriale — {html.escape(league_label)}</h1>
<p class="sub">{len(players)} joueurs détectés dans ce championnat · {len(auto_confirm)} auto-confirmés (Léopards A) · {len(auto_locked)} auto-rejetés (verrouillés autre nation, FIFA Art 9) · <strong>{len(to_review)} à arbitrer ci-dessous</strong>. Pour chaque profil : <strong>Confirmé</strong> / <strong>À creuser</strong> / <strong>Pas Léopard</strong> / <strong>Archiver</strong>.</p>

<div class="auto-banner">
  <div class="ab-block">
    <div class="ab-title">✓ Auto-confirmer {len(auto_confirm)} Léopards A (caps RDC &gt; 0)</div>
    <div class="ab-names">{html.escape(confirm_names) if confirm_names else "(aucun)"}</div>
    <div class="ab-actions">
      <button class="btn confirm" onclick="copyAuto('confirm','{confirm_ids}','Auto-confirm Léopards A {html.escape(league_label)}')" {"disabled" if not confirm_ids else ""}>Copier commande GH</button>
    </div>
  </div>
  <div class="ab-block reject">
    <div class="ab-title">✗ Auto-rejeter {len(auto_locked)} verrouillés (caps autre nation &gt; 3)</div>
    <div class="ab-names">{html.escape(locked_names) if locked_names else "(aucun)"}</div>
    <div class="ab-actions">
      <button class="btn reject" onclick="copyAuto('reject','{locked_ids}','FIFA Art 9 verrouille autre nation > 3 caps')" {"disabled" if not locked_ids else ""}>Copier commande GH</button>
    </div>
  </div>
</div>

<div class="toolbar">
  <input type="text" id="search" placeholder="Filtrer par nom, club, nat..." oninput="applyFilter()">
  <button class="btn primary" onclick="openPublish()">Publier les décisions</button>
  <button class="btn" onclick="resetAll()">Reset tout</button>
  <span class="count">
    <span class="c-confirm"><strong id="cnt-confirm">0</strong>confirmés</span>·
    <span class="c-investigate"><strong id="cnt-investigate">0</strong>à creuser</span>·
    <span class="c-reject"><strong id="cnt-reject">0</strong>rejetés</span>·
    <span class="c-archive"><strong id="cnt-archive">0</strong>archivés</span>·
    <strong id="cnt-total">{len(players)}</strong>total
  </span>
</div>

<div class="grid-wrap" id="grid">
{cards_html}
</div>

</div>

<div class="modal-bg" id="modal">
  <div class="modal">
    <h2>Publier les décisions</h2>
    <p class="ml">Note libre globale (optionnelle, sera enregistrée dans <code>editorial_note</code>) :</p>
    <textarea id="note" placeholder="Ex: revue Ligue 1 sprint mai 2026 — checks Wikipedia parents pour les U21"></textarea>
    <p class="ml">Copie chaque commande, ouvre le workflow GH, colle les inputs (action + tm_ids + note) → Run.</p>
    <pre id="cmd-out">(rien à publier — sélectionne au moins une action)</pre>
    <div class="mb">
      <button class="btn" onclick="closeModal()">Fermer</button>
      <a class="btn primary" href="{DISPATCH_URL}" target="_blank">Ouvrir workflow ↗</a>
    </div>
  </div>
</div>

<script>
const choices = new Map();  // tm_id -> action

function refresh() {{
  const counts = {{confirm: 0, investigate: 0, reject: 0, archive: 0}};
  document.querySelectorAll('.card').forEach(c => {{
    c.classList.remove('act-confirm','act-investigate','act-reject','act-archive');
    const act = choices.get(c.dataset.tm);
    if (act) {{ c.classList.add('act-'+act); counts[act]++; }}
  }});
  Object.entries(counts).forEach(([k,v]) => document.getElementById('cnt-'+k).textContent = v);
}}

document.querySelectorAll('.act').forEach(btn => {{
  btn.addEventListener('click', e => {{
    e.preventDefault();
    const card = btn.closest('.card');
    const tm = card.dataset.tm;
    const act = btn.dataset.act;
    if (choices.get(tm) === act) choices.delete(tm);  // toggle off
    else choices.set(tm, act);
    refresh();
  }});
}});

function resetAll() {{
  if (!confirm('Reset toutes les décisions ?')) return;
  choices.clear();
  refresh();
}}

function applyFilter() {{
  const q = document.getElementById('search').value.toLowerCase();
  document.querySelectorAll('.card').forEach(c => {{
    c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none';
  }});
}}

function openPublish() {{
  const note = (document.getElementById('note').value || '').replace(/"/g, '\\\\"');
  const byAct = {{confirm: [], investigate: [], reject: [], archive: []}};
  choices.forEach((act, tm) => byAct[act].push(tm));
  const cmds = [];
  for (const [act, ids] of Object.entries(byAct)) {{
    if (!ids.length) continue;
    cmds.push(`action: ${{act}}\\ntm_ids: ${{ids.join(',')}}\\nnote: ${{document.getElementById('note').value || ''}}\\n`);
  }}
  const out = cmds.length
    ? cmds.join('\\n────────────────\\n')
    : '(rien à publier — sélectionne au moins une action)';
  document.getElementById('cmd-out').textContent = out;
  document.getElementById('modal').classList.add('show');
}}

function closeModal() {{
  document.getElementById('modal').classList.remove('show');
}}

function copyAuto(action, ids, note) {{
  if (!ids) {{ alert('Aucun joueur dans ce bucket'); return; }}
  const txt = `action: ${{action}}\\ntm_ids: ${{ids}}\\nnote: ${{note}}`;
  navigator.clipboard.writeText(txt).then(() => {{
    const n = ids.split(',').length;
    alert(`${{n}} TM IDs (${{action}}) copiés.\\n\\nOuvre le workflow bulk-action-players → Run workflow → colle les 3 lignes dans les inputs correspondants → Run.`);
  }});
}}
document.getElementById('modal').addEventListener('click', e => {{
  if (e.target.id === 'modal') closeModal();
}});
document.addEventListener('keydown', e => {{
  if (e.key === 'Escape') closeModal();
}});
</script>
</body></html>'''
    Path(output).write_text(out, encoding="utf-8")
    print(f"✓ Wrote {output} ({len(out)//1024}KB) — {len(players)} cards")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--league", help="League code (L1, BEL1, etc.) from academy_map")
    parser.add_argument("--league-label", default=None, help="Display label (default: code)")
    parser.add_argument("--tm-ids", help="CSV des TM IDs à afficher (override --league)")
    parser.add_argument("--output", required=True, help="Output HTML path")
    args = parser.parse_args()

    url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL + SUPABASE_KEY (anon ou SR) requis en env", file=sys.stderr)
        sys.exit(1)
    url = url.rstrip("/")
    for s in ("/rest/v1", "/rest", "/api"):
        if url.endswith(s):
            url = url[: -len(s)].rstrip("/")

    acad_map = json.loads((DATA / "academy_map.json").read_text(encoding="utf-8"))

    if args.tm_ids:
        ids = [s.strip() for s in args.tm_ids.split(",") if s.strip()]
        in_list = "(" + ",".join(ids) + ")"
        endpoint = (
            f"{url}/rest/v1/players?transfermarkt_id=in.{in_list}"
            "&select=id,name,transfermarkt_id,date_of_birth,position,current_club,"
            "country_of_birth,nationalities,other_nationalities,image_url,market_value_eur,"
            "discovery_method,verified,eligibility_status,caps_rdc,caps_other_count,caps_other_country"
        )
        r = requests.get(endpoint, headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=20)
        players = r.json()
    elif args.league == "OTHER-EUROPE":
        players = fetch_players_other_europe(url, key, acad_map)
    else:
        players = fetch_players_in_league(url, key, args.league, acad_map)

    if not players:
        print(f"No players for league={args.league}", file=sys.stderr)
        sys.exit(1)
    label = args.league_label or args.league
    render(players, label, args.output)


if __name__ == "__main__":
    main()
