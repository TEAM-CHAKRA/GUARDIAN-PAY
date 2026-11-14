'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, DICTIONARY } from './i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof DICTIONARY['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('guardianpay_lang') as Language;
        if (saved && (saved === 'en' || saved === 'hi')) {
          return saved;
        }
      }
    } catch {
      // Ignore
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('guardianpay_lang', lang);
    } catch {
      // Ignore
    }
  };

  const t = (key: keyof typeof DICTIONARY['en']): string => {
    return DICTIONARY[language][key] || DICTIONARY.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return fallback if used outside provider
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: (key: keyof typeof DICTIONARY['en']) => DICTIONARY.en[key] || String(key),
    };
  }
  return context;
}
