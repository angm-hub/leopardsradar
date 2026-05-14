#!/usr/bin/env node
/**
 * scrape-press-rss.mjs — Phase 2 of the Revue de presse pipeline.
 *
 * Polls a curated list of RSS feeds, filters items by RDC-related
 * keywords, and inserts matches into the `press_items_pending` staging
 * table. A human then reviews each row and decides to promote it to
 * `press_items` (the published table) or reject.
 *
 * Why staging (not auto-publish) :
 *   - One bad RSS run could pollute the home with garbage.
 *   - The premium positioning of Léopards Radar relies on curation.
 *   - The scraper is dumb on purpose : it casts a wide net, the human
 *     reviews. Two distinct concerns, two distinct steps.
 *
 * Auth : requires SUPABASE_SERVICE_ROLE_KEY in env (write access).
 *        Read-only queries can fall back to the anon key.
 *
 * Run locally    : node scripts/scrape-press-rss.mjs
 * Run from CI    : GitHub Action `.github/workflows/press-rss.yml`
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { XMLParser } from "fast-xml-parser";

// -------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------

/**
 * RSS sources. Each entry maps a publisher to its feed and metadata.
 * Add a new source : append a row, ship a PR. No code change elsewhere.
 *
 * `category` is the *default* category for items from this feed. The
 * curator can override during review.
 */
// Validated RSS endpoints (curl-tested 14 May 2026). Adding a feed here
// is the only change needed to start polling a new source.
//
// `tier` = source reliability per Alex playbook (S/A/B/C). Items inserted
// from this feed get this tier by default. Overridable at curation review.
//
// `bias` = short editorial note explaining what this source is good at and
// where to be careful. Surfaces in the curator UI.
const FEEDS = [
  // -------------- TIER A — RDC + diaspora --------------
  {
    handle: "africatopsports.com",
    name: "Africa Top Sports",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=africatopsports.com&sz=128",
    feedUrl: "https://www.africatopsports.com/feed",
    defaultCategory: "actu",
    tier: "A",
    bias: "Long-format Afrique fiable. Plus rapide pour les analyses que les scoops.",
  },
  {
    handle: "afrik-foot.com",
    name: "Afrik-Foot",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=afrik-foot.com&sz=128",
    feedUrl: "https://www.afrik-foot.com/feed",
    defaultCategory: "actu",
    tier: "A",
    bias: "Presse panafricaine. Scoops occasionnels diaspora. Headlines parfois racoleurs.",
  },
  {
    handle: "radiookapi.net",
    name: "Radio Okapi",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=radiookapi.net&sz=128",
    feedUrl: "https://www.radiookapi.net/feed",
    defaultCategory: "actu",
    tier: "A",
    bias: "Radio onusienne RDC, ton institutionnel. Très fiable, peu de scoops.",
  },
  {
    handle: "actualite.cd",
    name: "Actualité.cd",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=actualite.cd&sz=128",
    feedUrl: "https://www.actualite.cd/feed",
    defaultCategory: "actu",
    tier: "A",
    bias: "Presse RDC quotidienne. Bonne couverture FECOFA et Linafoot.",
  },
  {
    handle: "actu30.cd",
    name: "Actu30",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=actu30.cd&sz=128",
    feedUrl: "https://actu30.cd/feed",
    defaultCategory: "actu",
    tier: "B",
    bias: "Presse RDC standard.",
  },

  // -------------- TIER A — Belgique (pipeline RDC majeur) --------------
  // Per Alex playbook : Belgique = pipeline RDC majeur. Anderlecht, Genk,
  // Standard, Charleroi sortent les meilleurs binationaux.
  {
    handle: "walfoot.be",
    name: "Walfoot",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=walfoot.be&sz=128",
    feedUrl: "https://www.walfoot.be/rss",
    defaultCategory: "mercato",
    tier: "A",
    bias: "Belgique. Très important pour les jeunes Congolais en académies belges (Anderlecht, Genk, Standard).",
  },
  {
    handle: "dhnet.be",
    name: "DH Les Sports+",
    type: "web",
    logo: "https://www.google.com/s2/favicons?domain=dhnet.be&sz=128",
    feedUrl: "https://www.dhnet.be/arc/outboundfeeds/rss/?outputType=xml",
    defaultCategory: "actu",
    tier: "A",
    bias: "Belgique francophone. Beaucoup d'infos jeunes/binationaux RDC.",
  },
];

/**
 * Whitelist of keywords that mark an item as RDC-relevant. Match is
 * case-insensitive and substring-based. Adding a player name here is
 * how you start tracking that player automatically.
 */
const RDC_KEYWORDS = [
  // Country / institution
  "rdc",
  "rd congo",
  "république démocratique du congo",
  "kinshasa",
  "lubumbashi",
  "fecofa",
  "léopards",
  "leopards",
  "linafoot",
  "congolais",
  "congolaise",

  // Clubs
  "tp mazembe",
  "vita club",
  "v.club",
  "v club",
  "maniema union",
  "don bosco",
  "lupopo",

  // Cadres + symboles
  "bakambu",
  "wissa",
  "mbemba",
  "mukoko",
  "tuanzebe",
  "kasereka",
  "masuaku",
  "elia",
  "moutoussamy",
  "mbokani",

  // Binationaux ciblés FECOFA
  "kalimuendo",
  "bakwa",
  "locko",
  "makengo",
  "kambwala",
  "bondo",

  // Sélectionneur
  "desabre",
];

const SUPABASE_BASE = "https://pvpshyoaregroihwglye.supabase.co";

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function loadEnv() {
  // 1) Process env wins (CI passes secrets that way).
  const fromProc = {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey:
      process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
  if (fromProc.url && (fromProc.serviceKey || fromProc.anonKey)) return fromProc;

  // 2) Fallback to a local .env (dev only — never write secrets there).
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return fromProc;
  const txt = readFileSync(envPath, "utf8");
  const env = Object.fromEntries(
    txt
      .split("\n")
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const eq = l.indexOf("=");
        return [
          l.slice(0, eq).trim(),
          l.slice(eq + 1).trim().replace(/^["']|["']$/g, ""),
        ];
      }),
  );
  return {
    url: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

async function fetchFeed(feedUrl) {
  const res = await fetch(feedUrl, {
    headers: {
      "User-Agent": "LeopardsRadarBot/1.0 (+https://leopardsradar.com)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, */*",
    },
    // Some feeds are slow ; bail out before the CI step times out.
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${feedUrl}`);
  return res.text();
}

/** Returns an array of `{title, link, description, pubDate}` items
 *  regardless of whether the feed is RSS 2.0 or Atom 1.0. */
function parseItems(xmlText) {
  const j = parser.parse(xmlText);
  if (j?.rss?.channel?.item) {
    const arr = Array.isArray(j.rss.channel.item)
      ? j.rss.channel.item
      : [j.rss.channel.item];
    return arr.map((it) => ({
      title: stripText(it.title),
      link: typeof it.link === "string" ? it.link : it.link?.["#text"] ?? "",
      description: stripText(it.description ?? ""),
      pubDate: it.pubDate ?? it["dc:date"] ?? null,
    }));
  }
  if (j?.feed?.entry) {
    const arr = Array.isArray(j.feed.entry) ? j.feed.entry : [j.feed.entry];
    return arr.map((it) => ({
      title: stripText(it.title),
      link:
        it.link?.["@_href"] ??
        (Array.isArray(it.link) ? it.link[0]?.["@_href"] : "") ??
        "",
      description: stripText(it.summary ?? it.content ?? ""),
      pubDate: it.published ?? it.updated ?? null,
    }));
  }
  return [];
}

function stripText(v) {
  if (v == null) return "";
  if (typeof v === "string") return decode(v).trim();
  if (typeof v === "object" && "#text" in v) return decode(v["#text"]).trim();
  return "";
}

function decode(s) {
  return String(s)
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ");
}

function matchesRDC(item) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  const matched = RDC_KEYWORDS.filter((kw) => haystack.includes(kw));
  return matched;
}

/**
 * Auto-tagging : reads the headline + description, tries to match a
 * curated set of cross-cutting tags. Lightweight — no NLP, just keyword
 * substring matching. Tags here MUST be the same lowercase set used in
 * the UI filter on /revue-de-presse so navigation stays consistent.
 */
const TAG_RULES = [
  { tag: "RDC", patterns: ["rdc", "rd congo", "république démocratique du congo", "congolais", "léopards", "leopards", "fecofa", "kinshasa", "lubumbashi"] },
  { tag: "Belgique", patterns: ["belgique", "anderlecht", "genk", "standard", "charleroi", "club bruges", "antwerp", "jupiler", "bruxelles"] },
  { tag: "Ligue1", patterns: ["ligue 1", "ligue1", "psg", "marseille", "monaco", "lyon", "lille", "rennes"] },
  { tag: "Bundesliga", patterns: ["bundesliga", "bayern", "dortmund", "leipzig", "leverkusen"] },
  { tag: "EPL", patterns: ["premier league", "newcastle", "arsenal", "chelsea", "manchester", "liverpool", "tottenham"] },
  { tag: "Liga", patterns: ["liga", "real madrid", "barcelone", "atlético", "betis", "sevilla"] },
  { tag: "Linafoot", patterns: ["linafoot", "mazembe", "vita club", "v.club", "lupopo", "maniema", "don bosco"] },
  { tag: "Mercato", patterns: ["mercato", "transfert", "signe", "rejoint", "officiel", "contrat", "agent"] },
  { tag: "Binational", patterns: ["binational", "double nationalité", "éligible", "switch", "convoque pour la première fois"] },
  { tag: "U21", patterns: ["u17", "u18", "u19", "u20", "u21", "u23", "espoirs", "jeune talent"] },
  { tag: "Sélection", patterns: ["sélectionneur", "convocation", "rassemblement", "liste des", "match amical", "qualification"] },
  { tag: "Mondial", patterns: ["mondial", "coupe du monde", "world cup", "wc 2026"] },
  { tag: "CAN", patterns: ["can ", "coupe d'afrique", "afcon"] },
  { tag: "Blessure", patterns: ["blessure", "blessé", "indisponible", "forfait", "absent"] },
  { tag: "Diaspora", patterns: ["diaspora", "binational", "europe", "expatrié"] },
];

function autoTag(item) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  const tags = new Set();
  for (const rule of TAG_RULES) {
    if (rule.patterns.some((p) => haystack.includes(p))) tags.add(rule.tag);
  }
  return Array.from(tags);
}

/** Compute confidence_score 0..1 from tier × keyword density × recency. */
function confidenceFor(tier, matchedKeywords, publishedAtIso) {
  const tierWeight = { S: 1.0, A: 0.85, B: 0.6, C: 0.4 }[tier] ?? 0.5;
  // density : 1 keyword = 0.3, 2 = 0.5, 3+ = 0.7
  const densityWeight =
    matchedKeywords.length === 0
      ? 0.2
      : Math.min(0.7, 0.2 + matchedKeywords.length * 0.15);
  // recency : <24h full credit, then linear decay over 30 days to 0.5
  const ageDays = (Date.now() - new Date(publishedAtIso).getTime()) / 86_400_000;
  const recencyWeight = ageDays < 1 ? 1.0 : Math.max(0.5, 1.0 - (ageDays - 1) / 30);
  // Weighted geometric mean keeps the score conservative.
  const score = Math.pow(tierWeight * densityWeight * recencyWeight, 1 / 3);
  return Math.round(score * 100) / 100;
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

async function main() {
  const env = loadEnv();
  if (!env.url || !env.serviceKey) {
    console.error(
      "[rss-scraper] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — aborting",
    );
    process.exit(1);
  }

  const runId = `rss-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const newRows = [];

  for (const feed of FEEDS) {
    console.log(`[rss-scraper] polling ${feed.feedUrl}`);
    let xml;
    try {
      xml = await fetchFeed(feed.feedUrl);
    } catch (e) {
      console.warn(`[rss-scraper] failed ${feed.feedUrl}: ${e.message}`);
      continue;
    }
    const items = parseItems(xml);
    console.log(`[rss-scraper]   parsed ${items.length} items`);

    for (const it of items) {
      if (!it.link || !it.title) continue;
      const matched = matchesRDC(it);
      if (matched.length === 0) continue;
      const publishedAt = it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString();
      const tags = autoTag(it);
      const confidence = confidenceFor(feed.tier, matched, publishedAt);

      newRows.push({
        source_handle: feed.handle,
        source_name: feed.name,
        source_type: feed.type,
        source_logo_url: feed.logo,
        headline: it.title.slice(0, 280),
        excerpt: it.description ? it.description.slice(0, 400) : null,
        url: it.link,
        category: feed.defaultCategory,
        scraper_run_id: runId,
        scraper_source_url: feed.feedUrl,
        matched_keywords: matched,
        // Reco Alex (mai 2026) : matérialiser tier/biais/tags/confidence
        // dès le scrape — l'éditeur peut overrider à la review mais a
        // déjà un signal de fiabilité d'entrée.
        source_tier: feed.tier ?? "B",
        source_bias: feed.bias ?? null,
        tags,
        confidence_score: confidence,
        published_at: publishedAt,
      });
    }
  }

  console.log(`[rss-scraper] ${newRows.length} candidate rows after filtering`);

  if (newRows.length === 0) {
    console.log("[rss-scraper] nothing new — exit clean");
    return;
  }

  // Bulk insert with on-conflict-do-nothing on the (url) UNIQUE — keeps
  // the staging table clean across daily runs. PostgREST returns 201
  // with the inserted rows ; conflicts are silently dropped.
  const insertRes = await fetch(
    `${env.url.replace(/\/$/, "")}/rest/v1/press_items_pending`,
    {
      method: "POST",
      headers: {
        apikey: env.serviceKey,
        Authorization: `Bearer ${env.serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation,resolution=ignore-duplicates",
      },
      body: JSON.stringify(newRows),
    },
  );

  if (!insertRes.ok) {
    const txt = await insertRes.text();
    console.error(`[rss-scraper] insert failed HTTP ${insertRes.status}: ${txt.slice(0, 400)}`);
    process.exit(1);
  }
  const inserted = await insertRes.json();
  console.log(
    `[rss-scraper] OK — inserted ${inserted.length}/${newRows.length} new rows (rest = duplicates)`,
  );
}

main().catch((e) => {
  console.error("[rss-scraper] fatal:", e);
  process.exit(1);
});
