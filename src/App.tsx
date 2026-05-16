import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home.tsx";
import { PromoBanner } from "./components/layout/PromoBanner";

/**
 * Route-level code splitting.
 *
 * Home is loaded eagerly so the landing page paints without a network
 * round-trip. Every other route is lazy-loaded — Vite emits a separate
 * chunk per page, which gives us proper bundle splitting without
 * breaking React's module load order (the trap that killed P2's
 * manualChunks approach).
 */
const Roster = lazy(() => import("./pages/Roster.tsx"));
const Player = lazy(() => import("./pages/Player.tsx"));
const Radar = lazy(() => import("./pages/Radar.tsx"));
const BestXI = lazy(() => import("./pages/BestXI.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Newsletter = lazy(() => import("./pages/Newsletter.tsx"));
const NewsletterConfirm = lazy(() => import("./pages/NewsletterConfirm.tsx"));
const NewsletterUnsubscribe = lazy(
  () => import("./pages/NewsletterUnsubscribe.tsx"),
);
const Auth = lazy(() => import("./pages/Auth.tsx"));
const AdminPhotos = lazy(() => import("./pages/AdminPhotos.tsx"));
const MaListe = lazy(() => import("./pages/MaListe.tsx"));
const MaListePublic = lazy(() => import("./pages/MaListePublic.tsx"));
const MaListeV2 = lazy(() => import("./pages/MaListeV2.tsx"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales.tsx"));
const Confidentialite = lazy(() => import("./pages/Confidentialite.tsx"));
const Cgu = lazy(() => import("./pages/Cgu.tsx"));
const Histoires = lazy(() => import("./pages/Histoires.tsx"));
const Histoire = lazy(() => import("./pages/Histoire.tsx"));
const Methodologie = lazy(() => import("./pages/Methodologie.tsx"));
const Compare = lazy(() => import("./pages/Compare.tsx"));
const RevueDePresse = lazy(() => import("./pages/RevueDePresse.tsx"));
const Insights = lazy(() => import("./pages/Insights.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

/** Minimal fallback while a route chunk loads — keeps the dark background
 * visible to avoid a white flash. No spinner: chunks are usually already
 * in HTTP cache and the swap is sub-50ms. */
function RouteFallback() {
  return <div className="min-h-screen bg-background" aria-hidden />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        {/* Skip-to-content link — invisible until focused via keyboard
            (Tab on page load). Required for WCAG 2.1 AA. Skips Navbar +
            PromoBanner directly to the page's <main>. We focus the first
            <main> programmatically rather than relying on an id, so every
            page works without per-page changes. */}
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault();
            const main = document.querySelector("main");
            if (main) {
              main.setAttribute("tabindex", "-1");
              (main as HTMLElement).focus();
              main.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Aller au contenu principal
        </a>
        <PromoBanner />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/roster" element={<Roster />} />
            <Route path="/player/:slug" element={<Player />} />
            <Route path="/radar" element={<Radar />} />
            <Route path="/best-xi" element={<BestXI />} />
            <Route path="/revue-de-presse" element={<RevueDePresse />} />
            <Route path="/a-propos" element={<About />} />
            <Route path="/about" element={<About />} />
            <Route path="/newsletter" element={<Newsletter />} />
            <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
            <Route
              path="/newsletter/unsubscribe"
              element={<NewsletterUnsubscribe />}
            />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/photos" element={<AdminPhotos />} />
            <Route path="/ma-liste" element={<MaListeV2 />} />
            <Route path="/ma-liste-v2" element={<MaListeV2 />} />
            <Route path="/ma-liste-v1" element={<MaListe />} />
            <Route path="/ma-liste/:slug" element={<MaListePublic />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="/confidentialite" element={<Confidentialite />} />
            <Route path="/cgu" element={<Cgu />} />
            <Route path="/histoires" element={<Histoires />} />
            <Route path="/histoires/:slug" element={<Histoire />} />
            <Route path="/methodologie" element={<Methodologie />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/insights" element={<Insights />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
