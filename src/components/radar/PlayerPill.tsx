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

// ── Tier UEFA ────────────────────────────────────────────────────────────────

type TierUEFA = "S" | "A" | "B" | "C";

/**
 * Dérive le tier UEFA d'un joueur.
 *
 * WHY heuristique valeur : le champ `tier` en base (tier1/tier2) n'a pas
 * de granularité suffisante pour distinguer S/A/B/C. On utilise donc la
 * valeur marchande comme proxy — distribution log-normale, les seuils
 * 30M/10M/3M correspondent aux percentiles observés dans le vivier RDC.
 */
function getTierUEFA(player: DBPlayer): TierUEFA {
  const value = player.market_value_eur ?? 0;
  if (value >= 30_000_000) return "S";
  if (value >= 10_000_000) return "A";
  if (value >= 3_000_000) return "B";
  return "C";
}

/**
 * Style de fond/texte par tier.
 *
 * WHY style inline et non classes Tailwind dynamiques : les classes générées
 * à la volée (bg-primary, bg-success/80…) ne sont pas garanties dans le
 * bundle purged — l'inline est la seule approche sûre pour des valeurs
 * runtime.
 */
function getTierStyle(tier: TierUEFA): { bg: string; color: string; border: string } {
  switch (tier) {
    case "S":
      // Jaune RDC — top valeur, Champions League contender
      return {
        bg: "rgba(252,209,22,1)",
        color: "#0A0A0B",
        border: "rgba(252,209,22,0.9)",
      };
    case "A":
      // Vert RDC vif — top 5 européen hors CL
      return {
        bg: "rgba(0,166,81,0.80)",
        color: "#0A0A0B",
        border: "rgba(0,166,81,0.65)",
      };
    case "B":
      // Vert RDC atténué — compétitif Europe/national fort
      return {
        bg: "rgba(0,166,81,0.35)",
        color: "#d1fae5",
        border: "rgba(0,166,81,0.45)",
      };
    default:
      // Gris neutre — autre ou valeur inconnue
      return {
        bg: "rgba(255,255,255,0.10)",
        color: "#a1a1aa",
        border: "rgba(255,255,255,0.12)",
      };
  }
}

// ── Taille proportionnelle ────────────────────────────────────────────────────

const MIN_SIZE = 8;  // px — valeur ≤ 1M ou null
const MAX_SIZE = 32; // px — valeur ≥ 100M

/**
 * Calcule le diamètre de la pill en px selon la valeur marchande.
 *
 * WHY échelle logarithmique : la distribution des valeurs est une power law
 * (quelques joueurs à 50M+, majorité sous 5M). Le log compresse les écarts
 * extrêmes et rend la variation de taille lisible sans écraser les petites
 * valeurs. Le dénominateur log10(100_000_000) = 8 fixe le plafond à 100M.
 */
function getPillSize(value: number | null): number {
  const v = Math.max(value ?? 0, 1);
  const raw = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * (Math.log10(v) / Math.log10(100_000_000));
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, raw));
}

// ── Interface ─────────────────────────────────────────────────────────────────

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
 *  - default  : pill compact avec couleur tier + taille valeur
 *  - featured : pill premium avec avatar + halo doré (top valeur)
 *
 * Couleur = tier UEFA (S jaune / A vert vif / B vert pâle / C gris).
 * Taille  = valeur marchande sur échelle log, 8px → 32px.
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

  const tier = getTierUEFA(player);
  const tierStyle = getTierStyle(tier);
  const pillSize = getPillSize(player.market_value_eur);

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
              tierStyle={tierStyle}
              pillSize={pillSize}
            />
          ) : (
            <DefaultPill
              lastName={lastName}
              positionClass={positionClass}
              tierStyle={tierStyle}
              pillSize={pillSize}
            />
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
  tierStyle,
  pillSize,
}: {
  lastName: string;
  positionClass: string;
  tierStyle: { bg: string; color: string; border: string };
  pillSize: number;
}) {
  return (
    <div
      style={{
        // WHY style inline : les valeurs bg/color/border sont runtime (tier).
        // Les classes Tailwind dynamiques ne survivent pas au purge CSS en prod.
        backgroundColor: tierStyle.bg,
        color: tierStyle.color,
        boxShadow: `0 0 0 0.5px ${tierStyle.border}, 0 2px 6px rgba(0,0,0,0.45)`,
        // Taille proportionnelle à la valeur — largeur min fixée pour le texte.
        minWidth: Math.max(pillSize + 32, 40),
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1",
        "backdrop-blur-sm",
        "transition-[box-shadow,filter,background-color] duration-200",
        "hover:[filter:brightness(1.1)]",
        "group-hover:z-10",
      )}
    >
      <span
        className={cn("shrink-0 rounded-sm", positionClass)}
        style={{ width: pillSize, height: pillSize }}
        aria-hidden
      />
      <span className="text-[12px] font-medium whitespace-nowrap leading-none">
        {lastName}
      </span>
    </div>
  );
}

function FeaturedPill({
  player,
  lastName,
  positionClass,
  tierStyle,
  pillSize,
}: {
  player: DBPlayer;
  lastName: string;
  positionClass: string;
  tierStyle: { bg: string; color: string; border: string };
  pillSize: number;
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
        style={{
          backgroundColor: tierStyle.bg,
          color: tierStyle.color,
          boxShadow: `0 0 0 0.5px ${tierStyle.border}, 0 4px 14px rgba(252,209,22,0.22)`,
        }}
        className={cn(
          "relative flex items-center gap-2 rounded-full pl-1 pr-3 py-1",
          "transition-[box-shadow,filter] duration-200",
          "hover:[filter:brightness(1.08)]",
          "group-hover:z-20",
        )}
      >
        <div className="relative h-7 w-7 rounded-full overflow-hidden border border-primary/50">
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            srcAlt={player.image_url_alt}
            className="h-full w-full"
            initialsClassName="text-[10px]"
          />
        </div>
        <span
          className={cn("shrink-0 rounded-sm", positionClass)}
          style={{ width: pillSize, height: pillSize }}
          aria-hidden
        />
        <span className="font-serif text-[13px] whitespace-nowrap leading-none">
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
