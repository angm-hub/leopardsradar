import { useMemo } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { FORMATION_SLOTS } from "@/types/maListe";
import type { Formation, SlotPosition } from "@/types/maListe";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import { formatMarketValue } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";

export type ShareFormat = "story" | "og";

interface Props {
  format: ShareFormat;
  formation: Formation;
  startingXI: Record<string, DBPlayer | null>;
  bench: DBPlayer[];
  captain: DBPlayer;
  pseudo?: string | null;
  slug?: string | null;
}

/* ─────────────────────────────────────────────────────────────
 * BRAND TOKENS — must match site (tailwind.config.ts)
 * ───────────────────────────────────────────────────────────── */
const BG = "#0A0A0B";
const SURFACE = "#131316";
const SURFACE_HI = "#16161A";
const BORDER = "#1F1F24";
const FG = "#F4F4F1";
const MUTED = "#6B6B73";
const MUTED_HI = "#9999A3";
const PRIMARY = "#FCD116"; // RDC yellow
const RED = "#CE1126"; // RDC red
const GREEN = "#00A651"; // RDC green / Léopards

const SERIF = "'Fraunces', 'Playfair Display', Georgia, serif";
const SANS = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', Menlo, monospace";

const POS_COLOR: Record<DBPosition, string> = {
  Goalkeeper: "#8B5CF6",
  Defender: "#10B981",
  Midfield: "#3B82F6",
  Attack: "#EF4444",
};

const PITCH_POSITIONS: Record<
  Formation,
  Partial<Record<SlotPosition, { x: number; y: number }>>
> = {
  "4-3-3": {
    GK: { x: 50, y: 91 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 28, y: 47 }, CM: { x: 50, y: 50 }, RCM: { x: 72, y: 47 },
    LW: { x: 15, y: 22 }, ST: { x: 50, y: 14 }, RW: { x: 85, y: 22 },
  },
  "4-2-3-1": {
    GK: { x: 50, y: 91 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 35, y: 54 }, RCM: { x: 65, y: 54 },
    LW: { x: 18, y: 30 }, CAM: { x: 50, y: 33 }, RW: { x: 82, y: 30 },
    ST: { x: 50, y: 12 },
  },
  "3-5-2": {
    GK: { x: 50, y: 91 },
    LCB: { x: 25, y: 72 }, CB: { x: 50, y: 75 }, RCB: { x: 75, y: 72 },
    LWB: { x: 8, y: 50 }, LCM: { x: 30, y: 50 }, CM: { x: 50, y: 53 }, RCM: { x: 70, y: 50 }, RWB: { x: 92, y: 50 },
    LST: { x: 35, y: 17 }, RST: { x: 65, y: 17 },
  },
};

const POS_SHORT: Record<DBPosition, string> = {
  Goalkeeper: "GK",
  Defender: "DEF",
  Midfield: "MID",
  Attack: "ATT",
};

const lastName = (name: string) => {
  const parts = name.split(" ");
  return parts[parts.length - 1].toUpperCase();
};

/* ─────────────────────────────────────────────────────────────
 * Reusable atoms (inlined to keep export self-contained)
 * ───────────────────────────────────────────────────────────── */

function Eyebrow({
  children,
  color = MUTED_HI,
  size = 11,
  letter = "0.28em",
}: {
  children: React.ReactNode;
  color?: string;
  size?: number;
  letter?: string;
}) {
  return (
    <span
      style={{
        fontFamily: MONO,
        fontSize: size,
        fontWeight: 500,
        color,
        letterSpacing: letter,
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function FlagBar({ height = 4 }: { height?: number }) {
  return (
    <div style={{ display: "flex", height, width: "100%" }}>
      <div style={{ flex: 1, background: PRIMARY }} />
      <div style={{ flex: 1, background: RED }} />
      <div style={{ flex: 1, background: GREEN }} />
    </div>
  );
}

/** Subtle dotted-grid + radial spotlight, draws attention to center */
function EditorialBackdrop() {
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(252,209,22,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -120,
          top: -120,
          width: 360,
          height: 360,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(206,17,38,0.18) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -140,
          bottom: -100,
          width: 380,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,166,81,0.20) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
    </>
  );
}

/** Premium pitch with subtle texture, vignette, halftone overlay */
function PitchCanvas({ children, radius = 18 }: { children: React.ReactNode; radius?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #0E5430 0%, #0A4225 45%, #07331C 100%)",
        boxShadow:
          "inset 0 0 120px rgba(0,0,0,0.45), 0 30px 60px -20px rgba(0,0,0,0.6)",
      }}
    >
      {/* Vertical mowing stripes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0 8%, transparent 8% 16%)",
        }}
      />
      {/* Halftone texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
          mixBlendMode: "overlay",
        }}
      />
      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {children}
    </div>
  );
}

function PitchLines({ inset = 28 }: { inset?: number }) {
  const stroke = "rgba(255,255,255,0.28)";
  const sw = 2;
  return (
    <>
      {/* Outer */}
      <div
        style={{
          position: "absolute",
          inset,
          border: `${sw}px solid ${stroke}`,
          borderRadius: 6,
        }}
      />
      {/* Halfway line */}
      <div
        style={{
          position: "absolute",
          left: inset,
          right: inset,
          top: "50%",
          height: sw,
          background: stroke,
        }}
      />
      {/* Center circle */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 140,
          height: 140,
          border: `${sw}px solid ${stroke}`,
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 8,
          height: 8,
          background: stroke,
          borderRadius: "50%",
        }}
      />
      {/* Top penalty box */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: inset,
          transform: "translateX(-50%)",
          width: "55%",
          height: "18%",
          borderLeft: `${sw}px solid ${stroke}`,
          borderRight: `${sw}px solid ${stroke}`,
          borderBottom: `${sw}px solid ${stroke}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: inset,
          transform: "translateX(-50%)",
          width: "26%",
          height: "8%",
          borderLeft: `${sw}px solid ${stroke}`,
          borderRight: `${sw}px solid ${stroke}`,
          borderBottom: `${sw}px solid ${stroke}`,
        }}
      />
      {/* Bottom penalty box */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: inset,
          transform: "translateX(-50%)",
          width: "55%",
          height: "18%",
          borderLeft: `${sw}px solid ${stroke}`,
          borderRight: `${sw}px solid ${stroke}`,
          borderTop: `${sw}px solid ${stroke}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: inset,
          transform: "translateX(-50%)",
          width: "26%",
          height: "8%",
          borderLeft: `${sw}px solid ${stroke}`,
          borderRight: `${sw}px solid ${stroke}`,
          borderTop: `${sw}px solid ${stroke}`,
        }}
      />
    </>
  );
}

function PitchPlayer({
  player,
  isCaptain,
  size,
  labelSize,
  showPosChip = true,
}: {
  player: DBPlayer;
  isCaptain: boolean;
  size: number;
  labelSize: number;
  showPosChip?: boolean;
}) {
  const pos = (player.position as DBPosition) ?? "Midfield";
  const posColor = POS_COLOR[pos];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div style={{ position: "relative" }}>
        {/* Glow ring */}
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            background: isCaptain
              ? `radial-gradient(circle, ${PRIMARY}55 0%, transparent 70%)`
              : `radial-gradient(circle, ${posColor}40 0%, transparent 70%)`,
            filter: "blur(6px)",
          }}
        />
        <div
          style={{
            position: "relative",
            width: size,
            height: size,
            borderRadius: "50%",
            padding: 2,
            background: isCaptain
              ? `conic-gradient(from 0deg, ${PRIMARY}, #FFE066, ${PRIMARY})`
              : `linear-gradient(135deg, #fff 0%, ${posColor} 100%)`,
            boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
          }}
        >
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className="rounded-full"
            style={{ width: size - 4, height: size - 4 }}
            initialsClassName={`text-[${Math.max(10, Math.floor(size / 5))}px]`}
          />
        </div>
        {isCaptain && (
          <div
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: PRIMARY,
              color: BG,
              fontFamily: SERIF,
              fontSize: 14,
              fontWeight: 800,
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
              border: `2px solid ${BG}`,
            }}
          >
            C
          </div>
        )}
      </div>
      <div
        style={{
          background: "rgba(10,10,11,0.85)",
          backdropFilter: "blur(4px)",
          padding: "3px 8px",
          borderRadius: 4,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: `1px solid rgba(255,255,255,0.1)`,
        }}
      >
        {showPosChip && (
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: posColor,
            }}
          />
        )}
        <span
          style={{
            fontFamily: SANS,
            fontSize: labelSize,
            fontWeight: 700,
            color: FG,
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
          }}
        >
          {lastName(player.name)}
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * MAIN
 * ───────────────────────────────────────────────────────────── */

export function ShareCard({
  format,
  formation,
  startingXI,
  bench,
  captain,
  pseudo,
  slug,
}: Props) {
  const slots = FORMATION_SLOTS[formation];
  const positions = PITCH_POSITIONS[formation];

  const stats = useMemo(() => {
    const xi = Object.values(startingXI).filter((p): p is DBPlayer => !!p);
    const all = [...xi, ...bench];
    const ages = all.map((p) => p.age ?? 0).filter((a) => a > 0);
    const avgAge =
      ages.length > 0
        ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10
        : 0;
    const total = all.reduce((s, p) => s + (p.market_value_eur ?? 0), 0);
    const radarCount = all.filter((p) => p.player_category === "radar").length;
    const tier1Count = all.filter((p) => p.tier === "tier1").length;
    return { avgAge, total, radarCount, tier1Count, count: all.length };
  }, [startingXI, bench]);

  const dateStr = new Date()
    .toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    .toUpperCase();

  /* ============== STORY 1200×1500 ============== */
  if (format === "story") {
    return (
      <div
        style={{
          width: 1200,
          height: 1500,
          background: BG,
          fontFamily: SANS,
          color: FG,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <EditorialBackdrop />

        {/* Top flag accent */}
        <FlagBar height={5} />

        {/* ─── HEADER ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "32px 64px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `linear-gradient(135deg, ${PRIMARY} 0%, #E6BD14 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: 800,
                fontSize: 22,
                color: BG,
                boxShadow: `0 4px 14px ${PRIMARY}40`,
              }}
            >
              L
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  color: FG,
                }}
              >
                Léopards Radar
              </span>
              <Eyebrow size={9}>Mondial 2026 · RDC</Eyebrow>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              background: `${PRIMARY}10`,
              border: `1px solid ${PRIMARY}40`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: PRIMARY,
                boxShadow: `0 0 10px ${PRIMARY}`,
              }}
            />
            <Eyebrow color={PRIMARY} size={11} letter="0.2em">
              MA LISTE DES 26
            </Eyebrow>
          </div>
        </div>

        {/* ─── TITLE BLOCK ─── */}
        <div style={{ padding: "44px 64px 28px", position: "relative" }}>
          <Eyebrow color={MUTED} size={11}>
            ÉDITION PERSONNELLE · {dateStr}
          </Eyebrow>
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 84,
              fontWeight: 600,
              lineHeight: 0.98,
              letterSpacing: "-0.025em",
              margin: "14px 0 0",
              color: FG,
            }}
          >
            Ma sélection
            <br />
            <span style={{ color: PRIMARY }}>des 26.</span>
          </h1>
          <div
            style={{
              marginTop: 20,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                fontFamily: MONO,
                fontSize: 13,
                fontWeight: 600,
                color: FG,
                letterSpacing: "0.05em",
              }}
            >
              {formation}
            </div>
            {pseudo && (
              <>
                <div style={{ width: 1, height: 16, background: BORDER }} />
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 20,
                    color: MUTED_HI,
                  }}
                >
                  par {pseudo}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ─── PITCH ─── */}
        <div
          style={{
            position: "relative",
            margin: "0 64px",
            height: 560,
          }}
        >
          <PitchCanvas radius={20}>
            <PitchLines inset={26} />

            {/* Watermark formation */}
            <div
              style={{
                position: "absolute",
                left: 24,
                bottom: 18,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 64,
                fontWeight: 700,
                color: "rgba(255,255,255,0.07)",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {formation}
            </div>
            <div
              style={{
                position: "absolute",
                right: 24,
                top: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <Eyebrow color="rgba(255,255,255,0.55)" size={9}>
                ONZE DE DÉPART
              </Eyebrow>
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1,
                }}
              >
                XI
              </span>
            </div>

            {/* Players */}
            {slots.map((slot) => {
              const pos = positions?.[slot];
              const player = startingXI[slot];
              if (!pos || !player) return null;
              const isCaptain = captain.slug === player.slug;
              return (
                <div
                  key={slot}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <PitchPlayer
                    player={player}
                    isCaptain={isCaptain}
                    size={76}
                    labelSize={12}
                  />
                </div>
              );
            })}
          </PitchCanvas>
        </div>

        {/* ─── BENCH ─── */}
        <div style={{ margin: "32px 64px 0" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
              borderBottom: `1px solid ${BORDER}`,
              paddingBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span
                style={{
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 28,
                  fontWeight: 600,
                  color: FG,
                  letterSpacing: "-0.02em",
                }}
              >
                Le banc
              </span>
              <Eyebrow color={PRIMARY} size={10}>
                15 RÉSERVISTES
              </Eyebrow>
            </div>
            <Eyebrow color={MUTED} size={10}>
              {bench.length}/15 SÉLECTIONNÉS
            </Eyebrow>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 10,
            }}
          >
            {Array.from({ length: 15 }).map((_, i) => {
              const player = bench[i];
              const isCaptain = player && captain.slug === player.slug;
              if (!player) {
                return (
                  <div
                    key={`empty-${i}`}
                    style={{
                      height: 96,
                      border: `1px dashed ${BORDER}`,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 20,
                        color: "#2A2A30",
                      }}
                    >
                      ·
                    </span>
                  </div>
                );
              }
              const pos = (player.position as DBPosition) ?? "Midfield";
              const posColor = POS_COLOR[pos];
              return (
                <div
                  key={player.slug}
                  style={{
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 8,
                    padding: "10px 6px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: 96,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Position color bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: posColor,
                    }}
                  />
                  <div style={{ position: "relative" }}>
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className={cn(
                        "rounded-full",
                        isCaptain ? "ring-2" : "",
                      )}
                      style={{
                        width: 44,
                        height: 44,
                        boxShadow: isCaptain
                          ? `0 0 0 2px ${PRIMARY}`
                          : `0 0 0 1px ${BORDER}`,
                      }}
                      initialsClassName="text-[10px]"
                    />
                    {isCaptain && (
                      <div
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: PRIMARY,
                          color: BG,
                          fontFamily: SERIF,
                          fontSize: 9,
                          fontWeight: 800,
                          fontStyle: "italic",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1.5px solid ${SURFACE}`,
                        }}
                      >
                        C
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: SANS,
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: FG,
                      letterSpacing: "0.02em",
                      textAlign: "center",
                      lineHeight: 1.05,
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      width: "100%",
                      padding: "0 2px",
                    }}
                  >
                    {lastName(player.name)}
                  </div>
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 8,
                      color: posColor,
                      letterSpacing: "0.18em",
                      fontWeight: 600,
                    }}
                  >
                    {POS_SHORT[pos]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── STATS STRIP ─── */}
        <div
          style={{
            position: "absolute",
            bottom: 76,
            left: 64,
            right: 64,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "18px 0",
            boxShadow: "0 20px 40px -12px rgba(0,0,0,0.6)",
          }}
        >
          {[
            { label: "ÂGE MOYEN", value: stats.avgAge, suffix: "ans" },
            { label: "VALEUR", value: formatMarketValue(stats.total), suffix: "" },
            { label: "RADAR", value: stats.radarCount, suffix: "j." },
            { label: "TIER 1", value: stats.tier1Count, suffix: "j." },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                textAlign: "center",
                borderLeft: i > 0 ? `1px solid ${BORDER}` : "none",
                padding: "0 12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 36,
                    fontWeight: 600,
                    color: FG,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                {s.suffix && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      color: MUTED,
                    }}
                  >
                    {s.suffix}
                  </span>
                )}
              </div>
              <div
                style={{
                  marginTop: 6,
                  fontFamily: MONO,
                  fontSize: 9,
                  color: MUTED_HI,
                  letterSpacing: "0.22em",
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* ─── FOOTER ─── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 64px",
              height: 56,
            }}
          >
            <Eyebrow color={MUTED} size={10}>
              LEOPARDSRADAR.COM{slug ? ` / MA-LISTE / ${slug.toUpperCase()}` : ""}
            </Eyebrow>
            <Eyebrow color={MUTED} size={10}>
              CONSTRUIS LA TIENNE →
            </Eyebrow>
          </div>
          <FlagBar height={5} />
        </div>
      </div>
    );
  }

  /* ============== OG 1200×630 ============== */
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        background: BG,
        fontFamily: SANS,
        color: FG,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <EditorialBackdrop />
      <FlagBar height={4} />

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        {/* ─── LEFT: editorial title ─── */}
        <div
          style={{
            width: 520,
            padding: "44px 44px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: `1px solid ${BORDER}`,
            position: "relative",
          }}
        >
          {/* Top: brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `linear-gradient(135deg, ${PRIMARY} 0%, #E6BD14 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontWeight: 800,
                  fontSize: 16,
                  color: BG,
                }}
              >
                L
              </div>
              <Eyebrow size={10} color={FG}>
                LÉOPARDS RADAR
              </Eyebrow>
              <span style={{ width: 1, height: 12, background: BORDER }} />
              <Eyebrow size={10} color={PRIMARY}>
                MONDIAL 2026
              </Eyebrow>
            </div>

            <h1
              style={{
                marginTop: 28,
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 60,
                fontWeight: 600,
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                color: FG,
              }}
            >
              Ma sélection
              <br />
              <span style={{ color: PRIMARY }}>des 26.</span>
            </h1>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  padding: "5px 10px",
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 5,
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  color: FG,
                  letterSpacing: "0.05em",
                }}
              >
                {formation}
              </div>
              {pseudo && (
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 16,
                    color: MUTED_HI,
                  }}
                >
                  par {pseudo}
                </span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 0,
              marginTop: 24,
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              background: SURFACE,
              overflow: "hidden",
            }}
          >
            {[
              { label: "ÂGE MOYEN", value: stats.avgAge, suffix: "ans" },
              { label: "VALEUR", value: formatMarketValue(stats.total), suffix: "" },
              { label: "RADAR", value: stats.radarCount, suffix: "j." },
              { label: "TIER 1", value: stats.tier1Count, suffix: "j." },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "14px 16px",
                  borderRight: i % 2 === 0 ? `1px solid ${BORDER}` : "none",
                  borderTop: i >= 2 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 28,
                      fontWeight: 600,
                      color: FG,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                    }}
                  >
                    {s.value}
                  </span>
                  {s.suffix && (
                    <span
                      style={{ fontFamily: MONO, fontSize: 9, color: MUTED }}
                    >
                      {s.suffix}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: MONO,
                    fontSize: 8,
                    color: MUTED_HI,
                    letterSpacing: "0.22em",
                    fontWeight: 500,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: pitch + bench ─── */}
        <div
          style={{
            flex: 1,
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Pitch */}
          <div style={{ flex: 1, position: "relative" }}>
            <PitchCanvas radius={14}>
              <PitchLines inset={18} />
              <div
                style={{
                  position: "absolute",
                  right: 14,
                  top: 12,
                  fontFamily: SERIF,
                  fontStyle: "italic",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                XI
              </div>
              {slots.map((slot) => {
                const pos = positions?.[slot];
                const player = startingXI[slot];
                if (!pos || !player) return null;
                const isCaptain = captain.slug === player.slug;
                return (
                  <div
                    key={slot}
                    style={{
                      position: "absolute",
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <PitchPlayer
                      player={player}
                      isCaptain={isCaptain}
                      size={42}
                      labelSize={9}
                      showPosChip={false}
                    />
                  </div>
                );
              })}
            </PitchCanvas>
          </div>

          {/* Bench strip */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Eyebrow color={PRIMARY} size={9}>
                BANC · 15
              </Eyebrow>
              <Eyebrow color={MUTED} size={9}>
                {bench.length}/15
              </Eyebrow>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 15 }).map((_, i) => {
                const player = bench[i];
                const isCaptain = player && captain.slug === player.slug;
                if (!player) {
                  return (
                    <div
                      key={`b-empty-${i}`}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: "50%",
                        border: `1px dashed ${BORDER}`,
                      }}
                    />
                  );
                }
                const pos = (player.position as DBPosition) ?? "Midfield";
                return (
                  <div
                    key={player.slug}
                    style={{ flex: 1, position: "relative" }}
                  >
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className="rounded-full"
                      style={{
                        width: 36,
                        height: 36,
                        boxShadow: isCaptain
                          ? `0 0 0 2px ${PRIMARY}`
                          : `0 0 0 1.5px ${POS_COLOR[pos]}80`,
                      }}
                      initialsClassName="text-[9px]"
                    />
                    {isCaptain && (
                      <div
                        style={{
                          position: "absolute",
                          top: -2,
                          right: -2,
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: PRIMARY,
                          color: BG,
                          fontFamily: SERIF,
                          fontSize: 7,
                          fontWeight: 800,
                          fontStyle: "italic",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1px solid ${BG}`,
                        }}
                      >
                        C
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 36px",
            height: 40,
          }}
        >
          <Eyebrow color={MUTED} size={9}>
            LEOPARDSRADAR.COM{slug ? ` / MA-LISTE / ${slug.toUpperCase()}` : ""}
          </Eyebrow>
          <Eyebrow color={MUTED} size={9}>
            CONSTRUIS LA TIENNE →
          </Eyebrow>
        </div>
        <FlagBar height={4} />
      </div>
    </div>
  );
}
