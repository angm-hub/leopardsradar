import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <section className="container-site min-h-[180vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-serif text-display-xl md:text-display-2xl text-foreground tracking-tight text-balance">
              Léopards Radar
            </h1>
            <p className="mt-6 font-sans text-base md:text-lg text-muted-light">
              Setup ready. Scrolle pour voir la navbar se densifier.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
