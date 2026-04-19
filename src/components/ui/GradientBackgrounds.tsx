/**
 * Ambient gradient system for the home page.
 * Only 3 colors: #FCD116 (yellow), #00A651 (green), #050506 (deep black).
 * Slow 20-30s breathing cycles. Background-only — never affects content.
 */

const YELLOW = "#FCD116";
const GREEN = "#00A651";

interface StrongGradientProps {
  intensity?: number;
  position?: "center" | "top" | "bottom" | "flow";
}

export function StrongGradient({
  intensity = 1,
  position = "center",
}: StrongGradientProps) {
  // Position presets for the two aurora blobs
  const presets: Record<
    NonNullable<StrongGradientProps["position"]>,
    { y1: string; y2: string; x1: string; x2: string }
  > = {
    center: { y1: "30%", y2: "70%", x1: "30%", x2: "70%" },
    top: { y1: "15%", y2: "45%", x1: "35%", x2: "65%" },
    bottom: { y1: "60%", y2: "85%", x1: "30%", x2: "70%" },
    flow: { y1: "55%", y2: "90%", x1: "30%", x2: "70%" },
  };
  const p = presets[position];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Layer 1 — yellow aurora */}
      <div
        className="gradient-strong-layer absolute inset-0 animate-gradient-drift-1"
        style={{
          background: `radial-gradient(ellipse 60% 50% at ${p.x1} ${p.y1}, ${YELLOW}1F 0%, ${YELLOW}0A 35%, transparent 70%)`,
          opacity: 0.85 * intensity,
          willChange: "transform, opacity",
        }}
      />
      {/* Layer 2 — green aurora, offset & slower */}
      <div
        className="gradient-strong-layer absolute inset-0 animate-gradient-drift-2"
        style={{
          background: `radial-gradient(ellipse 55% 45% at ${p.x2} ${p.y2}, ${GREEN}1A 0%, ${GREEN}08 40%, transparent 75%)`,
          opacity: 0.8 * intensity,
          willChange: "transform, opacity",
        }}
      />
      {/* Layer 3 — depth vignette for readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at center, transparent 0%, rgba(5,5,6,0.55) 100%)",
        }}
      />
    </div>
  );
}

interface ResidualGradientProps {
  position?: "top-bottom" | "sides" | "top" | "bottom";
}

export function ResidualGradient({
  position = "top-bottom",
}: ResidualGradientProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {position === "top-bottom" && (
        <>
          <div
            className="absolute inset-x-0 top-0 h-48"
            style={{
              background: `radial-gradient(ellipse 70% 100% at 50% 0%, ${YELLOW}10 0%, transparent 80%)`,
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-48"
            style={{
              background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${GREEN}10 0%, transparent 80%)`,
            }}
          />
        </>
      )}

      {position === "sides" && (
        <>
          <div
            className="absolute inset-y-0 left-0 w-1/3"
            style={{
              background: `radial-gradient(ellipse 100% 60% at 0% 50%, ${YELLOW}0E 0%, transparent 75%)`,
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3"
            style={{
              background: `radial-gradient(ellipse 100% 60% at 100% 50%, ${GREEN}0E 0%, transparent 75%)`,
            }}
          />
        </>
      )}

      {position === "top" && (
        <div
          className="absolute inset-x-0 top-0 h-56"
          style={{
            background: `radial-gradient(ellipse 70% 100% at 50% 0%, ${GREEN}10 0%, transparent 80%)`,
          }}
        />
      )}

      {position === "bottom" && (
        <div
          className="absolute inset-x-0 bottom-0 h-56"
          style={{
            background: `radial-gradient(ellipse 70% 100% at 50% 100%, ${YELLOW}10 0%, transparent 80%)`,
          }}
        />
      )}
    </div>
  );
}

export default StrongGradient;
