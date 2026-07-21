import { lazy, Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { RoutePrefetch } from "@/components/util/RoutePrefetch";
import LeopardsHero from "@/components/home/LeopardsHero";
import ProBridge from "@/components/home/ProBridge";
import { PRESSE_PUBLIEE } from "@/config/editorial";

// Sections sous la ligne de flottaison : lazy pour sortir leur poids (et
// celui de leurs hooks/data) du chunk index. Seul le hero reste eager — c'est
// lui qui porte le LCP. Les fallbacks réservent une hauteur approximative
// pour ne créer aucun décalage si l'utilisateur scrolle pendant le chargement.
const PressReviewSection = lazy(() =>
  import("@/components/home/PressReviewSection").then((m) => ({
    default: m.PressReviewSection,
  })),
);
const FeaturedThisWeek = lazy(() => import("@/components/home/FeaturedThisWeek"));
const StatsSection = lazy(() => import("@/components/home/StatsSection"));
const BestXIPreviewSection = lazy(
  () => import("@/components/home/BestXIPreviewSection"),
);
const NewsletterSection = lazy(() => import("@/components/home/NewsletterSection"));
const MaListeCTA = lazy(() =>
  import("@/components/home/MaListeCTA").then((m) => ({ default: m.MaListeCTA })),
);

function SectionFallback({ minH = 480 }: { minH?: number }) {
  return <div style={{ minHeight: minH }} aria-hidden />;
}

/**
 * Home — pivot Revue de presse + landing sévèrement coupée (14 mai 2026).
 *
 * Audit Sprint 1 a tué 3 sections qui ne servaient pas la conversion :
 *   - RadarPreviewSection : doublon intégral avec /radar
 *   - EditorialSeparator "52" : séparateur 480 px sans titre, padding pur
 *   - ClubsMarqueeSection : carousel décoratif sans signal
 *
 * À leur place : PressReviewSection en 2e position (juste après le hero).
 * C'est la nouvelle colonne vertébrale éditoriale — la "raison de revenir
 * tous les jours". Le radar reste hebdo, mais la presse bouge en continu.
 *
 * Flux narratif final (8 sections — DA Cobalt 2026-05-15) :
 *   1. Hero               — promesse + 2 CTA + mini-grid stats
 *   2. Revue de presse    — 5 dernières items curées
 *   3. Featured this week — 5 Léopards en mouvement (visages)
 *   4. Stats              — bento chiffres clés
 *   5. Best XI            — preview de la composition de la semaine
 *   6. Three Symbols      — manifeste sémiotique Radar/Léopard/Okapi (ajouté
 *                           avec la pivot DA Premium v2 ; ancre la marque
 *                           sans casser le flux de conversion)
 *   7. Ma Liste CTA       — push Mondial 2026
 *   8. Newsletter         — capture email
 */
const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <RoutePrefetch />
      <main className="flex-1">
        <LeopardsHero />
        {PRESSE_PUBLIEE && (
          <Suspense fallback={<SectionFallback minH={640} />}>
            <PressReviewSection />
          </Suspense>
        )}
        <Suspense fallback={<SectionFallback />}>
          <FeaturedThisWeek />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <StatsSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <BestXIPreviewSection />
        </Suspense>
        <Suspense fallback={<SectionFallback minH={320} />}>
          <MaListeCTA />
        </Suspense>
        <ProBridge />
        <Suspense fallback={<SectionFallback minH={320} />}>
          <NewsletterSection />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
