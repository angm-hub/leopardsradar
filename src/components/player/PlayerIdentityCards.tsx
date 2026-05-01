import { Calendar, MapPin, Footprints, Ruler } from "lucide-react";

interface PlayerIdentityCardsProps {
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  countryOfBirth: string | null;
  foot: "left" | "right" | "both" | null;
  heightCm: number | null;
}

/**
 * PlayerIdentityCards — 4 cards d'identité avec icônes.
 *
 * Remplace l'ancienne section "Infos" en 8 cellules dl/dt/dd plates.
 * Chaque card = un fait, une icône, une lecture rapide.
 */
export function PlayerIdentityCards({
  dateOfBirth,
  placeOfBirth,
  countryOfBirth,
  foot,
  heightCm,
}: PlayerIdentityCardsProps) {
  const ageString = dateOfBirth ? buildAgeString(dateOfBirth) : "—";
  const birthplace = [placeOfBirth, countryOfBirth].filter(Boolean).join(", ") || "—";
  const footLabel = foot
    ? foot === "left"
      ? "Gauche"
      : foot === "right"
        ? "Droit"
        : "Ambidextre"
    : "—";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card icon={<Calendar className="h-3.5 w-3.5" />} label="Né le" value={ageString} />
      <Card icon={<MapPin className="h-3.5 w-3.5" />} label="Lieu de naissance" value={birthplace} />
      <Card icon={<Footprints className="h-3.5 w-3.5" />} label="Pied fort" value={footLabel} />
      <Card icon={<Ruler className="h-3.5 w-3.5" />} label="Taille" value={heightCm ? `${heightCm} cm` : "—"} />
    </div>
  );
}

function buildAgeString(dob: string): string {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Card({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[9px] uppercase tracking-[0.25em] font-mono">
          {label}
        </span>
      </div>
      <p className="mt-2 font-serif text-base md:text-lg text-foreground leading-tight">
        {value}
      </p>
    </div>
  );
}
