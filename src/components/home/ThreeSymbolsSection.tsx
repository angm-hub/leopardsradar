/**
 * ThreeSymbolsSection — Manifeste sémiotique du brand book Premium v2.
 *
 * Trois symboles, un seul regard :
 *   I. Le Radar — l'instrument, la méthode, l'œil moderne.
 *   II. Le Léopard — le félin national, le nom des Léopards depuis 1968.
 *   III. L'Okapi — l'endémique, l'observateur de la forêt, signature graphique.
 *
 * Placement home : entre BestXIPreviewSection (preview produit) et MaListeCTA
 * (push conversion Mondial). Moment éditorial qui ancre la marque sans casser
 * le flux de conversion. Atmosphère cobalt + grain + cards glass subtiles.
 *
 * Source : composant PHManifesto du handoff bundle Anthropic Design.
 */

import { motion } from "framer-motion";
import { LRMark } from "@/components/ui/Wordmark";

// ─── Léopard silhouette — profil félin minimal géométrique ──────────────────
function LeopardSilhouette({
  size = 96,
  color = "currentColor",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 80"
      width={size}
      height={(size * 80) / 120}
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M 8 50 L 12 44 Q 18 38, 26 38 L 38 36 Q 44 30, 50 28 L 64 26
           Q 72 26, 80 30 L 96 30 Q 100 28, 104 26 L 108 22 L 110 28
           L 108 32 Q 104 34, 102 34 L 100 40 Q 98 48, 102 56 L 104 70
           L 100 70 L 96 58 L 88 60 L 90 70 L 86 70 L 82 58 L 50 58
           L 48 70 L 44 70 L 44 58 L 30 58 L 28 70 L 24 70 L 24 56
           Q 18 54, 14 54 L 8 56 Z"
        fill={color}
      />
      <circle cx="60" cy="42" r="1.5" fill="#050B1A" opacity="0.55" />
      <circle cx="72" cy="40" r="1.5" fill="#050B1A" opacity="0.55" />
      <circle cx="84" cy="44" r="1.2" fill="#050B1A" opacity="0.55" />
      <circle cx="50" cy="48" r="1.3" fill="#050B1A" opacity="0.55" />
      <circle cx="68" cy="50" r="1.5" fill="#050B1A" opacity="0.55" />
      <circle cx="80" cy="52" r="1.2" fill="#050B1A" opacity="0.55" />
    </svg>
  );
}

// ─── Okapi silhouette — profil tête + cou ───────────────────────────────────
function OkapiSilhouette({
  size = 96,
  color = "currentColor",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <path d="M 38 12 L 32 4 L 44 10 Z" fill={color} />
      <path d="M 50 10 L 48 2 L 58 10 Z" fill={color} />
      <path
        d="M 30 16
           Q 28 22, 32 26
           L 38 28
           Q 42 28, 48 28
           L 62 28
           Q 72 30, 76 38
           L 80 50
           Q 80 56, 78 58
           L 74 56
           Q 72 50, 70 44
           L 64 40
           L 58 40
           L 52 42
           Q 46 44, 42 50
           L 36 56
           L 32 92
           L 26 92
           L 28 50
           Q 22 44, 22 36
           Q 22 24, 30 16 Z"
        fill={color}
      />
      <circle cx="35" cy="22" r="1.2" fill="#050B1A" />
    </svg>
  );
}

// ─── Card individuelle ──────────────────────────────────────────────────────

interface SymbolCardProps {
  numeral: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

function SymbolCard({
  numeral,
  title,
  subtitle,
  description,
  icon,
}: SymbolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="glass relative flex flex-col justify-between gap-6 rounded-card p-7 md:p-8"
    >
      {/* En-tête : numéro romain + sous-titre éditorial */}
      <div className="flex items-start justify-between">
        <span className="display-heading text-4xl text-primary">{numeral}</span>
        <span className="label-mono text-foreground/50">{subtitle}</span>
      </div>

      {/* Icône silhouette centrée */}
      <div className="flex min-h-[140px] flex-1 items-center justify-center">
        {icon}
      </div>

      {/* Titre + description */}
      <div>
        <h3 className="display-heading text-2xl md:text-3xl text-foreground">
          {title}
        </h3>
        <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-foreground/60">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Section principale ─────────────────────────────────────────────────────

export function ThreeSymbolsSection() {
  return (
    <section
      aria-labelledby="three-symbols-heading"
      className="relative overflow-hidden border-t border-border/40"
    >
      {/* Atmosphère cobalt en fond — radial gradients superposés. */}
      <div aria-hidden className="absolute inset-0 atmos-jade opacity-90" />

      {/* Vignette pour focaliser le centre. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(5,11,26,0.7) 0%, transparent 70%)",
        }}
      />

      {/* Grain texture */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.18]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="container-site relative z-10 py-20 md:py-28">
        {/* Eyebrow + titre éditorial */}
        <div className="mb-12 flex flex-col items-start gap-3 md:mb-16">
          <span className="label-mono text-cobalt-mist">012 — Sémiologie</span>
          <h2
            id="three-symbols-heading"
            className="display-heading text-4xl md:text-5xl lg:text-6xl text-foreground"
          >
            Trois symboles.{" "}
            <span className="text-foreground/45">Un seul regard.</span>
          </h2>
        </div>

        {/* Grille des 3 cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          <SymbolCard
            numeral="I."
            subtitle="The instrument"
            title="Le Radar."
            description="L'œil moderne. La méthode. Ce qui voit avant que le débat ne commence. Sans nostalgie, sans bruit."
            icon={<LRMark size={64} color="#9FB8E0" />}
          />
          <SymbolCard
            numeral="II."
            subtitle="The name"
            title="Le Léopard."
            description="Le félin national. La vitesse, la précision du saut, la patience. Le nom des Léopards depuis 1968."
            icon={<LeopardSilhouette size={120} color="#F5C518" />}
          />
          <SymbolCard
            numeral="III."
            subtitle="The endemic"
            title="L'Okapi."
            description="L'animal-licorne. Trouvé nulle part ailleurs. Discret, forestier, rare. Notre signature visuelle."
            icon={<OkapiSilhouette size={120} color="#ECE8DD" />}
          />
        </div>

        {/* Citation 1974 — discrète, ancre l'héritage sans bloc lourd */}
        <div className="mt-14 md:mt-20 flex flex-col items-start gap-3 border-t border-border/40 pt-8 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="label-mono text-foreground/45">
              1974 — 2026 · Cinquante ans de regard
            </span>
            <p className="mt-3 max-w-xl text-base md:text-lg text-foreground/70">
              Le Zaïre, premier sub-saharien en Coupe du Monde.{" "}
              <span className="text-foreground">22 Léopards</span> alors,{" "}
              <span className="text-primary">1 075 Léopards</span> aujourd'hui.
              Léopards Radar prolonge ce regard.
            </p>
          </div>
          <span className="display-heading text-5xl md:text-6xl text-torch">
            1974.
          </span>
        </div>
      </div>
    </section>
  );
}

export default ThreeSymbolsSection;
