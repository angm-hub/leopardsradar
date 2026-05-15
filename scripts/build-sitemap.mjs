#!/usr/bin/env node
/**
 * build-sitemap.mjs — generates dist/sitemap.xml from publicly indexable URLs.
 *
 * Sprint 1.8 du brief 2026-05-15. Runs as a postbuild step, après build-rss.mjs.
 *
 * Contenu indexé :
 *   - Pages statiques publiques (Home, Roster, Radar, Best XI, A propos,
 *     Methodologie, Histoires, Revue de presse, Newsletter, Compare, Ma Liste)
 *   - 1 URL par joueur publié : /player/:slug
 *   - 1 URL par article publié : /histoires/:slug
 *
 * Exclu : pages utilitaires (Auth, NewsletterConfirm/Unsubscribe, NotFound,
 * AdminPhotos, MaListePublic) et pages légales (CGU, Confidentialité,
 * Mentions Légales — indexable en théorie mais low-value pour le SEO).
 *
 * Stratégie : on lit la même Supabase REST API que build-rss.mjs, anon JWT.
 * Pas de serverless, pas de coût. Le sitemap est régénéré à chaque deploy.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env");
const DIST_PATH = resolve(ROOT, "dist", "sitemap.xml");
const SITE_BASE = "https://angm-hub.github.io/leopardsradar";

// ── Pages statiques + leur priorité SEO ─────────────────────────────────────
// Priority : 1.0 (home) → 0.9 (sections produit principales) → 0.7 (éditorial)
// → 0.5 (utilitaire). changefreq cohérent avec la cadence éditoriale du projet.
const STATIC_PAGES = [
  { path: "", priority: "1.0", changefreq: "weekly" },
  { path: "roster", priority: "0.9", changefreq: "weekly" },
  { path: "radar", priority: "0.9", changefreq: "weekly" },
  { path: "best-xi", priority: "0.9", changefreq: "weekly" },
  { path: "histoires", priority: "0.8", changefreq: "weekly" },
  { path: "revue-de-presse", priority: "0.8", changefreq: "daily" },
  { path: "compare", priority: "0.7", changefreq: "monthly" },
  { path: "ma-liste", priority: "0.7", changefreq: "monthly" },
  { path: "a-propos", priority: "0.6", changefreq: "monthly" },
  { path: "methodologie", priority: "0.6", changefreq: "monthly" },
  { path: "newsletter", priority: "0.6", changefreq: "monthly" },
];

function readEnv() {
  if (!existsSync(ENV_PATH)) {
    console.warn("[sitemap] .env not found, skipping sitemap generation");
    return null;
  }
  const txt = readFileSync(ENV_PATH, "utf8");
  return Object.fromEntries(
    txt
      .split("\n")
      .filter((l) => l && !l.startsWith("#"))
      .map((l) => {
        const eq = l.indexOf("=");
        const k = l.slice(0, eq).trim();
        const v = l
          .slice(eq + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        return [k, v];
      }),
  );
}

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Pagination Supabase : limite par défaut 1000/page. On boucle jusqu'à
// ramener moins que la page = fin des résultats.
async function fetchAll(url, key, endpoint) {
  const PAGE_SIZE = 1000;
  const all = [];
  for (let from = 0; from < 50000; from += PAGE_SIZE) {
    const to = from + PAGE_SIZE - 1;
    const res = await fetch(`${url}${endpoint}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
        "Range-Unit": "items",
        Range: `${from}-${to}`,
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] fetch failed ${endpoint} (range ${from}-${to}): HTTP ${res.status}`);
      break;
    }
    const page = await res.json();
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break; // dernière page
  }
  return all;
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  const env = readEnv();
  if (!env) return;
  const url = env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[sitemap] missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
    return;
  }

  // Récupère slugs publiés en parallèle
  const [players, articles] = await Promise.all([
    // Pas de filtre is_active : la colonne n'existe pas encore (Sprint 2 du brief).
    // Tous les joueurs avec un slug sont indexables. On filtre côté JS plus bas.
    fetchAll(
      url,
      key,
      "/rest/v1/players?select=slug,updated_at&slug=not.is.null&order=updated_at.desc",
    ),
    fetchAll(
      url,
      key,
      "/rest/v1/articles?select=slug,published_at&is_published=eq.true&order=published_at.desc",
    ),
  ]);

  const today = new Date().toISOString().slice(0, 10);

  // Pages statiques
  const staticUrls = STATIC_PAGES.map((p) =>
    urlEntry({
      loc: `${SITE_BASE}/${p.path}`,
      lastmod: today,
      changefreq: p.changefreq,
      priority: p.priority,
    }),
  );

  // Joueurs : 1 URL par profil actif avec slug
  const playerUrls = (Array.isArray(players) ? players : [])
    .filter((p) => p.slug)
    .map((p) =>
      urlEntry({
        loc: `${SITE_BASE}/player/${p.slug}`,
        lastmod: p.updated_at ? p.updated_at.slice(0, 10) : today,
        changefreq: "weekly",
        priority: "0.7",
      }),
    );

  // Articles publiés
  const articleUrls = (Array.isArray(articles) ? articles : [])
    .filter((a) => a.slug)
    .map((a) =>
      urlEntry({
        loc: `${SITE_BASE}/histoires/${a.slug}`,
        lastmod: a.published_at ? a.published_at.slice(0, 10) : today,
        changefreq: "monthly",
        priority: "0.6",
      }),
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...playerUrls, ...articleUrls].join("\n")}
</urlset>
`;

  writeFileSync(DIST_PATH, xml, "utf8");
  console.log(
    `[sitemap] wrote ${DIST_PATH} (${STATIC_PAGES.length} static + ${playerUrls.length} players + ${articleUrls.length} articles)`,
  );
}

main().catch((e) => {
  console.error("[sitemap] failed:", e);
  // Non-fatal : un sitemap manquant ne bloque pas le deploy.
});
