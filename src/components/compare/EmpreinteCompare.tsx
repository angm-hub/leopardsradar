import { usePlayerGradebars } from "@/hooks/usePlayerGradebars";
import { Empreinte } from "@/components/player/Empreinte";
import type { DBPlayer } from "@/types/dbPlayer";

/**
 * EmpreinteCompare — comparaison de deux joueurs par leurs empreintes, côte à
 * côte. Remplace l'hexagone superposé (motif banni de la DA LR) : deux pizzas
 * de percentiles se lisent d'un coup, chacune avec son pool de comparaison.
 *
 * Pour un même poste, les axes sont identiques → les formes se comparent
 * directement. Sur un cross-poste, chaque empreinte garde son propre pool (la
 * note cross-position de la page le précise). Chiffres exacts : CompareDeltas.
 */

function EmpreinteCol({ player }: { player: DBPlayer }) {
  const { gradebars, loading } = usePlayerGradebars(player.slug);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-center min-h-[38px]">
        <p className="font-serif text-base sm:text-lg font-semibold text-foreground leading-tight line-clamp-1">
          {player.name}
        </p>
        {gradebars ? (
          <p className="mt-0.5 text-[10px] font-mono uppercase tracking-[0.14em] text-muted">
            vs {gradebars.pool_label}
          </p>
        ) : null}
      </div>
      {loading ? (
        <div className="aspect-square w-full max-w-[260px] bg-card animate-pulse rounded-card" />
      ) : gradebars && gradebars.axes.length > 0 ? (
        <Empreinte
          axes={gradebars.axes}
          poolLabel={gradebars.pool_label}
          variant="card"
          className="w-full max-w-[280px]"
        />
      ) : (
        <p className="py-16 text-center text-[11px] text-muted">
          Empreinte pas encore calculable à ce poste.
        </p>
      )}
    </div>
  );
}

export function EmpreinteCompare({
  playerA,
  playerB,
}: {
  playerA: DBPlayer;
  playerB: DBPlayer;
}) {
  return (
    <div className="grid w-full max-w-xl grid-cols-2 gap-4 sm:gap-8">
      <EmpreinteCol player={playerA} />
      <EmpreinteCol player={playerB} />
    </div>
  );
}

export default EmpreinteCompare;
