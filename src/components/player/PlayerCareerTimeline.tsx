import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMarketValue } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// Types locaux — miroir du JOIN player_clubs → clubs → leagues
// On n'exporte pas ces types : ils sont internes à ce composant.
// ──────────────────────────────────────────────────────────────────────────────

interface CareerRow {
  id: number;
  transfer_type: string | null;
  date_from: string | null;  // ISO date
  date_to: string | null;    // ISO date ou null = présent
  fee_eur: number | null;
  club_id: number | null;
  club_name: string | null;
  logo_url: string | null;
  country_code: string | null;
  tier_uefa: number | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de rendu
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Formate une date ISO en année simple pour la frise.
 * Ex: "2023-07-01" → "2023". Retourne "?" si null.
 */
function yearFrom(iso: string | null): string {
  if (!iso) return "?";
  return iso.slice(0, 4);
}

/**
 * Formate la plage de dates d'un passage.
 * Ex: "2021" ou "2019 → 2023" ou "2023 → présent".
 */
function formatDateRange(from: string | null, to: string | null): string {
  const start = yearFrom(from);
  const end = to ? yearFrom(to) : "présent";
  if (start === end) return start;
  return `${start} → ${end}`;
}

/**
 * Mappe le tier_uefa vers un label court pour le chip de ligue.
 * Réutilise la logique de classement du Radar (tier 100 = Top 5, etc.).
 */
function tierLabel(tier: number | null): string | null {
  if (tier === null) return null;
  if (tier >= 100) return "S";
  if (tier >= 70) return "A";
  if (tier >= 45) return "B";
  return "C";
}

/**
 * Mappe le tier_uefa vers les classes CSS du chip.
 * Cohérent avec les couleurs utilisées dans le Radar.
 */
function tierChipClass(tier: number | null): string {
  if (tier === null) return "bg-card/60 text-muted border-border/60";
  if (tier >= 100) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (tier >= 70) return "bg-sky-500/15 text-sky-400 border-sky-500/30";
  if (tier >= 45) return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
  return "bg-card/60 text-muted-light border-border/60";
}

/**
 * Retourne les classes CSS du badge transfer_type.
 * Jaune pour transfert payant (information mercato forte),
 * vert pour prêt (temporaire), gris pour free/formé, bleu pâle pour jeunes.
 */
function transferBadgeClass(type: string | null, hasFee: boolean): string {
  if (!type) return "bg-card/60 text-muted border-border/60";
  switch (type) {
    case "transfer":
      // Transfert payant = jaune (signal fort) ; sans fee = gris sobre
      return hasFee
        ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
        : "bg-card/60 text-muted-light border-border/60";
    case "loan":
    case "return":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "free":
      return "bg-card/60 text-muted-light border-border/60";
    case "youth":
    case "promotion":
      return "bg-sky-500/15 text-sky-400 border-sky-500/30";
    default:
      return "bg-card/60 text-muted border-border/60";
  }
}

/**
 * Traduit le transfer_type en label français court pour le badge.
 */
function transferBadgeLabel(type: string | null): string {
  if (!type) return "Transfert";
  const labels: Record<string, string> = {
    transfer: "Transfert",
    loan: "Prêt",
    return: "Retour",
    free: "Libre",
    youth: "Formation",
    promotion: "Promotion",
  };
  return labels[type] ?? type;
}

// ──────────────────────────────────────────────────────────────────────────────
// Skeleton de chargement — 3 passages fictifs pour éviter le layout shift
// ──────────────────────────────────────────────────────────────────────────────

function CareerSkeleton() {
  return (
    <section className="container-site py-12 border-t border-border">
      <div className="mb-8">
        <div className="h-3 w-16 rounded bg-card animate-pulse" />
        <div className="mt-3 h-8 w-48 rounded bg-card animate-pulse" />
      </div>
      <div className="space-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="relative flex gap-6 pb-10">
            {/* Trait vertical */}
            <div className="relative flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-card/60 animate-pulse" />
              {i < 2 && <div className="mt-2 w-px flex-1 bg-border/40" />}
            </div>
            <div className="flex-1 pt-1 space-y-2">
              <div className="h-5 w-40 rounded bg-card animate-pulse" />
              <div className="h-3 w-24 rounded bg-card/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Composant principal
// ──────────────────────────────────────────────────────────────────────────────

interface PlayerCareerTimelineProps {
  /** id numérique du joueur dans la table players */
  playerId: number;
}

/**
 * PlayerCareerTimeline — Frise de carrière sur la fiche joueur.
 *
 * Requête : player_clubs JOIN clubs JOIN leagues pour le joueur donné,
 * triée récent → ancien (date_from DESC).
 *
 * Comportement :
 *  - Loading : skeleton 3 passages
 *  - Zéro passage : return null (auto-hide — la section disparaît tant
 *    que le backfill n'a pas atteint ce joueur)
 *  - Données : timeline verticale, un item par passage
 *
 * Design : Fraunces (serif) pour les noms, DM Sans pour le corps,
 * Space Mono pour les étiquettes, vert RDC (#00B341 via text-primary) pour
 * l'eyebrow et les accents.
 */
export function PlayerCareerTimeline({ playerId }: PlayerCareerTimelineProps) {
  const [rows, setRows] = useState<CareerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // JOIN player_clubs → clubs → leagues via Supabase REST
        // On caste en `any` car les types auto-générés Supabase sont vides
        // (table ajoutée après la génération) — pattern cohérent avec usePlayer.ts
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("player_clubs")
          .select(`
            id,
            transfer_type,
            date_from,
            date_to,
            fee_eur,
            club_id,
            clubs (
              id,
              name,
              logo_url,
              country_code,
              leagues (
                tier_uefa
              )
            )
          `)
          .eq("player_id", playerId)
          .order("date_from", { ascending: false });

        if (error) throw error;
        if (cancelled) return;

        // Aplatit la structure imbriquée (clubs.leagues) vers CareerRow
        const normalized: CareerRow[] = ((data as unknown[]) ?? []).map((raw: unknown) => {
          const r = raw as Record<string, unknown>;
          const club = (r.clubs as Record<string, unknown> | null) ?? null;
          const league = club
            ? ((club.leagues as Record<string, unknown> | null) ?? null)
            : null;

          return {
            id: r.id as number,
            transfer_type: (r.transfer_type as string | null) ?? null,
            date_from: (r.date_from as string | null) ?? null,
            date_to: (r.date_to as string | null) ?? null,
            fee_eur: (r.fee_eur as number | null) ?? null,
            club_id: (r.club_id as number | null) ?? null,
            club_name: club ? (club.name as string | null) : null,
            logo_url: club ? (club.logo_url as string | null) : null,
            country_code: club ? (club.country_code as string | null) : null,
            tier_uefa: league ? (league.tier_uefa as number | null) : null,
          };
        });

        setRows(normalized);
      } catch (e) {
        console.warn("[PlayerCareerTimeline]", e);
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerId]);

  // Pendant le fetch : skeleton pour éviter le layout shift
  if (loading) return <CareerSkeleton />;

  // Zéro passage : auto-hide — le backfill n'a pas encore atteint ce joueur.
  // On ne veut pas afficher un bloc "historique en cours d'enrichissement"
  // pour tous les profils d'un coup — ça dégraderait 165 fiches d'un seul coup.
  // Chaque fiche "s'allume" progressivement au fur et à mesure du backfill.
  if (rows.length === 0) return null;

  return (
    <section
      id="carriere"
      className="container-site py-12 border-t border-border scroll-mt-24"
    >
      {/* En-tête éditorial — cohérent avec les autres sections de Player.tsx */}
      <div className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-primary/85">
          Carrière
        </p>
        <h2 className="mt-2 font-serif text-2xl md:text-3xl text-foreground leading-tight">
          Le parcours.
        </h2>
      </div>

      {/* Timeline verticale */}
      <ol className="space-y-0">
        {rows.map((row, idx) => {
          const isLast = idx === rows.length - 1;
          const hasFee = (row.fee_eur ?? 0) > 0;
          const tier = tierLabel(row.tier_uefa);

          return (
            <li key={row.id} className="relative flex gap-4 sm:gap-6">
              {/* Rail vertical — trait qui relie les pastilles entre elles */}
              <div
                aria-hidden
                className="relative flex flex-col items-center"
                style={{ width: 40, flexShrink: 0 }}
              >
                {/* Pastille / logo club */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 overflow-hidden ring-1 ring-border/40">
                  {row.logo_url ? (
                    <img
                      src={row.logo_url}
                      alt={row.club_name ?? ""}
                      className="h-7 w-7 object-contain"
                      loading="lazy"
                      onError={(e) => {
                        // Si le logo TM expire, on masque l'image sans casser le layout
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    // Fallback : initiales du club en Space Mono
                    <span className="text-[9px] font-mono uppercase tracking-wider text-muted-light">
                      {(row.club_name ?? "?")
                        .split(" ")
                        .filter((w) => w.length > 1 && !["FC", "AC", "AS", "SC"].includes(w))
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase() || "?"}
                    </span>
                  )}
                </div>

                {/* Trait vertical entre pastilles (absent sur le dernier item) */}
                {!isLast && (
                  <div
                    aria-hidden
                    className="mt-1 w-px flex-1 bg-border/30"
                    style={{ minHeight: 32 }}
                  />
                )}
              </div>

              {/* Contenu du passage */}
              <div className={cn("flex-1 pb-10", isLast && "pb-0")}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  {/* Nom du club */}
                  <span className="font-serif text-lg md:text-xl text-foreground leading-tight">
                    {row.club_name ?? "Club inconnu"}
                  </span>

                  {/* Tier UEFA chip — affiché seulement si disponible */}
                  {tier && (
                    <span
                      className={cn(
                        "mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em]",
                        tierChipClass(row.tier_uefa),
                      )}
                      title={`Tier UEFA ${tier}`}
                    >
                      Tier {tier}
                    </span>
                  )}
                </div>

                {/* Dates — Space Mono, muted */}
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
                  {formatDateRange(row.date_from, row.date_to)}
                  {row.country_code ? (
                    <span className="ml-2 opacity-60">· {row.country_code}</span>
                  ) : null}
                </p>

                {/* Badges transfer type + fee */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em]",
                      transferBadgeClass(row.transfer_type, hasFee),
                    )}
                  >
                    {transferBadgeLabel(row.transfer_type)}
                  </span>

                  {/* Montant du transfert — affiché seulement si fee_eur > 0 */}
                  {hasFee && (
                    <span className="text-[11px] font-mono text-primary/90">
                      {formatMarketValue(row.fee_eur)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default PlayerCareerTimeline;
