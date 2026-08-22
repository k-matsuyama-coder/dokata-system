"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import ja from "@/locales/ja.cleaned.json";
import en from "@/locales/en.json";

type Language = "ja" | "en";

type Messages = Record<string, string>;
function normalizeMessages(source: Record<string, unknown>): Messages {
  return Object.entries(source).reduce<Messages>((result, [key, value]) => {
    if (typeof value === "string") {
      result[key] = value;
    }

    return result;
  }, {});
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const LANGUAGE_STORAGE_KEY = "app_language";

const messages: Record<Language, Messages> = {
  ja: normalizeMessages(ja),
  en: normalizeMessages(en),
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] = useState<Language>("ja");

  useEffect(() => {
    const saved = window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY
    ) as Language | null;

    if (saved === "ja" || saved === "en") {
      setLanguageState(saved);
      return;
    }

    const browserLanguage = navigator.language.toLowerCase();

    if (browserLanguage.startsWith("ja")) {
      setLanguageState("ja");
      return;
    }

    setLanguageState("en");
  }, []);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
  }, []);

  const t = useCallback(
    (key: string) => {
      return messages[language][key] ?? messages.ja[key] ?? key;
    },
    [language]
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}