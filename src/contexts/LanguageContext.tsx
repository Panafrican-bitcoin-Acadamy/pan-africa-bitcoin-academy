"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** English or Tigrinya — persisted for future i18n */
export type SiteLanguage = "en" | "ti";

const STORAGE_KEY = "paba-language";

function readStoredLanguage(): SiteLanguage {
  if (typeof window === "undefined") return "en";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "ti") {
      // Tigrinya UI not live yet — default to English and clear stale preference
      localStorage.setItem(STORAGE_KEY, "en");
      return "en";
    }
    if (raw === "en") return "en";
  } catch {
    /* ignore */
  }
  return "en";
}

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (lang: SiteLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>(() =>
    readStoredLanguage()
  );

  useEffect(() => {
    document.documentElement.lang = language === "ti" ? "ti" : "en";
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language]);

  const setLanguage = useCallback((lang: SiteLanguage) => {
    setLanguageState(lang);
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
