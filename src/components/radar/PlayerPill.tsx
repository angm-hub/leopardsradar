import { useState, useCallback, useRef, useEffect } from "react";
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

function getTierUEFA(player: DBPlayer): TierUEFA {
  const value = player.market_value_eur ?? 0;
  if (value >= 30_000_000) return "S";
  if (value >= 10_000_000) return "A";
  if (value >= 3_000_000) return "B";
  return "C";
}

function getTierStyle(tier: TierUEFA): { bg: string; color: string; border: string } {
  switch (tier) {
    case "S":
      return {
        bg: "rgba(252,209,22,1)",
        color: "#0A0A0B",
        border: "rgba(252,209,22,0.9)",
      };
    case "A":
      return {
        bg: "rgba(0,166,81,0.80)",
        color: "#0A0A0B",
        border: "rgba(0,166,81,0.65)",
      };
    case "B":
      return {
        bg: "rgba(0,166,81,0.35)",
        color: "#d1fae5",
        border: "rgba(0,166,81,0.45)",
      };
    default:
      return {
        bg: "rgba(255,255,255,0.10)",
        color: "#a1a1aa",
        border: "rgba(255,255,255,0.12)",
      };
  }
}

// ── Taille proportionnelle ────────────────────────────────────────────────────

const MIN_SIZE = 8;
const MAX_SIZE = 32;

function getPillSize(value: number | null): number {
  const v = Math.max(value ?? 0, 1);
  const raw = MIN_SIZE + (MAX_SIZE - MIN_SIZE) * (Math.log10(v) / Math.log10(100_000_000));
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, raw));
}

// ── Detect touch device ───────────────────────────────────────────────────────

function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
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
 * Comportement tooltip :
 *   - Desktop (hover): affichage au survol via CSS group-hover
 *   - Mobile (touch): tap pour ouvrir, tap a l'exterieur pour fermer
 *
 * Au tap/clic sur la pill sur mobile, le tooltip s'affiche. Un clic sur
 * le lien dans le tooltip navigue vers la fiche. Un clic hors tooltip
 * ferme le tooltip via un overlay transparent (pointer-events + useEffect).
 */
export function PlayerPill({
  player,
  x,
  y,
  index,
  featured = false,
}: PlayerPillProps) {
  const reduced = useReducedMotion();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);

  const positionClass = player.position
    ? POSITION_DOT[player.position]
    : "bg-muted";
  const lastName = player.name.split(/\s+/).slice(-1)[0] || player.name;

  const tier = getTierUEFA(player);
  const tierStyle = getTierStyle(tier);
  const pillSize = getPillSize(player.market_value_eur);

  // Drift animation
  const seed = (player.id * 9301 + 49297) % 233280;
  const driftDur = 8 + (seed % 6);
  const driftX = 1.2 + ((seed >> 3) % 18) / 10;
  const driftY = 1.0 + ((seed >> 5) % 15) / 10;
  const driftDelay = (seed % 30) / 10;

  const driftAnim =
    reduced
      ? undefined
      : {
          x: [0, driftX, -driftX * 0.6, 0],
          y: [0, -driftY, driftY * 0.7, 0],
        };

  // Fermeture du tooltip sur clic exterieur (mobile uniquement)
  const handleClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        setTooltipOpen(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!tooltipOpen) return;
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [tooltipOpen, handleClickOutside]);

  // Sur mobile : tap ouvre/ferme le tooltip sans naviguer.
  // Sur desktop : hover CSS suffit, le clic navigue directement.
  const handlePillInteract = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isTouchDevice()) {
        e.preventDefault();
        setTooltipOpen((v) => !v);
      }
    },
    [],
  );

  return (
    <motion.div
      ref={pillRef}
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
        {/* Wrapper group — hover desktop + tap mobile */}
        <div
          className="group relative"
          onTouchStart={handlePillInteract}
          onClick={
            isTouchDevice()
              ? (e) => {
                  if (!tooltipOpen) {
                    e.preventDefault();
                    setTooltipOpen(true);
                  }
                }
              : undefined
          }
        >
          {/* Hover halo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-3 rounded-full opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-80"
            style={{
              background:
                "radial-gradient(circle, rgba(252,209,22,0.45) 0%, rgba(252,209,22,0) 70%)",
            }}
          />

          {/* Lien vers la fiche — s'active sur desktop (pas mobile via pill) */}
          <Link
            to={`/player/${player.slug}`}
            tabIndex={0}
            aria-label={`${player.name}${player.age ? `, ${player.age} ans` : ""}${player.current_club ? `, ${player.current_club}` : ""}`}
            onClick={
              isTouchDevice()
                ? (e) => {
                    // Sur mobile, le clic sur la pill ouvre le tooltip.
                    // La navigation se fait via le bouton dans le tooltip.
                    if (!tooltipOpen) e.preventDefault();
                  }
                : undefined
            }
          >
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
          </Link>

          {/* Tooltip — desktop via CSS group-hover, mobile via state */}
          <PillTooltip player={player} open={tooltipOpen} />
        </div>
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
        backgroundColor: tierStyle.bg,
        color: tierStyle.color,
        boxShadow: `0 0 0 0.5px ${tierStyle.border}, 0 2px 6px rgba(0,0,0,0.45)`,
        minWidth: Math.max(pillSize + 32, 40),
      }}
      className={cn(
        "flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1",
        "backdrop-blur-sm",
        "transition-[box-shadow,filter,background-color] duration-200",
        "hover:[filter:brightness(1.1)]",
        "group-hover:z-10",
        // Touch target minimum 44px via padding vertical supplementaire sur mobile
        "min-h-[28px]",
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
          "min-h-[32px]",
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

/**
 * PillTooltip — version améliorée.
 *
 * Desktop : visible via CSS group-hover (opacity transition).
 * Mobile  : visible via prop `open` (state React controlé par tap).
 *
 * Le tooltip sur mobile inclut un bouton "Voir la fiche" explicite pour
 * eviter la confusion entre tap-tooltip et tap-navigate.
 */
function PillTooltip({ player, open }: { player: DBPlayer; open: boolean }) {
  const isTouch = isTouchDevice();

  return (
    <div
      role="tooltip"
      aria-label={`Detail : ${player.name}`}
      className={cn(
        "pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2",
        "w-56 rounded-card border border-border bg-card",
        "p-3 transition-opacity duration-150",
        "shadow-2xl z-30",
        // Desktop : piloté par CSS hover du parent .group
        // Mobile  : piloté par state `open`
        isTouch
          ? open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0"
          : "opacity-0 group-hover:opacity-100",
      )}
    >
      {/* Photo + nom + club */}
      <div className="flex items-start gap-2.5">
        <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 border border-border">
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
          <span className="text-base leading-none shrink-0">
            {flagFor(player.other_nationalities[0])}
          </span>
        ) : null}
      </div>

      {/* Stats compactes */}
      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-2 border-t border-border/50">
        <span className="text-muted">
          {player.age ? `${player.age} ans` : "—"}
          {player.foot ? ` · ${player.foot === "right" ? "Pied D" : player.foot === "left" ? "Pied G" : "Ambidextre"}` : ""}
        </span>
        {player.market_value_eur && player.market_value_eur > 0 ? (
          <span className="text-primary font-semibold">
            {formatMarketValue(player.market_value_eur)}
          </span>
        ) : null}
      </div>

      {/* Bouton fiche — visible sur mobile uniquement */}
      {isTouch && (
        <Link
          to={`/player/${player.slug}`}
          className="mt-2.5 flex w-full items-center justify-center rounded-button bg-primary/15 border border-primary/30 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary/25 pointer-events-auto"
        >
          Voir la fiche
        </Link>
      )}
    </div>
  );
}
