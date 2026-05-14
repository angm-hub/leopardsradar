// Mirror of the Supabase `press_items` table. Mirrors the SQL CHECK
// constraints exactly so TypeScript catches invalid values at edit time.

export type PressSourceType = "twitter" | "web" | "youtube" | "instagram";

export type PressCategory =
  | "actu"
  | "mercato"
  | "fecofa"
  | "diaspora"
  | "longread"
  | "social";

/**
 * Source reliability tier — playbook Alex (mai 2026).
 *   S : indispensable, validation premium (Romano, Ornstein, Tavolieri,
 *       Santi, Foot Mercato — quand le scoop est sourcé)
 *   A : très important pour RDC/Belgique/France (Plettenberg, Moretto,
 *       L'Équipe, Walfoot, Africa Top Sports, Mediacongo, Radio Okapi)
 *   B : standard (presse RDC sans scoop, agrégateurs francophones)
 *   C : bruit potentiel, à filtrer (forums, comptes anonymes)
 */
export type PressSourceTier = "S" | "A" | "B" | "C";

export interface DBPressItem {
  id: number;
  source_handle: string;
  source_name: string;
  source_type: PressSourceType;
  source_logo_url: string | null;
  headline: string;
  excerpt: string | null;
  url: string;
  thumbnail_url: string | null;
  lang: string;
  category: PressCategory;
  player_id: number | null;
  curator: string;
  curator_note: string | null;
  is_featured: boolean;
  published_at: string;
  added_at: string;
  // Phase reco Alex (mai 2026)
  source_tier: PressSourceTier;
  source_bias: string | null;
  tags: string[];
  confidence_score: number; // 0..1
}

export const PRESS_CATEGORY_LABEL: Record<PressCategory, string> = {
  actu: "Actu",
  mercato: "Mercato",
  fecofa: "FECOFA",
  diaspora: "Diaspora",
  longread: "Long format",
  social: "Social",
};

export const PRESS_CATEGORY_ACCENT: Record<PressCategory, string> = {
  actu: "text-foreground bg-foreground/10",
  mercato: "text-success bg-success/10",
  fecofa: "text-primary bg-primary/15",
  diaspora: "text-blue-400 bg-blue-400/10",
  longread: "text-amber-300 bg-amber-300/10",
  social: "text-muted-light bg-muted-light/10",
};

export const PRESS_TIER_LABEL: Record<PressSourceTier, string> = {
  S: "Tier S",
  A: "Tier A",
  B: "Tier B",
  C: "Tier C",
};

export const PRESS_TIER_ACCENT: Record<PressSourceTier, string> = {
  // S = validation premium → primary kAIra (jaune)
  S: "text-primary border-primary/40 bg-primary/10",
  // A = early signal solide → success
  A: "text-success border-success/30 bg-success/10",
  // B = standard → muted
  B: "text-muted-light border-border bg-card-hover",
  // C = bruit → discret
  C: "text-muted border-border/50 bg-transparent",
};
