/**
 * RadarLegend — mini-légende du canvas Radar.
 *
 * WHY composant séparé : la légende est un contexte de lecture, pas un
 * ornement. Elle explique deux dimensions visuelles en même temps :
 * couleur (tier UEFA) et taille (valeur marchande).
 */
export function RadarLegend() {
  return (
    <div className="mt-5 flex flex-col gap-3">
      <p className="text-center text-[11px] font-mono text-muted-light uppercase tracking-[0.18em]">
        Couleur = tier UEFA · Taille = valeur marchande
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <TierSwatch tier="S" label="S — Champions League" />
        <TierSwatch tier="A" label="A — Top 5 européen" />
        <TierSwatch tier="B" label="B — Compétitif" />
        <TierSwatch tier="C" label="C — Autre" />
      </div>
    </div>
  );
}

function TierSwatch({ tier, label }: { tier: "S" | "A" | "B" | "C"; label: string }) {
  const sizeMap: Record<string, number> = { S: 18, A: 14, B: 11, C: 9 };
  const size = sizeMap[tier];

  // Couleurs inline pour que les swatches reflètent exactement le rendu
  // des pills — pas de classes dynamiques Tailwind qui pourraient être
  // purgées en prod.
  const bgMap: Record<string, { bg: string; color: string }> = {
    S: { bg: "#FCD116", color: "#0A0A0B" },
    A: { bg: "rgba(0,166,81,0.80)", color: "#0A0A0B" },
    B: { bg: "rgba(0,166,81,0.40)", color: "#d1fae5" },
    C: { bg: "rgba(255,255,255,0.12)", color: "#a1a1aa" },
  };
  const { bg, color } = bgMap[tier];

  return (
    <span className="inline-flex items-center gap-2 text-[11px] text-muted-light">
      <span
        aria-hidden
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          color,
          borderRadius: "50%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 7,
          fontFamily: "Space Mono, monospace",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {tier}
      </span>
      {label}
    </span>
  );
}
