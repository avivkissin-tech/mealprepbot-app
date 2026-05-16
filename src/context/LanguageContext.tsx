'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { he } from '@/translations/he';
import { en } from '@/translations/en';
import { Locale } from '@/types';

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>(null!);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('he');

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    try {
      localStorage.setItem('locale', l);
    } catch {}
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('locale') as Locale | null;
      if (saved === 'he' || saved === 'en') {
        setLocale(saved);
      }
    } catch {}
  }, []);

  const t = (key: string): string => {
    const dict = locale === 'he' ? he : en;
    return dict[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
