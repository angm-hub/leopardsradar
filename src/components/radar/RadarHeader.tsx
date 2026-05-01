interface RadarHeaderProps {
  shown: number;
  total: number;
  totalValue: number;
}

const formatValueShort = (eur: number): string => {
  if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)} Md €`;
  if (eur >= 1_000_000) return `${Math.round(eur / 1_000_000)} M €`;
  if (eur >= 1_000) return `${Math.round(eur / 1_000)} k €`;
  return `${eur} €`;
};

/**
 * RadarHeader — ribbon éditorial au-dessus du canvas.
 * Donne le titre du mode, la lecture statistique, et plante l'intention.
 * Couche de signature qui transforme le canvas en page de référence.
 */
export function RadarHeader({ shown, total, totalValue }: RadarHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
          Vue · Carte
        </p>
        <h2 className="mt-2 font-serif text-3xl md:text-4xl text-foreground tracking-tight">
          La galaxie des Léopards
        </h2>
        <p className="mt-2 text-sm text-muted-light max-w-xl">
          Chaque pill est un joueur. Position selon valeur marchande (axe X) et
          jeunesse (axe Y). Lignes jaunes : coéquipiers en club. Hover pour le
          détail.
        </p>
      </div>

      <div className="flex items-stretch gap-4 text-right">
        <Stat label="Affichés" value={`${shown}`} sub={`/ ${total}`} />
        <div className="w-px bg-border/60" />
        <Stat label="Valeur cumulée" value={formatValueShort(totalValue)} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl text-foreground leading-none">
        {value}
        {sub ? (
          <span className="text-sm text-muted-light font-sans ml-1">{sub}</span>
        ) : null}
      </p>
    </div>
  );
}
