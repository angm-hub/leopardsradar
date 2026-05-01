import type { BestXIPlayer } from "@/hooks/useBestXI";

interface XIStatsPanelProps {
  players: BestXIPlayer[];
}

const formatValueShort = (eur: number): string => {
  if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)} Md`;
  if (eur >= 1_000_000) return `${Math.round(eur / 1_000_000)} M`;
  if (eur >= 1_000) return `${Math.round(eur / 1_000)} k`;
  return `${eur}`;
};

/**
 * XIStatsPanel — 4 stats clés du Best XI affiché.
 *
 * Donne instantanément la lecture chiffrée de la composition :
 * âge moyen, valeur cumulée, capés RDC, championnats représentés.
 */
export function XIStatsPanel({ players }: XIStatsPanelProps) {
  const ages = players.map((p) => p.age).filter((a): a is number => !!a);
  const avgAge =
    ages.length > 0 ? ages.reduce((s, a) => s + a, 0) / ages.length : null;

  const totalValue = players.reduce(
    (s, p) => s + (p.market_value_eur ?? 0),
    0,
  );

  const cappedCount = players.filter(
    (p) => (p.caps_rdc ?? 0) > 0,
  ).length;

  // Distinct clubs as a proxy for championship variety
  const clubs = new Set(players.map((p) => p.current_club).filter(Boolean));

  return (
    <dl className="grid grid-cols-2 gap-3">
      <Stat label="Âge moyen" value={avgAge !== null ? avgAge.toFixed(1) : "—"} unit={avgAge !== null ? "ans" : undefined} />
      <Stat label="Valeur cumulée" value={formatValueShort(totalValue)} unit="€" />
      <Stat label="Déjà capés RDC" value={`${cappedCount}`} unit="/ 11" />
      <Stat label="Clubs représentés" value={`${clubs.size}`} />
    </dl>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-card border border-border bg-card/60 p-3">
      <dt className="text-[9px] uppercase tracking-[0.25em] text-muted font-mono">
        {label}
      </dt>
      <dd className="mt-1.5 font-serif text-2xl text-foreground leading-none">
        {value}
        {unit ? (
          <span className="text-xs text-muted-light font-sans ml-1">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}
