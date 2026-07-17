import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { PlayerEligibilityQuote, buildPlayerEligibilityLine } from "@/components/player/PlayerWhySection";
import { PlayerEligibilityBlock } from "@/components/player/PlayerEligibilityBlock";
import { PlayerCareerTimeline } from "@/components/player/PlayerCareerTimeline";
import { PlayerPressMentions } from "@/components/player/PlayerPressMentions";
import { PRESSE_PUBLIEE } from "@/config/editorial";
import { RelatedPlayers } from "@/components/player/RelatedPlayers";
import { PlayerHeaderDense } from "@/components/player/PlayerHeaderDense";
import { PlayerTabsV2 } from "@/components/player/PlayerTabsV2";
import { AttributeProfile15 } from "@/components/player/AttributeProfile15";
import { KeyInsights } from "@/components/player/KeyInsights";
import { TopStrengths } from "@/components/player/TopStrengths";
import { PlayerDetailedStats } from "@/components/player/PlayerDetailedStats";
import { usePlayer } from "@/hooks/usePlayer";
import { usePlayerAttributes } from "@/hooks/usePlayerAttributes";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { cn } from "@/lib/utils";
import { PlayerGradeBars } from "@/components/player/PlayerGradeBars";
import {
  POSITION_LABEL,
  formatMarketValue,
} from "@/lib/playerHelpers";
import type { PlayerTab } from "@/components/player/PlayerTabsV2";

// ─────────────────────────────────────────────────────────────────────────────
// Not Found
// ─────────────────────────────────────────────────────────────────────────────

function NotFound() {
  useDocumentMeta({
    title: "Joueur introuvable",
    description:
      "Ce profil n'existe pas dans Léopards Radar. Parcourez le Roster ou le Radar pour trouver un joueur.",
    noindex: true,
  });
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-site flex min-h-[70vh] flex-col items-center justify-center py-32 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-4">
          404 · Profil introuvable
        </p>
        <h1 className="text-5xl font-semibold text-foreground" style={{ letterSpacing: "-0.03em" }}>
          Joueur introuvable.
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Ce profil n'existe pas (encore) dans notre radar. Si tu cherchais un
          binational récemment dévoilé, on l'ajoute peut-être bientôt.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/roster"
            className="inline-flex items-center gap-2 rounded-md bg-card border border-border px-5 py-2.5 text-sm text-foreground hover:bg-card-hover transition-colors"
          >
            Parcourir le Roster
          </Link>
          <Link
            to="/radar"
            className="inline-flex items-center gap-2 rounded-md bg-card border border-border px-5 py-2.5 text-sm text-foreground hover:bg-card-hover transition-colors"
          >
            Explorer le Radar
          </Link>
          <a
            href="mailto:alexandre@withkaira.com?subject=Joueur à ajouter"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-background hover:bg-primary-hover transition-colors"
          >
            Proposer un joueur
          </a>
        </div>
        <Link to="/" className="mt-12 inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </Link>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function PlayerSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Header skeleton */}
        <div className="border-b border-border bg-background pt-28 pb-8">
          <div className="container-site">
            <div className="flex gap-6">
              <div className="h-28 w-28 rounded-card bg-card animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-3 w-32 rounded bg-card animate-pulse" />
                <div className="h-8 w-64 rounded bg-card animate-pulse" />
                <div className="h-4 w-48 rounded bg-card animate-pulse" />
              </div>
            </div>
            <div className="mt-6 h-20 rounded-card bg-card animate-pulse" />
          </div>
        </div>
        {/* Tabs skeleton */}
        <div className="border-b border-border bg-background/95 h-12" />
        {/* Content skeleton */}
        <div className="container-site py-12 space-y-6">
          <div className="h-48 rounded-card bg-card animate-pulse" />
          <div className="h-32 rounded-card bg-card animate-pulse" />
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function PlayerPage() {
  const { slug } = useParams<{ slug: string }>();
  const { player, bases, selections, loading } = usePlayer(slug);
  const [activeTab, setActiveTab] = useState<PlayerTab>("overview");

  // Attributs 15 axes — fetché en parallèle du player
  const {
    profile: attrProfile,
    insights: attrInsights,
    strengths: attrStrengths,
    rawStats: advancedStats,
    loading: attrLoading,
  } = usePlayerAttributes(player?.id, player?.position);

  // Meta document
  useDocumentMeta(
    player
      ? {
          title: player.name,
          description: buildPlayerMetaDescription(player),
          image: player.image_url ?? undefined,
        }
      : { title: "Profil joueur" },
  );

  if (loading) return <PlayerSkeleton />;
  if (!player) return <NotFound />;

  // "Page cimetière" detector
  const identityEmptyCount = [
    player.date_of_birth,
    player.place_of_birth,
    player.foot,
    player.height_cm,
    player.current_club,
  ].filter((v) => !v).length;
  const seasonEmpty =
    !player.season_games &&
    !player.season_goals &&
    !player.season_assists &&
    !player.season_minutes &&
    !player.season_rating;
  const isProfileSparse = identityEmptyCount >= 4 && seasonEmpty;

  const hasAdvancedStats = !attrLoading && advancedStats.length > 0;
  const hasAttrProfile = attrProfile !== null && !attrLoading;

  const positionLabel = player.position ? POSITION_LABEL[player.position] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HEADER DENSE ── */}
      <PlayerHeaderDense player={player} />

      {/* ── TABS NAV ── */}
      <PlayerTabsV2
        active={activeTab}
        onSelect={setActiveTab}
        showDetailed={hasAdvancedStats}
      />

      <main id="player-content">

        {/* ════════════════════════════════════════════════════════
            TAB OVERVIEW
        ════════════════════════════════════════════════════════ */}
        <div
          id="panel-overview"
          role="tabpanel"
          aria-labelledby="tab-overview"
          className={cn(activeTab !== "overview" && "hidden")}
        >
          {/* Éditorial — Pourquoi il est sur le radar */}
          <section className="container-site py-10 border-b border-border/40">
            <PlayerEligibilityQuote
              variant="full"
              className="max-w-3xl"
              text={buildPlayerEligibilityLine({
                eligibilityNote: player.eligibility_note,
                eligibilityStatus: player.eligibility_status,
                category: player.player_category,
                capsRdc: player.caps_rdc,
              })}
            />
          </section>

          {/* ── Radar de potentiel (gradebars percentiles) ──
              Toujours affiché, y compris pour les profils creux : les axes
              niveau de jeu + ancrage Léopards couvrent tout le pool. C'est
              la signature data de la fiche (F2 de la thèse produit). */}
          <section className="container-site py-10 border-b border-border/40">
            <div className="max-w-3xl">
              <PlayerGradeBars slug={player.slug} />
            </div>
          </section>

          {/* ── Attribut Profile 15 + Insights + Strengths ── */}
          {isProfileSparse ? (
            <SparseProfileBanner player={player} />
          ) : (
            <section className="container-site py-10 border-b border-border/40">
              {attrLoading ? (
                /* Hauteur proche du contenu final (profil 15 + sidebar) :
                   sans ca, la section pousse la page de ~500px au chargement
                   (CLS 0.235 mesure au Lighthouse mobile du 16/07/2026). */
                <div className="space-y-4">
                  <div className="h-4 w-36 bg-card animate-pulse rounded" />
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
                    <div className="h-[430px] bg-card animate-pulse rounded-card" />
                    <div className="hidden lg:block h-[320px] bg-card animate-pulse rounded-card" />
                  </div>
                </div>
              ) : hasAttrProfile ? (
                <div className="space-y-6">
                  {/* Titre section */}
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-lg font-semibold text-foreground" style={{ letterSpacing: "-0.02em" }}>
                      Profil d'attributs
                    </h2>
                    {positionLabel && (
                      <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted">
                        {positionLabel}
                      </span>
                    )}
                  </div>

                  {/* Attributs + sidebar Insights/Strengths */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
                    {/* Profil 15 */}
                    <AttributeProfile15 profile={attrProfile!} />

                    {/* Sidebar droite */}
                    <div className="space-y-4">
                      <KeyInsights insights={attrInsights} />
                      <TopStrengths
                        strengths={attrStrengths}
                        position={positionLabel}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Pas de stats avancées — fallback notice */
                <NoAdvancedDataNotice />
              )}
            </section>
          )}

          {/* ── Carrière ── */}
          <PlayerCareerTimeline playerId={player.id} />

          {/* ── Plus de Léopards ── */}
          <RelatedPlayers
            position={player.position}
            excludeSlug={player.slug}
          />
        </div>

        {/* ════════════════════════════════════════════════════════
            TAB DETAILED STATS
        ════════════════════════════════════════════════════════ */}
        {hasAdvancedStats && (
          <div
            id="panel-detailed"
            role="tabpanel"
            aria-labelledby="tab-detailed"
            className={cn(activeTab !== "detailed" && "hidden")}
          >
            <section className="container-site py-10">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground mb-1" style={{ letterSpacing: "-0.02em" }}>
                  Statistiques avancées
                </h2>
                <p className="text-sm text-muted-light">
                  Toutes saisons et compétitions · source FBref / scraper Léopards Radar.
                </p>
              </div>
              <PlayerDetailedStats
                stats={advancedStats}
                loading={attrLoading}
              />
            </section>

            {/* Presse dans ce tab aussi */}
            <div className="scroll-mt-24">
              {PRESSE_PUBLIEE && <PlayerPressMentions playerId={player.id} />}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            TAB FIFA · Statut éligibilité
        ════════════════════════════════════════════════════════ */}
        <div
          id="panel-fifa"
          role="tabpanel"
          aria-labelledby="tab-fifa"
          className={cn(activeTab !== "fifa" && "hidden")}
        >
          <PlayerEligibilityBlock
            player={player}
            bases={bases}
            selections={selections}
          />

          {/* Presse dans ce tab si pas de tab detailed */}
          {!hasAdvancedStats && (
            <div className="scroll-mt-24">
              {PRESSE_PUBLIEE && <PlayerPressMentions playerId={player.id} />}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SparseProfileBanner({ player }: { player: import("@/types/dbPlayer").DBPlayer }) {
  return (
    <section className="container-site py-10 border-b border-border/40">
      <div className="rounded-card border border-dashed border-border bg-card/40 p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">
          Profil en cours d'enrichissement
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4" style={{ letterSpacing: "-0.02em" }}>
          {player.name} vient d'entrer dans notre radar.
        </h2>
        <p className="text-muted-light leading-relaxed max-w-2xl text-sm">
          Détecté via la chaîne d'enrichissement (Wikidata, sélections jeunes
          EU, patronymes bantous). Date de naissance, club, taille et statistiques
          saison sont en cours de collecte · mise à jour chaque dimanche.
        </p>
        <p className="text-muted text-xs mt-6">
          L'angle éditorial · base juridique RDC, fenêtre de switch FIFA, procédure
          FECOFA · est disponible dans l'onglet "Statut FIFA".
        </p>
        <div className="mt-6">
          <a
            href={`mailto:alexandre@withkaira.com?subject=Compléter le profil de ${encodeURIComponent(player.name)}`}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm text-foreground hover:bg-card-hover transition-colors"
          >
            Proposer une source pour ce profil
          </a>
        </div>
      </div>
    </section>
  );
}

function NoAdvancedDataNotice() {
  return (
    <div className="rounded-card border border-dashed border-border bg-card/30 p-8 text-center">
      <p className="text-sm text-muted-light mb-2">
        Statistiques avancées non encore disponibles pour ce profil.
      </p>
      <p className="text-xs text-muted max-w-md mx-auto">
        Les attributs (Finishing, Dribbling, Aerial...) nécessitent les données
        FBref via notre pipeline auto. Les joueurs des 15 championnats couverts
        sont enrichis en priorité.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Meta description builder
// ─────────────────────────────────────────────────────────────────────────────

function buildPlayerMetaDescription(p: import("@/types/dbPlayer").DBPlayer): string {
  const bits: string[] = [];
  if (p.position) bits.push(POSITION_LABEL[p.position]);
  if (p.current_club) bits.push(p.current_club);
  if (p.caps_rdc > 0) bits.push(`${p.caps_rdc} cap${p.caps_rdc > 1 ? "s" : ""} RDC`);
  if (p.market_value_eur && p.market_value_eur > 0) bits.push(formatMarketValue(p.market_value_eur));
  return bits.length > 0 ? bits.join(" · ") : `Profil ${p.name} sur Léopards Radar`;
}
