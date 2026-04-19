import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeopardsHero from "@/components/home/LeopardsHero";
import RosterPreviewSection from "@/components/home/RosterPreviewSection";

const Home = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <LeopardsHero />
        <RosterPreviewSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
