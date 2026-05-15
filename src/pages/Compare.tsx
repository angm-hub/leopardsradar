import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRightLeft, Shuffle, Sparkles } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer } from "@/types/dbPlayer";
import { computePlayerScores } from "@/lib/playerScores";
import { PlayerPicker } from "@/components/compare/PlayerPicker";
import { HexagonCompare, CompareLegend } from "@/components/compare/HexagonCompare";
import { CompareDeltas } from "@/components/compare/CompareDeltas";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

/**
 * Compare — head-to-head comparison page (`/compare?p1=<slug>&p2=<slug>`).
 *
 * URL is the source of truth : both slugs live in the query string so the
 * page is shareable, bookmarkable, and the back button works as expected.
 * Picking, swapping or clearing slots writes back to the URL via
 * setSearchParams instead of mutating local state — keeps the two synced
 * automatically.
 *
 * Two render modes :
 *   - Setup : at least one slot empty → giant pickers, suggestions row,
 *             tagline explaining the feature.
 *   - Compare : both slots filled → hexagon + deltas. Pickers collapse to
 *             a compact identity row at the top with a "Swap" / "Clear"
 *             toolbar.
 */
export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const slugA = params.get("p1");
  const slugB = params.get("p2");

  useDocumentMeta({
    title: "Comparateur",
    description:
      "Compare deux Léopards côte à côte — six axes statistiques, lecture des écarts, suggestions de paires.",
  });

  const { player: playerA, loading: loadingA } = usePlayerBySlug(slugA);
  const { player: playerB, loading: loadingB } = usePlayerBySlug(slugB);

  const ready = !!playerA && !!playerB;

  const updateSlot = (slot: "p1" | "p2", value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(slot, value);
    else next.delete(slot);
    setParams(next, { replace: false });
  };

  const swap = () => {
    if (!slugA || !slugB) return;
    const next = new URLSearchParams(params);
    next.set("p1", slugB);
    next.set("p2", slugA);
    setParams(next, { replace: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="container-site pt-28 pb-8">
          <nav className="mb-8 text-sm text-muted">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2 opacity-50">/</span>
            <span className="text-foreground/80">Comparer</span>
          </nav>

          <p className="text-[10px] uppercase tracking-[0.3em] text-primary/85 font-mono">
            Comparateur · Léopards
          </p>
          <h1 className="mt-2 display-heading text-5xl md:text-7xl leading-[1.05] text-balance text-foreground">
            {ready
              ? `${playerA!.name}.`
              : "Deux Léopards. Six axes. Une lecture."}
          </h1>
          {ready ? (
            <p className="mt-2 font-serif text-3xl md:text-5xl text-muted-light italic">
              vs. {playerB!.name}.
            </p>
          ) : (
            <p className="mt-4 max-w-2xl text-muted-light">
              Choisissez deux profils — radar, roster ou héritage — pour
              superposer leurs hexagones et lire les écarts axe par axe.
              Vous pouvez partager le lien pour discuter d'un duel.
            </p>
          )}
        </section>

        {/* PICKERS */}
        <section className="container-site pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <PlayerPicker
              accent="#FCD116"
              slotLabel="Joueur 1"
              player={playerA}
              excludeSlug={slugB}
              onPick={(p) => updateSlot("p1", p.slug)}
              onClear={() => updateSlot("p1", null)}
            />
            <PlayerPicker
              accent="#00A651"
              slotLabel="Joueur 2"
              player={playerB}
              excludeSlug={slugA}
              onPick={(p) => updateSlot("p2", p.slug)}
              onClear={() => updateSlot("p2", null)}
            />
          </div>

          {/* Toolbar (only when both slots filled) */}
          {ready ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={swap}>
                <ArrowRightLeft className="h-4 w-4" /> Inverser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const next = new URLSearchParams();
                  setParams(next, { replace: false });
                }}
              >
                Réinitialiser
              </Button>
            </div>
          ) : null}
        </section>

        {/* COMPARE BODY */}
        {ready ? (
          <CompareBody playerA={playerA!} playerB={playerB!} />
        ) : (
          <SetupHints
            slugA={slugA}
            slugB={slugB}
            playerA={playerA}
            playerB={playerB}
            loading={loadingA || loadingB}
          />
        )}

        <div className="container-site py-12">
          <Link
            to="/roster"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" /> Retour au Roster
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ---------- Compare body (both players selected) ----------

function CompareBody({
  playerA,
  playerB,
}: {
  playerA: DBPlayer;
  playerB: DBPlayer;
}) {
  const scoresA = useMemo(() => computePlayerScores(playerA), [playerA]);
  const scoresB = useMemo(() => computePlayerScores(playerB), [playerB]);

  // Cross-position note shown below the hexagon when the role axes differ.
  const crossPosition =
    !!scoresA.positionLabel &&
    !!scoresB.positionLabel &&
    scoresA.positionLabel !== scoresB.positionLabel;

  return (
    <>
      <section className="container-site py-12 border-t border-border">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-16 items-start">
          <div className="flex flex-col items-center lg:items-start gap-6">
            <HexagonCompare
              scoresA={scoresA}
              scoresB={scoresB}
              nameA={playerA.name}
              nameB={playerB.name}
              size={380}
            />
            <CompareLegend nameA={playerA.name} nameB={playerB.name} />
            {crossPosition ? (
              <p className="max-w-sm text-[11px] text-muted-light leading-relaxed">
                <span className="text-foreground/80">{scoresA.positionLabel}</span> face à{" "}
                <span className="text-foreground/80">{scoresB.positionLabel}</span> : les
                deux axes liés au poste mesurent des choses différentes pour
                chacun (chaque profil garde son barème). Les quatre axes
                universels restent comparables.
              </p>
            ) : null}
          </div>

          <div>
            <CompareDeltas
              playerA={playerA}
              playerB={playerB}
              scoresA={scoresA}
              scoresB={scoresB}
            />
          </div>
        </div>
      </section>

      {/* Quick links to individual fiches */}
      <section className="container-site py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to={`/player/${playerA.slug}`}
            className="rounded-card border border-border bg-card hover:bg-card-hover transition-colors p-4 sm:p-5 flex items-center gap-3"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "#FCD116" }}
            />
            <div className="min-w-0">
              <div className="font-serif text-foreground truncate">
                Voir la fiche de {playerA.name}
              </div>
              <div className="text-xs text-muted truncate">
                {playerA.current_club ?? "Sans club"}
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted rotate-180 ml-auto shrink-0" />
          </Link>
          <Link
            to={`/player/${playerB.slug}`}
            className="rounded-card border border-border bg-card hover:bg-card-hover transition-colors p-4 sm:p-5 flex items-center gap-3"
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "#00A651" }}
            />
            <div className="min-w-0">
              <div className="font-serif text-foreground truncate">
                Voir la fiche de {playerB.name}
              </div>
              <div className="text-xs text-muted truncate">
                {playerB.current_club ?? "Sans club"}
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted rotate-180 ml-auto shrink-0" />
          </Link>
        </div>
      </section>
    </>
  );
}

// ---------- Setup hints (one or both slots empty) ----------

const SUGGESTED_DUELS: Array<{
  slugA: string;
  slugB: string;
  title: string;
  why: string;
}> = [
  {
    slugA: "yoane-wissa",
    slugB: "cedric-bakambu",
    title: "Wissa vs. Bakambu",
    why: "Le finisseur en Premier League face au capitaine vétéran de la Liga.",
  },
  {
    slugA: "castello-lukeba",
    slugB: "ngalayel-mukau",
    title: "Lukeba vs. Mukau",
    why: "Deux pépites premium — un défenseur RB Leipzig face à un milieu LOSC.",
  },
  {
    slugA: "stephy-mavididi",
    slugB: "samuel-mbangula",
    title: "Mavididi vs. Mbangula",
    why: "Deux ailiers productifs — Leicester face à Brême sur la même saison.",
  },
];

function SetupHints({
  slugA,
  slugB,
  playerA,
  playerB,
  loading,
}: {
  slugA: string | null;
  slugB: string | null;
  playerA: DBPlayer | null;
  playerB: DBPlayer | null;
  loading: boolean;
}) {
  const requested = (slugA && !playerA) || (slugB && !playerB);
  return (
    <section className="container-site py-8">
      {requested && !loading ? (
        <p className="rounded-card border border-border bg-card/40 px-4 py-3 text-sm text-muted-light mb-6">
          Un des slugs demandés ne correspond à aucun joueur de la base.
          Sélectionnez un autre joueur via la recherche.
        </p>
      ) : null}

      <div className="rounded-card border border-border bg-card/40 p-6 sm:p-8">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          <Sparkles className="h-3.5 w-3.5 text-primary/80" aria-hidden />
          Duels suggérés
        </div>
        <p className="mt-2 text-sm text-muted-light max-w-xl">
          Pour démarrer, voici trois confrontations qui montrent l'intérêt
          du comparateur — entre profils du même poste comme à travers les
          lignes.
        </p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SUGGESTED_DUELS.map((d) => (
            <Link
              key={d.title}
              to={`/compare?p1=${d.slugA}&p2=${d.slugB}`}
              className="rounded-card border border-border bg-card hover:bg-card-hover transition-colors p-4 group"
            >
              <div className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
                {d.title}
              </div>
              <p className="mt-1 text-xs text-muted-light leading-relaxed">
                {d.why}
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.16em] text-primary/85">
                Lancer <Shuffle className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Hooks ----------

function usePlayerBySlug(slug: string | null) {
  const [player, setPlayer] = useState<DBPlayer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) {
      setPlayer(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from("players")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        if (!data) {
          setPlayer(null);
        } else {
          const row = data as Record<string, unknown>;
          setPlayer({
            ...(row as unknown as DBPlayer),
            nationalities: normalizeJsonbArray(row.nationalities),
            other_nationalities: normalizeJsonbArray(row.other_nationalities),
          });
        }
      } catch (e) {
        console.error("[Compare/usePlayerBySlug]", e);
        if (!cancelled) setPlayer(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { player, loading };
}

function normalizeJsonbArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}
