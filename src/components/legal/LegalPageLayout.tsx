import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const LAST_UPDATE = "1 mai 2026";

interface Props {
  title: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-32 pb-20">
        <div className="container-site">
          <div className="max-w-2xl mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-10"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l'accueil
            </Link>
            <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
              {title}
            </h1>
            <div className="mt-10 flex flex-col gap-8 text-base leading-relaxed text-foreground/80 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_h2]:mt-4 [&_h2]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_a]:text-primary [&_a:hover]:underline">
              {children}
            </div>
            <p className="mt-16 text-sm text-muted">
              Dernière mise à jour : {LAST_UPDATE}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default LegalPageLayout;
