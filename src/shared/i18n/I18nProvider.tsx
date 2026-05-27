import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LOCALES, Locale, TranslationKey, translations } from "./translations";

interface I18nContextValue {
  locale: Locale;
  locales: Locale[];
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_STORAGE_KEY = "deinweg_locale";

function readStoredLocale(): Locale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (saved === "de" || saved === "ua") {
    return saved;
  }
  if (saved === "uk") {
    return "ua";
  }
  return "ua";
}

interface I18nProviderProps {
  children: React.ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps): JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      locales: LOCALES,
      setLocale: (next) => {
        localStorage.setItem(LOCALE_STORAGE_KEY, next);
        setLocaleState(next);
      },
      t: (key) => translations[locale][key]
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }

  return context;
}
