import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Poppins", "system-ui", "sans-serif"],
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        background: "var(--farmly-bg)",
        foreground: "var(--farmly-foreground)",
        "farmly-bg":              "var(--farmly-bg)",
        "farmly-foreground":      "var(--farmly-foreground)",
        "farmly-primary":         "#c1121f",
        "farmly-primary-hover":   "#a50e1a",
        "farmly-accent":          "#c1121f",
        "farmly-accent-light":    "#e63946",
        "farmly-surface":         "var(--farmly-surface)",
        "farmly-surface-elevated":"var(--farmly-surface-elevated)",
        "farmly-surface-card":    "var(--farmly-surface-card)",
        "farmly-muted":           "var(--farmly-muted)",
        "farmly-muted-dark":      "var(--farmly-muted-dark)",
        "farmly-border":          "var(--farmly-border)",
        "farmly-input-bg":        "var(--farmly-input-bg)",
        "farmly-input-border":    "var(--farmly-input-border)",
        "farmly-input-text":      "var(--farmly-input-text)",
        "farmly-table-header":    "var(--farmly-table-header)",
        "farmly-table-hover":     "var(--farmly-table-row-hover)",
      },
      borderRadius: {
        lg: "var(--radius, 0.625rem)",
        md: "calc(var(--radius, 0.625rem) - 2px)",
        sm: "calc(var(--radius, 0.625rem) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in":   "fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-in":  "slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
