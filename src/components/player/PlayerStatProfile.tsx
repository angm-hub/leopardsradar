import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import type { DBPlayer } from "@/types/dbPlayer";
import { computePlayerScores } from "@/lib/playerScores";
import { PlayerHexagon } from "./PlayerHexagon";

interface PlayerStatProfileProps {
  player: DBPlayer;
}

/**
 * PlayerStatProfile — section "Profil statistique" sur la fiche Player.
 *
 * 2-col layout : hexagon SVG à gauche, détail des 6 axes à droite.
 * Sur mobile, hexagon en haut, détail en dessous.
 *
 * Quand toutes les valeurs sont à null (joueur sans aucune donnée
 * saison ni caps), on cache la section au lieu d'afficher un hexagon
 * vide — pas d'espace mort dans la page.
 */
export function PlayerStatProfile({ player }: PlayerStatProfileProps) {
  const scores = computePlayerScores(player);
  const hasAnyData = scores.order.some((k) => scores.axes[k].value !== null);
  if (!hasAnyData) return null;

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
      <p className="mb-8 max-w-xl text-sm text-muted-light">
        Six axes notés sur 100. Quatre universels, deux propres au poste{" "}
        {scores.positionLabel ? (
          <>
            <span className="text-foreground/85">{scores.positionLabel.toLowerCase()}</span>
            .
          </>
        ) : (
          "."
        )}{" "}
        Les axes marqués <span className="font-mono text-foreground/70">—</span> attendent une
        donnée que nous n'avons pas encore.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* Hexagon */}
        <div className="flex justify-center lg:justify-start">
          <PlayerHexagon scores={scores} size={340} />
        </div>

        {/* Axis breakdown */}
        <div className="space-y-2">
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

export default PlayerStatProfile;
