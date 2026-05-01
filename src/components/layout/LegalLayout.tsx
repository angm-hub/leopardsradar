import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

/**
 * Shared layout for legal pages (mentions, confidentialité, CGU).
 * Sober editorial layout, max-w-2xl, focus on readability.
 */
export function LegalLayout({ title, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container-site pt-32 pb-24">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-12"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>

          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
            {title}
          </h1>

          <p className="mt-4 text-sm text-muted-light">
            Dernière mise à jour : {updatedAt}
          </p>

          <div className="mt-12 prose-legal text-foreground/85 leading-relaxed">
            {children}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LegalLayout;
