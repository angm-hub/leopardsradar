import { AnimatePresence, motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useMaListeStore } from "@/store/maListeStore";
import { IntroScreen } from "@/components/ma-liste/IntroScreen";
import { FormationPicker } from "@/components/ma-liste/FormationPicker";
import { LineupBuilder } from "@/components/ma-liste/LineupBuilder";
import { BenchBuilder } from "@/components/ma-liste/BenchBuilder";
import { CaptainSelector } from "@/components/ma-liste/CaptainSelector";

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} {...stepFade}>
            {currentStep === "intro" && <IntroScreen />}
            {currentStep === "formation" && <FormationPicker />}
            {currentStep === "lineup" && <LineupBuilder />}
            {currentStep === "bench" && <BenchBuilder />}
            {currentStep === "captain" && <CaptainSelector />}
            {currentStep === "recap" && (
              <Placeholder label="Récap" prompt="Prompt 5/5" />
            )}
            {currentStep === "share" && (
              <Placeholder label="Partage" prompt="Prompt 5/5" />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
