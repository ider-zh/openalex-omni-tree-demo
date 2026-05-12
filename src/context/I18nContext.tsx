import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Translations = Record<string, string>;
export type TFunction = (key: string, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: TFunction;
  loading: boolean;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
  loading: true,
});

// In-memory cache for loaded translations
const translationCache: Record<string, Translations> = {};

async function loadTranslation(lang: string): Promise<Translations> {
  if (translationCache[lang]) return translationCache[lang];
  try {
    const res = await fetch(`/data/i18n/${lang}.json`);
    if (!res.ok) throw new Error(`Failed to load ${lang} translations`);
    const data = await res.json();
    translationCache[lang] = data;
    return data;
  } catch (err) {
    console.error(`Failed to load translation for ${lang}:`, err);
    return {};
  }
}

// Load English as fallback
let fallbackDict: Translations = {};
loadTranslation('en').then(d => { fallbackDict = d; });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('openalex-lang');
    return saved || 'en';
  });
  const [dict, setDict] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('openalex-lang', lang);
    document.documentElement.lang = lang;

    let cancelled = false;
    setLoading(true);
    loadTranslation(lang).then(loaded => {
      if (!cancelled) {
        setDict(loaded);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [lang]);

  const t = useCallback<TFunction>((key, params) => {
    const raw = dict[key] ?? fallbackDict[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
  }, [dict]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, loading }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
