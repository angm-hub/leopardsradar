import type { Config } from "tailwindcss";

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
        background: "#0A0A0B",
        card: "#131316",
        "card-hover": "#16161A",
        border: "#1F1F24",
        "border-hover": "#2A2A30",
        foreground: "#F4F4F1",
        muted: "#6B6B73",
        "muted-light": "#9999A3",
        primary: {
          DEFAULT: "#FCD116",
          hover: "#E6BD14",
          foreground: "#0A0A0B",
        },
        success: "#00A651",
        alert: "#CE1126",
        pos: {
          gk: "#8B5CF6",
          def: "#10B981",
          mid: "#3B82F6",
          att: "#EF4444",
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },
      fontSize: {
        "display-2xl": ["5rem", { lineHeight: "1.05", fontWeight: "600" }],
        "display-xl": ["3.5rem", { lineHeight: "1.1", fontWeight: "600" }],
        "display-lg": ["2.5rem", { lineHeight: "1.15", fontWeight: "600" }],
      },
      borderRadius: {
        card: "12px",
        button: "8px",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
