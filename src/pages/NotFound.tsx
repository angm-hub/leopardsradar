import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: route inconnue", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container-site flex items-center justify-center pt-32 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">
            Erreur · 404
          </p>
          <h1 className="mt-4 font-serif text-5xl md:text-6xl font-semibold text-foreground tracking-tight text-balance">
            404 — cette page a quitté le Roster.
          </h1>
          <p className="mt-6 text-lg text-muted-light leading-relaxed max-w-xl mx-auto">
            La page que tu cherches n'existe pas ou a été déplacée.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/">
              <Button variant="primary" size="md">
                Retour à l'accueil
              </Button>
            </Link>
            <Link to="/roster">
              <Button variant="outline" size="md">
                Voir le Roster
              </Button>
            </Link>
          </div>

          {location.pathname ? (
            <p className="mt-10 font-mono text-xs text-muted/70">
              Route demandée : <span className="text-muted">{location.pathname}</span>
            </p>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
