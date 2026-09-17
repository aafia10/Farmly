"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [actualTheme, setActualTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("farmly_theme") as Theme) || "dark";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let resolved: "light" | "dark" = "dark";

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      resolved = media.matches ? "dark" : "light";

      const handler = (e: MediaQueryListEvent) => {
        const next = e.matches ? "dark" : "light";
        setActualTheme(next);
        if (next === "dark") {
          root.classList.add("dark");
          root.classList.remove("light");
        } else {
          root.classList.add("light");
          root.classList.remove("dark");
        }
      };

      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    } else {
      resolved = theme;
    }

    setActualTheme(resolved);

    if (resolved === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("farmly_theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
