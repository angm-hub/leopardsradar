#!/usr/bin/env python3
"""Enrichissement Wikidata -> SIGNAUX eligibilite (citoyennete P27, selections nationales P54,
pays de naissance P19->P17). Ne remplit que le vide, JAMAIS de verdict d'eligibilite.
Complementaire de discover_wikidata.py (qui, lui, decouvre de nouveaux joueurs).

Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Args: --limit N | --rescan-all (rejoue les fiches deja scannees sans data) | --dry-run

Match: footballeur (P106) OU date de naissance exacte ; rejet si la DOB Wikidata contredit la notre.
Selections nationales: P54 filtre (P31=Q6979593 ou libelle 'de football'/'national'), cache par equipe.
"""
import os, re, sys, time, argparse
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests

WD="https://www.wikidata.org/w/api.php"
WDUA={"User-Agent":"LeopardsRadar-enrichment/1.0 (alexandre@withkaira.com)"}
FOOTBALLER={"Q937857","Q628099"}
NAT_RE=re.compile(r"(de football|national)", re.I)  # segment garde uniquement s'il matche (filtre club)
CLUB_HINT=re.compile(r"(équipe|selecc|seleç|national|nationalmannschaft|nazionale)\s.*\b(football|calcio|fútbol|futbol|voetbal)|"
                     r"\bU-?(15|16|17|18|19|20|21|23)\b|olympique|olympic", re.I)
_teamcache={}

URL=os.environ.get("SUPABASE_URL","").rstrip("/")
KEY=os.environ.get("SUPABASE_SERVICE_ROLE_KEY","")
if URL.endswith("/rest/v1"): URL=URL[:-8]  # tolere le secret pollue (cf. incident press-rss)
SBH={"apikey":KEY,"Authorization":f"Bearer {KEY}","Content-Type":"application/json"}

def wd(params):
    params.update(format="json")
    for _ in range(3):
        try: return requests.get(WD, params=params, headers=WDUA, timeout=25).json()
        except Exception: time.sleep(1.5)
    return {}
def search(name):
    ids=[]
    for lang in ("fr","en"):
        for x in wd(dict(action="wbsearchentities",search=name,language=lang,uselang=lang,type="item",limit=8)).get("search",[]):
            if x["id"] not in ids: ids.append(x["id"])
    return ids[:12]
def ents(ids, props):
    out={}
    for i in range(0,len(ids),45):
        out.update(wd(dict(action="wbgetentities",ids="|".join(ids[i:i+45]),props=props,languages="fr|en")).get("entities",{}))
    return out
def cids(e,pid):
    r=[]
    for c in e.get("claims",{}).get(pid,[]):
        try: r.append(c["mainsnak"]["datavalue"]["value"]["id"])
        except Exception: pass
    return r
def cyear(e):
    for c in e.get("claims",{}).get("P569",[]):
        try: return c["mainsnak"]["datavalue"]["value"]["time"][1:5]
        except Exception: pass
    return None
def lbl(e):
    l=e.get("labels",{}); return (l.get("fr") or l.get("en") or {}).get("value")

def national_teams(team_qids):
    todo=[q for q in team_qids if q not in _teamcache]
    if todo:
        es=ents(todo,"claims|labels")
        for q in todo:
            e=es.get(q,{}); name=lbl(e) or ""
            isnat=("Q6979593" in set(cids(e,"P31"))) or bool(CLUB_HINT.search(name))
            _teamcache[q]=(isnat,name)
    out=[_teamcache[q][1] for q in team_qids if _teamcache.get(q,(False,None))[0] and _teamcache[q][1]]
    # 2e filtre anti-club : ne garder que les libelles de selection nationale
    return [n for n in out if NAT_RE.search(n)]

def resolve(p):
    name,dob=p["name"],(p.get("date_of_birth") or ""); yr=dob[:4]
    ids=search(name)
    row={"id":p["id"]}
    if not ids: return row
    es=ents(ids,"claims|labels")
    best=None;bestscore=0
    for q in ids:
        e=es.get(q,{}); y=cyear(e)
        if y and yr and y!=yr: continue
        foot=bool(set(cids(e,"P106"))&FOOTBALLER); hasP54=bool(e.get("claims",{}).get("P54")); dobok=bool(y and yr and y==yr)
        if not (foot or dobok): continue
        sc=(3 if dobok else 0)+(2 if foot else 0)+(1 if hasP54 else 0)
        if sc>bestscore: bestscore=sc; best=(q,e)
    if not best or bestscore<3: return row
    q,e=best; row["wikidata_qid"]=q
    cit_q=cids(e,"P27"); place_q=cids(e,"P19")
    aux=ents(list(set(cit_q+place_q)),"claims|labels") if (cit_q or place_q) else {}
    cits=[lbl(aux.get(c,{})) for c in cit_q]; cits=[c for c in cits if c]
    if cits: row["wikidata_citizenships"]="; ".join(cits)
    if place_q and cyear(e)==yr and not p.get("country_of_birth"):
        pe=aux.get(place_q[0],{}); co=cids(pe,"P17")
        if co:
            cl=lbl(ents(co,"labels").get(co[0],{}))
            if cl: row["country_of_birth"]=cl
    nat=national_teams(cids(e,"P54"))
    if nat: row["wikidata_national_teams"]="; ".join(dict.fromkeys(nat))
    return row

def fetch_pool(rescan_all, limit):
    filt="&wikidata_checked_at=is.null" if not rescan_all else "&wikidata_qid=is.null"
    pool=[]; off=0
    while True:
        q=(f"{URL}/rest/v1/players?select=id,name,date_of_birth,country_of_birth"
           f"&archived=eq.false{filt}&order=id&offset={off}&limit=1000")
        b=requests.get(q, headers=SBH, timeout=40).json()
        if not b: break
        pool+=b; off+=len(b)
        if len(b)<1000 or (limit and len(pool)>=limit): break
    return pool[:limit] if limit else pool

def write(row, dry):
    fields={k:v for k,v in row.items() if k!="id"}
    fields["wikidata_checked_at"]=datetime.now(timezone.utc).isoformat()
    if dry: return 200
    r=requests.patch(f"{URL}/rest/v1/players?id=eq.{row['id']}", headers={**SBH,"Prefer":"return=minimal"}, json=fields, timeout=25)
    return r.status_code

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("--limit",type=int,default=0)
    ap.add_argument("--rescan-all",action="store_true"); ap.add_argument("--dry-run",action="store_true")
    a=ap.parse_args()
    if not URL or not KEY: print("ERREUR: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants"); sys.exit(1)
    pool=fetch_pool(a.rescan_all, a.limit)
    print(f"pool={len(pool)} rescan_all={a.rescan_all} dry={a.dry_run}", flush=True)
    st={"m":0,"cit":0,"nat":0,"cob":0}; done=0
    with ThreadPoolExecutor(max_workers=5) as ex:
        futs={ex.submit(resolve,p):p for p in pool}
        for f in as_completed(futs):
            done+=1; r=f.result()
            if r.get("wikidata_qid"): st["m"]+=1
            if r.get("wikidata_citizenships"): st["cit"]+=1
            if r.get("wikidata_national_teams"): st["nat"]+=1
            if r.get("country_of_birth"): st["cob"]+=1
            write(r, a.dry_run)
            if done%100==0: print(f"  ...{done}/{len(pool)} m={st['m']} cit={st['cit']} nat={st['nat']} cob={st['cob']}", flush=True)
    print(f"[FIN] {len(pool)} traites | match {st['m']} | citoyennete {st['cit']} | selections {st['nat']} | pays_naiss {st['cob']}", flush=True)

if __name__=="__main__": main()
