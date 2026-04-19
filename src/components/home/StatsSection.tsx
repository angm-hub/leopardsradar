import { motion } from "framer-motion";
import { Globe, Target, Trophy } from "lucide-react";
import { Pill } from "@/components/ui/Pill";

export function StatsSection() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container-site grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <span className="text-xs uppercase tracking-[0.2em] text-primary">
            Les Léopards en chiffres
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight text-balance">
            Une diaspora, un talent collectif.
          </h2>
          <p className="text-muted text-base md:text-lg leading-relaxed max-w-md">
            35 joueurs. 12 pays. Une carte du monde qui ne ment pas : le talent
            congolais brille partout où il pose le pied.
          </p>
        </div>

        {/* Right */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="lg:col-span-7"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
            {/* Glow */}
            <div className="pointer-events-none absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-primary/[0.04] blur-3xl" />

            {/* Hero stat */}
            <div className="relative flex items-center gap-5">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-3xl font-bold text-foreground leading-none">
                  184M €
                </span>
                <span className="mt-1 text-sm text-muted">
                  Valeur marchande cumulée
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="relative mt-8">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Joueurs en top 5 européen</span>
                <span className="text-foreground font-medium">80%</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "80%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                />
              </div>
            </div>

            <div className="h-px bg-border my-6" />

            {/* Mini stats */}
            <div className="grid grid-cols-3 divide-x divide-border">
              {[
                { value: "35", label: "Joueurs" },
                { value: "12", label: "Pays" },
                { value: "27", label: "Âge moyen" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`flex flex-col items-center ${i === 0 ? "pr-4" : i === 2 ? "pl-4" : "px-4"}`}
                >
                  <span className="font-mono text-2xl font-bold text-foreground">
                    {s.value}
                  </span>
                  <span className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Tag pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              <Pill dot dotColor="bg-success">
                Mondial 2026
              </Pill>
              <Pill icon={Trophy}>Play-offs conquis</Pill>
              <Pill icon={Globe}>Diaspora mondiale</Pill>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default StatsSection;
