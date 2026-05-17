import { useMemo } from "react";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { FORMATION_SLOTS } from "@/types/maListe";
import type { Formation, SlotPosition } from "@/types/maListe";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";
import { formatMarketValue } from "@/lib/playerHelpers";

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
 * BRAND TOKENS — match tailwind.config.ts and the public site
 * Output dimensions are the *standard* social ratios:
 *   story = 1080×1350 (Instagram feed 4:5, LinkedIn, Twitter post)
 *   og    = 1200×630  (Open Graph, X card, WhatsApp link preview)
 * ───────────────────────────────────────────────────────────── */
const BG = "#0A0A0B";
const SURFACE = "#131316";
const BORDER = "#26262C";
const FG = "#F4F4F1";
const MUTED = "#8B8B95";
const PRIMARY = "#FCD116"; // RDC yellow — accent only
const RED = "#CE1126";
const GREEN = "#00A651";

// Brand book Leopards Radar v2 — Geist partout, pas de serif editorial.
// L'alias SERIF garde le nom historique pour ne pas avoir a renommer les
// 30+ usages dans ce fichier, mais pointe sur Geist.
const SERIF = "'Geist', system-ui, sans-serif";
const SANS = "'Geist', system-ui, sans-serif";
const MONO = "'Geist Mono', ui-monospace, Menlo, monospace";

const POS_ACCENT: Record<DBPosition, string> = {
  Goalkeeper: PRIMARY,
  Defender: "#5BB7B7",
  Midfield: "#A88BFF",
  Attack: "#FF6B6B",
};

const PITCH_POSITIONS: Record<
  Formation,
  Partial<Record<SlotPosition, { x: number; y: number }>>
> = {
  "4-3-3": {
    GK: { x: 50, y: 90 },
    LB: { x: 14, y: 70 }, LCB: { x: 36, y: 73 }, RCB: { x: 64, y: 73 }, RB: { x: 86, y: 70 },
    LCM: { x: 28, y: 48 }, CM: { x: 50, y: 51 }, RCM: { x: 72, y: 48 },
    LW: { x: 18, y: 22 }, ST: { x: 50, y: 14 }, RW: { x: 82, y: 22 },
  },
  "4-2-3-1": {
    GK: { x: 50, y: 90 },
    LB: { x: 14, y: 70 }, LCB: { x: 36, y: 73 }, RCB: { x: 64, y: 73 }, RB: { x: 86, y: 70 },
    LCM: { x: 36, y: 55 }, RCM: { x: 64, y: 55 },
    LW: { x: 20, y: 30 }, CAM: { x: 50, y: 33 }, RW: { x: 80, y: 30 },
    ST: { x: 50, y: 12 },
  },
  "3-5-2": {
    GK: { x: 50, y: 90 },
    LCB: { x: 26, y: 72 }, CB: { x: 50, y: 75 }, RCB: { x: 74, y: 72 },
    LWB: { x: 10, y: 50 }, LCM: { x: 32, y: 50 }, CM: { x: 50, y: 53 }, RCM: { x: 68, y: 50 }, RWB: { x: 90, y: 50 },
    LST: { x: 36, y: 17 }, RST: { x: 64, y: 17 },
  },
};

const lastName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1].toUpperCase();
};

/* ─────────────────────────────────────────────────────────────
 * Atoms
 * ───────────────────────────────────────────────────────────── */

function FlagAccent({ height = 4 }: { height?: number }) {
  return (
    <div style={{ display: "flex", height, width: "100%", flexShrink: 0 }}>
      <div style={{ flex: 1, background: PRIMARY }} />
      <div style={{ flex: 1, background: RED }} />
      <div style={{ flex: 1, background: GREEN }} />
    </div>
  );
}

function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: PRIMARY,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: SERIF,
        fontStyle: "italic",
        fontWeight: 700,
        fontSize: Math.round(size * 0.6),
        color: BG,
        flexShrink: 0,
      }}
    >
      L
    </div>
  );
}

function Eyebrow({
  children,
  color = MUTED,
  size = 11,
  letter = "0.22em",
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

/** Pitch background — quieter than the previous version, no halftone, no spotlight */
function PitchCanvas({
  children,
  radius = 12,
}: {
  children: React.ReactNode;
  radius?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, #0F5A33 0%, #0B4626 50%, #07321B 100%)",
      }}
    >
      {/* Soft mowing stripes */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0 9%, transparent 9% 18%)",
        }}
      />
      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      {children}
    </div>
  );
}

function PitchLines({ inset = 22 }: { inset?: number }) {
  const stroke = "rgba(255,255,255,0.32)";
  const sw = 1.5;
  return (
    <>
      {/* Outer */}
      <div
        style={{
          position: "absolute",
          inset,
          border: `${sw}px solid ${stroke}`,
          borderRadius: 4,
        }}
      />
      {/* Halfway */}
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
          width: 110,
          height: 110,
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
          width: 6,
          height: 6,
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
          width: "52%",
          height: "16%",
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
          width: "24%",
          height: "7%",
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
          width: "52%",
          height: "16%",
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
          width: "24%",
          height: "7%",
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
}: {
  player: DBPlayer;
  isCaptain: boolean;
  size: number;
  labelSize: number;
}) {
  const pos = (player.position as DBPosition) ?? "Midfield";
  const accent = POS_ACCENT[pos];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "relative",
            width: size,
            height: size,
            borderRadius: "50%",
            padding: 2,
            background: isCaptain ? PRIMARY : "rgba(255,255,255,0.92)",
            boxShadow: isCaptain
              ? `0 0 0 2px ${BG}, 0 6px 14px rgba(252,209,22,0.45)`
              : `0 0 0 2px ${BG}, 0 4px 10px rgba(0,0,0,0.45)`,
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
              top: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: PRIMARY,
              color: BG,
              fontFamily: SERIF,
              fontSize: 12,
              fontWeight: 800,
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${BG}`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
            }}
          >
            C
          </div>
        )}
      </div>
      <div
        style={{
          background: "rgba(10,10,11,0.88)",
          padding: "2px 7px",
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          gap: 5,
          border: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: accent,
          }}
        />
        <span
          style={{
            fontFamily: SANS,
            fontSize: labelSize,
            fontWeight: 700,
            color: FG,
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          {lastName(player.name)}
        </span>
      </div>
    </div>
  );
}

function BenchAvatar({
  player,
  isCaptain,
  size = 38,
}: {
  player: DBPlayer;
  isCaptain: boolean;
  size?: number;
}) {
  const pos = (player.position as DBPosition) ?? "Midfield";
  const accent = POS_ACCENT[pos];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div style={{ position: "relative" }}>
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            padding: 1.5,
            background: isCaptain ? PRIMARY : accent,
          }}
        >
          <PlayerAvatar
            name={player.name}
            src={player.image_url}
            className="rounded-full"
            style={{ width: size - 3, height: size - 3 }}
            initialsClassName="text-[9px]"
          />
        </div>
        {isCaptain && (
          <div
            style={{
              position: "absolute",
              top: -1,
              right: -1,
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
      <span
        style={{
          fontFamily: SANS,
          fontSize: 8.5,
          fontWeight: 600,
          color: "rgba(255,255,255,0.75)",
          letterSpacing: "0.02em",
          maxWidth: size + 16,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {lastName(player.name)}
      </span>
    </div>
  );
}

function EmptyBenchSlot({ size = 38 }: { size?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `1px dashed ${BORDER}`,
          background: SURFACE,
        }}
      />
      <span
        style={{
          fontFamily: MONO,
          fontSize: 8,
          color: "#3A3A42",
        }}
      >
        ·
      </span>
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
    return { avgAge, total, radarCount, count: all.length };
  }, [startingXI, bench]);

  const dateStr = new Date()
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

  /* ============================================================
   * STORY — 1080×1350 (Instagram feed 4:5, LinkedIn, Twitter post)
   * ============================================================ */
  if (format === "story") {
    const W = 1080;
    const H = 1350;
    const PAD = 56;

    return (
      <div
        style={{
          width: W,
          height: H,
          background: BG,
          fontFamily: SANS,
          color: FG,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <FlagAccent height={5} />

        {/* ─── HEADER ─── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: `28px ${PAD}px 0`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <BrandMark size={32} />
            <span
              style={{
                fontFamily: SANS,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: FG,
              }}
            >
              Léopards Radar
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 999,
              background: `${PRIMARY}14`,
              border: `1px solid ${PRIMARY}50`,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: PRIMARY,
              }}
            />
            <Eyebrow color={PRIMARY} size={10} letter="0.2em">
              MA LISTE · MONDIAL 2026
            </Eyebrow>
          </div>
        </div>

        {/* ─── TITLE ─── */}
        <div style={{ padding: `38px ${PAD}px 0` }}>
          <Eyebrow size={10}>ÉDITION PERSONNELLE · {dateStr}</Eyebrow>
          <h1
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 86,
              fontWeight: 600,
              lineHeight: 0.96,
              letterSpacing: "-0.025em",
              margin: "16px 0 0",
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
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 4,
                fontFamily: MONO,
                fontSize: 12,
                fontWeight: 600,
                color: FG,
                letterSpacing: "0.06em",
              }}
            >
              {formation}
            </div>
            {pseudo && (
              <>
                <div style={{ width: 1, height: 14, background: BORDER }} />
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 19,
                    color: "rgba(244,244,241,0.75)",
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
            margin: `28px ${PAD}px 0`,
            height: 600,
            flexShrink: 0,
          }}
        >
          <PitchCanvas radius={14}>
            <PitchLines inset={22} />
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
                    size={70}
                    labelSize={11}
                  />
                </div>
              );
            })}
          </PitchCanvas>
        </div>

        {/* ─── BENCH (single row) ─── */}
        <div
          style={{
            margin: `26px ${PAD}px 0`,
            paddingTop: 18,
            borderTop: `1px solid ${BORDER}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <span
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 22,
                fontWeight: 600,
                color: FG,
                letterSpacing: "-0.02em",
              }}
            >
              Le banc
            </span>
            <Eyebrow size={10}>{bench.length}/15</Eyebrow>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(15, 1fr)",
              gap: 6,
            }}
          >
            {Array.from({ length: 15 }).map((_, i) => {
              const player = bench[i];
              if (!player) return <EmptyBenchSlot key={`b-${i}`} size={38} />;
              const isCaptain = captain.slug === player.slug;
              return (
                <BenchAvatar
                  key={player.slug}
                  player={player}
                  isCaptain={isCaptain}
                  size={38}
                />
              );
            })}
          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          {/* Stats inline */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: `0 ${PAD}px`,
              height: 64,
              borderTop: `1px solid ${BORDER}`,
              background: SURFACE,
            }}
          >
            {[
              { label: "ÂGE", value: stats.avgAge, suffix: "ans" },
              {
                label: "VALEUR",
                value: formatMarketValue(stats.total),
                suffix: "",
              },
              { label: "RADAR", value: stats.radarCount, suffix: "joueurs" },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  flex: 1,
                  justifyContent: i === 1 ? "center" : i === 2 ? "flex-end" : "flex-start",
                }}
              >
                <Eyebrow size={9}>{s.label}</Eyebrow>
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 24,
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
                      fontSize: 10,
                      color: MUTED,
                    }}
                  >
                    {s.suffix}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* URL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: `0 ${PAD}px`,
              height: 38,
              background: BG,
            }}
          >
            <Eyebrow size={9}>
              LEOPARDSRADAR.COM
              {slug ? ` / ${slug.toUpperCase()}` : ""}
            </Eyebrow>
            <Eyebrow color={PRIMARY} size={9}>
              CONSTRUIS LA TIENNE →
            </Eyebrow>
          </div>
          <FlagAccent height={4} />
        </div>
      </div>
    );
  }

  /* ============================================================
   * OG — 1200×630 (Open Graph, Twitter card, WhatsApp preview)
   * ============================================================ */
  const OG_W = 1200;
  const OG_H = 630;
  return (
    <div
      style={{
        width: OG_W,
        height: OG_H,
        background: BG,
        fontFamily: SANS,
        color: FG,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <FlagAccent height={4} />

      <div style={{ flex: 1, display: "flex", position: "relative" }}>
        {/* LEFT — title + stats */}
        <div
          style={{
            width: 540,
            padding: "40px 40px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: `1px solid ${BORDER}`,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <BrandMark size={26} />
              <Eyebrow color={FG} size={10}>
                LÉOPARDS RADAR
              </Eyebrow>
              <span style={{ width: 1, height: 12, background: BORDER }} />
              <Eyebrow color={PRIMARY} size={10}>
                MONDIAL 2026
              </Eyebrow>
            </div>

            <h1
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 56,
                fontWeight: 600,
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                color: FG,
                margin: 0,
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
                  borderRadius: 4,
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 600,
                  color: FG,
                  letterSpacing: "0.06em",
                }}
              >
                {formation}
              </div>
              {pseudo && (
                <span
                  style={{
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    fontSize: 17,
                    color: "rgba(244,244,241,0.7)",
                  }}
                >
                  par {pseudo}
                </span>
              )}
            </div>
          </div>

          {/* Stats inline */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "baseline",
            }}
          >
            {[
              { label: "ÂGE", value: stats.avgAge, suffix: "ans" },
              {
                label: "VALEUR",
                value: formatMarketValue(stats.total),
                suffix: "",
              },
              { label: "RADAR", value: stats.radarCount, suffix: "j." },
            ].map((s) => (
              <div key={s.label}>
                <Eyebrow size={9}>{s.label}</Eyebrow>
                <div
                  style={{
                    marginTop: 4,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      fontSize: 26,
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
                        fontSize: 9,
                        color: MUTED,
                      }}
                    >
                      {s.suffix}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — pitch only (clean, no bench) */}
        <div
          style={{
            flex: 1,
            padding: "32px 32px 28px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <PitchCanvas radius={10}>
              <PitchLines inset={16} />
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
                    />
                  </div>
                );
              })}
            </PitchCanvas>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: 38,
          background: SURFACE,
          borderTop: `1px solid ${BORDER}`,
        }}
      >
        <Eyebrow size={9}>
          LEOPARDSRADAR.COM
          {slug ? ` / ${slug.toUpperCase()}` : ""}
        </Eyebrow>
        <Eyebrow color={PRIMARY} size={9}>
          CONSTRUIS LA TIENNE →
        </Eyebrow>
      </div>
      <FlagAccent height={4} />
    </div>
  );
}
