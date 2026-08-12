import { motion, useReducedMotion } from "framer-motion";
import { Crown, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMaListeV2Store, MAX_STARTERS, MAX_BENCH } from "@/store/maListeV2Store";
import { formatMarketValueCompact } from "@/lib/playerHelpers";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import {
  squadNote,
  totalValue,
  alchimie,
  noteColorClass,
  useCountUp,
} from "./squadFormation";

const TOTAL = MAX_STARTERS + MAX_BENCH; // 26

/**
 * SquadHUD — le tableau de bord vivant du squad-builder (refonte gamifiée).
 * Note du XI (count-up color-rampée), complétion 26/26 + statuts, valeur
 * cumulée, alchimie de club, capitaine. Célébration à convocation complète.
 */
export function SquadHUD() {
  const starters = useMaListeV2Store((s) => s.starters);
  const bench = useMaListeV2Store((s) => s.bench);
  const captain = useMaListeV2Store((s) => s.captain);
  const reduced = useReducedMotion();

  const all = [...starters, ...bench];
  const picked = all.length;
  const note = squadNote(starters);
  const noteCount = useCountUp(note ?? 0);
  const value = totalValue(all);
  const valueCount = useCountUp(Math.round(value / 100000)); // dixièmes de M€
  const alch = useCountUp(alchimie(all));

  const startersDone = starters.length === MAX_STARTERS;
  const benchDone = bench.length === MAX_BENCH;
  const captainDone = !!captain;
  const complete = startersDone && benchDone && captainDone;
  const pct = Math.round((picked / TOTAL) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
      {/* Halo de célébration */}
      {complete ? (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background:
              "radial-gradient(120% 90% at 50% -10%, rgba(245,197,24,0.16), transparent 60%)",
          }}
        />
      ) : null}

      <div className="relative grid grid-cols-2 gap-px bg-border/40 sm:grid-cols-4">
        {/* NOTE DU XI */}
        <Tile label="Note du XI">
          <span
            className={cn(
              "font-serif text-4xl font-semibold tabular-nums leading-none md:text-5xl",
              noteColorClass(note),
            )}
          >
            {note != null ? noteCount : "n.d."}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            {starters.length}/{MAX_STARTERS} titulaires
          </span>
        </Tile>

        {/* COMPLÉTION */}
        <Tile label="Complétion">
          <span className="font-serif text-4xl font-semibold tabular-nums leading-none text-foreground md:text-5xl">
            {picked}
            <span className="text-xl text-muted md:text-2xl">/{TOTAL}</span>
          </span>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-border/70">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cobalt-500 to-primary"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
            />
          </div>
        </Tile>

        {/* VALEUR CUMULÉE */}
        <Tile label="Valeur cumulée">
          <span className="font-serif text-3xl font-semibold tabular-nums leading-none text-foreground md:text-4xl">
            {value > 0 ? formatMarketValueCompact(valueCount * 100000) : "0"}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            marché
          </span>
        </Tile>

        {/* ALCHIMIE */}
        <Tile label="Alchimie">
          <span
            className={cn(
              "font-serif text-3xl font-semibold tabular-nums leading-none md:text-4xl",
              alch >= 60 ? "text-primary" : alch >= 25 ? "text-foreground" : "text-foreground/55",
            )}
          >
            {alch}
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            coéquipiers
          </span>
        </Tile>
      </div>

      {/* Barre de statut : XI · Banc · Capitaine + célébration */}
      <div className="relative flex flex-wrap items-center gap-2 border-t border-border/40 px-4 py-3">
        <StatusChip label={`XI ${starters.length}/${MAX_STARTERS}`} done={startersDone} />
        <StatusChip label={`Banc ${bench.length}/${MAX_BENCH}`} done={benchDone} />
        {captainDone ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
            <Crown className="h-3 w-3" />
            <span className="normal-case tracking-normal">{captain!.name}</span>
          </span>
        ) : (
          <StatusChip label="Capitaine à désigner" done={false} />
        )}

        {complete ? (
          <motion.span
            initial={reduced ? false : { scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground"
          >
            <Sparkles className="h-3 w-3" />
            Convocation complète
          </motion.span>
        ) : null}
      </div>
    </div>
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center bg-card/60 px-4 py-4">
      <span className="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-cobalt-mist">
        {label}
      </span>
      {children}
    </div>
  );
}

function StatusChip({ label, done }: { label: string; done: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors",
        done
          ? "border-success/40 bg-success/15 text-success"
          : "border-border bg-background/40 text-muted",
      )}
    >
      {done ? <Check className="h-3 w-3" /> : null}
      {label}
    </span>
  );
}

export default SquadHUD;
