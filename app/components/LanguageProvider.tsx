"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Lang } from "../site-data";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    const stored = window.localStorage.getItem("jetkiz-language");
    const timer = window.setTimeout(() => {
      if (stored === "ru" || stored === "kz") setLangState(stored);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "kz" ? "kk" : "ru";
  }, [lang]);

  const value = useMemo(
    () => ({
      lang,
      setLang: (next: Lang) => {
        setLangState(next);
        window.localStorage.setItem("jetkiz-language", next);
      },
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}
