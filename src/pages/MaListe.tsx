import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { useMaListeStore } from "@/store/maListeStore";

export default function MaListe() {
  const currentStep = useMaListeStore((s) => s.currentStep);
  const reset = useMaListeStore((s) => s.reset);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-24">
        <div className="container-site max-w-3xl">
          <p className="text-xs uppercase tracking-[0.25em] text-primary mb-4">
            Nouveau · World Cup 2026
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-semibold leading-tight">
            Ma Liste des 26.
          </h1>
          <p className="mt-4 text-lg text-foreground/70 max-w-xl">
            Composez votre groupe idéal des Léopards pour la Coupe du monde
            2026. Partagez votre vision.
          </p>

          <div className="mt-12 rounded-card border border-border bg-card/40 p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.25em] text-muted">
              Setup state — étape courante
            </p>
            <p className="font-mono text-sm text-foreground">{currentStep}</p>
            <p className="text-sm text-foreground/70">
              Setup prompt 1/5 ✓ — store Zustand persistant, table
              <code className="px-1 text-primary">user_lists</code> et route OK.
            </p>
            <ul className="text-sm text-foreground/60 list-disc list-inside space-y-1">
              <li>Intro + Formation Picker (prompt 2)</li>
              <li>Lineup Builder + Player Drawer (prompt 3)</li>
              <li>Bench + Captain (prompt 4)</li>
              <li>Recap + Share + PNG Export (prompt 5)</li>
            </ul>
            <Button variant="ghost" size="sm" onClick={reset}>
              Reset state (dev)
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
