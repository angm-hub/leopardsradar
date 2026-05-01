import { motion } from "framer-motion";

interface InfoPanelProps {
  total: number;
  shown: number;
  positions: { gk: number; def: number; mid: number; att: number };
  avgAge: number | null;
}

/**
 * InfoPanel — encart translucide top-left du canvas Radar.
 * Inspiré du panneau "Concentration / Boredom / Calmness" de Hume AI.
 * Mosaïque dense : composition par poste + âge moyen + tag de mode.
 */
export function InfoPanel({ total, shown, positions, avgAge }: InfoPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="absolute top-4 left-4 z-[2] max-w-[260px]"
    >
      <div className="rounded-card border border-border/60 bg-background/75 backdrop-blur-xl p-3.5">
        <div className="flex items-center gap-2 mb-3">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <p className="text-[9px] uppercase tracking-[0.25em] text-foreground/60 font-mono">
            Sélection live
          </p>
        </div>

        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-serif text-foreground leading-none">
            {shown}
          </p>
          <p className="text-xs text-muted-light font-sans">
            sur {total} profils
          </p>
        </div>

        {avgAge !== null ? (
          <p className="mt-1.5 text-[10px] text-muted font-mono">
            Âge moyen · {avgAge.toFixed(1)} ans
          </p>
        ) : null}

        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          <PosCell label="GK" value={positions.gk} dot="bg-pos-gk" />
          <PosCell label="DEF" value={positions.def} dot="bg-pos-def" />
          <PosCell label="MID" value={positions.mid} dot="bg-pos-mid" />
          <PosCell label="ATT" value={positions.att} dot="bg-pos-att" />
        </div>
      </div>
    </motion.div>
  );
}

function PosCell({
  label,
  value,
  dot,
}: {
  label: string;
  value: number;
  dot: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-button bg-card/40 py-1.5">
      <span className={`h-1.5 w-1.5 rounded-sm ${dot}`} aria-hidden />
      <span className="text-[10px] font-mono text-foreground/85 leading-none">
        {value}
      </span>
      <span className="text-[8px] uppercase tracking-wider text-muted leading-none">
        {label}
      </span>
    </div>
  );
}
