/**
 * PlayerHeaderDense — Header compact style ScoutingStats.
 *
 * Structure :
 *   [Photo] [Nom + Position + Club + Metadata] [4 stats clés]
 *
 * Design : Geist display, palette Cobalt, mono pour labels.
 * Mobile : stack vertical (photo → infos → stats).
 */

import { Link } from "react-router-dom";
import {
  Twitter,
  MessageCircle,
  Link2,
  Check,
  ListPlus,
  ListChecks,
  ArrowLeft,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { Button } from "@/components/ui/ButtonPrimitive";
import { LevelBandBadge } from "@/components/player/LevelBandBadge";
import {
  POSITION_LABEL,
  POSITION_BADGE,
  POSITION_DOT,
  flagFor,
  formatMarketValue,
} from "@/lib/playerHelpers";
import { isLevelBand } from "@/lib/playerLevel";
import { cn } from "@/lib/utils";
import type { DBPlayer } from "@/types/dbPlayer";
import { useMaListeStore } from "@/store/maListeStore";

interface PlayerHeaderDenseProps {
  player: DBPlayer;
  /** Override nombre de matchs (si différent de player.season_games) */
  games?: number | null;
}

export function PlayerHeaderDense({ player, games }: PlayerHeaderDenseProps) {
  const [copied, setCopied] = useState(false);

  const playerSlug = player.slug;
  const isInList = useMaListeStore((s) => {
    if (!playerSlug) return false;
    if (s.bench.some((p) => p.slug === playerSlug)) return true;
    for (const slot of Object.values(s.startingXI)) {
      if (slot?.slug === playerSlug) return true;
    }
    return false;
  });
  const addToBench = useMaListeStore((s) => s.addToBench);

  const isRoster = player.player_category === "roster";
  const rootHref = isRoster ? "/roster" : "/radar";
  const rootLabel = isRoster ? "Roster" : "Radar";

  const matchCount = games ?? player.season_games;
  const hasSeasonData =
    matchCount || player.season_goals || player.season_assists || player.season_rating;

  const handleShare = (channel: "twitter" | "whatsapp" | "copy") => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `${player.name} — ${player.current_club ?? "profil RDC"} sur Léopards Radar`;
    if (channel === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else if (channel === "whatsapp") {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
        "_blank",
        "noopener,noreferrer",
      );
    } else {
      navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="border-b border-border bg-background">
      {/* Breadcrumb */}
      <div className="container-site pt-28 pb-0">
        <nav className="mb-6 flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-[0.18em]">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span className="opacity-40">/</span>
          <Link to={rootHref} className="hover:text-foreground transition-colors">{rootLabel}</Link>
          <span className="opacity-40">/</span>
          <span className="text-foreground/70">{player.name}</span>
        </nav>
      </div>

      {/* Header principal */}
      <div className="container-site pb-8">
        <div className="flex flex-col gap-6 md:flex-row md:gap-10 md:items-start">

          {/* Photo — compact */}
          <div className="relative flex-shrink-0 w-28 h-28 md:w-36 md:h-36 rounded-card overflow-hidden border border-border/60 bg-card">
            <PlayerAvatar
              name={player.name}
              src={player.image_url}
              srcAlt={player.image_url_alt}
              className="h-full w-full"
              initialsClassName="text-4xl"
            />
          </div>

          {/* Infos joueur */}
          <div className="flex-1 min-w-0">
            {/* Kicker */}
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/80 mb-1">
              {player.player_category === "roster"
                ? "Roster · Sélection nationale"
                : player.player_category === "heritage"
                  ? "Héritage RDC"
                  : "Radar · Binational"}
            </p>

            {/* Nom */}
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground leading-tight tracking-tight mb-3"
                style={{ letterSpacing: "-0.03em" }}>
              {player.name}
            </h1>

            {/* Position + Club + Metadata row */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {player.position && (
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em]",
                  POSITION_BADGE[player.position],
                )}>
                  <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[player.position])} />
                  {POSITION_LABEL[player.position]}
                </span>
              )}
              {player.current_club && (
                <span className="text-sm text-foreground/80 font-medium">
                  {player.current_club}
                </span>
              )}
              {player.contract_expires && (
                <span className="text-[11px] text-muted font-mono">
                  jusqu'en {new Date(player.contract_expires).getFullYear()}
                </span>
              )}
            </div>

            {/* Attributs compacts — une ligne de chips */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-4">
              {player.age && (
                <MetaChip label={`${player.age} ans`} />
              )}
              {player.height_cm && (
                <MetaChip label={`${player.height_cm} cm`} />
              )}
              {player.foot && (
                <MetaChip label={`Pied ${player.foot === "left" ? "gauche" : player.foot === "right" ? "droit" : "ambidextre"}`} />
              )}
              {player.nationalities.map((nat) => (
                <span key={nat} className="inline-flex items-center gap-1 text-[11px] text-muted-light">
                  <span className="text-base leading-none">{flagFor(nat)}</span>
                  <span className="font-mono">{nat}</span>
                </span>
              ))}
              {player.market_value_eur && player.market_value_eur > 0 && (
                <MetaChip
                  label={formatMarketValue(player.market_value_eur)}
                  accent
                />
              )}
              {isLevelBand(player.level_band) && (
                <LevelBandBadge
                  band={player.level_band}
                  score={player.level_score}
                  size="sm"
                  showScore
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {player.computed_eligibility_status === "INELIGIBLE" ? (
                <Button size="sm" variant="outline" disabled>
                  <ListPlus className="h-3.5 w-3.5 opacity-50" /> Cap-tied
                </Button>
              ) : isInList ? (
                <Link to="/ma-liste">
                  <Button size="sm" variant="outline">
                    <ListChecks className="h-3.5 w-3.5" /> Dans ma liste
                  </Button>
                </Link>
              ) : (
                <Button
                  size="sm"
                  variant={player.computed_eligibility_status === "POTENTIALLY" ? "outline" : "default"}
                  onClick={() => {
                    addToBench(player);
                    toast.success(
                      player.computed_eligibility_status === "POTENTIALLY"
                        ? `${player.name} ajouté — à instruire avant Mondial.`
                        : `${player.name} ajouté à ta liste.`,
                      {
                        action: {
                          label: "Voir ma liste",
                          onClick: () => { window.location.href = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/ma-liste`; },
                        },
                      },
                    );
                  }}
                >
                  <ListPlus className="h-3.5 w-3.5" />
                  {player.computed_eligibility_status === "POTENTIALLY" ? "Ajouter (à instruire)" : "Ajouter"}
                </Button>
              )}
              <Link to={`/compare?p1=${player.slug}`}>
                <Button variant="outline" size="sm">
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Comparer
                </Button>
              </Link>
              {player.transfermarkt_id && (
                <a
                  href={`https://www.transfermarkt.com/profil/spieler/${player.transfermarkt_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5" /> TM
                  </Button>
                </a>
              )}
              <span className="self-center h-4 w-px bg-border/60 hidden sm:block" />
              <Button variant="outline" size="sm" onClick={() => handleShare("twitter")} aria-label="Partager sur Twitter">
                <Twitter className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare("whatsapp")} aria-label="Partager sur WhatsApp">
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleShare("copy")} aria-label="Copier le lien">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats résumé saison — 4 chiffres en gros */}
        {hasSeasonData ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-card overflow-hidden border border-border">
            <BigStat
              label="MATCHS"
              value={matchCount || 0}
              muted={!matchCount}
            />
            <BigStat
              label="BUTS"
              value={player.season_goals ?? 0}
              muted={!player.season_goals}
              accent={!!player.season_goals && player.season_goals >= 10}
            />
            <BigStat
              label="PASSES DEC."
              value={player.season_assists ?? 0}
              muted={!player.season_assists}
            />
            <BigStat
              label="NOTE MOY."
              value={player.season_rating ? player.season_rating.toFixed(2) : "—"}
              muted={!player.season_rating}
              accent={!!player.season_rating && player.season_rating >= 7}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-px bg-border rounded-card overflow-hidden border border-border">
            <BigStat label="CAPS RDC" value={player.caps_rdc ?? 0} />
            <BigStat
              label="VALEUR MARCHE"
              value={formatMarketValue(player.market_value_eur)}
              muted={!player.market_value_eur}
            />
            <BigStat
              label="BUTS SAISON"
              value={player.season_goals ?? "—"}
              muted={!player.season_goals}
            />
          </div>
        )}
      </div>

      {/* Back link */}
      <div className="container-site pb-3">
        <Link
          to={rootHref}
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> {rootLabel}
        </Link>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaChip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span className={cn(
      "text-[11px] font-mono uppercase tracking-[0.15em]",
      accent ? "text-primary" : "text-muted",
    )}>
      {label}
    </span>
  );
}

function BigStat({
  label,
  value,
  muted = false,
  accent = false,
}: {
  label: string;
  value: string | number;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="bg-card px-4 py-4 md:px-6">
      <div className={cn(
        "font-semibold leading-none",
        "text-2xl md:text-3xl",
        muted ? "text-muted italic" : accent ? "text-primary" : "text-foreground",
      )}
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div className="mt-1.5 text-[9px] font-mono uppercase tracking-[0.22em] text-muted">
        {label}
      </div>
    </div>
  );
}

export default PlayerHeaderDense;
