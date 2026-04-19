import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home.tsx";
import Roster from "./pages/Roster.tsx";
import Player from "./pages/Player.tsx";
import Radar from "./pages/Radar.tsx";
import BestXI from "./pages/BestXI.tsx";
import About from "./pages/About.tsx";
import Newsletter from "./pages/Newsletter.tsx";
import NewsletterConfirm from "./pages/NewsletterConfirm.tsx";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe.tsx";
import Auth from "./pages/Auth.tsx";
import AdminPhotos from "./pages/AdminPhotos.tsx";
import MaListe from "./pages/MaListe.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roster" element={<Roster />} />
          <Route path="/player/:slug" element={<Player />} />
          <Route path="/radar" element={<Radar />} />
          <Route path="/best-xi" element={<BestXI />} />
          <Route path="/about" element={<About />} />
          <Route path="/newsletter" element={<Newsletter />} />
          <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
          <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin/photos" element={<AdminPhotos />} />
          <Route path="/ma-liste" element={<MaListe />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
