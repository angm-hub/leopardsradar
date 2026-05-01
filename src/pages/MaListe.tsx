import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useMaListeStore } from "@/store/maListeStore";
import { IntroScreen } from "@/components/ma-liste/IntroScreen";
import { FormationPicker } from "@/components/ma-liste/FormationPicker";
import { BuilderUnified } from "@/components/ma-liste/builder/BuilderUnified";
import { ListRecap } from "@/components/ma-liste/ListRecap";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const stepFade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

function Placeholder({ label, prompt }: { label: string; prompt: string }) {
  const reset = useMaListeStore((s) => s.reset);
  return (
    <section className="container-site max-w-2xl py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
        {prompt}
      </p>
      <h2 className="mt-4 font-serif text-4xl text-foreground">{label}</h2>
      <p className="mt-4 text-muted-light">À venir dans le prochain prompt.</p>
      <button
        onClick={reset}
        className="mt-8 text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors"
      >
        Reset state (dev)
      </button>
    </section>
  );
}

export default function MaListe() {
  const currentStep = useMaListeStore((s) => s.currentStep);
  const [listCount, setListCount] = useState(0);

  useEffect(() => {
    // Fetch real count from database
    const fetchCount = async () => {
      const { data, error } = await supabase
        .from("user_lists")
        .select("id", { count: "exact", head: true })
        .eq("is_submitted", true);
      
      if (!error && data !== null) {
        const count = Array.isArray(data) ? data.length : 0;
        setListCount(count);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} {...stepFade}>
            {currentStep === "intro" && <IntroScreen totalListsCreated={listCount} />}
            {currentStep === "formation" && <FormationPicker />}
            {/* Builder unifié : remplace les 3 anciennes étapes (lineup / bench / captain) */}
            {(currentStep === "lineup" ||
              currentStep === "bench" ||
              currentStep === "captain") && <BuilderUnified />}
            {currentStep === "recap" && <ListRecap />}
            {currentStep === "share" && <ListRecap />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
