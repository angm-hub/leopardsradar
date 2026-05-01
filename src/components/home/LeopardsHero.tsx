import { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/ButtonPrimitive";
import { Pill } from "@/components/ui/Pill";
import { AuroraShader } from "@/components/ui/AuroraShader";
import { NewsletterForm } from "@/components/newsletter/NewsletterForm";
import { useHomeStats } from "@/hooks/useHomeStats";
import { supabase } from "@/integrations/supabase/client";

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0.85, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function formatFrenchDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function useLatestBestXI() {
  const [info, setInfo] = useState<{ date: string; index: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase as any)
          .from("best_xi")
          .select("published_at")
          .eq("is_published", true)
          .order("published_at", { ascending: false });
        if (cancelled || !data || !data.length) return;
        const latest = data[0]?.published_at;
        if (latest) {
          setInfo({
            date: formatFrenchDate(new Date(latest)),
            index: data.length,
          });
        }
      } catch (e) {
        console.error("[useLatestBestXI]", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  return info;
}

export function LeopardsHero() {
  const { stats } = useHomeStats();
  const latest = useLatestBestXI();

  const totalPlayers = stats?.total_players ?? 471;
  const roster = stats?.roster_count ?? 65;
  const radar = stats?.radar_count ?? 397;
  const countries = stats?.total_countries ?? 19;

  const statBandDesktop = `${totalPlayers} joueurs suivis · ${roster} dans le roster · ${radar} sur le radar · ${countries} pays · Mis à jour chaque dimanche`;
  const statBandMobile = `${totalPlayers} joueurs · ${countries} pays · Mis à jour chaque dimanche`;

  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      <AuroraShader className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background pointer-events-none" />

      <div className="container-site relative z-10 flex min-h-screen items-center py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-4xl flex flex-col items-center text-center gap-7"
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
            className="flex flex-col items-center gap-3 w-full sm:w-auto"
          >
            <Link to="/ma-liste" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="group w-full sm:w-auto">
                Compose ta liste des 26
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <p className="text-xs text-foreground/60">
              2 minutes. Compare aux autres fans. Partage.
            </p>
            <Link to="/roster" className="w-full sm:w-auto mt-1">
              <Button variant="ghost-premium" size="lg" className="w-full sm:w-auto">
                Voir le Roster
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="w-full flex justify-center pt-2"
          >
            <NewsletterForm
              source="hero"
              variant="inline-hero"
              buttonLabel="Préviens-moi du lancement"
              microcopy="Une édition par semaine. Zéro spam. Désinscription en un clic."
            />
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col items-center gap-1.5 mt-2">
            <span className="hidden md:block text-sm text-foreground/55">
              {statBandDesktop}
            </span>
            <span className="md:hidden text-sm text-foreground/55">
              {statBandMobile}
            </span>
            {latest ? (
              <span className="text-xs text-foreground/45">
                Édition #{latest.index} du Best XI publiée le {latest.date}
              </span>
            ) : null}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default LeopardsHero;
