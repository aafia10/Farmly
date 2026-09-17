"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, SupportedLanguage } from "@/lib/i18n/languages";
import { DICTIONARIES } from "@/lib/i18n/dictionaries";

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  languages: SupportedLanguage[];
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("farmly_lang");
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLanguage = (code: string) => {
    setLanguageState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("farmly_lang", code);
      document.documentElement.lang = code;
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = DICTIONARIES[language] || DICTIONARIES[DEFAULT_LANGUAGE];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to English
    if (DICTIONARIES[DEFAULT_LANGUAGE] && DICTIONARIES[DEFAULT_LANGUAGE][key]) {
      return DICTIONARIES[DEFAULT_LANGUAGE][key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language: mounted ? language : DEFAULT_LANGUAGE,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
