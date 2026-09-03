import { Link } from "react-router-dom";
import { Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useContributorLeaderboard } from "@/hooks/useContributorLeaderboard";
import { cn } from "@/lib/utils";

const THRESHOLD = 5;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function Contributeurs() {
  useDocumentMeta({
    title: "Contributeurs",
    description:
      "Celles et ceux qui construisent le radar. Le classement des contributeurs, du premier signalement au statut de Scout vérifié.",
  });
  const { rows, loading, error } = useContributorLeaderboard();
  const verifiedCount = rows.filter((r) => r.is_verified).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-32 pb-12">
          <nav aria-label="breadcrumb" className="text-sm text-muted mb-8">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Contributeurs</span>
          </nav>
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-[0.2em] text-primary">
              Le radar se construit à plusieurs
            </span>
            <h1 className="mt-6 display-heading text-5xl md:text-6xl text-foreground">
              Celles et ceux qui construisent le radar.
            </h1>
            <p className="mt-6 text-xl text-muted-light">
              Chaque info validée fait grandir la base. On contribue d'abord, on
              gagne un statut ensuite. Au bout de {THRESHOLD} contributions
              validées, on devient <b className="text-foreground">Scout vérifié</b>.
            </p>
          </div>
        </section>

        <section className="container-site pb-16">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted" />
            </div>
          ) : error ? (
            <p className="py-16 text-center text-sm text-muted">
              Classement indisponible pour le moment. Réessaie dans un instant.
            </p>
          ) : rows.length === 0 ? (
            <div className="rounded-card border border-border bg-card/40 p-10 text-center">
              <h2 className="display-heading text-2xl text-foreground">
                Personne encore. À toi de l'ouvrir.
              </h2>
              <p className="mt-3 text-muted-light max-w-md mx-auto">
                Le classement se remplit dès la première contribution validée.
                Sois le premier nom du mur.
              </p>
              <Link
                to="/contribuer"
                className="mt-6 inline-flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Contribuer une info <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5 text-xs uppercase tracking-[0.16em] text-muted">
                <span>{rows.length} contributeurs</span>
                {verifiedCount > 0 && (
                  <span className="text-primary">
                    · {verifiedCount} scout{verifiedCount > 1 ? "s" : ""} vérifié{verifiedCount > 1 ? "s" : ""}
                  </span>
                )}
                <span className="h-px flex-1 bg-border" />
              </div>
              <ol className="flex flex-col gap-2">
                {rows.map((c, i) => {
                  const rank = i + 1;
                  return (
                    <li
                      key={c.display_name + i}
                      className="grid grid-cols-[36px_1fr_auto] items-center gap-4 rounded-card border border-border bg-card/40 px-4 sm:px-5 py-3.5 transition-colors hover:border-primary/30"
                    >
                      <span
                        className={cn(
                          "font-mono text-sm",
                          rank <= 3 ? "text-primary" : "text-muted",
                        )}
                      >
                        {String(rank).padStart(2, "0")}
                      </span>
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] text-primary ring-1 ring-primary/20">
                          {initials(c.display_name)}
                        </span>
                        <span className="truncate text-[15px] font-medium text-foreground">
                          {c.display_name}
                        </span>
                        {c.is_verified && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary ring-1 ring-primary/20">
                            <ShieldCheck className="h-3 w-3" /> Vérifié
                          </span>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <span className="font-mono text-base font-semibold text-foreground">
                          {c.validated}
                        </span>
                        <span className="ml-1 text-xs text-muted">
                          validée{c.validated > 1 ? "s" : ""}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </section>

        <section className="container-site py-16 border-t border-border">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">Comment on monte</span>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Tu contribues", d: "Une correction, un joueur, un talent vu, une source. Chaque info part en file de vérification." },
              { n: "02", t: "On valide", d: "Un arbitre passe la contribution en revue. Validée, elle rejoint la base et compte pour toi." },
              { n: "03", t: `Tu gagnes un statut`, d: `À ${THRESHOLD} contributions validées, tu deviens Scout vérifié, avec revue allégée et ton nom sur le mur.` },
            ].map((s) => (
              <div key={s.n} className="rounded-card border border-border bg-card p-6">
                <span className="font-mono text-xs text-muted">{s.n}</span>
                <h3 className="mt-3 display-heading text-xl text-foreground">{s.t}</h3>
                <p className="mt-2 text-muted leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/contribuer"
              className="inline-flex items-center gap-2 rounded-button border border-border px-6 py-3 text-sm text-foreground hover:border-primary/50 transition-colors"
            >
              Commencer à contribuer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
