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

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (lang: SiteLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "en") {
        setLanguageState("en");
      } else if (raw === "ti") {
        // Tigrinya UI not live yet — default to English and clear stale preference
        setLanguageState("en");
        localStorage.setItem(STORAGE_KEY, "en");
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = language === "ti" ? "ti" : "en";
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language, ready]);

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
