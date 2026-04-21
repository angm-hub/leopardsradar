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

const PITCH_POSITIONS: Record<
  Formation,
  Partial<Record<SlotPosition, { x: number; y: number }>>
> = {
  "4-3-3": {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 28, y: 47 }, CM: { x: 50, y: 50 }, RCM: { x: 72, y: 47 },
    LW: { x: 15, y: 22 }, ST: { x: 50, y: 14 }, RW: { x: 85, y: 22 },
  },
  "4-2-3-1": {
    GK: { x: 50, y: 90 },
    LB: { x: 12, y: 70 }, LCB: { x: 35, y: 73 }, RCB: { x: 65, y: 73 }, RB: { x: 88, y: 70 },
    LCM: { x: 35, y: 54 }, RCM: { x: 65, y: 54 },
    LW: { x: 18, y: 30 }, CAM: { x: 50, y: 33 }, RW: { x: 82, y: 30 },
    ST: { x: 50, y: 12 },
  },
  "3-5-2": {
    GK: { x: 50, y: 90 },
    LCB: { x: 25, y: 72 }, CB: { x: 50, y: 75 }, RCB: { x: 75, y: 72 },
    LWB: { x: 8, y: 50 }, LCM: { x: 30, y: 50 }, CM: { x: 50, y: 53 }, RCM: { x: 70, y: 50 }, RWB: { x: 92, y: 50 },
    LST: { x: 35, y: 17 }, RST: { x: 65, y: 17 },
  },
};

const POS_ORDER: DBPosition[] = ["Goalkeeper", "Defender", "Midfield", "Attack"];
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
      ages.length > 0 ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10 : 0;
    const total = all.reduce((s, p) => s + (p.market_value_eur ?? 0), 0);
    const radarCount = all.filter((p) => p.player_category === "radar").length;
    return { avgAge, total, radarCount };
  }, [startingXI, bench]);

  const benchByPos = useMemo(() => {
    const groups: Record<DBPosition, DBPlayer[]> = {
      Goalkeeper: [],
      Defender: [],
      Midfield: [],
      Attack: [],
    };
    for (const p of bench) {
      const pos = (p.position as DBPosition) ?? "Midfield";
      groups[pos].push(p);
    }
    return groups;
  }, [bench]);

  // ============== STORY 1200x1500 ==============
  if (format === "story") {
    return (
      <div
        style={{
          width: 1200,
          height: 1500,
          backgroundColor: "#0A0A0A",
          fontFamily: "Inter, sans-serif",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header 0–180 */}
        <div
          style={{
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            LÉOPARDS RADAR
          </span>
          <span
            style={{
              backgroundColor: "#FFC107",
              color: "#0A0A0A",
              padding: "10px 18px",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              borderRadius: 999,
            }}
          >
            MA LISTE · MONDIAL 2026
          </span>
        </div>

        {/* Title 180–360 */}
        <div style={{ padding: "48px 64px 32px", textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.05,
              margin: 0,
            }}
          >
            Ma sélection des 26
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 18,
              color: "#9A9A9A",
              letterSpacing: "0.05em",
            }}
          >
            Formation {formation}
            {pseudo ? ` · ${pseudo}` : ""}
          </p>
        </div>

        {/* Pitch 360–980 (h≈620) */}
        <div
          style={{
            margin: "0 64px",
            height: 620,
            position: "relative",
            background:
              "radial-gradient(ellipse at center, #00C063 0%, #00A651 50%, #007638 100%)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* lines */}
          <div
            style={{
              position: "absolute",
              inset: 24,
              border: "2px solid rgba(255,255,255,0.25)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 24,
              right: 24,
              top: "50%",
              height: 2,
              background: "rgba(255,255,255,0.25)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 120,
              height: 120,
              border: "2px solid rgba(255,255,255,0.25)",
              borderRadius: "50%",
            }}
          />

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
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div style={{ position: "relative" }}>
                  <PlayerAvatar
                    name={player.name}
                    src={player.image_url}
                    className={cn(
                      "rounded-full border-[3px] shadow-xl",
                      isCaptain ? "border-[#FFC107]" : "border-white",
                    )}
                    style={{ width: 72, height: 72 }}
                    initialsClassName="text-base"
                  />
                  {isCaptain && (
                    <div
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "#FFC107",
                        color: "#0A0A0A",
                        fontSize: 14,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                      }}
                    >
                      C
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "0.05em",
                    textShadow:
                      "0 1px 0 #000, 1px 0 0 #000, -1px 0 0 #000, 0 -1px 0 #000",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lastName(player.name)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bench 980–1280 */}
        <div
          style={{
            margin: "20px 64px 0",
            backgroundColor: "#0A0A0A",
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <span
              style={{
                color: "#FFC107",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
              }}
            >
              BANC · 15
            </span>
            <span
              style={{
                color: "#666",
                fontSize: 11,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {bench.length}/15 sélectionnés
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 12,
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
                      height: 110,
                      border: "1px dashed rgba(255,255,255,0.15)",
                      borderRadius: 8,
                    }}
                  />
                );
              }
              return (
                <div
                  key={player.slug}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    height: 110,
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className={cn(
                        "rounded-full border-2",
                        isCaptain ? "border-[#FFC107]" : "border-white/30",
                      )}
                      style={{ width: 56, height: 56 }}
                      initialsClassName="text-xs"
                    />
                    {isCaptain && (
                      <div
                        style={{
                          position: "absolute",
                          top: -4,
                          right: -4,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: "#FFC107",
                          color: "#0A0A0A",
                          fontSize: 11,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        C
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      letterSpacing: "0.03em",
                      textAlign: "center",
                      lineHeight: 1.1,
                    }}
                  >
                    {lastName(player.name)}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#666",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    {POS_SHORT[(player.position as DBPosition) ?? "Midfield"]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats 1280–1420 */}
        <div
          style={{
            position: "absolute",
            bottom: 80,
            left: 64,
            right: 64,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            borderTop: "1px solid #FFC107",
            borderBottom: "1px solid #FFC107",
            paddingTop: 20,
            paddingBottom: 20,
          }}
        >
          {[
            { label: "ÂGE MOYEN", value: stats.avgAge },
            { label: "VALEUR TOTALE", value: formatMarketValue(stats.total) },
            { label: "JOUEURS DU RADAR", value: stats.radarCount },
            { label: "FORMATION", value: formation },
          ].map((s, i) => (
            <div
              key={s.label}
              style={{
                textAlign: "center",
                borderLeft: i > 0 ? "1px solid rgba(255,193,7,0.3)" : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#9A9A9A",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer 1420–1500 */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 64px",
            fontSize: 12,
            color: "#9A9A9A",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          <span>🇨🇩</span>
          <span>leopardsradar.com{slug ? `/ma-liste/${slug}` : "/ma-liste"}</span>
          <span>{new Date().toLocaleDateString("fr-FR")}</span>
        </div>
      </div>
    );
  }

  // ============== OG 1200x630 ==============
  return (
    <div
      style={{
        width: 1200,
        height: 630,
        backgroundColor: "#0A0A0A",
        fontFamily: "Inter, sans-serif",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
          }}
        >
          LÉOPARDS RADAR
        </span>
        <span
          style={{
            backgroundColor: "#FFC107",
            color: "#0A0A0A",
            padding: "5px 12px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            borderRadius: 999,
          }}
        >
          MONDIAL 2026
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* LEFT 480 */}
        <div
          style={{
            width: 480,
            padding: "32px 36px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontSize: 44,
                fontWeight: 700,
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Ma sélection des 26
            </h1>
            <p
              style={{
                marginTop: 12,
                fontSize: 14,
                color: "#9A9A9A",
                letterSpacing: "0.05em",
              }}
            >
              Formation {formation}
              {pseudo ? ` · ${pseudo}` : ""}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[
              { label: "ÂGE MOYEN", value: stats.avgAge },
              { label: "VALEUR", value: formatMarketValue(stats.total) },
              { label: "RADAR", value: stats.radarCount },
              { label: "FORMATION", value: formation },
            ].map((s) => (
              <div key={s.label}>
                <div
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 28,
                    fontWeight: 700,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "#9A9A9A",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT 720 */}
        <div
          style={{
            width: 720,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Mini pitch */}
          <div
            style={{
              flex: 1,
              position: "relative",
              background:
                "radial-gradient(ellipse at center, #00C063 0%, #00A651 50%, #007638 100%)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 16,
                border: "2px solid rgba(255,255,255,0.2)",
                borderRadius: 4,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                top: "50%",
                height: 1,
                background: "rgba(255,255,255,0.2)",
              }}
            />
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
                  <div style={{ position: "relative" }}>
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className={cn(
                        "rounded-full border-2",
                        isCaptain ? "border-[#FFC107]" : "border-white",
                      )}
                      style={{ width: 36, height: 36 }}
                      initialsClassName="text-[9px]"
                    />
                    {isCaptain && (
                      <div
                        style={{
                          position: "absolute",
                          top: -3,
                          right: -3,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: "#FFC107",
                          color: "#0A0A0A",
                          fontSize: 8,
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        C
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Bench mini-strip */}
          <div>
            <div
              style={{
                fontSize: 9,
                color: "#FFC107",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              BANC · 15
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: 15 }).map((_, i) => {
                const player = bench[i];
                if (!player) {
                  return (
                    <div
                      key={`b-empty-${i}`}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "1px dashed rgba(255,255,255,0.2)",
                        flex: 1,
                      }}
                    />
                  );
                }
                return (
                  <div key={player.slug} style={{ flex: 1 }}>
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className="rounded-full border border-white/30"
                      style={{ width: 28, height: 28 }}
                      initialsClassName="text-[8px]"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          fontSize: 11,
          color: "#9A9A9A",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        <span>🇨🇩 leopardsradar.com</span>
        <span>{slug ? `/ma-liste/${slug}` : "/ma-liste"}</span>
      </div>
    </div>
  );
}
