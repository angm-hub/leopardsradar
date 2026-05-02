import type { DBPosition } from "@/types/dbPlayer";

export const POSITION_LABEL: Record<DBPosition, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfield: "Milieu",
  Attack: "Attaquant",
};

// Sober pill — neutral background, muted text, faint border.
// The position is signalled by a small colored dot (POSITION_DOT) the consumer
// renders inside the pill, not by tinting the whole pill.
// This keeps the editorial palette (dark + green + accent yellow) clean.
export const POSITION_BADGE: Record<DBPosition, string> =
  Object.freeze({
    Goalkeeper: "bg-card/40 text-muted-light border-border/60",
    Defender: "bg-card/40 text-muted-light border-border/60",
    Midfield: "bg-card/40 text-muted-light border-border/60",
    Attack: "bg-card/40 text-muted-light border-border/60",
  }) as Record<DBPosition, string>;

// Dot color per position (background utility class).
// Render as: <span className={cn("inline-block h-1.5 w-1.5 rounded-full", POSITION_DOT[pos])} />
export const POSITION_DOT: Record<DBPosition, string> = {
  Goalkeeper: "bg-yellow-400",
  Defender: "bg-emerald-400",
  Midfield: "bg-sky-400",
  Attack: "bg-rose-400",
};

export function initialsFromName(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

// Map a country / nationality string to its emoji flag.
// Covers the nations that appear in the dataset; everything else falls back
// to a neutral globe emoji.
const FLAG: Record<string, string> = {
  "DR Congo": "🇨🇩",
  "Congo": "🇨🇬",
  "France": "🇫🇷",
  "Belgium": "🇧🇪",
  "Belgique": "🇧🇪",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Angleterre": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Spain": "🇪🇸",
  "Espagne": "🇪🇸",
  "Portugal": "🇵🇹",
  "Switzerland": "🇨🇭",
  "Suisse": "🇨🇭",
  "Netherlands": "🇳🇱",
  "Pays-Bas": "🇳🇱",
  "Germany": "🇩🇪",
  "Allemagne": "🇩🇪",
  "Italy": "🇮🇹",
  "Italie": "🇮🇹",
  "Greece": "🇬🇷",
  "Grèce": "🇬🇷",
  "Turkey": "🇹🇷",
  "Turquie": "🇹🇷",
  "Russia": "🇷🇺",
  "Russie": "🇷🇺",
  "Poland": "🇵🇱",
  "Pologne": "🇵🇱",
  "Egypt": "🇪🇬",
  "Égypte": "🇪🇬",
  "Morocco": "🇲🇦",
  "Maroc": "🇲🇦",
  "Tunisia": "🇹🇳",
  "Tunisie": "🇹🇳",
  "Algeria": "🇩🇿",
  "Algérie": "🇩🇿",
  "Zambia": "🇿🇲",
  "Zambie": "🇿🇲",
  "South Africa": "🇿🇦",
  "Afrique du Sud": "🇿🇦",
  "USA": "🇺🇸",
  "United States": "🇺🇸",
  "Canada": "🇨🇦",
  "Brazil": "🇧🇷",
  "Brésil": "🇧🇷",
  "Argentina": "🇦🇷",
  "Denmark": "🇩🇰",
  "Sweden": "🇸🇪",
  "Norway": "🇳🇴",
  "Finland": "🇫🇮",
  "Austria": "🇦🇹",
  "Autriche": "🇦🇹",
  "Romania": "🇷🇴",
  "Hungary": "🇭🇺",
  "Czech Republic": "🇨🇿",
  "Slovakia": "🇸🇰",
  "Croatia": "🇭🇷",
  "Serbia": "🇷🇸",
  "Bulgaria": "🇧🇬",
  "Cyprus": "🇨🇾",
  "Israel": "🇮🇱",
  "Saudi Arabia": "🇸🇦",
  "Qatar": "🇶🇦",
  "UAE": "🇦🇪",
  "Australia": "🇦🇺",
  "Japan": "🇯🇵",
  "South Korea": "🇰🇷",
  "China": "🇨🇳",
  "Cameroon": "🇨🇲",
  "Cameroun": "🇨🇲",
  "Senegal": "🇸🇳",
  "Sénégal": "🇸🇳",
  "Ivory Coast": "🇨🇮",
  "Côte d'Ivoire": "🇨🇮",
  "Ghana": "🇬🇭",
  "Nigeria": "🇳🇬",
  "Mali": "🇲🇱",
  "Burkina Faso": "🇧🇫",
  "Guinea": "🇬🇳",
  "Guinée": "🇬🇳",
  "Angola": "🇦🇴",
  "Gabon": "🇬🇦",
  "Kenya": "🇰🇪",
  "Uganda": "🇺🇬",
  "Tanzania": "🇹🇿",
};

export function flagFor(nation: string): string {
  return FLAG[nation] ?? "🌍";
}

export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export function formatMarketValue(eur: number | null | undefined): string {
  if (eur === null || eur === undefined || eur === 0) return "Non renseignée";
  if (eur >= 1_000_000) {
    const m = eur / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M\u00A0€`;
  }
  if (eur >= 1_000) return `${Math.round(eur / 1_000)}K\u00A0€`;
  return `${eur}\u00A0€`;
}

/**
 * Compact version used inside the StatsSection bento hero card.
 * Intentionally removes the gap before the euro symbol to avoid visual breakage.
 */
export function formatMarketValueCompact(eur: number | null | undefined): string {
  if (!eur) return "—";
  if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)}Md€`;
  if (eur >= 1_000_000) return `${Math.round(eur / 1_000_000)}M€`;
  if (eur >= 1_000) return `${Math.round(eur / 1_000)}K€`;
  return `${eur}€`;
}

export const ELIGIBILITY_BADGE: Record<string, string> = {
  selected: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  eligible: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  potentially_eligible: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  ineligible: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  unknown: "bg-muted/15 text-muted-light border-border",
};

export function eligibilityLabel(status: string | null): string {
  if (!status) return "Inconnu";
  const map: Record<string, string> = {
    selected: "Sélectionné",
    eligible: "Éligible",
    potentially_eligible: "Potentiellement éligible",
    ineligible: "Inéligible",
    unknown: "Inconnu",
  };
  return map[status] ?? status;
}
