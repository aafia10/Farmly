import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#050806",
        foreground: "#FFFFFF",
        "farmly-bg": "#050806",
        "farmly-dark-green": "#0B3D2E",
        "farmly-primary": "#145C43",
        "farmly-primary-hover": "#1A7254",
        "farmly-accent": "#2F8F68",
        "farmly-accent-light": "#3EB081",
        "farmly-surface": "#0B120F",
        "farmly-surface-elevated": "#121C18",
        "farmly-surface-card": "#0E1713",
        "farmly-muted": "#D1D5DB",
        "farmly-muted-dark": "#9CA3AF",
        "farmly-border": "rgba(255, 255, 255, 0.10)",
        "farmly-border-focus": "rgba(47, 143, 104, 0.5)",
      },
      borderRadius: {
        lg: "var(--radius, 0.75rem)",
        md: "calc(var(--radius, 0.75rem) - 2px)",
        sm: "calc(var(--radius, 0.75rem) - 4px)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-subtle": "pulse-subtle 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
