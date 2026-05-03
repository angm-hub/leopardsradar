import { Link } from "react-router-dom";
import { Info, AlertCircle } from "lucide-react";
import type { DBPlayer } from "@/types/dbPlayer";
import { computePlayerScores } from "@/lib/playerScores";
import { PlayerHexagon } from "./PlayerHexagon";

interface PlayerStatProfileProps {
  player: DBPlayer;
}

// Threshold below which we hide the hexagon and switch to a 1-col axis
// breakdown : a polygon with only 1 or 2 vertices reads as broken, not
// honest. With 3+ axes the silhouette becomes informative.
const HEX_MIN_VALID_AXES = 3;

/**
 * PlayerStatProfile — section "Profil statistique" sur la fiche Player.
 *
 * Three rendering modes :
 *   - Empty  : zero data → section hidden entirely
 *   - Sparse : 1-2 axes filled → axis breakdown alone (no hexagon),
 *              with an editorial note about partial data
 *   - Full   : 3+ axes filled → 2-col layout with hexagon left + breakdown right
 *
 * The "sparse" mode prevents the dégénéré-polygon look on the long tail
 * of fiches where the free football-data.org tier doesn't reach (gardiens,
 * défenseurs non-scoreurs, championnats hors top 10).
 */
export function PlayerStatProfile({ player }: PlayerStatProfileProps) {
  const scores = computePlayerScores(player);
  const validAxes = scores.order.filter((k) => scores.axes[k].value !== null).length;
  if (validAxes === 0) return null;

  const isSparse = validAxes < HEX_MIN_VALID_AXES;

  return (
    <section className="container-site py-12 border-t border-border">
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-2">
        <h2 className="font-serif text-3xl text-foreground">
          Profil statistique.
        </h2>
        <Link
          to="/methodologie"
          className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.18em] text-muted hover:text-foreground transition-colors"
        >
          <Info className="h-3 w-3" />
          Méthodologie
        </Link>
      </div>

      {isSparse ? (
        <SparseIntro positionLabel={scores.positionLabel} validCount={validAxes} />
      ) : (
        <FullIntro positionLabel={scores.positionLabel} />
      )}

      <div
        className={
          isSparse
            ? "grid grid-cols-1"
            : "grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start"
        }
      >
        {!isSparse ? (
          <div className="flex justify-center lg:justify-start">
            <PlayerHexagon scores={scores} size={340} />
          </div>
        ) : null}

        <div className={isSparse ? "max-w-2xl space-y-2" : "space-y-2"}>
          {scores.order.map((key) => {
            const a = scores.axes[key];
            return (
              <div
                key={key}
                className="grid grid-cols-[140px_1fr_auto] items-baseline gap-4 py-3 border-b border-border/60 last:border-b-0"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {a.label}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground/85 truncate">
                    {a.fullLabel}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-light">
                    {a.raw}
                  </p>
                </div>
                <span
                  className={
                    a.value === null
                      ? "font-serif text-2xl text-muted"
                      : "font-serif text-2xl text-foreground"
                  }
                >
                  {a.value === null ? "—" : a.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FullIntro({ positionLabel }: { positionLabel: string | null }) {
  return (
    <p className="mb-8 max-w-xl text-sm text-muted-light">
      Six axes notés sur 100. Quatre universels, deux propres au poste{" "}
      {positionLabel ? (
        <>
          <span className="text-foreground/85">{positionLabel.toLowerCase()}</span>
          .
        </>
      ) : (
        "."
      )}{" "}
      Les axes marqués <span className="font-mono text-foreground/70">—</span> attendent une
      donnée que nous n'avons pas encore.
    </p>
  );
}

function SparseIntro({
  positionLabel,
  validCount,
}: {
  positionLabel: string | null;
  validCount: number;
}) {
  return (
    <div className="mb-8 flex max-w-2xl items-start gap-3 rounded-card border border-border/60 bg-card/40 p-4">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted" aria-hidden />
      <div>
        <p className="text-sm text-foreground/85">
          Données partielles pour ce profil{" "}
          {positionLabel ? (
            <span className="text-muted-light">({positionLabel.toLowerCase()})</span>
          ) : null}{" "}
          — {validCount} axe{validCount > 1 ? "s" : ""} renseigné{validCount > 1 ? "s" : ""} sur 6.
          Les statistiques saison ne sont actuellement disponibles que pour les
          joueurs des 10 compétitions majeures couvertes par notre pipeline auto.{" "}
          <Link
            to="/methodologie#frequence"
            className="text-primary hover:text-primary-hover transition-colors"
          >
            En savoir plus →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default PlayerStatProfile;
