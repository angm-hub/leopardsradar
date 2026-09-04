/**
 * Ma Liste v2 — squad-builder gamifié (terrain FUT + HUD live).
 *
 * Refonte 2026-08-12 : abandonne les 4 listes par poste au profit d'un
 * terrain 4-3-3 (ton XI placé sur la pelouse) surmonté d'un HUD vivant
 * (note du XI, complétion 26/26, valeur cumulée, alchimie, capitaine,
 * célébration). La pioche (Library) reste à droite ; cliquer un slot vide
 * la focalise sur le poste. Store inchangé (starters/bench/captain), donc
 * partage et ShareCard continuent de marcher.
 */
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MotionConfig } from "framer-motion";
import { useMaListeV2Store, MAX_STARTERS, MAX_BENCH } from "@/store/maListeV2Store";
import { usePlayers } from "@/hooks/usePlayers";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { TopBar } from "@/components/ma-liste/v2/TopBar";
import { Library } from "@/components/ma-liste/v2/Library";
import { StickyShareCTA } from "@/components/ma-liste/v2/StickyShareCTA";
import { ShareModalV2 } from "@/components/ma-liste/v2/ShareModalV2";
import { SquadHUD } from "@/components/ma-liste/v2/SquadHUD";
import { SquadPitch } from "@/components/ma-liste/v2/SquadPitch";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

export default function MaListeV2() {
  useDocumentMeta({
    title: "Ma Liste · Léopards Radar",
    description:
      "Compose ta sélection idéale des Léopards : place ton XI sur le terrain, complète ton banc, désigne ton capitaine.",
  });

  const { players: allPlayers, loading, error } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
    publicVisibilityOnly: true,
  });

  const starters = useMaListeV2Store((s) => s.starters);
  const bench = useMaListeV2Store((s) => s.bench);
  const addToStarters = useMaListeV2Store((s) => s.addToStarters);
  const addToBench = useMaListeV2Store((s) => s.addToBench);
  const hydrateFromUrl = useMaListeV2Store((s) => s.hydrateFromUrl);

  const [shareOpen, setShareOpen] = useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);
  const [focusPosition, setFocusPosition] = useState<DBPosition | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  // Glisser-déposer (desktop, HTML5 natif) : joueur en cours de drag depuis
  // la pioche. Mobile reste au tap (naturel dans la bottom sheet).
  const [draggingPlayer, setDraggingPlayer] = useState<DBPlayer | null>(null);

  // Résout le joueur déposé : slug du dataTransfer (fiable) puis fallback état.
  const resolveDropped = (e: React.DragEvent): DBPlayer | null => {
    const slug = e.dataTransfer.getData("text/plain");
    return allPlayers.find((p) => p.slug === slug) ?? draggingPlayer;
  };
  const handleDropStarter = (e: React.DragEvent) => {
    const p = resolveDropped(e);
    if (p) addToStarters(p);
    setDraggingPlayer(null);
  };
  const handleDropBench = (e: React.DragEvent) => {
    const p = resolveDropped(e);
    if (p) addToBench(p);
    setDraggingPlayer(null);
  };

  // Hydrate depuis l'URL hash au premier load
  useEffect(() => {
    if (!loading && allPlayers.length > 0) hydrateFromUrl(allPlayers);
  }, [loading, allPlayers, hydrateFromUrl]);

  // Pick : titulaire si le XI n'est pas plein, sinon banc.
  const handlePick = (player: DBPlayer) => {
    if (starters.length < MAX_STARTERS) addToStarters(player);
    else if (bench.length < MAX_BENCH) addToBench(player);
    setMobileLibraryOpen(false);
  };

  // Slot vide cliqué → focalise la pioche sur ce poste (+ ouvre la sheet mobile).
  const handlePickPosition = (bucket: DBPosition) => {
    setFocusPosition(bucket);
    setFocusKey((k) => k + 1);
    setMobileLibraryOpen(true);
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
        {/* Atmosphère */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-50">
          <StrongGradient position="top" intensity={0.5} />
        </div>
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-1/2"
          style={{
            background:
              "radial-gradient(ellipse 90% 60% at 50% 100%, rgba(37,99,184,0.16) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.022] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 flex min-h-screen flex-col">
          <TopBar />

          <main className="flex-1">
            <div className="mx-auto max-w-[1320px] px-4 py-8 md:px-8 md:py-12 lg:px-12">
              {/* Header éditorial */}
              <header className="mb-8 max-w-3xl md:mb-10">
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-px w-12 bg-primary" />
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/85">
                    Ta sélection idéale
                  </span>
                </div>
                <h1
                  className="font-display text-foreground"
                  style={{
                    fontSize: "clamp(2.25rem, 6vw, 4rem)",
                    fontWeight: 200,
                    lineHeight: 0.94,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Ta sélection<br />
                  <span className="italic font-light text-foreground/70">
                    des Léopards.
                  </span>
                </h1>
                <p className="mt-5 max-w-xl font-sans text-[15px] leading-relaxed text-foreground/55">
                  Place ton XI sur le terrain, complète ton banc, désigne ton
                  capitaine.{" "}
                  <span className="text-foreground/35">Sauvegarde auto.</span>
                </p>
              </header>

              {/* Layout : terrain + HUD (gauche) · pioche (droite) */}
              <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
                <div className="min-w-0 space-y-6">
                  <SquadHUD />
                  <SquadPitch
                    onPickPosition={handlePickPosition}
                    isDragging={!!draggingPlayer}
                    onDropStarter={handleDropStarter}
                    onDropBench={handleDropBench}
                  />
                </div>

                <aside
                  className={
                    "lg:sticky lg:top-24 lg:h-[calc(100vh-11rem)] " +
                    (mobileLibraryOpen
                      ? "fixed inset-x-0 bottom-0 z-30 h-[80vh] lg:static"
                      : "hidden lg:block")
                  }
                >
                  <Library
                    allPlayers={allPlayers}
                    loading={loading}
                    error={error}
                    activeSlot={null}
                    onPickForSlot={handlePick}
                    onPickForBench={handlePick}
                    focusPosition={focusPosition}
                    focusKey={focusKey}
                    onDragStart={(p) => setDraggingPlayer(p)}
                    onDragEnd={() => setDraggingPlayer(null)}
                  />
                </aside>
              </div>

              {/* Toggle pioche mobile — via portal (un ancêtre motion porte un
                  transform qui transformerait le fixed en absolute). */}
              {createPortal(
                <button
                  type="button"
                  onClick={() => setMobileLibraryOpen((v) => !v)}
                  className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(245,197,24,0.6)] lg:hidden"
                  aria-label={mobileLibraryOpen ? "Fermer la pioche" : "Ouvrir la pioche"}
                >
                  {mobileLibraryOpen ? "×" : "+"}
                </button>,
                document.body,
              )}
            </div>
          </main>

          <StickyShareCTA onShare={() => setShareOpen(true)} />
        </div>

        <ShareModalV2 open={shareOpen} onClose={() => setShareOpen(false)} />
      </div>
    </MotionConfig>
  );
}
