import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the site under /leopardsradar/. Without an explicit
  // base, asset URLs are emitted as relative paths and resolve incorrectly
  // on deep routes (e.g. /leopardsradar/player/<slug> → 404 on assets).
  // The BrowserRouter in App.tsx already reads import.meta.env.BASE_URL,
  // so setting base here also fixes router resolution on GH Pages.
  base: mode === "production" ? "/leopardsradar/" : "/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Réécrit les paths "./" dans index.html pour qu'ils soient absolus
    // depuis la base. Sinon en prod, sur une route deep type
    // /leopardsradar/player/<slug>, le browser résout "./fonts/..." depuis
    // /leopardsradar/player/ et 404. Avec ce remplacement on a
    // /leopardsradar/fonts/... peu importe la profondeur.
    {
      name: "rewrite-relative-public-paths",
      transformIndexHtml(html: string) {
        const base = mode === "production" ? "/leopardsradar/" : "/";
        return html
          .replace(/href="\.\/fonts\.css"/g, `href="${base}fonts.css"`)
          .replace(/href="\.\/fonts\//g, `href="${base}fonts/`);
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core",
    ],
  },
  build: {
    chunkSizeWarningLimit: 1100,
    // Manual chunk splitting was attempted in P2 to improve caching, but it
    // caused runtime crashes ("Cannot read properties of undefined reading
    // forwardRef / createContext") because many transitive dependencies
    // touch React's module namespace at load time. Splitting React across
    // multiple chunks does not guarantee load order in ESM, so libs that
    // import React top-level (Radix, cmdk, cva, vaul, sonner, every Radix
    // wrapper) crash before React resolves. Reverting to Vite's default
    // single-chunk vendor strategy is slower to cache but reliably boots.
  },
}));
