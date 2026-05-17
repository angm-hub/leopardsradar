"""
stats_sources — modules de scraping individuels pour le pipeline multi-source.

Chaque module expose une fonction fetch(player: dict) -> dict | None
qui retourne une structure normalisee :

{
    "source":          str,           # 'fbref' | 'transfermarkt' | 'soccerway' | 'sofascore' | 'understat'
    "season":          str,           # '2025-2026'
    "competition":     str | None,    # nom de la competition (None = tous aggreges)
    "competition_tier":int | None,
    "matches_played":  int | None,
    "minutes_played":  int | None,
    "goals":           int | None,
    "assists":         int | None,
    "xg":              float | None,
    "xa":              float | None,
    "yellow_cards":    int | None,
    "red_cards":       int | None,
    "source_url":      str,
    "confidence":      str,           # 'HIGH' | 'MEDIUM' | 'LOW'
}

Une liste de telles structures est retournee quand il y a plusieurs
competitions pour le meme joueur (cas FBRef, TM, Soccerway).
Le caller (sync_stats_multi.py) assemble les listes et ecrit dans
player_stats_multi.
"""
