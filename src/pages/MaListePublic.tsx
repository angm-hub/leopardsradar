import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/ButtonPrimitive";
import { ShareCard } from "@/components/ma-liste/ShareCard";
import { fetchListBySlug } from "@/lib/maListeApi";
import { supabase } from "@/integrations/supabase/client";
import type { DBPlayer } from "@/types/dbPlayer";
import type { Formation } from "@/types/maListe";
import { formatMarketValue } from "@/lib/playerHelpers";
import { Copy, Check, ArrowLeft } from "lucide-react";

interface XISlot {
  position: string;
  player_slug: string | null;
  player_id: number | null;
}

interface BenchEntry {
  player_slug: string;
  player_id: number;
  position: string;
}

interface UserListRow {
  id: string;
  slug: string;
  pseudo: string | null;
  formation: Formation;
  starting_xi: XISlot[];
  bench: BenchEntry[];
  captain_id: number;
  avg_age: number | null;
  radar_count: number;
  total_market_value_eur: number | null;
  created_at: string;
}

export default function MaListePublic() {
  const { slug } = useParams<{ slug: string }>();
  const [list, setList] = useState<UserListRow | null>(null);
  const [players, setPlayers] = useState<Map<string, DBPlayer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const row = (await fetchListBySlug(slug)) as UserListRow | null;
        if (!row) {
          if (!cancelled) setError("Liste introuvable.");
          return;
        }
        // collect all player slugs
        const slugs = new Set<string>();
        for (const s of row.starting_xi ?? []) {
          if (s.player_slug) slugs.add(s.player_slug);
        }
        for (const b of row.bench ?? []) {
          if (b.player_slug) slugs.add(b.player_slug);
        }
        if (slugs.size === 0) {
          if (!cancelled) {
            setList(row);
            setLoading(false);
          }
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: playerRows, error: pErr } = await (supabase as any)
          .from("players")
          .select("*")
          .in("slug", Array.from(slugs));
        if (pErr) throw pErr;
        const map = new Map<string, DBPlayer>();
        for (const p of (playerRows ?? []) as DBPlayer[]) {
          map.set(p.slug, p);
        }
        if (!cancelled) {
          setList(row);
          setPlayers(map);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Erreur de chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const ogImageUrl = slug
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-ma-liste?slug=${slug}`
    : "";
  const permalink = `${typeof window !== "undefined" ? window.location.origin : ""}/ma-liste/${slug}`;
  const title = list?.pseudo
    ? `Ma liste des 26 — ${list.pseudo} | Léopards Radar`
    : "Ma liste des 26 | Léopards Radar";
  const description = list
    ? `Sélection ${list.formation}, âge moyen ${list.avg_age}, ${list.radar_count} joueurs du Radar. Compose la tienne sur leopardsradar.com.`
    : "Compose ta sélection des 26 Léopards pour le Mondial 2026.";

  const handleCopy = () => {
    navigator.clipboard.writeText(permalink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Set document meta tags imperatively (no react-helmet dependency)
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = title;
    const setMeta = (
      key: "name" | "property",
      value: string,
      content: string,
    ) => {
      let el = document.querySelector(
        `meta[${key}="${value}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(key, value);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", "article");
    setMeta("name", "twitter:card", "summary_large_image");
    if (slug && ogImageUrl) {
      setMeta("property", "og:image", ogImageUrl);
      setMeta("name", "twitter:image", ogImageUrl);
    }
    let link = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = permalink;
  }, [title, description, ogImageUrl, permalink, slug]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <section className="container-site max-w-3xl py-12 md:py-16">
          <Link
            to="/ma-liste"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Compose la tienne
          </Link>

          {loading && (
            <div className="text-center py-32">
              <p className="text-muted">Chargement de la liste…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-32">
              <h1 className="font-serif text-3xl text-foreground">{error}</h1>
              <p className="mt-3 text-muted">
                Le lien n'est peut-être plus valide.
              </p>
              <Link to="/ma-liste">
                <Button className="mt-6">Compose ta liste</Button>
              </Link>
            </div>
          )}

          {!loading && !error && list && (
            <>
              <div className="text-center mb-8">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
                  LISTE PUBLIQUE
                </p>
                <h1 className="mt-3 font-serif text-4xl md:text-5xl text-foreground">
                  {list.pseudo
                    ? `La sélection de ${list.pseudo}`
                    : "Une sélection des 26"}
                </h1>
                <p className="mt-3 text-muted-light">
                  Formation {list.formation} · âge moyen {list.avg_age} ·{" "}
                  {formatMarketValue(list.total_market_value_eur ?? 0)}
                </p>
              </div>

              {/* Render the ShareCard at preview scale */}
              <div className="flex justify-center mb-8">
                <div
                  className="rounded-card overflow-hidden border border-border shadow-2xl"
                  style={{
                    width: "100%",
                    maxWidth: 480,
                    aspectRatio: "4/5",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      transform: "scale(0.4)",
                      transformOrigin: "top left",
                      width: 1200,
                      height: 1500,
                    }}
                  >
                    {(() => {
                      const xi: Record<string, DBPlayer | null> = {};
                      for (const s of list.starting_xi ?? []) {
                        xi[s.position] = s.player_slug
                          ? players.get(s.player_slug) ?? null
                          : null;
                      }
                      const bench: DBPlayer[] = [];
                      for (const b of list.bench ?? []) {
                        const p = players.get(b.player_slug);
                        if (p) bench.push(p);
                      }
                      // captain: find by id in xi or bench
                      const all = [
                        ...Object.values(xi).filter((p): p is DBPlayer => !!p),
                        ...bench,
                      ];
                      const captain =
                        all.find((p) => p.id === list.captain_id) ?? all[0];
                      if (!captain) return null;
                      return (
                        <ShareCard
                          format="story"
                          formation={list.formation}
                          startingXI={xi}
                          bench={bench}
                          captain={captain}
                          pseudo={list.pseudo}
                          slug={list.slug}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="w-full gap-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Lien copié" : "Copier le lien"}
                </Button>
                <Link to="/ma-liste" className="w-full">
                  <Button className="w-full">Compose la tienne →</Button>
                </Link>
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
