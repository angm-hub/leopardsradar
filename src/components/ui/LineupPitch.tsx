import { cn } from "@/lib/utils";

export interface LineupPlayer {
  name: string;
  photoUrl: string;
  club: string;
  clubLogoUrl?: string;
  nationalityFlag: string;
  position: string;
}

interface LineupPitchProps {
  formation: "4-3-3" | "4-2-3-1" | "3-5-2";
  players: LineupPlayer[];
  date?: string;
  className?: string;
}

// Coordinates expressed as % of pitch box. y=0 is top (attack), y=100 bottom (GK).
type Slot = { pos: string; x: number; y: number };

const FORMATIONS: Record<LineupPitchProps["formation"], Slot[]> = {
  "4-3-3": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "RB", x: 82, y: 72 },
    { pos: "CB", x: 60, y: 74 },
    { pos: "CB", x: 40, y: 74 },
    { pos: "LB", x: 18, y: 72 },
    { pos: "CM", x: 72, y: 50 },
    { pos: "CM", x: 50, y: 52 },
    { pos: "CM", x: 28, y: 50 },
    { pos: "RW", x: 80, y: 22 },
    { pos: "ST", x: 50, y: 18 },
    { pos: "LW", x: 20, y: 22 },
  ],
  "4-2-3-1": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "RB", x: 82, y: 72 },
    { pos: "CB", x: 60, y: 74 },
    { pos: "CB", x: 40, y: 74 },
    { pos: "LB", x: 18, y: 72 },
    { pos: "CDM", x: 62, y: 56 },
    { pos: "CDM", x: 38, y: 56 },
    { pos: "RAM", x: 78, y: 32 },
    { pos: "CAM", x: 50, y: 34 },
    { pos: "LAM", x: 22, y: 32 },
    { pos: "ST", x: 50, y: 14 },
  ],
  "3-5-2": [
    { pos: "GK", x: 50, y: 90 },
    { pos: "CB", x: 72, y: 74 },
    { pos: "CB", x: 50, y: 76 },
    { pos: "CB", x: 28, y: 74 },
    { pos: "RWB", x: 88, y: 50 },
    { pos: "CM", x: 65, y: 52 },
    { pos: "CM", x: 50, y: 54 },
    { pos: "CM", x: 35, y: 52 },
    { pos: "LWB", x: 12, y: 50 },
    { pos: "ST", x: 60, y: 18 },
    { pos: "ST", x: 40, y: 18 },
  ],
};

function PitchSVG() {
  return (
    <svg
      viewBox="0 0 400 500"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0D2818" />
          <stop offset="55%" stopColor="#0B1F12" />
          <stop offset="100%" stopColor="#0A0A0B" />
        </linearGradient>
        <pattern
          id="mowStripes"
          patternUnits="userSpaceOnUse"
          width="400"
          height="50"
        >
          <rect width="400" height="50" fill="transparent" />
          <rect width="400" height="25" fill="rgba(255,255,255,0.018)" />
        </pattern>
        <radialGradient id="centerGlow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="rgba(252,209,22,0.10)" />
          <stop offset="100%" stopColor="rgba(252,209,22,0)" />
        </radialGradient>
      </defs>

      <rect width="400" height="500" fill="url(#pitchGrad)" />
      <rect width="400" height="500" fill="url(#mowStripes)" />
      <rect width="400" height="500" fill="url(#centerGlow)" />

      <g
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.2"
      >
        {/* Outer border */}
        <rect x="14" y="14" width="372" height="472" rx="2" />
        {/* Center line */}
        <line x1="14" y1="250" x2="386" y2="250" />
        {/* Center circle + spot */}
        <circle cx="200" cy="250" r="48" />
        <circle cx="200" cy="250" r="2" fill="rgba(255,255,255,0.4)" stroke="none" />
        {/* Top penalty box (attack) */}
        <rect x="100" y="14" width="200" height="70" />
        <rect x="150" y="14" width="100" height="28" />
        <circle cx="200" cy="92" r="2" fill="rgba(255,255,255,0.4)" stroke="none" />
        <path d="M 160 84 A 50 50 0 0 0 240 84" />
        {/* Bottom penalty box (defense / GK) */}
        <rect x="100" y="416" width="200" height="70" />
        <rect x="150" y="458" width="100" height="28" />
        <circle cx="200" cy="408" r="2" fill="rgba(255,255,255,0.4)" stroke="none" />
        <path d="M 160 416 A 50 50 0 0 1 240 416" />
      </g>
    </svg>
  );
}

export function LineupPitch({
  formation,
  players,
  date,
  className,
}: LineupPitchProps) {
  const slots = FORMATIONS[formation];

  return (
    <div
      className={cn(
        "relative w-full aspect-[4/5] overflow-hidden rounded-card border border-border bg-[#0A0A0B] shadow-2xl",
        className,
      )}
    >
      <PitchSVG />

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-lg shadow-primary/20">
          Best XI Diaspora
        </span>
        {date && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/70">
            {date}
          </span>
        )}
      </div>

      {/* Formation label */}
      <div className="absolute top-12 left-1/2 z-10 -translate-x-1/2 font-serif text-xs italic text-white/40">
        {formation}
      </div>

      {/* Players */}
      {slots.map((slot, i) => {
        const player = players[i];
        if (!player) return null;
        return (
          <div
            key={`${slot.pos}-${i}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -m-2 rounded-full bg-primary/40 blur-md"
                />
                <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-full border-[3px] border-primary bg-card shadow-lg shadow-primary/30">
                  <img
                    src={player.photoUrl}
                    alt={player.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <span className="font-serif text-[11px] sm:text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap">
                {player.name}
              </span>
              <div className="flex items-center gap-1 text-[9px] text-white/70">
                {player.clubLogoUrl ? (
                  <img
                    src={player.clubLogoUrl}
                    alt=""
                    aria-hidden
                    className="h-4 w-4 object-contain"
                  />
                ) : (
                  <span className="h-1 w-1 rounded-full bg-white/40" />
                )}
                <span className="leading-none">{player.nationalityFlag}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Footer watermark */}
      <div className="absolute bottom-3 left-0 right-0 z-20 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
        leopardsradar.com
      </div>

      {/* Subtle vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.55)_100%)]"
      />
    </div>
  );
}

export default LineupPitch;
