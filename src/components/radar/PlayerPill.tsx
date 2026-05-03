import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { flagFor, formatMarketValue } from "@/lib/playerHelpers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

const POSITION_DOT: Record<DBPosition, string> = {
  Goalkeeper: "bg-pos-gk",
  Defender: "bg-pos-def",
  Midfield: "bg-pos-mid",
  Attack: "bg-pos-att",
};

interface PlayerPillProps {
  player: DBPlayer;
  x: number;
  y: number;
  index: number;
  featured?: boolean;
}

/**
 * PlayerPill — un joueur sur le canvas Radar.
 *
 * Variants :
 *  - default  : pill compact opaque (marker + nom)
 *  - featured : pill premium avec avatar + halo doré (top valeur)
 *
 * Choix de clarté : background à 95% d'opacité (pas semi-transparent)
 * pour que le texte reste 100% lisible quoi qu'il y ait derrière.
 */
export function PlayerPill({
  player,
  x,
  y,
  index,
  featured = false,
}: PlayerPillProps) {
  const reduced = useReducedMotion();
  const positionClass = player.position
    ? POSITION_DOT[player.position]
    : "bg-muted";
  const lastName = player.name.split(/\s+/).slice(-1)[0] || player.name;

  // Per-pill deterministic drift parameters. Same player.id always yields
  // the same drift so the cloud feels alive without ever shifting state
  // between renders.
  const seed = (player.id * 9301 + 49297) % 233280;
  const driftDur = 8 + (seed % 6); // 8s..14s
  const driftX = 1.2 + ((seed >> 3) % 18) / 10; // 1.2..3.0px
  const driftY = 1.0 + ((seed >> 5) % 15) / 10; // 1.0..2.5px
  const driftDelay = (seed % 30) / 10; // 0..3s phase offset

  // Continuous drift only kicks in for users who haven't requested
  // reduced motion. Featured pills get the same drift — the halo plays
  // the differentiation role on its own.
  const driftAnim =
    reduced
      ? undefined
      : {
          x: [0, driftX, -driftX * 0.6, 0],
          y: [0, -driftY, driftY * 0.7, 0],
        };

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index * 0.012, 1),
        ease: [0.22, 0.8, 0.2, 1],
      }}
    >
      <motion.div
        animate={driftAnim}
        transition={
          reduced
            ? undefined
            : {
                duration: driftDur,
                delay: driftDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        <Link to={`/player/${player.slug}`} className="group relative block">
          {/* Hover halo — soft radial glow that intensifies on hover.
              Opacity 0 by default so it never adds visual noise to the
              resting state. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-80"
            style={{
              background:
                "radial-gradient(circle, rgba(252,209,22,0.45) 0%, rgba(252,209,22,0) 70%)",
            }}
          />
          {featured ? (
            <FeaturedPill
              player={player}
              lastName={lastName}
              positionClass={positionClass}
            />
          ) : (
            <DefaultPill lastName={lastName} positionClass={positionClass} />
          )}
          <PillTooltip player={player} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

function DefaultPill({
  lastName,
  positionClass,
}: {
  lastName: string;
  positionClass: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1",
        "bg-card/95 backdrop-blur-sm",
        "[box-shadow:0_0_0_0.5px_rgba(255,255,255,0.06),0_2px_6px_rgba(0,0,0,0.45)]",
        "transition-[box-shadow,filter,background-color] duration-200",
        "hover:[filter:brightness(1.1)]",
        "hover:[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.5),0_4px_14px_rgba(252,209,22,0.18)]",
        "group-hover:z-10",
      )}
    >
      <span
        className={cn("h-2.5 w-2.5 rounded-sm shrink-0", positionClass)}
        aria-hidden
      />
      <span className="text-[12px] font-medium text-foreground whitespace-nowrap leading-none">
        {lastName}
      </span>
    </div>
  );
}

function FeaturedPill({
  player,
  lastName,
  positionClass,
}: {
  player: DBPlayer;
  lastName: string;
  positionClass: string;
}) {
  return (
    <div className="relative">
      {/* Halo doux */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(circle, rgba(252,209,22,0.55) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex items-center gap-2 rounded-full pl-1 pr-3 py-1",
          "bg-card",
          "[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.55),0_4px_14px_rgba(252,209,22,0.22)]",
          "transition-[box-shadow,filter] duration-200",
          "hover:[filter:brightness(1.08)]",
          "hover:[box-shadow:0_0_0_0.5px_rgba(252,209,22,0.85),0_6px_18px_rgba(252,209,22,0.32)]",
          "group-hover:z-20",
        )}
      >
        <div className="relative h-7 w-7 rounded-full overflow-hidden border border-primary/50">
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className="h-full w-full"
            initialsClassName="text-[10px]"
          />
        </div>
        <span
          className={cn("h-2 w-2 rounded-sm shrink-0", positionClass)}
          aria-hidden
        />
        <span className="font-serif text-[13px] text-foreground whitespace-nowrap leading-none">
          {lastName}
        </span>
      </div>
    </div>
  );
}

function PillTooltip({ player }: { player: DBPlayer }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2",
        "w-60 rounded-card border border-border bg-card",
        "p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
        "shadow-2xl z-30",
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-border">
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className="h-full w-full"
            initialsClassName="text-xs"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif text-sm text-foreground truncate">
            {player.name}
          </p>
          {player.current_club ? (
            <p className="text-[10px] text-muted-light truncate mt-0.5">
              {player.current_club}
            </p>
          ) : null}
        </div>
        {player.other_nationalities.length > 0 ? (
          <span className="text-base leading-none">
            {flagFor(player.other_nationalities[0])}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-border/50">
        <span className="text-muted">
          {player.age ? `${player.age} ans` : "—"}
        </span>
        {player.market_value_eur && player.market_value_eur > 0 ? (
          <span className="text-primary">
            {formatMarketValue(player.market_value_eur)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
