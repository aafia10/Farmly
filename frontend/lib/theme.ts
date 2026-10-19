export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "farmly_theme";
export const DEFAULT_THEME: Theme = "light";

/**
 * Inlined in <head> so the first paint already uses the saved theme (no flash).
 * Must resolve themes the same way as ThemeProvider in contexts/theme-context.tsx.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t!=="light"&&t!=="dark"&&t!=="system")t="${DEFAULT_THEME}";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.remove(d?"light":"dark");r.classList.add(d?"dark":"light");}catch(e){}})();`;
