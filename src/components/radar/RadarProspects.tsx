/**
 * RadarProspects — "Diamants bruts"
 *
 * Contre-poids editorial a RadarHighlights (Top 5 valeurs). Le tri par valeur
 * marchande enterre en bas des ~1200 nodes les jeunes prospects sans prix
 * Transfermarkt (<=20 ans, valeur nulle), qui sont pourtant la vraie cible du
 * scouting : ils n'ont pas encore de valeur justement parce qu'ils n'ont pas
 * encore signe pro, pas parce qu'ils sont faibles.
 *
 * Ajoute le 19/07/2026 : Alexandre repérait Borasio (Juventus U20), Nzinga /
 * M'futila (PSG U23), Sambi Mbungu (Lyon B) comme "manquants" alors qu'ils
 * etaient en base mais invisibles, coules par le tri valeur. Ce bloc les
 * remonte en haut du Radar.
 *
 * Data : filtre client-side sur les players deja charges par Radar.tsx.
 * Aucun fetch supplementaire.
 */

import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

// Grands centres de formation : on remonte ces clubs en priorite dans la
// vitrine (signal de qualite de l'environnement du jeune).
const NOTABLE =
  /(PSG|Paris|Bayern|Juventus|Lyon|Monaco|Lille|Marseille|Chelsea|Arsenal|City|United|Tottenham|Anderlecht|Genk|Brugge|Ajax|PSV|Feyenoord|Leverkusen|Dortmund|Leipzig|Milan|Inter|Rennes|Nantes|Metz|Nottingham|Standard|Reading|Burnley|Watford|Sunderland|Wolfsburg|Brentford)/i;

function rank(p: DBPlayer): number {
  let s = p.age ?? 99; // plus jeune d'abord
  if (p.current_club && NOTABLE.test(p.current_club)) s -= 100; // grands clubs en tete
  return s;
}

export function RadarProspects({ players }: { players: DBPlayer[] }) {
  const prospects = players
    .filter(
      (p) =>
        p.verified &&
        p.age != null &&
        p.age <= 20 &&
        (p.market_value_eur == null || p.market_value_eur === 0) &&
        p.eligibility_status !== "ineligible" &&
        p.computed_eligibility_status !== "INELIGIBLE" &&
        !!p.slug,
    )
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, 10);

  if (prospects.length === 0) return null;

  return (
    <section aria-labelledby="prospects-heading" className="container-site pb-12 pt-2">
      <div className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary/80">
          Radar · Diamants bruts
        </p>
        <h2
          id="prospects-heading"
          className="mt-2 font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
        >
          Les pépites que la valeur marchande cache.
        </h2>
        <p className="mt-1.5 text-sm text-muted-light">
          Jeunes de 20 ans ou moins, dans de grands centres de formation, pas encore cotés.
          La vraie cible du scouting, remontée en haut du Radar plutôt qu'enterrée en bas.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {prospects.map((p) => {
          const positionLabel = p.position ? POSITION_LABEL[p.position as DBPosition] : null;
          return (
            <Link
              key={p.id}
              to={`/player/${p.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-card border border-border bg-card",
                "p-4 flex flex-col gap-3 transition-colors duration-200 hover:border-border-hover",
              )}
            >
              <div className="flex items-center gap-3">
                <PlayerAvatar
                  name={p.name}
                  src={p.image_url}
                  srcAlt={p.image_url_alt}
                  className="h-11 w-11 rounded-full ring-1 ring-border shrink-0"
                  initialsClassName="text-sm"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-sm font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-muted-light truncate">
                    {[p.age ? `${p.age} ans` : null, positionLabel].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                <span className="text-[11px] text-muted truncate">{p.current_club ?? ""}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary/80 shrink-0">
                  Espoir
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default RadarProspects;
