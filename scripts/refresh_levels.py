#!/usr/bin/env python3
"""
Léopards Radar — Refresh quotidien des level_score / level_band.

Appelle la fonction Postgres refresh_player_levels(NULL) via l'API RPC
Supabase, puis logue le résultat dans sync_logs.

Utilisé par :
  .github/workflows/refresh-levels.yml  (cron 03h00 UTC chaque jour)

Variables d'environnement requises :
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Options CLI :
  --dry-run  Affiche ce qui serait fait sans appeler la fonction Postgres

Usage local :
  cd scripts && python refresh_levels.py
  cd scripts && python refresh_levels.py --dry-run
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import sys
import traceback

from supabase_client import SupabaseClient

# ─────────────────────────────────────────────────────────────────────────────
# Constantes
# ─────────────────────────────────────────────────────────────────────────────

JOB_NAME = "refresh-levels"


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh player level_score / level_band")
    parser.add_argument("--dry-run", action="store_true", help="Affiche sans modifier la base")
    args = parser.parse_args()

    # L'URL de run est injectée par GH Actions pour le log — pas critique en local.
    github_run_url = os.environ.get("GITHUB_RUN_URL", "local")

    try:
        db = SupabaseClient()
        db.ping()
    except RuntimeError as exc:
        print(f"[{JOB_NAME}] ERREUR connexion Supabase : {exc}", file=sys.stderr)
        return 1

    if args.dry_run:
        print(f"[{JOB_NAME}] --dry-run actif : aucun appel à refresh_player_levels().")
        print(f"[{JOB_NAME}] En prod, la fonction MaJ players.level_score / level_band pour tous les joueurs.")
        return 0

    started_at = dt.datetime.utcnow()
    players_updated = 0
    error_detail: str | None = None
    status = "success"

    try:
        # Appel RPC — refresh_player_levels(NULL) = refresh global.
        # La fonction retourne le nombre de lignes effectivement modifiées.
        result = db.rpc("refresh_player_levels", {"target_player_id": None})

        # La fonction retourne un entier scalaire (via GET DIAGNOSTICS).
        # Le wrapper REST Supabase enveloppe ça dans un entier brut.
        if isinstance(result, int):
            players_updated = result
        elif isinstance(result, list) and len(result) > 0:
            # Certaines versions du wrapper retournent [int]
            players_updated = result[0] if isinstance(result[0], int) else 0
        else:
            players_updated = 0

        elapsed = (dt.datetime.utcnow() - started_at).total_seconds()
        print(f"[{JOB_NAME}] {players_updated} joueur(s) mis à jour en {elapsed:.1f}s")

    except Exception as exc:
        status = "error"
        error_detail = traceback.format_exc()
        print(f"[{JOB_NAME}] ERREUR lors du refresh : {exc}", file=sys.stderr)
        print(error_detail, file=sys.stderr)

    # ── Log dans sync_logs ───────────────────────────────────────────────────
    # On logue même en cas d'erreur pour garder une trace complète.
    try:
        db.insert("sync_logs", {
            "job_name":        JOB_NAME,
            "started_at":      started_at.isoformat() + "Z",
            "finished_at":     dt.datetime.utcnow().isoformat() + "Z",
            "players_updated": players_updated,
            "status":          status,
            "error_detail":    error_detail,
            "github_run_url":  github_run_url,
        })
    except Exception as log_exc:
        # Le log échoue → on signale mais ce n'est pas bloquant.
        print(f"[{JOB_NAME}] WARNING : impossible de logger dans sync_logs : {log_exc}", file=sys.stderr)

    return 0 if status == "success" else 1


if __name__ == "__main__":
    sys.exit(main())
