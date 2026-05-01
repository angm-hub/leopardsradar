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
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;

          // React + everything that depends directly on React's runtime
          // (forwardRef, hooks, etc.) MUST live in the same chunk to avoid
          // "Cannot read properties of undefined (reading 'forwardRef')"
          // when chunks are loaded out-of-order.
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router") ||
            id.includes("@radix-ui/") ||
            id.includes("react-hook-form") ||
            id.includes("/scheduler/") ||
            id.includes("use-sync-external-store") ||
            id.includes("/use-callback-ref/")
          ) {
            return "react-vendor";
          }

          // Supabase — independent runtime
          if (id.includes("@supabase/")) {
            return "supabase-vendor";
          }

          // Framer Motion — depends on React but tolerates split-loading;
          // keep it isolated to leverage caching across feature work.
          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          // React Query — also React-dependent but designed for split-loading
          if (id.includes("@tanstack/")) {
            return "query-vendor";
          }

          // Lucide icons (large icon set, no React internals)
          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          // date-fns — pure utility
          if (id.includes("date-fns")) {
            return "date-vendor";
          }

          // colorthief and color helpers — pure utility
          if (id.includes("colorthief")) {
            return "color-vendor";
          }

          // Everything else from node_modules
          return "vendor";
        },
      },
    },
  },
}));
