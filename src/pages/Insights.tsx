/**
 * /insights — analyses auto-générées du vivier Léopards.
 *
 * Sprint 5 du brief Léopards Radar v3 (2026-05-15). Consomme les 3 vues
 * matérialisées créées via Supabase MCP migration sprint5_insights_views,
 * refresh dimanche 14h UTC :
 *   - mv_eligibility_pipeline → bloc « Pipeline éligibilité »
 *   - mv_profile_insights → bloc « Local vs diaspora »
 *   - mv_club_concentration → bloc « Concentration par club »
 *
 * DA Cobalt : atmos-jade en backdrop, glass cards, label-mono kickers,
 * display-heading H2s, accent star yellow sur les chiffres clés.
 *
 * À enrichir Sprint 2+ : ajouter la 4ème vue generation_overview (U17/U20/
 * U23/A) une fois les colonnes u17_caps/u20_caps/u23_caps disponibles, et
 * l'onglet « Générations » sur cette page.
 */

import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useInsights } from "@/hooks/useInsights";
import { formatMarketValue } from "@/lib/playerHelpers";

// ─── Helpers d'affichage ────────────────────────────────────────────────────

const ELIGIBILITY_LABEL: Record<string, string> = {
  SELECTED: "Sélectionnés A",
  ELIGIBLE: "Éligibles confirmés",
  POTENTIALLY_ELIGIBLE: "À instruire",
  INELIGIBLE: "Cap-tied / inéligibles",
  UNKNOWN: "Statut indéterminé",
};

const ELIGIBILITY_DESCRIPTION: Record<string, string> = {
  SELECTED: "Déjà convoqués en sélection A par la FECOFA.",
  ELIGIBLE: "Éligibles RDC, base juridique vérifiée. Pas encore convoqués.",
  POTENTIALLY_ELIGIBLE: "Bases d'éligibilité plausibles, instruction en cours.",
  INELIGIBLE: "Cap-tied ou base juridique non recevable.",
  UNKNOWN: "Profil détecté, instruction non encore lancée.",
};

const ORIGIN_LABEL: Record<string, string> = {
  local: "Local — né en RDC",
  diaspora: "Diaspora — né hors RDC",
  unknown: "Origine non documentée",
};

const ORIGIN_TONE: Record<string, string> = {
  local: "text-primary",
  diaspora: "text-cobalt-mist",
  unknown: "text-muted-light",
};

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("fr-FR");
}

function bandLabel(rank: number): string {
  switch (rank) {
    case 1:
      return "Elite";
    case 2:
      return "High";
    case 3:
      return "Mid";
    case 4:
      return "Developing";
    case 5:
      return "Watch";
    default:
      return "—";
  }
}

function bandTone(rank: number): string {
  if (rank <= 1) return "text-primary";
  if (rank === 2) return "text-cobalt-mist";
  return "text-muted-light";
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function Insights() {
  useDocumentMeta({
    title: "Insights — Le vivier en chiffres",
    description:
      "Analyses auto-générées du vivier Léopards : pipeline éligibilité FIFA, comparaison local vs diaspora, concentration par club. Données mises à jour chaque dimanche.",
  });

  const { data, isLoading, error } = useInsights();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-24">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div aria-hidden className="absolute inset-0 atmos-jade opacity-90" />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.18]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 100% at 50% 100%, rgba(5,11,26,0.55) 0%, transparent 70%)",
            }}
          />

          <div className="container-site relative z-10 py-16 md:py-20">
            <nav aria-label="breadcrumb" className="text-sm text-muted">
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="mx-2 text-muted/60">/</span>
              <span className="text-foreground/80">Insights</span>
            </nav>
            <span className="label-mono text-cobalt-mist mt-6 inline-block">
              Sprint 5 — Analyses auto-générées
            </span>
            <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
              Le vivier en chiffres.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/75">
              Trois lectures complémentaires du vivier — pipeline éligibilité,
              profil type, concentration par club. Recompilées chaque dimanche
              à partir des 1 075 joueurs trackés. Les écarts qui apparaissent
              ne sont pas des opinions, ce sont des comptages.
            </p>
          </div>
        </section>

        {/* État loading / erreur */}
        {isLoading && (
          <section className="container-site py-12">
            <p className="label-mono text-muted-light">Chargement des analyses…</p>
          </section>
        )}
        {error && (
          <section className="container-site py-12">
            <p className="text-blood">
              Impossible de charger les analyses pour le moment. Réessayez dans
              quelques instants.
            </p>
          </section>
        )}

        {data && (
          <>
            {/* ── Bloc 1 — Pipeline éligibilité ─────────────────────────── */}
            <section className="container-site py-16 md:py-20">
              <div className="mb-10 max-w-2xl">
                <span className="label-mono text-cobalt-mist mb-3 inline-block">
                  01 — Pipeline éligibilité FIFA
                </span>
                <h2 className="display-heading text-3xl md:text-4xl text-foreground">
                  Où en est le vivier.
                </h2>
                <p className="mt-3 text-base md:text-lg text-foreground/70 leading-relaxed">
                  Répartition des {totalPlayers(data.eligibility)} profils
                  trackés par statut FIFA. Chaque ligne agrège le nombre,
                  la valeur marchande cumulée et les profils les plus visibles
                  du segment.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.eligibility.map((row) => (
                  <div
                    key={row.status}
                    className="glass rounded-card p-6 flex flex-col gap-4"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="label-mono-sm text-foreground/55">
                        {ELIGIBILITY_LABEL[row.status] ?? row.status}
                      </span>
                      <span className="display-heading text-3xl md:text-4xl text-foreground">
                        {formatNumber(row.player_count)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed">
                      {ELIGIBILITY_DESCRIPTION[row.status] ?? "—"}
                    </p>
                    <div className="mt-auto pt-3 border-t border-border/50">
                      <p className="label-mono-sm text-foreground/45">
                        Valeur marchande cumulée
                      </p>
                      <p className="mt-1 display-heading text-lg text-primary">
                        {row.total_market_value_eur
                          ? formatMarketValue(row.total_market_value_eur)
                          : "—"}
                      </p>
                    </div>
                    {row.top_players_by_value && (
                      <p className="text-xs text-foreground/50 leading-relaxed line-clamp-2">
                        {row.top_players_by_value
                          .split(" · ")
                          .slice(0, 3)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ── Bloc 2 — Local vs Diaspora ────────────────────────────── */}
            <section className="relative overflow-hidden border-y border-border/40">
              <div aria-hidden className="absolute inset-0 atmos-dawn opacity-90" />
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-[0.18]"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1, 0 0 0 0 1, 0 0 0 0 1, 0 0 0 0.55 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")",
                }}
              />

              <div className="container-site relative z-10 py-16 md:py-20">
                <div className="mb-10 max-w-2xl">
                  <span className="label-mono text-cobalt-mist mb-3 inline-block">
                    02 — Profil type
                  </span>
                  <h2 className="display-heading text-3xl md:text-4xl text-foreground">
                    Local vs diaspora.
                  </h2>
                  <p className="mt-3 text-base md:text-lg text-foreground/70 leading-relaxed">
                    Comparaison directe par origine de naissance. Les Léopards
                    nés en RDC sont plus âgés et plus capés (roster actif),
                    la diaspora porte la valeur marchande mais reste à
                    convertir en sélection. Les profils sans pays de naissance
                    documenté restent un chantier d'enrichissement.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {data.profiles.map((row) => (
                    <div
                      key={row.player_origin}
                      className="glass rounded-card p-6 flex flex-col gap-5"
                    >
                      <div>
                        <span
                          className={`label-mono-sm ${ORIGIN_TONE[row.player_origin] ?? "text-foreground/55"}`}
                        >
                          {ORIGIN_LABEL[row.player_origin] ?? row.player_origin}
                        </span>
                        <p className="mt-3 display-heading text-4xl md:text-5xl text-foreground">
                          {formatNumber(row.total_players)}
                        </p>
                        <p className="mt-1 text-xs text-foreground/55">
                          joueurs trackés
                        </p>
                      </div>

                      <dl className="grid grid-cols-2 gap-y-4 gap-x-3 text-sm border-t border-border/50 pt-4">
                        <div>
                          <dt className="label-mono-sm text-foreground/45">
                            Âge moyen
                          </dt>
                          <dd className="mt-1 display-heading text-xl text-foreground">
                            {row.avg_age ?? "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="label-mono-sm text-foreground/45">
                            % capés A
                          </dt>
                          <dd className="mt-1 display-heading text-xl text-primary">
                            {formatPercent(row.pct_with_caps_rdc)}
                          </dd>
                        </div>
                        <div>
                          <dt className="label-mono-sm text-foreground/45">
                            Valeur médiane
                          </dt>
                          <dd className="mt-1 display-heading text-xl text-foreground">
                            {row.median_market_value_eur
                              ? formatMarketValue(
                                  Number(row.median_market_value_eur),
                                )
                              : "—"}
                          </dd>
                        </div>
                        <div>
                          <dt className="label-mono-sm text-foreground/45">
                            Position dominante
                          </dt>
                          <dd className="mt-1 text-foreground/85 text-base">
                            {row.most_common_position ?? "—"}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>

                <p className="mt-8 text-xs text-foreground/45 max-w-3xl">
                  Méthodologie : segment « local » = joueurs avec
                  <code className="mx-1 px-1.5 py-0.5 rounded bg-cobalt-night/60 font-mono text-[11px] text-foreground/80">
                    country_of_birth
                  </code>
                  contenant « congo ». « Diaspora » = né documenté ailleurs.
                  « Inconnue » = pays de naissance pas encore renseigné — à
                  enrichir dans une prochaine vague.
                </p>
              </div>
            </section>

            {/* ── Bloc 3 — Concentration clubs ──────────────────────────── */}
            <section className="container-site py-16 md:py-20">
              <div className="mb-10 max-w-2xl">
                <span className="label-mono text-cobalt-mist mb-3 inline-block">
                  03 — Concentration géo
                </span>
                <h2 className="display-heading text-3xl md:text-4xl text-foreground">
                  Où sont concentrés nos joueurs.
                </h2>
                <p className="mt-3 text-base md:text-lg text-foreground/70 leading-relaxed">
                  Clubs qui hébergent au moins deux Léopards éligibles
                  (sélectionnés ou éligibles confirmés). Utile pour identifier
                  les bases naturelles de la sélection — les vestiaires où
                  les Léopards se croisent déjà au quotidien.
                </p>
              </div>

              {data.clubs.length === 0 ? (
                <p className="text-foreground/60">
                  Aucune concentration détectée pour le moment.
                </p>
              ) : (
                <div className="overflow-hidden rounded-card border border-border bg-card/40">
                  <table className="w-full text-sm">
                    <thead className="bg-cobalt-night/40">
                      <tr className="text-left">
                        <th className="px-4 py-3 label-mono-sm text-foreground/55">
                          Club
                        </th>
                        <th className="px-4 py-3 label-mono-sm text-foreground/55">
                          Léopards
                        </th>
                        <th className="px-4 py-3 label-mono-sm text-foreground/55">
                          Niveau max
                        </th>
                        <th className="hidden md:table-cell px-4 py-3 label-mono-sm text-foreground/55">
                          Profils
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clubs.map((club) => (
                        <tr
                          key={club.club_name}
                          className="border-t border-border/40 hover:bg-cobalt-night/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-foreground font-medium">
                            {club.club_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="display-heading text-lg text-primary">
                              {club.leopards_count}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`label-mono-sm ${bandTone(club.top_band_rank)}`}
                            >
                              {bandLabel(club.top_band_rank)}
                            </span>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3 text-foreground/65 text-xs leading-relaxed">
                            {club.players}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Footer méthodologie */}
            <section className="container-site pt-4 pb-16">
              <div className="rounded-card border border-border/50 bg-card/30 p-6 max-w-3xl">
                <p className="label-mono text-cobalt-mist mb-3">
                  Méthodologie & cadence
                </p>
                <p className="text-sm text-foreground/70 leading-relaxed">
                  Données recompilées chaque dimanche à 14 h UTC après les
                  syncs Transfermarkt + matchs + level bands. Les statuts FIFA
                  sont calculés via la fonction{" "}
                  <code className="px-1.5 py-0.5 rounded bg-cobalt-night/60 font-mono text-[11px] text-foreground/80">
                    compute_eligibility()
                  </code>{" "}
                  appliquée sur chaque profil. Méthodologie complète sur la
                  page{" "}
                  <Link
                    to="/methodologie"
                    className="text-primary hover:text-primary-hover underline underline-offset-4"
                  >
                    Méthodologie
                  </Link>
                  .
                </p>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function totalPlayers(rows: { player_count: number }[]): string {
  const total = rows.reduce((sum, r) => sum + (r.player_count ?? 0), 0);
  return total.toLocaleString("fr-FR");
}
