import { eligibilityLabel } from "@/lib/playerHelpers";

/**
 * eligibility_note est un journal interne : segments séparés par " | ",
 * chacun préfixé d'un tag daté comme "[elig 2026-07-09]" ou
 * "[fact-check 2026-07-08]", avec les sources en fin de segment.
 * Côté public on ne montre que les verdicts, sans tags ni URLs.
 */
const VERDICT_RE =
  /SWITCHABLE|INELIGIBLE|SELECTED|Aucune cape|Base juridique|cap-tied|éligible|eligible/i;

export function publicEligibilityNote(raw: string): string {
  const segments = raw
    .split(" | ")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) return "";
  const verdicts = segments.filter((s) => VERDICT_RE.test(s));
  const picked = verdicts.length > 0 ? verdicts.slice(-2) : [segments[segments.length - 1]];
  return picked
    .map((s) =>
      s
        .replace(/^(\[[^\]]*\]\s*)+/, "")
        .replace(/\s*Sources?\s*:\s*.*$/i, "")
        .trim(),
    )
    .filter(Boolean)
    .join(" ");
}

/**
 * Build the editorial line that explains why the player is on the radar.
 * Used both inline in the player fold (as a compact pull quote) and
 * potentially in any teaser surface that needs a one-liner.
 *
 * Returns the public rendition of eligibility_note when present, falls
 * back to a synthetic line built from status + category + caps so we
 * never show an empty quote.
 */
export function buildPlayerEligibilityLine(args: {
  eligibilityNote: string | null;
  eligibilityStatus: string | null;
  category: "roster" | "radar" | "heritage";
  capsRdc: number;
}): string {
  const note = args.eligibilityNote?.trim();
  if (note) {
    const publicNote = publicEligibilityNote(note);
    if (publicNote) return publicNote;
  }
  if (args.category === "roster") {
    return args.capsRdc > 0
      ? `Membre du roster Léopards. ${args.capsRdc} sélection${args.capsRdc > 1 ? "s" : ""} déjà avec la RDC.`
      : "Joueur du roster Léopards en route vers ses premières sélections.";
  }
  if (args.category === "heritage") {
    return "Profil héritage RDC : ascendance ou attaches familiales fortes avec le pays, à suivre dans la durée.";
  }
  return `Profil suivi par notre radar · statut : ${eligibilityLabel(args.eligibilityStatus).toLowerCase()}.`;
}

interface PlayerEligibilityQuoteProps {
  text: string;
  className?: string;
  /** "compact" → inline-fold version (smaller, no kicker). "full" → standalone section version with kicker. */
  variant?: "compact" | "full";
}

/**
 * Editorial pull quote that surfaces the reason this player is being
 * tracked. Designed to live inside the player hero fold so the visitor
 * gets the answer to "why am I reading this?" before any scroll.
 */
export function PlayerEligibilityQuote({
  text,
  className,
  variant = "compact",
}: PlayerEligibilityQuoteProps) {
  if (!text) return null;
  if (variant === "full") {
    return (
      <div className={className}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono mb-4">
          Pourquoi il est sur notre radar
        </p>
        <blockquote className="border-l-2 border-primary/60 pl-5 md:pl-6">
          <p className="font-serif text-xl md:text-2xl italic leading-relaxed text-foreground/90">
            {text}
          </p>
        </blockquote>
      </div>
    );
  }
  return (
    <blockquote className={`border-l-2 border-primary/60 pl-4 ${className ?? ""}`}>
      <p className="font-serif text-base md:text-lg italic leading-snug text-foreground/85">
        {text}
      </p>
    </blockquote>
  );
}

