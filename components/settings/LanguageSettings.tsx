import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../contexts/LanguageContext';
// FIX: Import translations to define a type for valid language codes.
import { translations } from '../../services/i18n';

// FIX: Define a type for valid language codes based on available translations.
type LanguageCode = keyof typeof translations;

const languages: { code: LanguageCode, name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'so', name: 'Soomaali' },
    { code: 'ar', name: 'العربية' },
];

export const LanguageSettings: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();
    const [feedbackMessage, setFeedbackMessage] = useState('');

    const handleSelectLanguage = (code: LanguageCode) => {
        setLanguage(code);
        setFeedbackMessage(t('language_saved_feedback'));
        setTimeout(() => setFeedbackMessage(''), 3000); // Hide message after 3 seconds
    };

    return (
        <div className="space-y-2 py-4">
             {feedbackMessage && (
                <div className="mb-4 p-3 bg-green-900/50 border border-green-500/30 text-green-300 text-center rounded-lg">
                    {feedbackMessage}
                </div>
            )}
            {languages.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className="w-full flex justify-between items-center p-4 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors border border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-pressed={language === lang.code}
                >
                    <span className="text-white text-lg">{lang.name}</span>
                    {language === lang.code && <CheckIcon className="w-6 h-6 text-indigo-400" />}
                </button>
            ))}
        </div>
    );
}
