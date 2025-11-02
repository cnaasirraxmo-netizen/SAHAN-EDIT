import React from 'react';
import { Page } from '../types';
import { SparklesIcon, PaintBrushIcon, VideoCameraIcon, FilmIcon, Cog6ToothIcon, ArrowRightIcon, SwatchIcon, ClipboardDocumentListIcon, PhotoIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../contexts/LanguageContext';
// FIX: Import translations to define a type for translation keys.
import { translations } from '../services/i18n';

// FIX: Define a type for valid translation keys.
type TranslationKey = keyof typeof translations.en;

interface HomeProps {
    setPage: (page: Page) => void;
}

const ToolCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    t: (key: string) => string;
}> = ({ icon, title, description, onClick, t }) => (
    <div 
        onClick={onClick}
        className="group relative bg-zinc-800 p-6 rounded-xl border border-zinc-700 hover:border-indigo-500/50 hover:bg-zinc-700/50 transition-all duration-300 cursor-pointer overflow-hidden"
    >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-indigo-600/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="relative">
            <div className="mb-4 w-12 h-12 bg-zinc-900 rounded-lg flex items-center justify-center border border-zinc-700 text-indigo-400">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-zinc-400 mb-4">{description}</p>
            <div className="flex items-center text-indigo-400 font-semibold">
                {t('home_card_cta')}
                <ArrowRightIcon className="w-4 h-4 ml-2 rtl:mr-2 rtl:ml-0 transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
            </div>
        </div>
    </div>
);


export const Home: React.FC<HomeProps> = ({ setPage }) => {
    const { t } = useLanguage();

    // FIX: Add explicit type to the tools array to ensure keys are valid translation keys.
    const tools: {
        page: Page;
        icon: React.ReactNode;
        titleKey: TranslationKey;
        descriptionKey: TranslationKey;
    }[] = [
        {
            page: Page.VIDEO_PROMPT_GEN,
            icon: <ClipboardDocumentListIcon className="w-6 h-6" />,
            titleKey: 'home_card_video_script_title',
            descriptionKey: 'home_card_video_script_desc',
        },
        {
            page: Page.LOGO_EDIT,
            icon: <SwatchIcon className="w-6 h-6" />,
            titleKey: 'home_card_logo_edit_title',
            descriptionKey: 'home_card_logo_edit_desc',
        },
        {
            page: Page.LOGO_GEN,
            icon: <SparklesIcon className="w-6 h-6" />,
            titleKey: 'home_card_logo_gen_title',
            descriptionKey: 'home_card_logo_gen_desc',
        },
         {
            page: Page.VIDEO_ANALYZER,
            icon: <DocumentMagnifyingGlassIcon className="w-6 h-6" />,
            titleKey: 'home_card_video_analyzer_title',
            descriptionKey: 'home_card_video_analyzer_desc',
        },
        {
            page: Page.VIDEO_EDIT,
            icon: <FilmIcon className="w-6 h-6" />,
            titleKey: 'home_card_video_edit_title',
            descriptionKey: 'home_card_video_edit_desc',
        },
        {
            page: Page.IMAGE_GEN,
            icon: <PhotoIcon className="w-6 h-6" />,
            titleKey: 'home_card_image_gen_title',
            descriptionKey: 'home_card_image_gen_desc',
        },
        {
            page: Page.IMAGE_EDIT,
            icon: <PaintBrushIcon className="w-6 h-6" />,
            titleKey: 'home_card_image_edit_title',
            descriptionKey: 'home_card_image_edit_desc',
        },
        {
            page: Page.VIDEO_GEN,
            icon: <VideoCameraIcon className="w-6 h-6" />,
            titleKey: 'home_card_video_gen_title',
            descriptionKey: 'home_card_video_gen_desc',
        },
        {
            page: Page.SETTINGS,
            icon: <Cog6ToothIcon className="w-6 h-6" />,
            titleKey: 'home_card_settings_title',
            descriptionKey: 'home_card_settings_desc',
        }
    ];

    return (
        <div className="space-y-10">
            <header className="text-left rtl:text-right">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                    {t('home_title_1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">SAHAN edit</span>
                </h1>
                <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
                    {t('home_description')}
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map(tool => (
                    <ToolCard
                        key={tool.page}
                        icon={tool.icon}
                        title={t(tool.titleKey)}
                        description={t(tool.descriptionKey)}
                        onClick={() => setPage(tool.page)}
                        t={t}
                    />
                ))}
            </div>
        </div>
    );
};