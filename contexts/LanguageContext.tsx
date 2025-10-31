import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { translations } from '../services/i18n';

const LANGUAGE_STORAGE_KEY = 'sahan-edit-language';

type LanguageCode = keyof typeof translations;
type Translations = typeof translations.en;

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (language: LanguageCode) => void;
    t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): LanguageCode => {
    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang && storedLang in translations) {
        return storedLang as LanguageCode;
    }
    const browserLang = navigator.language.split('-')[0];
    if (browserLang in translations) {
        return browserLang as LanguageCode;
    }
    return 'en';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);

    useEffect(() => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const setLanguage = (lang: LanguageCode) => {
        setLanguageState(lang);
    };
    
    const t = (key: keyof Translations): string => {
        return translations[language][key] || translations.en[key] || String(key);
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
