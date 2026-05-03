import { useEffect } from "react";

interface DocumentMeta {
  /** Page title — appears in tab + appended to "| Léopards Radar". */
  title: string;
  /** Short page description (160 char max ideal). */
  description?: string;
  /** Absolute URL of the OG/Twitter card image. */
  image?: string;
  /** Optional canonical URL — defaults to current location. */
  url?: string;
}

const SUFFIX = " | Léopards Radar";
const DEFAULT_TITLE = "Léopards Radar";
const DEFAULT_DESCRIPTION =
  "Léopards Radar — radar éditorial premium des joueurs de la RDC et talents éligibles de la diaspora.";

/**
 * useDocumentMeta — updates document title + meta tags at runtime.
 *
 * Coverage caveat : Twitter and Facebook crawlers do NOT execute JavaScript,
 * so their cards still see the index.html defaults. This hook works for :
 *   - Slack, Discord (execute JS for unfurling)
 *   - LinkedIn (modern crawler runs JS)
 *   - Google indexer (JS-rendering since 2019)
 *   - Browser tab title (always)
 *   - SEO snippets where the indexer renders JS
 *
 * For full Twitter/FB coverage, prerender per-route HTML at build time —
 * tracked as a future sprint backlog item (would require a Vite postbuild
 * script that fetches all player slugs and writes /dist/player/<slug>/index.html).
 *
 * On unmount, restores the default site-wide meta so navigation away from
 * a player page doesn't leave the player title behind in the next route.
 */
export function useDocumentMeta(meta: DocumentMeta) {
  useEffect(() => {
    const fullTitle = meta.title.endsWith(SUFFIX) ? meta.title : `${meta.title}${SUFFIX}`;
    document.title = fullTitle;
    setMeta("name", "description", meta.description ?? DEFAULT_DESCRIPTION);
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", meta.description ?? DEFAULT_DESCRIPTION);
    setMeta("property", "og:url", meta.url ?? window.location.href);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", meta.description ?? DEFAULT_DESCRIPTION);
    if (meta.image) {
      setMeta("property", "og:image", meta.image);
      setMeta("name", "twitter:image", meta.image);
    }

    return () => {
      // Restore site-wide defaults on unmount so a SPA back-navigation
      // doesn't surface stale per-page meta.
      document.title = DEFAULT_TITLE;
      setMeta("name", "description", DEFAULT_DESCRIPTION);
      setMeta("property", "og:title", DEFAULT_TITLE);
      setMeta("property", "og:description", DEFAULT_DESCRIPTION);
      setMeta("name", "twitter:title", DEFAULT_TITLE);
      setMeta("name", "twitter:description", DEFAULT_DESCRIPTION);
    };
  }, [meta.title, meta.description, meta.image, meta.url]);
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}
