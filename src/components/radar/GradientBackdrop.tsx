/**
 * GradientBackdrop — aurora discrète RDC pour la vue Radar Carte.
 *
 * Volontairement DIFFUS. Le rôle du fond est de poser une ambiance,
 * pas de rivaliser avec les pills. 4 radial-gradients aux couleurs RDC
 * en mix-blend-screen, opacités contenues, voile dark dominant.
 *
 * Anti-pattern à éviter : ajouter une grille, une vignette, une bande
 * verticale ou un drapeau watermark — chaque ornement supplémentaire
 * vole de la lisibilité aux joueurs.
 */
export function GradientBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute -inset-[10%] animate-gradient-drift-1"
        style={{
          background:
            "radial-gradient(circle at 28% 32%, rgba(252,209,22,0.70), transparent 55%)",
          filter: "blur(70px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute -inset-[10%] animate-gradient-drift-2"
        style={{
          background:
            "radial-gradient(circle at 78% 25%, rgba(206,17,38,0.60), transparent 50%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute -inset-[10%] animate-gradient-drift-1"
        style={{
          background:
            "radial-gradient(circle at 65% 78%, rgba(0,166,81,0.55), transparent 55%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute -inset-[10%] animate-gradient-drift-2"
        style={{
          background:
            "radial-gradient(circle at 22% 72%, rgba(91,58,138,0.65), transparent 50%)",
          filter: "blur(90px)",
          mixBlendMode: "screen",
          animationDelay: "-15s",
        }}
      />
      {/* Voile dark allégé : on laisse le gradient respirer tout en gardant
          une base sombre pour la lisibilité des pills (qui sont opaques). */}
      <div className="absolute inset-0 bg-background/30" />
    </div>
  );
}
