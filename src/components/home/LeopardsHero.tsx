import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Pill } from "@/components/ui/Pill";
import { AuroraShader } from "@/components/ui/AuroraShader";


const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function LeopardsHero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <AuroraShader className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background pointer-events-none" />

      <div className="container-site relative z-10 flex min-h-screen items-center py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl flex flex-col items-center text-center gap-8"
        >
          <motion.div variants={itemVariants}>
            <Pill dot dotColor="bg-success">
              Saison 2025/26
            </Pill>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-balance text-foreground"
          >
            Les yeux sur tous{" "}
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground/70 bg-clip-text text-transparent">
              les Léopards.
            </span>
          </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-lg md:text-xl text-foreground/70 max-w-2xl text-balance"
        >
          Tous les Léopards de la planète. Une seule base.
        </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
          >
            <Button variant="primary" size="lg" className="group">
              Voir le Roster
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="ghost-premium" size="lg" disabled title="Newsletter bientôt disponible">
              Newsletter · Bientôt
            </Button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex items-center gap-3 mt-2"
          >
            <span className="text-sm text-foreground/50">
              471 joueurs suivis · 19 pays · Mis à jour chaque semaine
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default LeopardsHero;
