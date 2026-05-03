import { Link } from "react-router-dom";
import { ArrowRight, Quote } from "lucide-react";
import { ResidualGradient } from "@/components/ui/GradientBackgrounds";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { useBestXI } from "@/hooks/useBestXI";

/**
 * BestXIPreviewSection — promotion home du Best XI Diaspora.
 *
 * Refonte audit éditorial :
 *   - Avant : copy générique "On fait l'exercice tous les vendredis" + liste
 *     11 joueurs sans contexte, dans un BrowserFrame de mockup → UI/promo
 *     plus que produit.
 *   - Après : la composition s'affiche dans la home elle-même, avec la
 *     note éditoriale stockée en BDD mise en valeur en citation. Le visiteur
 *     voit le produit, pas une preview du produit.
 *
 * La note éditoriale (champ `editorial_note` de la table best_xi) est ce
 * qui sépare une compo automatique d'un avis. Elle est rédigée à chaque
 * édition et stockée en BDD — la voix reste anonyme (pas de signature),
 * c'est "Léopards Radar" qui parle.
 */
export function BestXIPreviewSection() {
  const { data, loading } = useBestXI();

  return (
    <section className="relative bg-card/30 py-16 md:py-24 border-y border-border/50">
      <ResidualGradient position="top-bottom" />
      <div className="container-site relative">
        <div className="mb-10 max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/85 mb-3">
            Best XI Diaspora
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Le onze de la semaine.
          </h2>
          <p className="mt-4 text-muted-light text-base md:text-lg leading-relaxed">
            Roster + diaspora éligible confondus. La meilleure composition
            possible des Léopards si le coup d'envoi du Mondial était demain.
            Recomposée chaque dimanche soir.
          </p>
        </div>

        {loading ? (
          <BestXISkeleton />
        ) : !data ? (
          <BestXIEmpty />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-start">
            {/* COL 1 — Note éditoriale + métadonnées */}
            <div className="lg:sticky lg:top-24 space-y-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                Édition · {formatPublishedDate(data.published_at)} ·{" "}
                <span className="text-primary/85">{data.formation}</span>
              </div>
              {data.editorial_note ? (
                <blockquote className="relative">
                  <Quote
                    className="absolute -left-1 -top-2 h-8 w-8 text-primary/20"
                    aria-hidden
                  />
                  <p className="pl-7 font-serif italic text-xl md:text-2xl leading-relaxed text-foreground/90">
                    {data.editorial_note}
                  </p>
                  <footer className="pl-7 mt-4 text-[11px] font-mono uppercase tracking-[0.22em] text-muted">
                    — Note éditoriale
                  </footer>
                </blockquote>
              ) : (
                <p className="font-serif text-lg text-foreground/70 italic">
                  {data.title}
                </p>
              )}
              <Link
                to="/best-xi"
                className="group inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary-hover transition-colors"
              >
                Voir le détail et l'historique
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* COL 2 — Composition (11 noms compacts) */}
            <div className="rounded-card border border-border bg-background overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-card/50 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {data.title}
              </div>
              <ul className="divide-y divide-border/60">
                {data.slots.map((slot, idx) => {
                  const p = data.playersById[slot.player_id];
                  if (!p) return null;
                  return (
                    <li key={`${slot.position}-${idx}`}>
                      <Link
                        to={`/player/${p.slug}`}
                        className="flex items-center gap-3 px-5 py-2.5 hover:bg-card-hover transition-colors group"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-wider text-primary/85 w-10 shrink-0">
                          {slot.position}
                        </span>
                        <PlayerAvatar
                          name={p.name}
                          src={p.image_url}
                          srcAlt={p.image_url_alt}
                          className="h-9 w-9 shrink-0 rounded-full border border-border"
                          initialsClassName="text-xs"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-serif text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          {p.current_club ? (
                            <p className="text-[11px] text-muted truncate">
                              {p.current_club}
                            </p>
                          ) : null}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BestXISkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12">
      <div className="space-y-3">
        <div className="h-3 w-40 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
        <div className="h-24 rounded bg-card animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
      </div>
      <div className="rounded-card border border-border bg-card/50 divide-y divide-border/60">
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} className="h-12 animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
        ))}
      </div>
    </div>
  );
}

function BestXIEmpty() {
  return (
    <div className="rounded-card border border-dashed border-border bg-card/30 p-10 text-center max-w-2xl mx-auto">
      <p className="font-serif text-xl text-foreground">
        Première composition à venir
      </p>
      <p className="mt-2 text-sm text-muted-light">
        Le Best XI Diaspora sera publié lors de la prochaine édition du
        dimanche soir.
      </p>
    </div>
  );
}

function formatPublishedDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default BestXIPreviewSection;
