/**
 * MaListeHints — bannière contextuelle qui guide l'utilisateur pendant la
 * construction de sa liste des 26.
 *
 * WHY ce composant : le builder Ma Liste est dense (pitch + 1000 joueurs +
 * 4 contraintes : XI complet, banc complet, capitaine, formation respectée).
 * Sans guide, l'utilisateur scroll dans le vide et abandonne. Cette bannière
 * affiche LE hint le plus prioritaire à chaque instant — un seul à la fois,
 * pour ne pas saturer.
 *
 * Logique : on évalue 8 règles dans l'ordre de priorité décroissante. La
 * première règle qui matche → on affiche ce hint. Quand tout est OK → message
 * de validation final.
 *
 * Pas un toast (volatile, on rate l'info), pas un modal (bloque). Une bannière
 * inline qui glisse au-dessus du builder et reste visible jusqu'à résolution.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useMaListeStore } from "@/store/maListeStore";
import { FORMATION_SLOTS } from "@/types/maListe";
import { cn } from "@/lib/utils";

interface Hint {
  id: string;
  icon: typeof Crown;
  /** Phrase courte, max 2 lignes. Vouvoiement neutre (mode tu sur Ma Liste). */
  text: string;
  /** "info" = neutre, "warn" = attention, "success" = liste complète */
  tone: "info" | "warn" | "success";
}

const TONE_STYLES: Record<Hint["tone"], { bg: string; border: string; icon: string }> = {
  info: {
    bg: "bg-success/10",
    border: "border-success/40",
    icon: "text-success",
  },
  warn: {
    bg: "bg-primary/10",
    border: "border-primary/40",
    icon: "text-primary",
  },
  success: {
    bg: "bg-success/15",
    border: "border-success/50",
    icon: "text-success",
  },
};

export function MaListeHints() {
  const formation = useMaListeStore((s) => s.formation);
  const startingXI = useMaListeStore((s) => s.startingXI);
  const bench = useMaListeStore((s) => s.bench);
  const captain = useMaListeStore((s) => s.captain);

  // Calculs dérivés stables — useMemo pour éviter de recompute à chaque render
  // d'un parent.
  const hint = useMemo<Hint | null>(() => {
    if (!formation) return null;

    const slots = FORMATION_SLOTS[formation];
    const xiPlayers = Object.values(startingXI).filter((p) => p !== null);
    const xiSlotsExpected = slots.length;
    const xiCount = xiPlayers.length;

    // ─── Règle 1 — XI incomplet (priorité max) ────────────────────────────
    if (xiCount < xiSlotsExpected) {
      const missing = xiSlotsExpected - xiCount;
      return {
        id: "xi-incomplete",
        icon: Layers,
        text: `${missing} ${missing > 1 ? "places" : "place"} ${missing > 1 ? "vides" : "vide"} sur le terrain. Clique un slot pour le remplir.`,
        tone: "info",
      };
    }

    // ─── Règle 2 — Pas de capitaine ───────────────────────────────────────
    if (xiCount === xiSlotsExpected && !captain) {
      return {
        id: "no-captain",
        icon: Crown,
        text: "Le XI est complet. Désigne ton capitaine en cliquant l'étoile d'un titulaire.",
        tone: "warn",
      };
    }

    // ─── Règle 3 — Capitaine avec 0 caps RDC (étrange éditorialement) ─────
    // On ne bloque pas, on signale juste — un Lukaku sans cap RDC = bizarre
    // mais l'utilisateur a peut-être ses raisons.
    if (captain && (captain.caps_rdc ?? 0) === 0) {
      return {
        id: "captain-no-caps",
        icon: AlertCircle,
        text: `${captain.name.split(" ").slice(-1)[0]} comme capitaine ? Il n'a encore jamais porté le maillot RDC.`,
        tone: "warn",
      };
    }

    // ─── Règle 4 — Pas de gardien sur le banc ─────────────────────────────
    const benchHasGK = bench.some((p) => p.position === "Goalkeeper");
    if (xiCount === xiSlotsExpected && captain && bench.length > 0 && !benchHasGK) {
      return {
        id: "no-gk-bench",
        icon: Shield,
        text: "Aucun gardien remplaçant sur le banc. Risqué pour un Mondial.",
        tone: "warn",
      };
    }

    // ─── Règle 5 — Banc incomplet ────────────────────────────────────────
    const BENCH_TARGET = 15;
    if (
      xiCount === xiSlotsExpected &&
      captain &&
      bench.length < BENCH_TARGET
    ) {
      const remaining = BENCH_TARGET - bench.length;
      return {
        id: "bench-incomplete",
        icon: Layers,
        text: `Encore ${remaining} ${remaining > 1 ? "places" : "place"} à remplir sur le banc (${bench.length}/${BENCH_TARGET}).`,
        tone: "info",
      };
    }

    // ─── Règle 6 — Banc trop concentré sur un poste ────────────────────────
    if (xiCount === xiSlotsExpected && bench.length >= 5) {
      const counts: Record<string, number> = {};
      bench.forEach((p) => {
        if (p.position) counts[p.position] = (counts[p.position] ?? 0) + 1;
      });
      const max = Object.entries(counts).reduce<{ pos: string; n: number } | null>(
        (acc, [pos, n]) => (acc && acc.n >= n ? acc : { pos, n }),
        null,
      );
      if (max && max.n >= bench.length * 0.6 && max.pos !== "Goalkeeper") {
        const label =
          max.pos === "Defender"
            ? "défenseurs"
            : max.pos === "Midfield"
              ? "milieux"
              : max.pos === "Attack"
                ? "attaquants"
                : "joueurs au même poste";
        return {
          id: "bench-skewed",
          icon: AlertCircle,
          text: `${max.n} ${label} sur le banc — pense à équilibrer les postes.`,
          tone: "warn",
        };
      }
    }

    // ─── Règle 7 — Banc complet mais aucun "Tier S" (heuristique valeur) ──
    // Critère pragmatique : si tous les remplaçants ont une valeur < 10M,
    // le banc manque de profondeur en termes de potentiel international.
    if (
      xiCount === xiSlotsExpected &&
      captain &&
      bench.length === BENCH_TARGET
    ) {
      const benchHasTopTier = bench.some(
        (p) => (p.market_value_eur ?? 0) >= 10_000_000,
      );
      if (!benchHasTopTier) {
        return {
          id: "bench-low-tier",
          icon: Sparkles,
          text: "Banc complet mais sans top tier (≥ 10M €). Penser à pousser plus haut ?",
          tone: "warn",
        };
      }
    }

    // ─── Règle 8 — Tout est OK : succès ───────────────────────────────────
    if (
      xiCount === xiSlotsExpected &&
      captain &&
      bench.length === BENCH_TARGET
    ) {
      return {
        id: "all-good",
        icon: CheckCircle2,
        text: "Liste des 26 complète. Direction le récap pour partager.",
        tone: "success",
      };
    }

    return null;
  }, [formation, startingXI, bench, captain]);

  if (!hint) return null;

  const tone = TONE_STYLES[hint.tone];
  const Icon = hint.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={hint.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        role="status"
        aria-live="polite"
        className={cn(
          "flex items-start gap-3 rounded-card border px-4 py-3",
          "backdrop-blur-sm",
          tone.bg,
          tone.border,
        )}
      >
        <Icon
          aria-hidden
          className={cn("h-5 w-5 shrink-0 mt-0.5", tone.icon)}
        />
        <p className="text-sm text-foreground/90 leading-snug">{hint.text}</p>
      </motion.div>
    </AnimatePresence>
  );
}

export default MaListeHints;
