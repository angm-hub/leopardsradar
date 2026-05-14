/**
 * LeopardsGrainBackground — fond shader signature pour le hero Léopards Radar.
 *
 * Utilise @paper-design/shaders-react (GrainGradient) avec une palette ancrée
 * dans les couleurs nationales RDC : vert primaire, jaune drapeau, noir profond.
 * Forme "blob" (shape 6) : courbes organiques, zéro artefact géométrique, ne
 * rappelle aucun shader Vercel/Lovable par défaut.
 *
 * WHY ce choix vs RDCConstellation :
 * Le grain shader donne une vibration plus premium éditoriale (Apple-like) que
 * le SVG statique. Le SVG reste utilisé comme fallback côté reduce-motion (et
 * potentiellement en cas d'erreur de chargement WebGL — voir Suspense parent).
 *
 * Performance : ~30 kB gzip (chunk lazy depuis LeopardsHero), shader léger sur
 * GPU. Le fond est en `position: absolute inset-0` (pas fixed) pour rester
 * confiné à la section hero — sinon il défile sur tout le site et ça devient
 * un wallpaper, pas un hero.
 */

import { GrainGradient } from "@paper-design/shaders-react";
import { useReducedMotion } from "framer-motion";
import { RDCConstellation } from "@/components/ui/RDCConstellation";

// ─── Palette RDC ──────────────────────────────────────────────────────────────
// Couleurs au format CSS hex — Paper Shaders les convertit en vec4 GLSL.
const RDC_GREEN = "#00A651";
const RDC_GREEN_DEEP = "#005A2D";
const RDC_YELLOW = "#FCD116";
const BG_DEEP = "#0A0A0B";

interface LeopardsGrainBackgroundProps {
  /**
   * Override de l'opacité globale du shader (0 à 1). Default 0.55 — plus bas
   * que le shader brut pour laisser respirer le texte du hero, plus haut que
   * 0 pour garder la signature visible.
   */
  opacity?: number;
  className?: string;
}

export function LeopardsGrainBackground({
  opacity = 0.55,
  className,
}: LeopardsGrainBackgroundProps) {
  const reducedMotion = useReducedMotion();

  // Reduced-motion : on ne charge pas le shader animé. Le SVG constellation
  // statique a déjà la même intention de signature territoriale + reste sobre.
  if (reducedMotion) {
    return (
      <div aria-hidden className={className} style={{ opacity }}>
        <RDCConstellation />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={className}
      style={{ opacity, position: "absolute", inset: 0 }}
    >
      <GrainGradient
        // Fond noir profond — laisse la couleur RDC ressortir
        colorBack={BG_DEEP}
        // 3 couleurs : vert primaire (signature), jaune drapeau (accent),
        // vert foncé (transition douce). Pas de blanc — ça casserait la
        // teinte territoriale.
        colors={[RDC_GREEN, RDC_YELLOW, RDC_GREEN_DEEP]}
        // shape 6 = blob organique. Évite le côté "wave" (shape 1) qui rappelle
        // les hero SaaS startup, et le "dots" (2) qui ferait pattern grid.
        shape="blob"
        // softness élevée → transitions fluides entre les 3 couleurs
        softness={0.85}
        // intensity = amplitude du blob. 0.6 donne un mouvement marqué sans
        // saturer la zone du H1.
        intensity={0.6}
        // noise = grain Paper signature. 0.4 = perceptible sans être sale.
        noise={0.4}
        // Vitesse de l'animation : très lente (0.3) — on veut une présence
        // ambiante, pas un écran qui distrait.
        speed={0.3}
        // scale 1.5 → le blob occupe plus que la zone visible, pas de bord net
        scale={1.5}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

export default LeopardsGrainBackground;
