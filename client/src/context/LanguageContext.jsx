import { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, translateCategory } from '../constants/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('shoply_lang') || 'fr';
  });

  const setLanguage = (lang) => {
    if (['fr', 'ar', 'en'].includes(lang)) {
      setLanguageState(lang);
      localStorage.setItem('shoply_lang', lang);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key, params = {}) => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.fr;
    let text = dict[key] || TRANSLATIONS.fr[key] || key;
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return text;
  };

  const tCat = (catName) => {
    return translateCategory(catName, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tCat, isRTL: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
