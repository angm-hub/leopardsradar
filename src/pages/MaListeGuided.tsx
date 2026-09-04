/**
 * Ma Liste — flow guidé type Typeform (refonte 04/09).
 *
 * Un écran par étape : intro → système (4-3-3 / 4-2-3-1) → un groupe de poste
 * à la fois (gardiens, latéraux droits/gauches, centraux, milieux, attaquants)
 * → récap de l'effectif + partage. Remplace le terrain FUT (qui reste dispo
 * sur /ma-liste-v2).
 *
 * DA Léopards Radar : cobalt sombre + or, Geist, transitions spring, calme.
 * Clavier : Entrée avance. prefers-reduced-motion respecté.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion, MotionConfig } from "framer-motion";
import { ArrowRight, ArrowLeft, Search, Check, Share2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { usePlayers } from "@/hooks/usePlayers";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";
import { PlayerPickCard } from "@/components/ma-liste/guided/PlayerPickCard";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  useGuidedStore,
  encodeShare,
  decodeShare,
} from "@/store/maListeGuidedStore";
import {
  groupsFor,
  groupKeyOf,
  FORMATION_META,
  GROUP_TITLE,
  type Formation,
  type GroupKey,
} from "@/components/ma-liste/guided/guidedGroups";
import type { DBPlayer } from "@/types/dbPlayer";

type Phase = "intro" | "formation" | "group" | "recap";

export default function MaListeGuided() {
  useDocumentMeta({
    title: "Ma sélection · Léopards Radar",
    description:
      "Compose ta sélection des Léopards poste par poste, comme un sélectionneur. Choisis ton système, tes gardiens, tes latéraux, tes centraux, tes milieux, tes attaquants.",
  });

  const reduced = useReducedMotion();
  const { players, loading } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
    publicVisibilityOnly: true,
  });

  const formation = useGuidedStore((s) => s.formation);
  const setFormation = useGuidedStore((s) => s.setFormation);
  const selections = useGuidedStore((s) => s.selections);
  const toggle = useGuidedStore((s) => s.toggle);
  const totalPicked = useGuidedStore((s) => s.totalPicked);
  const reset = useGuidedStore((s) => s.reset);
  const hydrate = useGuidedStore((s) => s.hydrate);

  const [phase, setPhase] = useState<Phase>("intro");
  const [groupIndex, setGroupIndex] = useState(0);
  const [dir, setDir] = useState(1);

  // Partage : ?s=... → hydrate + saute au récap.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("s");
    if (p) {
      const dec = decodeShare(p);
      if (dec) {
        hydrate(dec.formation, dec.selections);
        setPhase("recap");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(
    () => (formation ? groupsFor(formation) : []),
    [formation],
  );

  // Index d'étape pour la barre de progression.
  const stepCount = 3 + (groups.length || 6); // intro + système + N + récap
  const stepIndex =
    phase === "intro"
      ? 0
      : phase === "formation"
        ? 1
        : phase === "group"
          ? 2 + groupIndex
          : 2 + (groups.length || 0);

  // Candidats indexés par groupe, triés par pertinence.
  const candidatesByGroup = useMemo(() => {
    const map: Record<GroupKey, DBPlayer[]> = { GK: [], RB: [], LB: [], CB: [], MID: [], ATT: [] };
    const seen = new Set<string>();
    for (const p of players) {
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      const g = groupKeyOf(p);
      if (g) map[g].push(p);
    }
    const rank = (p: DBPlayer) =>
      (p.player_category === "roster" ? 1_000_000 : 0) +
      (p.caps_rdc ?? 0) * 1000 +
      (p.market_value_eur ?? 0) / 1000;
    (Object.keys(map) as GroupKey[]).forEach((g) =>
      map[g].sort((a, b) => rank(b) - rank(a)),
    );
    return map;
  }, [players]);

  const bySlug = useMemo(() => {
    const m = new Map<string, DBPlayer>();
    for (const p of players) m.set(p.slug, p);
    return m;
  }, [players]);

  const goNext = () => {
    setDir(1);
    if (phase === "intro") setPhase("formation");
    else if (phase === "formation") {
      if (formation) {
        setGroupIndex(0);
        setPhase("group");
      }
    } else if (phase === "group") {
      if (groupIndex < groups.length - 1) setGroupIndex((i) => i + 1);
      else setPhase("recap");
    }
  };
  const goPrev = () => {
    setDir(-1);
    if (phase === "recap") {
      setPhase("group");
      setGroupIndex(Math.max(0, groups.length - 1));
    } else if (phase === "group") {
      if (groupIndex > 0) setGroupIndex((i) => i - 1);
      else setPhase("formation");
    } else if (phase === "formation") setPhase("intro");
  };

  const canNext =
    phase === "intro" ||
    (phase === "formation" && !!formation) ||
    phase === "group";

  // Entrée avance (sauf focus dans un champ texte).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "Enter" && tag !== "INPUT" && tag !== "TEXTAREA") {
        if (phase !== "recap" && canNext) {
          e.preventDefault();
          goNext();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const slide = reduced
    ? { initial: false, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: dir > 0 ? 28 : -28 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: dir > 0 ? -28 : 28 },
      };
  const stepKey = phase === "group" ? `group-${groupIndex}` : phase;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-background text-foreground">
        {/* Atmosphère */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-60">
          <StrongGradient position="top" intensity={0.55} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-1/2"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(37,99,184,0.16) 0%, transparent 70%)",
          }}
        />

        {/* Barre de progression + top bar minimal */}
        <div className="relative z-20">
          <div className="h-[3px] w-full bg-border/40">
            <motion.div
              className="h-full bg-primary"
              initial={false}
              animate={{ width: `${(stepIndex / (stepCount - 1)) * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 30 }}
            />
          </div>
          <div className="container-site flex items-center justify-between py-4">
            <Link
              to="/"
              className="font-display text-sm tracking-tight text-foreground/80 transition-colors hover:text-foreground"
            >
              Léopards <span className="text-foreground/45">Radar</span>
            </Link>
            <div className="flex items-center gap-4">
              {totalPicked() > 0 ? (
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/45">
                  {totalPicked()} choisis
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  reset();
                  setPhase("intro");
                  setGroupIndex(0);
                }}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/45 transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recommencer
              </button>
            </div>
          </div>
        </div>

        {/* Contenu de l'étape */}
        <main className="relative z-10 flex flex-1 flex-col">
          <div className="container-site flex flex-1 flex-col py-6 md:py-10">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={stepKey}
                {...slide}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-1 flex-col"
              >
                {phase === "intro" && <IntroStep onStart={goNext} />}
                {phase === "formation" && (
                  <FormationStep value={formation} onSelect={setFormation} />
                )}
                {phase === "group" && formation && (
                  <GroupStep
                    key={groups[groupIndex].key}
                    meta={groups[groupIndex]}
                    stepNo={groupIndex + 1}
                    stepTotal={groups.length}
                    candidates={candidatesByGroup[groups[groupIndex].key]}
                    selections={selections[groups[groupIndex].key]}
                    onToggle={(slug) => toggle(groups[groupIndex].key, slug)}
                    loading={loading}
                  />
                )}
                {phase === "recap" && formation && (
                  <RecapStep
                    formation={formation}
                    selections={selections}
                    bySlug={bySlug}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Barre d'action bas — sticky */}
        {phase !== "intro" ? (
          <div className="sticky bottom-0 z-20 border-t border-border/50 bg-background/85 backdrop-blur-md">
            <div className="container-site flex items-center justify-between gap-4 py-3.5">
              <button
                type="button"
                onClick={goPrev}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              {phase !== "recap" ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canNext}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    canNext
                      ? "bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.98]"
                      : "cursor-not-allowed bg-card text-foreground/30",
                  )}
                >
                  {phase === "group" && groupIndex === (formation ? groupsFor(formation).length - 1 : 0)
                    ? "Voir ma sélection"
                    : "Suivant"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/45">
                  Sélection prête
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </MotionConfig>
  );
}

/* ───────────────────────── Étape : intro ───────────────────────── */
function IntroStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-start justify-center">
      <p className="mb-4 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/85">
        <span className="h-px w-10 bg-primary" />
        Ma sélection
      </p>
      <h1
        className="font-display text-foreground"
        style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)", fontWeight: 300, lineHeight: 0.95, letterSpacing: "-0.04em" }}
      >
        Fais tes Léopards.
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/60">
        Compose ta sélection comme un sélectionneur : ton système, puis poste par
        poste. Une question à la fois.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="group mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        Commencer
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground/35">
        Appuie sur Entrée
      </p>
    </div>
  );
}

/* ───────────────────────── Étape : système ───────────────────────── */
function FormationStep({
  value,
  onSelect,
}: {
  value: Formation | null;
  onSelect: (f: Formation) => void;
}) {
  const options: Formation[] = ["4-3-3", "4-2-3-1"];
  return (
    <div className="flex flex-1 flex-col justify-center">
      <StepHeader eyebrow="Le socle" title="Ton système" subtitle="Il donne la forme de ton équipe type." />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {options.map((f) => {
          const meta = FORMATION_META[f];
          const active = value === f;
          return (
            <button
              key={f}
              type="button"
              onClick={() => onSelect(f)}
              className={cn(
                "group relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl border p-8 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-primary/60 bg-primary/[0.07] shadow-[0_0_0_1px_rgba(245,197,24,0.25),0_20px_50px_-24px_rgba(245,197,24,0.4)]"
                  : "border-border bg-card/40 hover:-translate-y-0.5 hover:border-border-hover hover:bg-card/70",
              )}
            >
              {active ? (
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
              ) : null}
              <FormationDiagram rows={meta.rows} active={active} />
              <div className="text-center">
                <div className="font-display text-3xl tracking-tight text-foreground">{meta.label}</div>
                <div className="mt-1 text-sm text-foreground/55">{meta.line}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormationDiagram({ rows, active }: { rows: number[]; active: boolean }) {
  // rows = lignes défense→attaque ; on affiche GK en bas puis les lignes.
  const lines = [...rows].reverse(); // haut = attaque
  return (
    <div className="flex h-40 w-28 flex-col justify-between rounded-2xl border border-border/60 bg-cobalt-deep/60 p-3">
      {lines.map((n, i) => (
        <div key={i} className="flex justify-center gap-2">
          {Array.from({ length: n }).map((_, j) => (
            <span
              key={j}
              className={cn("h-2.5 w-2.5 rounded-full transition-colors", active ? "bg-primary" : "bg-foreground/40")}
            />
          ))}
        </div>
      ))}
      {/* Gardien */}
      <div className="flex justify-center">
        <span className={cn("h-2.5 w-2.5 rounded-full", active ? "bg-primary/70" : "bg-foreground/25")} />
      </div>
    </div>
  );
}

/* ───────────────────────── Étape : groupe ───────────────────────── */
function GroupStep({
  meta,
  stepNo,
  stepTotal,
  candidates,
  selections,
  onToggle,
  loading,
}: {
  meta: { key: GroupKey; title: string; subtitle: string; target: number };
  stepNo: number;
  stepTotal: number;
  candidates: DBPlayer[];
  selections: string[];
  onToggle: (slug: string) => void;
  loading: boolean;
}) {
  const [q, setQ] = useState("");
  const picked = new Set(selections);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = s
      ? candidates.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            (p.current_club ?? "").toLowerCase().includes(s),
        )
      : candidates;
    // Les sélectionnés remontent en tête pour rester visibles.
    const sel = base.filter((p) => picked.has(p.slug));
    const rest = base.filter((p) => !picked.has(p.slug));
    return [...sel, ...rest];
  }, [candidates, q, selections]);

  const CAP = 60;
  const shown = filtered.slice(0, CAP);
  const count = selections.length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <StepHeader
          eyebrow={`Étape ${stepNo} / ${stepTotal}`}
          title={meta.title}
          subtitle={meta.subtitle}
        />
        <div className="shrink-0 text-right">
          <div className="font-display text-3xl tabular-nums text-foreground">
            {count}
            <span className="text-foreground/35">/{meta.target}</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/45">
            conseillé
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mt-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cherche un nom, un club…"
          className="w-full rounded-2xl border border-border bg-card/50 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-primary/60 focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* Grille de candidats */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-2xl border border-border/50 bg-card/40" />
            ))
          : shown.map((p, i) => (
              <PlayerPickCard
                key={p.slug}
                player={p}
                picked={picked.has(p.slug)}
                onToggle={() => onToggle(p.slug)}
                index={i}
              />
            ))}
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-foreground/45">
          Aucun candidat pour ce poste. Affine ou passe à l'étape suivante.
        </p>
      ) : null}
      {!loading && filtered.length > CAP ? (
        <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/35">
          {filtered.length - CAP} de plus · affine avec la recherche
        </p>
      ) : null}
      <div className="h-4" />
    </div>
  );
}

/* ───────────────────────── Étape : récap ───────────────────────── */
function RecapStep({
  formation,
  selections,
  bySlug,
}: {
  formation: Formation;
  selections: Record<GroupKey, string[]>;
  bySlug: Map<string, DBPlayer>;
}) {
  const order: GroupKey[] = ["GK", "RB", "LB", "CB", "MID", "ATT"];
  const total = order.reduce((n, g) => n + (selections[g]?.length ?? 0), 0);

  const share = () => {
    const url = `${window.location.origin}/ma-liste?s=${encodeShare(formation, selections)}`;
    navigator.clipboard?.writeText(url).then(
      () => toast.success("Lien copié", { description: "Partage ta sélection." }),
      () => toast.error("Copie impossible"),
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <StepHeader eyebrow="Ta sélection" title="Ton effectif" subtitle={`Système ${FORMATION_META[formation].label} · ${total} joueurs`} />
        <button
          type="button"
          onClick={share}
          className="group inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </button>
      </div>

      <div className="mt-8 space-y-7">
        {order.map((g) => {
          const slugs = selections[g] ?? [];
          if (!slugs.length) return null;
          return (
            <section key={g}>
              <div className="mb-3 flex items-baseline gap-3">
                <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-cobalt-mist">
                  {GROUP_TITLE[g]}
                </h3>
                <span className="font-mono text-[11px] text-foreground/35">{slugs.length}</span>
                <span className="h-px flex-1 bg-border/50" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {slugs.map((slug) => {
                  const p = bySlug.get(slug);
                  if (!p) return null;
                  return (
                    <div key={slug} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/40 p-2.5">
                      <PlayerAvatar name={p.name} src={p.image_url} srcAlt={p.image_url_alt} className="h-9 w-9 shrink-0 rounded-full border border-border" initialsClassName="text-[11px]" />
                      <span className="min-w-0 truncate font-serif text-sm font-medium text-foreground">
                        {p.name.split(" ").slice(-1)[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
        {total === 0 ? (
          <p className="py-16 text-center text-foreground/50">
            Aucun joueur choisi. Reviens en arrière pour composer ton effectif.
          </p>
        ) : null}
      </div>
      <div className="h-6" />
    </div>
  );
}

/* ───────────────────────── Commun ───────────────────────── */
function StepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="mb-3 flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
        <span className="h-px w-8 bg-primary/70" />
        {eyebrow}
      </p>
      <h2
        className="font-display text-foreground"
        style={{ fontSize: "clamp(1.9rem, 5vw, 3.25rem)", fontWeight: 300, lineHeight: 0.98, letterSpacing: "-0.035em" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-base text-foreground/55 md:text-lg">{subtitle}</p>
    </div>
  );
}
