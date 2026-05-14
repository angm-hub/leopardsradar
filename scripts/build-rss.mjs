#!/usr/bin/env node
/**
 * build-rss.mjs — generates dist/rss.xml from the published articles.
 *
 * Runs as a postbuild step. We fetch published articles from the
 * `articles` table via the Supabase REST endpoint (anon JWT), then
 * write a valid RSS 2.0 feed to dist/rss.xml.
 *
 * Why static at build time : GH Pages can't run server code. Editorial
 * cadence is weekly, so a feed regenerated at every deploy is fresh
 * enough — no need for a serverless endpoint.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const ENV_PATH = resolve(ROOT, ".env");
const DIST_PATH = resolve(ROOT, "dist", "rss.xml");
const SITE_BASE = "https://angm-hub.github.io/leopardsradar";

// Read VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY from .env
function readEnv() {
  if (!existsSync(ENV_PATH)) {
    console.warn("[rss] .env not found, skipping RSS generation");
    return null;
  }
  const txt = readFileSync(ENV_PATH, "utf8");
  const env = Object.fromEntries(
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
  return env;
}

// Minimal XML escape — covers all 5 entities required by spec.
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const env = readEnv();
  if (!env) return;
  const url = env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[rss] missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY");
    return;
  }
  const endpoint =
    `${url}/rest/v1/articles` +
    "?select=slug,title,subtitle,excerpt,category,author,published_at" +
    "&is_published=eq.true&order=published_at.desc&limit=50";
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    console.error(`[rss] supabase fetch failed: HTTP ${res.status}`);
    return;
  }
  const articles = await res.json();
  if (!Array.isArray(articles)) {
    console.error("[rss] unexpected supabase response shape");
    return;
  }

  const now = new Date().toUTCString();
  const items = articles
    .map((a) => {
      const link = `${SITE_BASE}/histoires/${a.slug}`;
      const pubDate = new Date(a.published_at).toUTCString();
      const desc = a.excerpt || a.subtitle || "";
      return `    <item>
      <title>${xmlEscape(a.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>contact@leopardsradar.com (${xmlEscape(a.author || "Léopards Radar")})</author>
      <category>${xmlEscape(a.category || "Histoires")}</category>
      <description>${xmlEscape(desc)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Léopards Radar — Histoires</title>
    <link>${SITE_BASE}/histoires</link>
    <atom:link href="${SITE_BASE}/rss.xml" rel="self" type="application/rss+xml"/>
    <description>Histoires éditoriales des Léopards de la République Démocratique du Congo. Roster, radar, diaspora — édité par Cobalt Sports &amp; Entertainment.</description>
    <language>fr-FR</language>
    <copyright>© ${new Date().getFullYear()} Cobalt Sports &amp; Entertainment</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>1440</ttl>
${items}
  </channel>
</rss>
`;

  writeFileSync(DIST_PATH, xml, "utf8");
  console.log(`[rss] wrote ${DIST_PATH} (${articles.length} items)`);
}

main().catch((e) => {
  console.error("[rss] failed:", e);
  // Non-fatal : a missing RSS file shouldn't block a deploy.
});
