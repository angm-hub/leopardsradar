import { usePlayerGradebars } from "@/hooks/usePlayerGradebars";
import { Empreinte } from "@/components/player/Empreinte";

/**
 * PlayerEmpreinte — signature data de la fiche joueur (remplace PlayerGradeBars).
 *
 * La pizza de percentiles (composant Empreinte, partagé avec le roster) est la
 * pièce maîtresse ; à côté, la lecture chiffrée de chaque axe garde la valeur
 * brute et la moyenne du pool (pas de score boîte noire). Même RPC que partout,
 * donc auto-fraîche. N'affiche que les axes calculables : jamais de case vide.
 */

function pctClass(pct: number): string {
  if (pct >= 75) return "text-primary";
  if (pct >= 40) return "text-foreground";
  return "text-muted-light";
}

export function PlayerEmpreinte({ slug }: { slug: string }) {
  const { gradebars, loading } = usePlayerGradebars(slug);

  if (loading) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="h-4 w-40 bg-card animate-pulse rounded" />
        <div className="h-64 bg-card animate-pulse rounded-card" />
      </div>
    );
  }

  if (!gradebars || gradebars.axes.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold text-foreground" style={{ letterSpacing: "-0.02em" }}>
          Empreinte
        </h2>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
          percentiles vs {gradebars.pool_label}
        </span>
      </div>

      <div className="rounded-card border border-border bg-card p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* pizza */}
          <Empreinte axes={gradebars.axes} poolLabel={gradebars.pool_label} variant="full" />

          {/* lecture chiffrée */}
          <div className="divide-y divide-border/50">
            {gradebars.axes.map((a) => (
              <div key={a.axis} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted">{a.label}</p>
                  <p className="mt-0.5 text-sm text-foreground/90">{a.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Moyenne {gradebars.pool_label} : {a.pool_avg}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`font-serif text-2xl font-semibold ${pctClass(a.percentile)}`} style={{ letterSpacing: "-0.03em" }}>
                    {Math.round(a.percentile)}
                  </span>
                  <span className="ml-0.5 align-super text-[10px] text-muted">e</span>
                  <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted">pct · pool {a.pool_n}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 pt-4 text-[11px] text-muted border-t border-border/40">
          Chaque tranche est le rang percentile du joueur sur cet axe, face aux
          joueurs suivis du même poste. Accent doré au-delà du 75e. Recalculé à
          chaque chargement depuis la base.
        </p>
      </div>
    </div>
  );
}

export default PlayerEmpreinte;
