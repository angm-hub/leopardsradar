/**
 * Ma Liste v2 — page racine, 1 seul écran.
 *
 * Refonte anti-friction selon docs/DESIGN_MA_LISTE_V2.md :
 * - Plus de wizard 5 étapes : 1 page builder
 * - URL hash sync pour mode remix
 * - Auto-save localStorage (Zustand persist)
 * - Library toujours visible (pas de drawer modal)
 * - DA Cinematic Dark + neo-editorial
 *
 * Route : /ma-liste-v2 (route temporaire avant remplacement de /ma-liste).
 */
import { useState, useEffect } from "react";
import { useMaListeV2Store } from "@/store/maListeV2Store";
import { usePlayers } from "@/hooks/usePlayers";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { TopBar } from "@/components/ma-liste/v2/TopBar";
import { Pitch } from "@/components/ma-liste/v2/Pitch";
import { Library } from "@/components/ma-liste/v2/Library";
import { BenchStrip } from "@/components/ma-liste/v2/BenchStrip";
import { StickyShareCTA } from "@/components/ma-liste/v2/StickyShareCTA";
import { ShareModalV2 } from "@/components/ma-liste/v2/ShareModalV2";
import { ToastUndo } from "@/components/ma-liste/v2/ToastUndo";
import type { DBPlayer } from "@/types/dbPlayer";
import type { SlotPosition } from "@/types/maListe";

export default function MaListeV2() {
  useDocumentMeta({
    title: "Ma Liste — Léopards Radar",
    description:
      "Ton sélectionneur intérieur. 11 titulaires, 15 remplaçants, 1 capitaine. Posée en 60 secondes.",
  });

  const { players: allPlayers, loading } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
    publicVisibilityOnly: true,
  });

  const placePlayerInSlot = useMaListeV2Store((s) => s.placePlayerInSlot);
  const addToBench = useMaListeV2Store((s) => s.addToBench);
  const hydrateFromUrl = useMaListeV2Store((s) => s.hydrateFromUrl);

  const [activeSlot, setActiveSlot] = useState<SlotPosition | null>(null);
  const [dragPlayer, setDragPlayer] = useState<DBPlayer | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);

  // Hydrate from URL hash au premier load avec les players dispos
  useEffect(() => {
    if (!loading && allPlayers.length > 0) {
      hydrateFromUrl(allPlayers);
    }
  }, [loading, allPlayers, hydrateFromUrl]);

  const handlePickForSlot = (player: DBPlayer) => {
    if (!activeSlot) return;
    placePlayerInSlot(activeSlot, player);
    setActiveSlot(null);
    setMobileLibraryOpen(false);
  };

  const handleDropOnSlot = (slot: SlotPosition) => {
    if (!dragPlayer) return;
    placePlayerInSlot(slot, dragPlayer);
    setDragPlayer(null);
    setActiveSlot(null);
  };

  const handleDropOnBench = () => {
    if (!dragPlayer) return;
    addToBench(dragPlayer);
    setDragPlayer(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TopBar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] px-4 md:px-6 py-6 md:py-8">
          {/* Headline */}
          <header className="mb-6 md:mb-8 max-w-xl">
            <h1
              className="font-v2 italic text-foreground"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.25rem)",
                fontWeight: 300,
                lineHeight: 0.95,
                letterSpacing: "-0.03em",
              }}
            >
              Ton sélectionneur intérieur.
            </h1>
            <p className="mt-3 font-v2-mono text-[11px] uppercase tracking-[0.1em] text-foreground/50">
              11 titulaires · 15 remplaçants · 1 capitaine
            </p>
          </header>

          {/* Layout : pitch + library */}
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-6">
            {/* Center : pitch + bench */}
            <div className="lg:col-span-7 space-y-4">
              <Pitch
                activeSlot={activeSlot}
                onActivateSlot={setActiveSlot}
                dragPlayer={dragPlayer}
                onDropOnSlot={handleDropOnSlot}
              />
              <BenchStrip dragPlayer={dragPlayer} onDropOnBench={handleDropOnBench} />
            </div>

            {/* Right : library — sticky desktop, bottom sheet mobile */}
            <aside
              className={
                "lg:col-span-5 lg:sticky lg:top-20 lg:h-[calc(100vh-9rem)] " +
                (mobileLibraryOpen
                  ? "fixed inset-x-0 bottom-0 z-30 h-[80vh] border-t border-border bg-card shadow-2xl lg:static lg:shadow-none lg:border-0"
                  : "hidden lg:block")
              }
            >
              <Library
                allPlayers={allPlayers}
                activeSlot={activeSlot}
                onPickForSlot={handlePickForSlot}
                onPickForBench={(p) => {
                  addToBench(p);
                  setMobileLibraryOpen(false);
                }}
                onDragStart={setDragPlayer}
                onDragEnd={() => setDragPlayer(null)}
              />
            </aside>
          </div>

          {/* Mobile toggle library button */}
          <button
            type="button"
            onClick={() => setMobileLibraryOpen((v) => !v)}
            className="lg:hidden fixed bottom-20 right-4 z-20 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center font-v2-mono text-xs font-bold"
            aria-label="Ouvrir la pioche"
          >
            {mobileLibraryOpen ? "✕" : "+"}
          </button>
        </div>
      </main>

      <StickyShareCTA onShare={() => setShareOpen(true)} />

      <ShareModalV2 open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* Toast undo : à brancher quand on aura le pattern de remove qui empile */}
      <ToastUndo
        open={false}
        message=""
        onUndo={() => {}}
        onDismiss={() => {}}
      />
    </div>
  );
}
