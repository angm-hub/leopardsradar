import type { Config } from "tailwindcss";

/**
 * Léopards Radar — Premium DA (Cobalt)
 *
 * Palette pivotée le 2026-05-15 vers la direction "Premium v2" du brand book :
 *   Void · Cobalt · Bone · Star · Blood — drapeau RDC désaturé 15-20% pour
 *   rester éditorial (pas drapeau brut, pas stade). Avant : vert-dominant
 *   #00A651 + foreground cool #F4F4F1 + Fraunces/DM Sans/Space Mono.
 *
 * Sémiologie héritage 3 couches :
 *   Radar (instrument · futur) · Léopard (nom · 1968) · Okapi (endémique · signature)
 *
 * Typo : Geist partout (display tracking -4.5%, body -1%, "mono" 500 caps +18%).
 * Référence : tokens-premium.css du brand book (Anthropic Design handoff bundle).
 *
 * Position colors (pos.gk/def/mid/att) restent inchangées — fonctionnel
 * player UI, pas brand. Le success vert reste pour les deltas positifs.
 */
const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // ── Semantic core ─────────────────────────────────────────
        background: "#050B1A",            // Void — page floor
        card: "#0E1F44",                  // Cobalt 900 — raised surface
        "card-hover": "#11203F",
        border: "#1A2B4A",
        "border-hover": "#2A3D64",
        foreground: "#ECE8DD",            // Bone — warm cream (vs cool #F4F4F1)
        muted: "#5C6E8C",
        "muted-light": "#8A9BBC",

        // ── Cobalt scale (atmosphère principale) ──────────────────
        cobalt: {
          deep: "#050B1A",
          night: "#0A1530",
          900: "#0E1F44",
          700: "#1A3A78",
          500: "#2563B8",                 // DRC blue, premium-tuned
          400: "#4A8AD8",
          mist: "#9FB8E0",
        },

        // ── Accents drapeau RDC (premium-tuned) ───────────────────
        primary: {
          DEFAULT: "#F5C518",             // Star — accent principal
          hover: "#D9AC15",
          foreground: "#050B1A",
        },
        star: {
          DEFAULT: "#F5C518",
          deep: "#C99A0E",
          soft: "#F8D659",
        },
        blood: {
          DEFAULT: "#C8202B",             // Blood — alerte / héritage
          deep: "#8B1219",
        },
        bone: {
          DEFAULT: "#ECE8DD",
          paper: "#F5F2EA",
          ivory: "#F5EDD6",
        },

        // ── Heritage palette (Zaïre + DRC tuning) ─────────────────
        zaire: {
          DEFAULT: "#0E5E3C",             // Vert Zaïre 1971-97
          deep: "#07351F",
        },
        torch: {
          DEFAULT: "#F5C518",             // Flambeau Authenticité
          deep: "#C99A0E",
        },
        copper: "#B87333",                // Cuivre Katanga

        // ── Functional ────────────────────────────────────────────
        success: "#10B981",               // Deltas positifs (+N) — fonctionnel
        alert: "#C8202B",                 // Blood (alias)
        // Position colors — fonctionnel, ne change pas (player UI)
        pos: {
          gk: "#8B5CF6",
          def: "#10B981",
          mid: "#3B82F6",
          att: "#EF4444",
        },
      },
      fontFamily: {
        // Charte graphique Léopards Radar — fonts self-hostées dans
        // /public/fonts/ via fonts.css. Fraunces = display éditorial
        // (titres, hero, accents italiques). DM Sans = body, UI courante.
        // Space Mono = labels mono uppercase + tabular nums.
        // Cf. memory kAIra `feedback_typo-anti-claude.md` — combo voulue
        // pour ne pas faire "trop Claude" (Cormorant/Inter/JetBrains bannis).
        serif: ['"Fraunces"', "Georgia", "ui-serif", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
        display: ['"Fraunces"', "Georgia", "ui-serif", "serif"],
        // Ma Liste v2 — DA dédiée alignée sur la charte du site
        // (cf. docs/DESIGN_MA_LISTE_V2.md). Fraunces pour les display
        // editoriaux, DM Sans pour le body, Space Mono pour les labels.
        v2: ['"Fraunces"', "Georgia", "ui-serif", "serif"],
        "v2-body": ['"DM Sans"', "system-ui", "sans-serif"],
        "v2-mono": ['"Space Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Display sizes calibrés pour Geist tracking serré -4.5%
        "display-2xl": ["5rem", { lineHeight: "0.92", letterSpacing: "-0.045em", fontWeight: "500" }],
        "display-xl": ["3.5rem", { lineHeight: "0.95", letterSpacing: "-0.04em", fontWeight: "500" }],
        "display-lg": ["2.5rem", { lineHeight: "1.05", letterSpacing: "-0.035em", fontWeight: "500" }],
      },
      borderRadius: {
        card: "14px",                     // Cobalt cards respirent un peu plus
        button: "999px",                  // Pill par défaut (brand book v2)
        "button-sm": "8px",               // Fallback rectangulaire
      },
      backgroundImage: {
        // Atmosphères réutilisables via bg-atmos-jade, bg-atmos-dawn, etc.
        // Source : tokens-premium.css. Valeurs en clair pour permettre à
        // Tailwind JIT de les emit sans expansion CSS variables.
        "atmos-jade":
          "radial-gradient(ellipse 80% 60% at 25% 30%, rgba(74,138,216,0.5) 0%, transparent 55%), radial-gradient(ellipse 60% 80% at 80% 70%, rgba(26,58,120,0.7) 0%, transparent 60%), linear-gradient(135deg, #1A3A78 0%, #0E1F44 40%, #050B1A 80%)",
        "atmos-dawn":
          "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(245,197,24,0.22) 0%, transparent 55%), radial-gradient(ellipse 90% 60% at 70% 80%, rgba(26,58,120,0.8) 0%, transparent 60%), linear-gradient(160deg, #2D5BA8 0%, #0E1F44 45%, #050B1A 90%)",
        "atmos-zaire":
          "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(37,99,184,0.75) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 70%, rgba(245,197,24,0.25) 0%, transparent 60%), linear-gradient(170deg, #1A3A78 0%, #0E1F44 50%, #050B1A 90%)",
        "atmos-torch":
          "radial-gradient(ellipse 70% 60% at 30% 35%, rgba(245,197,24,0.5) 0%, transparent 55%), radial-gradient(ellipse 80% 70% at 75% 80%, rgba(200,32,43,0.4) 0%, transparent 60%), linear-gradient(155deg, #C99A0E 0%, #5C1A12 50%, #0A1530 95%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 45s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        "gradient-drift-1": "gradient-drift-1 22s ease-in-out infinite",
        "gradient-drift-2": "gradient-drift-2 32s ease-in-out infinite",
        // Ma Liste v2
        shake: "shake 200ms cubic-bezier(.36,.07,.19,.97)",
      },
      gridTemplateColumns: {
        "15": "repeat(15, minmax(0, 1fr))",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-3px)" },
          "40%, 80%": { transform: "translateX(3px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "gradient-drift-1": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
          "33%": { transform: "translate(3%, -2%) scale(1.1)", opacity: "0.8" },
          "66%": { transform: "translate(-2%, 3%) scale(0.95)", opacity: "0.9" },
        },
        "gradient-drift-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1.1)", opacity: "0.7" },
          "50%": { transform: "translate(-4%, 2%) scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
