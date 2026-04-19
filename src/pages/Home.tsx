import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeopardsHero from "@/components/home/LeopardsHero";
import RosterPreviewSection from "@/components/home/RosterPreviewSection";
import RadarPreviewSection from "@/components/home/RadarPreviewSection";
import StatsSection from "@/components/home/StatsSection";
import ClubsMarqueeSection from "@/components/home/ClubsMarqueeSection";
import BestXIPreviewSection from "@/components/home/BestXIPreviewSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import EditorialSeparator from "@/components/home/EditorialSeparator";

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LeopardsHero />
        <RosterPreviewSection />
        <EditorialSeparator
          variant="bignumber"
          content="52"
          context="ans depuis la dernière Coupe du monde des Léopards."
        />
        <RadarPreviewSection />
        <StatsSection />
        <EditorialSeparator
          variant="quote"
          content="« Quand je porte le maillot des Léopards, c'est l'histoire de ma famille qui joue. »"
          author="Un joueur de la diaspora"
          context="Propos recueillis, 2024"
        />
        <ClubsMarqueeSection />
        <BestXIPreviewSection />
        <EditorialSeparator
          variant="headline"
          content="Demain se regarde aujourd'hui."
        />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
