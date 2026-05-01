import { eligibilityLabel } from "@/lib/playerHelpers";

interface PlayerWhySectionProps {
  eligibilityNote: string | null;
  eligibilityStatus: string | null;
  category: "roster" | "radar" | "heritage";
  capsRdc: number;
}

/**
 * PlayerWhySection — pourquoi ce joueur est dans le radar / roster.
 *
 * Sort la `eligibility_note` du fond de page et la met en valeur juste
 * sous le hero. C'est LA raison pour laquelle un visiteur arrive sur ce
 * profil — donc l'angle éditorial qui doit s'afficher en premier.
 *
 * Si la note est absente, on construit une phrase synthétique à partir
 * du statut + caps pour ne jamais laisser un vide.
 */
export function PlayerWhySection({
  eligibilityNote,
  eligibilityStatus,
  category,
  capsRdc,
}: PlayerWhySectionProps) {
  const fallback = buildFallback(category, eligibilityStatus, capsRdc);
  const text = eligibilityNote?.trim() || fallback;
  if (!text) return null;

  return (
    <section className="container-site py-12 md:py-16">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono mb-4">
          Pourquoi il est sur notre radar
        </p>
        <blockquote className="border-l-2 border-primary/60 pl-5 md:pl-6">
          <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-foreground/90">
            {text}
          </p>
        </blockquote>
      </div>
    </section>
  );
}

function buildFallback(
  category: "roster" | "radar" | "heritage",
  status: string | null,
  caps: number,
): string {
  if (category === "roster") {
    return caps > 0
      ? `Membre du roster Léopards. ${caps} sélection${caps > 1 ? "s" : ""} déjà avec la RDC.`
      : "Joueur du roster Léopards en route vers ses premières sélections.";
  }
  if (category === "heritage") {
    return "Profil héritage RDC : ascendance ou attaches familiales fortes avec le pays, à suivre dans la durée.";
  }
  // radar
  return `Profil suivi par notre radar — statut : ${eligibilityLabel(status).toLowerCase()}.`;
}
