import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ArticleCategory =
  | "Investigation"
  | "Profil"
  | "Analyse"
  | "Diaspora"
  | "Histoire";

/**
 * Bloc éditorial typé. Permet un rendu structuré côté React (h2, p, quote)
 * sans avoir à embarquer un parser markdown. Mêmes types que l'ancien
 * `StoryBlock` pour que les composants StoryHero/StoryCard/etc continuent
 * de marcher sans refacto.
 */
export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string };

export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: ArticleCategory;
  author: string;
  /** Date au format ISO (timestamptz BDD). Convertie en YYYY-MM-DD côté UI
   * pour rester compatible avec le formatage existant. */
  published_at: string;
  reading_minutes: number;
  featured: boolean;
  is_published: boolean;
  hero_image_url: string | null;
  body: ArticleBlock[];
}

/**
 * Helper : Date ISO timestamptz → YYYY-MM-DD pour les composants qui
 * attendaient l'ancien format `publishedAt` de stories.ts.
 */
export function isoToDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

// ---------- useArticles : flux complet (page Histoires) ----------

interface UseArticlesOptions {
  category?: ArticleCategory | "all";
  /** Inclut featured (rarement utile à false). */
  includeFeatured?: boolean;
}

export function useArticles(opts: UseArticlesOptions = {}) {
  const { category = "all", includeFeatured = true } = opts;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q = (supabase as any)
          .from("articles")
          .select("*")
          .eq("is_published", true)
          .order("published_at", { ascending: false });
        if (category !== "all") q = q.eq("category", category);
        if (!includeFeatured) q = q.eq("featured", false);
        const { data, error: err } = await q;
        if (err) throw err;
        if (cancelled) return;
        setArticles((data ?? []) as Article[]);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[useArticles]", msg);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [category, includeFeatured]);

  return { articles, loading, error };
}

// ---------- useArticle : single article + related ----------

export function useArticle(slug: string | undefined) {
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        // 1. Fetch article principal
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: main, error: errMain } = await (supabase as any)
          .from("articles")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .maybeSingle();
        if (errMain) throw errMain;
        if (cancelled) return;
        if (!main) {
          setArticle(null);
          setRelated([]);
          return;
        }
        setArticle(main as Article);

        // 2. Fetch related via RPC (même catégorie + fallback récents)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: rel, error: errRel } = await (supabase as any).rpc(
          "get_related_articles",
          { current_slug: slug, result_limit: 2 },
        );
        if (errRel) {
          // Pas critique : on affiche l'article sans related plutôt que d'échouer.
          console.warn("[useArticle] related RPC error", errRel);
          setRelated([]);
        } else if (!cancelled) {
          setRelated((rel ?? []) as Article[]);
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur inconnue";
        console.error("[useArticle]", msg);
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { article, related, loading, error };
}
