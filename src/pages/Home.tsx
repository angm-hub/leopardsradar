import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeopardsHero from "@/components/home/LeopardsHero";
import RadarPreviewSection from "@/components/home/RadarPreviewSection";
import StatsSection from "@/components/home/StatsSection";
import ClubsMarqueeSection from "@/components/home/ClubsMarqueeSection";
import BestXIPreviewSection from "@/components/home/BestXIPreviewSection";
import NewsletterSection from "@/components/home/NewsletterSection";
import EditorialSeparator from "@/components/home/EditorialSeparator";
import { MaListeCTA } from "@/components/home/MaListeCTA";

const Divider = () => (
  <div className="w-12 h-px bg-primary/30 mx-auto" />
);

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LeopardsHero />
        <StatsSection />
        <Divider />
        <MaListeCTA />
        <Divider />
        <EditorialSeparator
          variant="bignumber"
          content="52"
          context="ans depuis la dernière Coupe du monde des Léopards."
        />
        <Divider />
        <RadarPreviewSection />
        <BestXIPreviewSection />
        <div className="mx-auto w-24 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <EditorialSeparator
          variant="quote"
          content="« Le peuple congolais mérite ce bonheur. On a tout donné pour eux. »"
          author="Cédric Bakambu"
          context="Après la qualification pour les demi-finales de la CAN 2023, février 2024"
        />
        <ClubsMarqueeSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
