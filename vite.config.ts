import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
