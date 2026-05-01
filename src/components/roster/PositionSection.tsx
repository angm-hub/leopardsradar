import PlayerCard from "@/components/home/PlayerCard";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

interface PositionSectionProps {
  position: DBPosition;
  players: DBPlayer[];
}

const SECTION_META: Record<
  DBPosition,
  { kicker: string; title: string; tagline: string }
> = {
  Goalkeeper: {
    kicker: "Ligne 1",
    title: "Les gardiens.",
    tagline: "La dernière barrière",
  },
  Defender: {
    kicker: "Ligne 2",
    title: "Les défenseurs.",
    tagline: "L'arrière-garde",
  },
  Midfield: {
    kicker: "Ligne 3",
    title: "Les milieux.",
    tagline: "Le moteur",
  },
  Attack: {
    kicker: "Ligne 4",
    title: "Les attaquants.",
    tagline: "La pointe",
  },
};

/**
 * PositionSection — bloc éditorial regroupant les joueurs d'une ligne.
 *
 * Heading serif XL + kicker mono + tagline italique pour donner un angle
 * éditorial à chaque ligne, plutôt qu'un mur de cards uniformes.
 *
 * Compte les championnats représentés pour générer un sub-pitch chiffré
 * automatique ("8 défenseurs sur 5 championnats").
 */
export function PositionSection({ position, players }: PositionSectionProps) {
  if (players.length === 0) return null;
  const meta = SECTION_META[position];

  // Compte les championnats / clubs distincts (proxy de variété)
  const distinctClubs = new Set(
    players.map((p) => p.current_club).filter(Boolean),
  );

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-3 border-b border-border pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
            {meta.kicker} · {meta.tagline}
          </p>
          <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            {meta.title}
          </h2>
        </div>
        <p className="text-xs text-muted-light font-mono">
          {players.length} joueur{players.length > 1 ? "s" : ""} · {distinctClubs.size} club
          {distinctClubs.size > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {players.map((p) => (
          <PlayerCard key={p.slug} player={p} />
        ))}
      </div>
    </section>
  );
}
