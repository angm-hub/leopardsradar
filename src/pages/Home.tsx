import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeopardsHero from "@/components/home/LeopardsHero";
import RosterPreviewSection from "@/components/home/RosterPreviewSection";
import RadarPreviewSection from "@/components/home/RadarPreviewSection";
import StatsSection from "@/components/home/StatsSection";
import ClubsMarqueeSection from "@/components/home/ClubsMarqueeSection";
import BestXIPreviewSection from "@/components/home/BestXIPreviewSection";
import NewsletterSection from "@/components/home/NewsletterSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LeopardsHero />
        <RosterPreviewSection />
        <RadarPreviewSection />
        <StatsSection />
        <ClubsMarqueeSection />
        <BestXIPreviewSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
