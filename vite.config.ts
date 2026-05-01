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

          // React core
          if (
            id.includes("/react/") ||
            id.includes("/react-dom/") ||
            id.includes("/react-router")
          ) {
            return "react-vendor";
          }

          // Supabase
          if (id.includes("@supabase/")) {
            return "supabase-vendor";
          }

          // Framer Motion (heavy animation library)
          if (id.includes("framer-motion")) {
            return "motion-vendor";
          }

          // Radix UI primitives — split because there are many
          if (id.includes("@radix-ui/")) {
            return "radix-vendor";
          }

          // React Query
          if (id.includes("@tanstack/")) {
            return "query-vendor";
          }

          // Lucide icons (large icon set)
          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          // date-fns
          if (id.includes("date-fns")) {
            return "date-vendor";
          }

          // colorthief and color helpers
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
