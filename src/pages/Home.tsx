import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeopardsHero from "@/components/home/LeopardsHero";
import FeaturedThisWeek from "@/components/home/FeaturedThisWeek";
import RadarPreviewSection from "@/components/home/RadarPreviewSection";
import StatsSection from "@/components/home/StatsSection";
import ClubsMarqueeSection from "@/components/home/ClubsMarqueeSection";
import BestXIPreviewSection from "@/components/home/BestXIPreviewSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import EditorialSeparator from "@/components/home/EditorialSeparator";
import { MaListeCTA } from "@/components/home/MaListeCTA";

/**
 * Home — flux narratif après l'audit.
 *
 * Avant : Hero → Stats → MaListeCTA → 52 → Radar → BestXI → Clubs → Newsletter,
 * séparés par des `<Divider />` 1 px qui ajoutaient du padding sans contenu →
 * grands trous noirs visibles dans le hero/StatsSection screenshot.
 *
 * Après :
 *   1. Hero — promesse + CTA unique + stats live
 *   2. FeaturedThisWeek — 5 visages connus dès la 2e fold (proof immédiate,
 *      résout le leak CRO #2 de l'audit)
 *   3. StatsSection — bento grid valeur cumulée + chiffres
 *   4. EditorialSeparator "52" — punch émotionnel ("ans depuis la dernière Coupe")
 *   5. RadarPreviewSection — preview produit
 *   6. BestXIPreviewSection — autorité éditoriale
 *   7. MaListeCTA — push final avant newsletter
 *   8. ClubsMarqueeSection — preuve de couverture
 *   9. NewsletterSection — capture
 *
 * Les Divider <hr> sont retirés : chaque <section> porte déjà son propre
 * padding `py-16 md:py-20`, en empiler 3 (section + divider + section) faisait
 * gonfler le scroll sans apporter d'information.
 */
const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LeopardsHero />
        <FeaturedThisWeek />
        <StatsSection />
        <EditorialSeparator
          variant="bignumber"
          content="52"
          context="ans depuis la dernière Coupe du monde des Léopards."
        />
        <RadarPreviewSection />
        <BestXIPreviewSection />
        <MaListeCTA />
        <ClubsMarqueeSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
