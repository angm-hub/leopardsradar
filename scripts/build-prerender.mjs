#!/usr/bin/env node
/**
 * build-prerender.mjs — coquilles HTML statiques avec meta par page.
 *
 * Le site est une SPA : sans ce script, toutes les URLs servent le meme
 * index.html avec le meme <title> et les memes OG. Les crawlers et le
 * link unfurling (WhatsApp, Twitter, Slack) voient donc la meme carte
 * pour 2 300 pages. Ici, apres le build :
 *   - dist/player/<slug>/index.html   (une coquille par joueur)
 *   - dist/<route>/index.html         (routes statiques : roster, radar...)
 * chacune = copie de dist/index.html avec title / description / OG /
 * canonical propres a la page. Le contenu reste rendu par React au
 * chargement ; seules les meta different (pattern "meta shell").
 *
 * Effet de bord bienvenu : sur GitHub Pages, ces fichiers existent
 * physiquement, donc les deep-links prerendus repondent 200 la-bas aussi.
 *
 * Regle copy : zero tiret cadratin, separateur « · ».
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "..", "dist");

const SITE_BASE =
  process.env.SITE_BASE ??
  (process.env.VERCEL
    ? "https://leopardsradar.vercel.app"
    : "https://angm-hub.github.io/leopardsradar");

// ── env (.env local ou variables CI), meme approche que build-sitemap ──
function readEnv() {
  const env = { ...process.env };
  const envPath = join(__dirname, "..", ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^([A-Z_]+)="?([^"\n]*)"?$/);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Reecrit title/description/og/canonical dans la coquille index.html. */
function shell(template, { title, description, path }) {
  const url = `${SITE_BASE}${path}`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*(")/,
      `$1${esc(description)}$2`,
    )
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`);
  const extra = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
  ].join("\n    ");
  return html.replace("</head>", `    ${extra}\n  </head>`);
}

function writeShell(template, route, meta) {
  const dir = join(DIST, ...route.split("/").filter(Boolean));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), shell(template, meta));
}

const POSITION_FR = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur",
  Midfield: "Milieu",
  Attack: "Attaquant",
};

function playerDescription(p) {
  const bits = [];
  bits.push(POSITION_FR[p.position] ?? "Joueur");
  if (p.current_club) bits.push(p.current_club);
  if (p.age) bits.push(`${p.age} ans`);
  if (p.caps_rdc > 0) bits.push(`${p.caps_rdc} sélection${p.caps_rdc > 1 ? "s" : ""} RDC`);
  return `${bits.join(" · ")}. Profil, statut FIFA, statistiques de saison et valeur marchande sur Léopards Radar, la data du football congolais.`;
}

const STATIC_ROUTES = [
  ["/roster", "Roster Léopards | Léopards Radar", "Les internationaux RDC de la saison : minutes, buts, passes, clubs. Mis à jour chaque dimanche."],
  ["/radar", "Le Radar | Léopards Radar", "Les joueurs éligibles ou à ascendance RDC dans le monde, cartographiés par valeur, jeunesse et niveau."],
  ["/best-xi", "Best XI Diaspora | Léopards Radar", "La meilleure composition possible des Léopards, roster et diaspora confondus. Recomposée chaque dimanche."],
  ["/mondial-2026", "Mondial 2026, le bilan | Léopards Radar", "Le parcours des Léopards à la Coupe du Monde 2026 : quatre matchs, les chiffres, les hommes."],
  // /revue-de-presse retirée : section dépubliée jusqu'au lancement (cf. src/config/editorial.ts)
  ["/histoires", "Histoires | Léopards Radar", "Les récits du football congolais, racontés par la data."],
  ["/methodologie", "Méthodologie | Léopards Radar", "D'où viennent les données, comment on les calcule, ce qu'on n'a pas. Transparence par défaut."],
  ["/a-propos", "À propos | Léopards Radar", "Toute la data du football congolais, en un seul endroit. Un média indépendant construit à Paris."],
  ["/compare", "Comparateur | Léopards Radar", "Compare deux Léopards côte à côte : six axes statistiques et lecture des écarts."],
  ["/newsletter", "Le récap du dimanche | Léopards Radar", "L'analyse de la semaine des Léopards, 6 minutes de lecture, livrée le dimanche à 21 h."],
];

async function main() {
  const template = readFileSync(join(DIST, "index.html"), "utf8");
  const env = readEnv();

  for (const [path, title, description] of STATIC_ROUTES) {
    writeShell(template, path, { title, description, path });
  }
  console.log(`[prerender] ${STATIC_ROUTES.length} routes statiques`);

  const url = env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.warn("[prerender] env Supabase manquante, fiches joueurs sautées");
    return;
  }

  let players = [];
  let from = 0;
  const PAGE = 1000;
  for (;;) {
    const r = await fetch(
      `${url}/rest/v1/players?select=slug,name,position,current_club,age,caps_rdc&archived=not.is.true&or=(discovery_method.is.null,verified.is.true,caps_rdc.gt.0)&order=id.asc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Range: `${from}-${from + PAGE - 1}`,
        },
      },
    );
    if (!r.ok) {
      console.warn(`[prerender] Supabase HTTP ${r.status}, fiches sautées`);
      return;
    }
    const batch = await r.json();
    players.push(...batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }

  let written = 0;
  for (const p of players) {
    if (!p.slug) continue;
    writeShell(template, `/player/${p.slug}`, {
      title: `${p.name}${p.current_club ? " · " + p.current_club : ""} | Léopards Radar`,
      description: playerDescription(p),
      path: `/player/${p.slug}`,
    });
    written++;
  }
  console.log(`[prerender] ${written} fiches joueurs`);
}

main().catch((e) => {
  // Non bloquant : un prerender rate ne doit pas empecher le deploy.
  console.warn("[prerender] erreur non bloquante :", e.message);
});
