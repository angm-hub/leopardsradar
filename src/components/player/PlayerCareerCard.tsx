import { Briefcase } from "lucide-react";

interface PlayerCareerCardProps {
  currentClub: string | null;
  contractExpires: string | null;
  agent: string | null;
  onLoanFrom: string | null;
}

/**
 * PlayerCareerCard — carte unique sur la situation contractuelle actuelle.
 *
 * Concentre 4 infos qui étaient diluées dans la section "Infos" plate :
 * club courant, fin de contrat, agent, club prêteur. Permet de lire en
 * un coup d'œil l'état contractuel — utile pour les visiteurs qui
 * scrutent le mercato.
 */
export function PlayerCareerCard({
  currentClub,
  contractExpires,
  agent,
  onLoanFrom,
}: PlayerCareerCardProps) {
  // Si rien de notable, on n'affiche rien
  if (!currentClub && !contractExpires && !agent && !onLoanFrom) return null;

  const contractYear = contractExpires
    ? new Date(contractExpires).getFullYear()
    : null;

  return (
    <div className="rounded-card border border-border bg-card p-5 md:p-6">
      <div className="flex items-center gap-2 text-muted mb-4">
        <Briefcase className="h-3.5 w-3.5" />
        <span className="text-[9px] uppercase tracking-[0.25em] font-mono">
          Carrière en cours
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <Field label="Club" value={currentClub ?? "Sans club"} primary />
        <Field
          label="Fin de contrat"
          value={contractYear ? `Juin ${contractYear}` : "Non renseignée"}
        />
        <Field label="Agent" value={agent ?? "Non renseigné"} />
        {onLoanFrom ? (
          <Field label="Prêté par" value={onLoanFrom} highlight />
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  primary,
  highlight,
}: {
  label: string;
  value: string;
  primary?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted font-mono">
        {label}
      </dt>
      <dd
        className={
          primary
            ? "mt-1 font-serif text-lg md:text-xl text-foreground"
            : highlight
              ? "mt-1 text-sm text-primary"
              : "mt-1 text-sm text-foreground/85"
        }
      >
        {value}
      </dd>
    </div>
  );
}
