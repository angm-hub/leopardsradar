#!/usr/bin/env python3
"""
Léopards Radar — Audit cohérence caps (sélections cache vs réel).

Problème : players.caps_rdc est un entier dénormalisé mis à jour manuellement
ou via Transfermarkt. Si des sélections sont insérées/supprimées sans recalcul
du compteur, l'écart se creuse silencieusement.

Ce script détecte les joueurs roster dont l'écart ABS(caps_rdc - real_count) > 2
et les écrit dans caps_audit_findings pour revue humaine via l'admin Supabase.

Prérequis : migration 2026_05_15_caps_audit_findings.sql appliquée en base.

Usage :
  python audit_caps_consistency.py [--dry-run] [--gap-threshold N]

Variables d'env :
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
import traceback

from supabase_client import SupabaseClient

JOB_NAME = "audit-caps"
DEFAULT_GAP_THRESHOLD = 2   # écart acceptable avant alerte


def fetch_players_with_real_caps(sb: SupabaseClient) -> list[dict]:
    """
    Charge tous les joueurs roster avec leur caps_rdc dénormalisé.

    Le calcul du vrai compte se fait côté Python plutôt que via SQL complexe,
    pour rester compatible avec l'API REST Supabase (pas de GROUP BY natif
    via l'endpoint REST sans RPC). On fait :
      1. SELECT des joueurs roster avec caps_rdc
      2. Pour chaque joueur : COUNT des sélections officielles en RDC
    C'est plus lent (~1 req/joueur) mais robuste et sans dépendance RPC.
    """
    # On limite aux joueurs roster — les candidats radar n'ont pas de caps_rdc fiable
    players = sb.select(
        "players",
        select="id,name,caps_rdc",
        player_category="eq.roster",
        order="name.asc",
    )
    return players


def count_real_caps(sb: SupabaseClient, player_id: int) -> int:
    """
    Compte les vraies sélections A (officielles + amiaux) pour un joueur RDC.

    On filtre sur federation_code = COD (code FIFA de la RDC) et les
    catégories A-level (pas les jeunes U23, U17, etc.).
    """
    # L'API REST Supabase supporte le count via l'en-tête Prefer: count=exact
    # mais notre client léger ne le gère pas. On fait un SELECT minimal
    # et on compte côté Python — acceptable pour ~65 joueurs roster.
    sels = sb.select(
        "selections",
        select="id",
        **{
            "player_id": f"eq.{player_id}",
            "federation_code": "eq.COD",
            "category": "in.(A_OFFICIAL,A_FRIENDLY)",
        },
    )
    return len(sels)


def upsert_finding(
    sb: SupabaseClient,
    player_id: int,
    cached_caps: int,
    real_count: int,
    gap: int,
    dry_run: bool,
) -> None:
    """
    Insère ou met à jour une finding dans caps_audit_findings.

    Logique :
    - Si une finding PENDING existe déjà pour ce joueur (même audit_date ou non),
      on update le gap — évite le spam de lignes identiques à chaque run.
    - Si la finding existante est REVIEWED ou FIXED, on laisse en paix :
      un humain a déjà regardé, ne pas écraser sa décision.
    - Sinon, on insère.
    """
    if dry_run:
        print(f"    [dry-run] finding : player_id={player_id}, cached={cached_caps}, "
              f"real={real_count}, gap={gap}")
        return

    # Chercher une finding pending existante pour ce joueur
    existing = sb.select(
        "caps_audit_findings",
        **{
            "player_id": f"eq.{player_id}",
            "status": "eq.pending",
            "select": "id",
            "limit": "1",
        },
    )

    today = dt.date.today().isoformat()

    if existing:
        # Update le gap et la date d'audit — ne pas recréer
        finding_id = existing[0]["id"]
        sb.update(
            "caps_audit_findings",
            {"id": f"eq.{finding_id}"},
            {
                "audit_date": today,
                "cached_caps": cached_caps,
                "real_selections_count": real_count,
                "gap": gap,
            },
        )
    else:
        sb.insert("caps_audit_findings", {
            "player_id": player_id,
            "audit_date": today,
            "cached_caps": cached_caps,
            "real_selections_count": real_count,
            "gap": gap,
            "status": "pending",
        })


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Affiche les écarts sans écrire dans caps_audit_findings",
    )
    parser.add_argument(
        "--gap-threshold",
        type=int,
        default=DEFAULT_GAP_THRESHOLD,
        help=f"Seuil d'écart pour déclencher une alerte (défaut : {DEFAULT_GAP_THRESHOLD})",
    )
    args = parser.parse_args()

    started_at = dt.datetime.utcnow()
    print(f"=== Léopards Radar — Audit Caps Consistency ===")
    print(f"Start : {started_at.isoformat()}Z | Dry run : {args.dry_run} | Seuil : >{args.gap_threshold}")

    sb = SupabaseClient()
    try:
        sb.ping()
        print("[Supabase] auth OK")
    except RuntimeError as e:
        print(f"!!! ABORTING: {e}", file=sys.stderr)
        sys.exit(1)

    players = fetch_players_with_real_caps(sb)
    print(f"Joueurs roster chargés : {len(players)}")

    stats = {
        "checked": 0,
        "with_gap": 0,
        "findings_written": 0,
        "errors_count": 0,
        "error_details": [],
    }

    findings_summary = []

    for player in players:
        pid = player["id"]
        name = player.get("name", f"id={pid}")
        cached = player.get("caps_rdc") or 0

        try:
            real = count_real_caps(sb, pid)
            gap = abs(cached - real)

            stats["checked"] += 1

            if gap > args.gap_threshold:
                stats["with_gap"] += 1
                findings_summary.append({
                    "player_id": pid,
                    "name": name,
                    "cached": cached,
                    "real": real,
                    "gap": gap,
                })
                print(f"  [ÉCART] {name:30} | cached={cached:3} | réel={real:3} | Δ={gap}")
                upsert_finding(sb, pid, cached, real, gap, args.dry_run)
                if not args.dry_run:
                    stats["findings_written"] += 1
            else:
                # Pas d'écart significatif — ne pas polluer la sortie
                pass

        except Exception as e:
            stats["errors_count"] += 1
            stats["error_details"].append({
                "player_id": pid,
                "name": name,
                "error": f"{type(e).__name__}: {e}",
                "traceback": traceback.format_exc()[-400:],
            })
            print(f"  [ERREUR] {name} : {e}", file=sys.stderr)

    # Log dans sync_logs (résumé structuré)
    finished_at = dt.datetime.utcnow()
    duration_seconds = int((finished_at - started_at).total_seconds())
    log_status = "success" if stats["errors_count"] == 0 else "partial"

    if not args.dry_run:
        sb.insert("sync_logs", {
            "job_name": JOB_NAME,
            "status": log_status,
            "players_processed": stats["checked"],
            "players_updated": stats["findings_written"],
            "candidates_discovered": 0,
            "errors_count": stats["errors_count"],
            "error_details": {
                "errors": stats["error_details"][:20],
                "findings": findings_summary,
            },
            "started_at": started_at.isoformat() + "Z",
            "finished_at": finished_at.isoformat() + "Z",
            "duration_seconds": duration_seconds,
            "github_run_url": os.environ.get("GITHUB_RUN_URL"),
        })

    print(f"\n=== Récap ===")
    print(f"Joueurs vérifiés : {stats['checked']}")
    print(f"Écarts > {args.gap_threshold}      : {stats['with_gap']}")
    print(f"Findings écrites : {stats['findings_written']}")
    print(f"Erreurs          : {stats['errors_count']}")
    print(f"Durée            : {duration_seconds}s")

    if stats["with_gap"] > 0:
        print(f"\n→ {stats['with_gap']} joueur(s) à vérifier dans admin/caps-audit")

    if stats["errors_count"] > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
