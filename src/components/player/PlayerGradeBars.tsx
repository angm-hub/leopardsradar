import { motion } from "framer-motion";
import { usePlayerGradebars } from "@/hooks/usePlayerGradebars";

/**
 * PlayerGradeBars — radar de potentiel en barres percentiles (F2).
 *
 * Pattern « gradebars » validé côté Virage (barres vs moyenne du poste,
 * couleur par percentile), transposé dans la DA du site : track sombre,
 * fill coloré par tiers, trait de médiane à 50. Chaque barre lit une donnée
 * réelle avec son pool de comparaison affiché : pas de score boîte noire.
 *
 * Le hook ne renvoie que les axes calculables pour ce joueur : aucun axe
 * vide, aucun tiret. Deux axes minimum sont garantis pour tout le pool
 * (niveau de jeu, ancrage Léopards).
 */

function fillColor(pct: number): string {
  if (pct >= 66) return "bg-emerald-500/80";
  if (pct >= 33) return "bg-amber-500/80";
  return "bg-red-500/70";
}

function textColor(pct: number): string {
  if (pct >= 66) return "text-emerald-400";
  if (pct >= 33) return "text-amber-400";
  return "text-red-400";
}

export function PlayerGradeBars({ slug }: { slug: string }) {
  const { gradebars, loading } = usePlayerGradebars(slug);

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-4 w-40 bg-card animate-pulse rounded" />
        <div className="h-32 bg-card animate-pulse rounded-card" />
      </div>
    );
  }

  if (!gradebars || gradebars.axes.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h2
          className="text-lg font-semibold text-foreground"
          style={{ letterSpacing: "-0.02em" }}
        >
          Radar de potentiel
        </h2>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
          vs {gradebars.pool_label}
        </span>
      </div>

      <div className="rounded-card border border-border bg-card p-6 space-y-5">
        {gradebars.axes.map((a) => (
          <div key={a.axis}>
            <div className="flex items-baseline justify-between gap-3 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted">
                {a.label}
              </span>
              <span className="text-sm text-foreground/90">
                {a.value}
                <span className={`ml-3 font-mono text-xs ${textColor(a.percentile)}`}>
                  {Math.round(a.percentile)}
                  <span className="text-[9px] align-super">e</span> pct
                </span>
              </span>
            </div>
            <div
              className="relative h-2 rounded-full bg-card-hover overflow-hidden"
              role="img"
              aria-label={`${a.label} : ${a.value}, ${Math.round(a.percentile)}e percentile sur ${a.pool_n} joueurs`}
            >
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${fillColor(a.percentile)}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.max(a.percentile, 2)}%` }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Trait de médiane du pool */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-1/2 w-px bg-foreground/25"
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">
              Moyenne {gradebars.pool_label} : {a.pool_avg} · pool {a.pool_n}
            </p>
          </div>
        ))}

        <p className="pt-1 text-[11px] text-muted border-t border-border/40">
          Percentiles calculés sur les joueurs suivis du même poste. Le trait
          vertical marque la médiane. Recalculé à chaque chargement depuis la
          base.
        </p>
      </div>
    </div>
  );
}

export default PlayerGradeBars;
