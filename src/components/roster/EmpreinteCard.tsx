import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { DBPlayer } from "@/types/dbPlayer";
import type { PlayerGradebars } from "@/hooks/usePlayerGradebars";
import {
  POSITION_BADGE,
  POSITION_DOT,
  POSITION_LABEL,
  flagFor,
  formatMarketValue,
  nationalityFr,
} from "@/lib/playerHelpers";
import { LevelBandBadge } from "@/components/player/LevelBandBadge";
import { Empreinte } from "@/components/player/Empreinte";

interface EmpreinteCardProps {
  player: DBPlayer;
  gradebars?: PlayerGradebars;
  className?: string;
}

/**
 * EmpreinteCard — représentation « empreinte » d'un joueur pour le mode
 * Empreintes du roster. La pizza de percentiles est la pièce maîtresse ;
 * l'identité (poste, nationalités, nom, club, valeur) l'entoure.
 *
 * Si les percentiles ne sont pas encore calculables (pool insuffisant), la
 * carte reste propre : identité seule, sans pizza vide (règle LR).
 */
export function EmpreinteCard({ player, gradebars, className }: EmpreinteCardProps) {
  const {
    slug, name, current_club, position, age,
    nationalities, caps_rdc: capsRdc, market_value_eur: marketValue,
    level_band: levelBand, level_score: levelScore,
  } = player;

  const statBits: string[] = [];
  if (age) statBits.push(`${age} ans`);
  if (typeof capsRdc === "number" && capsRdc > 0) statBits.push(`${capsRdc} cap${capsRdc > 1 ? "s" : ""}`);
  if (marketValue && marketValue > 0) statBits.push(formatMarketValue(marketValue));

  const hasPrint = !!gradebars && gradebars.axes.length >= 3;

  return (
    <Link
      to={`/player/${slug}`}
      className={cn(
        "group relative flex flex-col rounded-card overflow-hidden",
        "bg-card border border-border transition-all duration-300",
        "hover:border-border-hover hover:shadow-xl hover:shadow-primary/5",
        className,
      )}
    >
      {/* atmosphère cobalt discrète */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 12%, rgba(74,138,216,.18) 0%, transparent 60%)",
        }}
      />

      {/* rangée haute : poste + niveau / drapeaux */}
      <div className="relative z-[1] flex items-start justify-between gap-2 p-4 pb-0">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {position ? (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              POSITION_BADGE[position],
            )}>
              <span aria-hidden className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[position])} />
              {POSITION_LABEL[position]}
            </span>
          ) : null}
          <LevelBandBadge band={levelBand} score={levelScore} size="sm" showScore={false} />
        </div>
        {nationalities.length > 0 ? (
          <div className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-background/40 border border-border/40 px-2 py-1">
            {nationalities.slice(0, 3).map((nat) => (
              <span key={nat} className="text-sm leading-none" title={nationalityFr(nat)}>
                {flagFor(nat)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* empreinte */}
      <div className="relative z-[1] px-4 pt-2">
        {hasPrint ? (
          <Empreinte axes={gradebars!.axes} poolLabel={gradebars!.pool_label} variant="card" />
        ) : (
          <div className="flex h-[168px] items-center justify-center text-center">
            <p className="max-w-[22ch] text-[11px] text-muted">
              Empreinte en attente : pas encore assez de données à ce poste.
            </p>
          </div>
        )}
      </div>

      {/* identité */}
      <div className="relative z-[1] mt-auto p-4 pt-2">
        {current_club ? (
          <p className="text-sm text-foreground/70 truncate">{current_club}</p>
        ) : null}
        <h3 className="mt-0.5 font-serif text-lg font-semibold text-foreground tracking-tight leading-tight line-clamp-1">
          {name}
        </h3>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {statBits.length > 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-light truncate">
              {statBits.join(" · ")}
            </p>
          ) : <span />}
          {hasPrint ? (
            <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              vs {gradebars!.pool_label}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default EmpreinteCard;
