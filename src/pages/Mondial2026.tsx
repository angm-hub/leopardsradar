import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
  MONDIAL_MATCHES,
  MONDIAL_PLAYERS,
  MONDIAL_SUMMARY,
  MONDIAL_SOURCES,
  type MondialMatch,
} from "@/data/mondial2026";

/**
 * Page Mondial 2026 — le bilan des Léopards.
 *
 * Contenu figé post-tournoi (données vérifiées FIFA, committées dans
 * src/data/mondial2026.ts) : zéro requête Supabase, la page peint
 * instantanément et reste vraie pour toujours. C'est la page d'atterrissage
 * de la bannière et du hero pendant la période post-Mondial.
 */

const OUTCOME_STYLE: Record<MondialMatch["outcome"], string> = {
  V: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  N: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  D: "bg-red-500/15 text-red-400 border-red-500/30",
};

const OUTCOME_LABEL: Record<MondialMatch["outcome"], string> = {
  V: "Victoire",
  N: "Nul",
  D: "Défaite",
};

function MatchCard({ match }: { match: MondialMatch }) {
  return (
    <article className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          {match.stage}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] ${OUTCOME_STYLE[match.outcome]}`}
        >
          {OUTCOME_LABEL[match.outcome]}
        </span>
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-serif text-2xl text-foreground leading-tight">
            RDC {match.scoreRdc} · {match.scoreOpponent} {match.opponent}
          </p>
          <p className="mt-1 text-xs text-muted">
            {match.dateLabel} · {match.venue}, {match.city}
          </p>
        </div>
      </div>

      {match.scorersRdc.length > 0 ? (
        <p className="text-sm text-foreground/80">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary mr-2">
            Buteurs RDC
          </span>
          {match.scorersRdc.join(", ")}
        </p>
      ) : (
        <p className="text-sm text-muted">Aucun but congolais ce soir-là.</p>
      )}

      <div className="grid grid-cols-4 gap-2 border-t border-border pt-4">
        {[
          ["Possession", `${match.stats.poss}%`],
          ["Tirs", String(match.stats.tirs)],
          ["Cadrés", String(match.stats.cadres)],
          ["xG", match.stats.xg.toFixed(2)],
        ].map(([label, value]) => (
          <div key={label}>
            <p className="font-mono text-sm text-foreground">{value}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">
              {label}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function Mondial2026() {
  useEffect(() => {
    document.title = "Mondial 2026, le bilan | Léopards Radar";
    return () => {
      document.title = "Léopards Radar";
    };
  }, []);

  const s = MONDIAL_SUMMARY;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        <header className="container-site pt-32 pb-10">
          <nav aria-label="breadcrumb" className="text-sm text-muted">
            <Link to="/" className="hover:text-foreground transition-colors">
              Accueil
            </Link>
            <span className="mx-2 text-muted/60">/</span>
            <span className="text-foreground/80">Mondial 2026</span>
          </nav>
          <h1 className="mt-4 display-heading text-5xl md:text-6xl text-foreground">
            Le Mondial des Léopards.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-light">
            Cinquante-deux ans après le Zaïre de 1974, la RDC a rejoué une
            Coupe du Monde. Quatre matchs, une victoire fondatrice, une sortie
            la tête haute contre l'Angleterre. Le parcours, les chiffres, les
            hommes.
          </p>
        </header>

        {/* Bilan en 4 chiffres */}
        <section className="container-site pb-14" aria-label="Bilan chiffré">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              [String(s.played), "Matchs joués"],
              [`${s.wins}V · ${s.draws}N · ${s.losses}D`, "Bilan"],
              [`${s.goalsFor} · ${s.goalsAgainst}`, "Buts pour · contre"],
              [s.exitStage, `Éliminés par l'${s.exitOpponent}`],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card px-5 py-6"
              >
                <p className="font-mono text-xl md:text-2xl text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-muted">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Les 4 matchs */}
        <section className="container-site pb-16" aria-label="Les matchs">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary mb-6">
            Match par match
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {MONDIAL_MATCHES.map((m) => (
              <MatchCard key={m.fixtureId} match={m} />
            ))}
          </div>
        </section>

        {/* Les hommes du tournoi */}
        <section className="container-site pb-16" aria-label="Les joueurs marquants">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary mb-6">
            Les hommes du tournoi
          </h2>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {MONDIAL_PLAYERS.map((p) => (
              <div
                key={p.name}
                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 px-6 py-4"
              >
                <div className="md:w-56 shrink-0">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted">{p.pos}</p>
                </div>
                <div className="flex gap-6 font-mono text-sm text-foreground/85 md:w-72 shrink-0">
                  <span>{p.minutes} min</span>
                  <span>
                    {p.goals} but{p.goals > 1 ? "s" : ""}
                  </span>
                  <span>note {p.rating.toFixed(2)}</span>
                </div>
                <p className="text-sm text-muted-light">{p.highlight}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted max-w-3xl">{MONDIAL_SOURCES}</p>
        </section>

        {/* Suite du produit */}
        <section className="container-site pb-24" aria-label="Et maintenant">
          <div className="rounded-xl border border-border bg-card px-6 py-10 md:px-10 text-center">
            <h2 className="display-heading text-3xl md:text-4xl text-foreground">
              Et maintenant, la suite.
            </h2>
            <p className="mt-3 text-muted-light max-w-xl mx-auto">
              Le vivier ne s'arrête pas aux 26 du Mondial. Le radar suit les
              binationaux éligibles, les fenêtres FIFA ouvertes et la
              prochaine génération, recalculés chaque dimanche.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/radar"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:translate-y-[-1px]"
              >
                Explorer le radar
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/newsletter"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Recevoir le récap du dimanche
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
