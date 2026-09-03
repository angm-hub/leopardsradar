import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useClubRanking } from "@/hooks/useClubRanking";
import { ClubBadge } from "@/components/clubs/ClubBadge";
import { cn } from "@/lib/utils";

const INITIAL = 30;

function fmtM(v: number | null): string {
  if (v == null) return "n.d.";
  const s = v % 1 === 0 ? String(v) : v.toFixed(1).replace(".", ",");
  return `${s} M€`;
}

export default function Clubs() {
  useDocumentMeta({
    title: "Classement des clubs",
    description:
      "Où se concentre le vivier congolais. Les clubs qui comptent le plus de joueurs du radar, effectif actuel, du championnat local RDC à l'Europe.",
  });
  const { rows, loading, error } = useClubRanking();
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, INITIAL);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Clubs</span>
          </nav>
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">
              Où se concentre le vivier
            </span>
            <h1 className="mt-6 display-heading text-5xl md:text-6xl text-foreground">
              Le classement des clubs.
            </h1>
            <p className="mt-6 text-xl text-muted-light">
              Les clubs qui comptent le plus de Léopards, éligibles ou à
              ascendance RDC, dans leur effectif actuel. Du championnat local aux
              cadors d'Europe.
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
              Classement indisponible pour le moment. Réessaie dans un instant.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5 text-xs uppercase tracking-[0.16em] text-muted">
                <span>{rows.length} clubs classés</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <ol className="flex flex-col gap-2">
                {shown.map((c, i) => {
                  const rank = i + 1;
                  return (
                    <li
                      key={c.club}
                      className={cn(
                        "grid grid-cols-[36px_1fr_auto] sm:grid-cols-[44px_1fr_120px_120px] items-center gap-4",
                        "rounded-card border border-border bg-card/40 px-4 sm:px-5 py-3.5",
                        "transition-colors hover:border-primary/30",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-sm",
                          rank <= 3 ? "text-primary" : "text-muted",
                        )}
                      >
                        {String(rank).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex items-center gap-3">
                        <ClubBadge tmId={c.tmId} name={c.club} />
                        <div className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-foreground">
                            {c.club}
                          </span>
                          {c.switchables > 0 && (
                            <span className="text-xs text-emerald-400/90">
                              {c.switchables} switchable{c.switchables > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right sm:text-left">
                        <span className="font-mono text-base font-semibold text-foreground">
                          {c.count}
                        </span>
                        <span className="ml-1 text-xs text-muted">joueur{c.count > 1 ? "s" : ""}</span>
                      </div>
                      <div className="hidden sm:block text-right">
                        <span className="font-mono text-sm text-muted-light">
                          {fmtM(c.topValueM)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wide text-muted">
                          valeur max
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {!all && rows.length > INITIAL && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAll(true)}
                    className="rounded-button border border-border px-6 py-2.5 text-sm text-foreground hover:border-primary/50 transition-colors"
                  >
                    Voir les {rows.length} clubs
                  </button>
                </div>
              )}

              <p className="mt-12 max-w-2xl text-sm text-muted leading-relaxed">
                Classement par effectif actuel, joueurs visibles du radar.
                Le classement des <b className="text-foreground/80">académies formatrices</b>,
                lui, arrivera quand la donnée de formation sera remontée par les
                contributeurs. Tu connais un club ou un centre qui mérite d'y
                figurer ? <Link to="/contribuer" className="text-cobalt-mist hover:text-foreground transition-colors">Contribue une info.</Link>
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
