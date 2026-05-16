/**
 * Ma Liste v2 — format "convocation officielle des 26".
 *
 * Refonte 2026-05-16 : abandonne le format pitch FUT, puis abandonne le
 * découpage Titulaires/Remplaçants au profit du séquencé par poste (GK/DEF/
 * MID/ATT) façon annonce officielle Desabre. 2 colonnes :
 *  - 65% gauche : 4 sections par poste avec quotas indicatifs
 *  - 35% droite : Library (search + scroll, sticky)
 *
 * Anti-friction radical : ajouter joueur = 1 clic, status T/R toggle = 1 clic,
 * capitaine = 1 clic. Auto-save URL hash + localStorage. Mode remix v1.
 */
import { useState, useEffect, useMemo } from "react";
import { useMaListeV2Store, MAX_STARTERS, MAX_BENCH } from "@/store/maListeV2Store";
import { usePlayers } from "@/hooks/usePlayers";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { TopBar } from "@/components/ma-liste/v2/TopBar";
import { Library } from "@/components/ma-liste/v2/Library";
import { PositionSection } from "@/components/ma-liste/v2/PositionSection";
import { StickyShareCTA } from "@/components/ma-liste/v2/StickyShareCTA";
import { ShareModalV2 } from "@/components/ma-liste/v2/ShareModalV2";
import { StrongGradient } from "@/components/ui/GradientBackgrounds";
import type { DBPlayer, DBPosition } from "@/types/dbPlayer";

// Quotas indicatifs convocation FIFA des 26 (3 GK + 9 DEF + 8 MID + 6 ATT).
// min = seuil de sécurité, ideal = cible standard, max = plafond raisonnable.
const POSITION_CONFIG: {
  position: DBPosition;
  label: string;
  shortLabel: string;
  quota: { min: number; ideal: number; max: number };
  emptyHint: string;
}[] = [
  {
    position: "Goalkeeper",
    label: "Gardiens",
    shortLabel: "GK",
    quota: { min: 2, ideal: 3, max: 3 },
    emptyHint: "3 gardiens dans une convocation officielle.",
  },
  {
    position: "Defender",
    label: "Défenseurs",
    shortLabel: "DEF",
    quota: { min: 7, ideal: 9, max: 10 },
    emptyHint: "Latéraux, centraux, polyvalents. Vise 9.",
  },
  {
    position: "Midfield",
    label: "Milieux",
    shortLabel: "MID",
    quota: { min: 6, ideal: 8, max: 9 },
    emptyHint: "Récupérateurs, relayeurs, créateurs. Vise 8.",
  },
  {
    position: "Attack",
    label: "Attaquants",
    shortLabel: "ATT",
    quota: { min: 5, ideal: 6, max: 7 },
    emptyHint: "Ailiers et avant-centres. Vise 6.",
  },
];

export default function MaListeV2() {
  useDocumentMeta({
    title: "Ma Liste — Léopards Radar",
    description:
      "Ta convocation des 26 pour les Léopards au Mondial 2026. 11 titulaires, 15 remplaçants, 1 capitaine.",
  });

  const { players: allPlayers, loading } = usePlayers({
    categories: ["roster", "radar"],
    excludeEligibilityStatus: "ineligible",
    limit: 1000,
    publicVisibilityOnly: true,
  });

  const starters = useMaListeV2Store((s) => s.starters);
  const bench = useMaListeV2Store((s) => s.bench);
  const captain = useMaListeV2Store((s) => s.captain);
  const addToStarters = useMaListeV2Store((s) => s.addToStarters);
  const addToBench = useMaListeV2Store((s) => s.addToBench);
  const removePlayer = useMaListeV2Store((s) => s.removePlayer);
  const toggleStatus = useMaListeV2Store((s) => s.toggleStatus);
  const setCaptain = useMaListeV2Store((s) => s.setCaptain);
  const hydrateFromUrl = useMaListeV2Store((s) => s.hydrateFromUrl);

  const [shareOpen, setShareOpen] = useState(false);
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false);

  // Hydrate from URL hash au premier load
  useEffect(() => {
    if (!loading && allPlayers.length > 0) hydrateFromUrl(allPlayers);
  }, [loading, allPlayers, hydrateFromUrl]);

  // Pick : si titulaires pas plein → starters, sinon bench
  const handlePick = (player: DBPlayer) => {
    if (starters.length < MAX_STARTERS) {
      addToStarters(player);
    } else if (bench.length < MAX_BENCH) {
      addToBench(player);
    }
    setMobileLibraryOpen(false);
  };

  // Regroupement par poste : on combine starters + bench, on indexe par
  // position. L'ordre d'insertion est conservé pour la stabilité visuelle.
  const playersByPosition = useMemo(() => {
    const all = [...starters, ...bench];
    const groups: Record<DBPosition, DBPlayer[]> = {
      Goalkeeper: [],
      Defender: [],
      Midfield: [],
      Attack: [],
    };
    for (const p of all) {
      if (p.position) groups[p.position].push(p);
    }
    return groups;
  }, [starters, bench]);

  const starterSlugs = useMemo(
    () => new Set(starters.map((p) => p.slug)),
    [starters],
  );
  const isStarter = (slug: string) => starterSlugs.has(slug);

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Atmosphere */}
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
      {/* Grain subliminale */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.022] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1">
          <div className="mx-auto max-w-[1320px] px-4 md:px-8 lg:px-12 py-10 md:py-16">
            {/* Header éditorial */}
            <header className="mb-10 md:mb-14 max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-12 bg-primary" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary/85 font-semibold">
                  Convocation · Mondial 2026
                </span>
              </div>
              <h1
                className="font-display text-foreground"
                style={{
                  fontSize: "clamp(2.5rem, 6.5vw, 4.5rem)",
                  fontWeight: 200,
                  lineHeight: 0.94,
                  letterSpacing: "-0.04em",
                }}
              >
                Tes 26<br />
                <span className="italic font-light text-foreground/70">pour les Léopards.</span>
              </h1>
              <p className="mt-6 font-sans text-[15px] text-foreground/55 leading-relaxed max-w-xl">
                Pioche par poste. Bascule T/R d'un clic. Désigne ton capitaine.{" "}
                <span className="text-foreground/35">
                  Sauvegarde automatique.
                </span>
              </p>
            </header>

            {/* Layout 2 cols asymétrique 65/35 */}
            <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
              {/* Gauche : 4 sections par poste */}
              <div className="space-y-10 min-w-0">
                {POSITION_CONFIG.map((cfg) => (
                  <PositionSection
                    key={cfg.position}
                    label={cfg.label}
                    shortLabel={cfg.shortLabel}
                    position={cfg.position}
                    quota={cfg.quota}
                    players={playersByPosition[cfg.position]}
                    isStarter={isStarter}
                    captain={captain}
                    emptyHint={cfg.emptyHint}
                    onToggleStatus={toggleStatus}
                    onSetCaptain={setCaptain}
                    onRemove={removePlayer}
                  />
                ))}
              </div>

              {/* Droite : Library */}
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
                  activeSlot={null}
                  onPickForSlot={handlePick}
                  onPickForBench={handlePick}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              </aside>
            </div>

            {/* Mobile toggle library */}
            <button
              type="button"
              onClick={() => setMobileLibraryOpen((v) => !v)}
              className="lg:hidden fixed bottom-24 right-4 z-20 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_rgba(245,197,24,0.6)] flex items-center justify-center text-xl font-bold"
              aria-label={mobileLibraryOpen ? "Fermer la pioche" : "Ouvrir la pioche"}
            >
              {mobileLibraryOpen ? "×" : "+"}
            </button>
          </div>
        </main>

        <StickyShareCTA onShare={() => setShareOpen(true)} />
      </div>

      <ShareModalV2 open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
