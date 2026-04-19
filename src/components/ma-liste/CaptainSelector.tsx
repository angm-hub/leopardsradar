import { ArrowLeft, ArrowRight, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { useMaListeStore } from "@/store/maListeStore";
import { Button } from "@/components/ui/ButtonPrimitive";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { POSITION_LABEL } from "@/lib/playerHelpers";
import { cn } from "@/lib/utils";
import type { DBPosition } from "@/types/dbPlayer";

export function CaptainSelector() {
  const getPlayersInStartingXI = useMaListeStore(
    (s) => s.getPlayersInStartingXI,
  );
  const captain = useMaListeStore((s) => s.captain);
  const setCaptain = useMaListeStore((s) => s.setCaptain);
  const previousStep = useMaListeStore((s) => s.previousStep);
  const nextStep = useMaListeStore((s) => s.nextStep);

  const xi = getPlayersInStartingXI();

  return (
    <section className="container-site max-w-6xl py-12 md:py-16">
      <div className="space-y-10">
        {/* Progress */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousStep}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="h-1 w-8 rounded-full bg-primary" />
            ))}
          </div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            5/5 · CAPITAINE
          </span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground">
            Qui porte le brassard ?
          </h1>
          <p className="mt-3 text-muted-light max-w-xl mx-auto">
            Désigne ton capitaine parmi les 11 titulaires. C'est lui qui
            représente ta vision du Mondial.
          </p>
        </div>

        {/* XI grid */}
        {xi.length === 0 ? (
          <p className="text-center text-muted py-12">
            Aucun titulaire trouvé. Reviens en arrière pour composer ton XI.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {xi.map((player, i) => {
              const isSelected = captain?.slug === player.slug;
              return (
                <motion.button
                  key={player.slug}
                  onClick={() => setCaptain(player)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "relative rounded-card p-4 border-2 transition-all group text-left",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/20"
                      : "border-border bg-card hover:border-foreground/30",
                  )}
                >
                  {isSelected && (
                    <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center shadow-lg">
                      <Crown className="h-4 w-4" />
                    </span>
                  )}

                  <div className="relative mx-auto w-20 h-20">
                    <PlayerAvatar
                      name={player.name}
                      src={player.image_url}
                      className={cn(
                        "h-20 w-20 rounded-full mx-auto border-2",
                        isSelected ? "border-primary" : "border-border",
                      )}
                    />
                    {isSelected && (
                      <span className="absolute inset-0 rounded-full ring-4 ring-primary/30 animate-pulse pointer-events-none" />
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p className="text-sm text-foreground font-medium truncate">
                      {player.name.split(" ").slice(-1)[0]}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
                      {player.position
                        ? POSITION_LABEL[player.position as DBPosition]
                        : "—"}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!captain}
            onClick={nextStep}
            className="gap-2"
          >
            {captain ? `${captain.name} capitaine` : "Choisir un capitaine"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
