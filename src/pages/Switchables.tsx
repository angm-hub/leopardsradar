import { Link } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { ClubBadge } from "@/components/clubs/ClubBadge";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useSwitchables, type SwitchableRow } from "@/hooks/useSwitchables";

const NOW = new Date();

const COUNTRY_FR: Record<string, string> = {
  Belgium: "Belgique",
  France: "France",
  England: "Angleterre",
  Netherlands: "Pays-Bas",
  Spain: "Espagne",
  Switzerland: "Suisse",
  Austria: "Autriche",
  Norway: "Norvège",
  Sweden: "Suède",
  Portugal: "Portugal",
  Germany: "Allemagne",
  Finland: "Finlande",
  Italy: "Italie",
  Denmark: "Danemark",
  Canada: "Canada",
  "United States": "États-Unis",
};

const POS_FR: Record<string, string> = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfield: "Milieu",
  Attack: "Attaquant",
};

function ageOf(dob: string | null): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  let a = NOW.getFullYear() - b.getFullYear();
  const m = NOW.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && NOW.getDate() < b.getDate())) a--;
  return a;
}

function poste(r: SwitchableRow): string {
  if (r.position_detail) return r.position_detail;
  if (r.position && POS_FR[r.position]) return POS_FR[r.position];
  return r.position ?? "";
}

function capt(r: SwitchableRow): string | null {
  if (!r.caps_other_country) return null;
  return COUNTRY_FR[r.caps_other_country] ?? r.caps_other_country;
}

function fmtM(v: number | null): string {
  if (v == null) return "";
  if (v >= 1_000_000) {
    const m = v / 1_000_000;
    return `${(m % 1 === 0 ? String(m) : m.toFixed(1).replace(".", ",")).replace(".", ",")} M€`;
  }
  return `${Math.round(v / 1000)} k€`;
}

export default function Switchables() {
  useDocumentMeta({
    title: "Switchables",
    description:
      "Le vivier récupérable. Les joueurs d'origine congolaise captés ailleurs mais encore basculables vers la RDC sous la règle FIFA du changement d'association.",
  });
  const { rows, loading, error } = useSwitchables();
  const valued = rows.filter((r) => (r.market_value_eur ?? 0) >= 10_000_000).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Switchables</span>
          </nav>
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">
              Le vivier récupérable
            </span>
            <h1 className="mt-6 display-heading text-5xl md:text-6xl text-foreground">
              Les Léopards qui peuvent encore basculer.
            </h1>
            <p className="mt-6 text-xl text-muted-light">
              Des joueurs d'origine congolaise captés par un autre pays, mais
              sans cape A qui verrouille, donc encore éligibles au changement
              d'association vers la RDC. C'est ce que ni Transfermarkt ni Wyscout
              ne qualifient.
            </p>
          </div>
        </section>

        <section className="container-site pb-20">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-muted">
              Liste indisponible pour le moment. Réessaie dans un instant.
            </p>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              Aucun switchable pour le moment.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5 text-xs uppercase tracking-[0.16em] text-muted">
                <span>{rows.length} switchables</span>
                {valued > 0 && <span className="text-primary">· {valued} à 10 M€ ou plus</span>}
                <span className="h-px flex-1 bg-border" />
              </div>
              <ol className="flex flex-col gap-2">
                {rows.map((r, i) => {
                  const rank = i + 1;
                  const a = ageOf(r.date_of_birth);
                  const from = capt(r);
                  const inner = (
                    <>
                      <span className="font-mono text-sm text-muted">
                        {String(rank).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-3 min-w-0">
                        <ClubBadge tmId={r.current_club_id} name={r.current_club ?? r.name} />
                        <div className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-foreground">
                            {r.name}
                          </span>
                          <span className="block truncate text-xs text-muted">
                            <span className="text-cobalt-mist">{poste(r)}</span>
                            {a != null && <> · {a} ans</>}
                            {r.current_club && <> · {r.current_club}</>}
                          </span>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 justify-self-start">
                        {from && (
                          <>
                            <span className="rounded-md bg-red-500/10 px-2 py-1 font-mono text-[11px] text-red-400 ring-1 ring-red-500/25 whitespace-nowrap">
                              {from}
                            </span>
                            <span className="text-muted text-xs">→</span>
                          </>
                        )}
                        <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/30 whitespace-nowrap">
                          RD Congo
                        </span>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="font-mono text-base font-semibold text-foreground">
                          {fmtM(r.market_value_eur) || "n.d."}
                        </span>
                      </div>
                    </>
                  );
                  const cls =
                    "grid grid-cols-[32px_1fr_auto] sm:grid-cols-[44px_1.6fr_160px_110px] items-center gap-4 rounded-card border border-border bg-card/40 px-4 sm:px-5 py-3.5 transition-colors hover:border-primary/30";
                  return (
                    <li key={(r.slug ?? r.name) + i}>
                      {r.slug ? (
                        <Link to={`/player/${r.slug}`} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <div className={cls}>{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <p className="mt-12 max-w-2xl text-sm text-muted leading-relaxed">
                La puce rouge est la sélection qui les a captés, la puce verte la
                RDC vers laquelle ils restent basculables. Une cible à instruire,
                pas une liste de convocables. Un profil qui manque ?{" "}
                <Link to="/contribuer" className="text-cobalt-mist hover:text-foreground transition-colors">Signale-le.</Link>
              </p>
            </>
          )}
        </section>

        <section className="container-site py-16 border-t border-border">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">Pour les clubs et sélectionneurs</span>
            <h2 className="mt-4 display-heading text-2xl md:text-3xl text-foreground">
              Le statut d'éligibilité, vérifié à la main.
            </h2>
            <p className="mt-4 text-muted-light">
              Chaque profil est qualifié en éligibilité FIFA, là où personne
              d'autre ne le fait. Rapports détaillés, alertes de changement de
              statut et carnet de suivi côté pro.
            </p>
            <Link
              to="/pro"
              className="mt-6 inline-flex items-center gap-2 rounded-button border border-border px-6 py-3 text-sm text-foreground hover:border-primary/50 transition-colors"
            >
              Découvrir Léopards Radar Pro <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
