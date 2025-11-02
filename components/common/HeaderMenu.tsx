import React from 'react';
import { Page } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderMenuProps {
    page: Page;
    setPage: (page: Page) => void;
}

const NavLink: React.FC<{
    text: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ text, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`relative px-4 py-2 text-sm font-semibold transition-colors duration-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            isActive
                ? 'text-white'
                : 'text-zinc-400 hover:text-white'
        }`}
    >
        {text}
        {isActive && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full"></span>
        )}
    </button>
);

export const HeaderMenu: React.FC<HeaderMenuProps> = ({ page, setPage }) => {
    const { t } = useLanguage();

    const mainPages = {
        LOGO: [Page.LOGO_GEN, Page.LOGO_EDIT],
        IMAGE: [Page.IMAGE_GEN, Page.IMAGE_EDIT],
        SCRIPT: [Page.VIDEO_PROMPT_GEN],
        VIDEO: [Page.VIDEO_GEN, Page.VIDEO_EDIT],
        ANALYZE: [Page.VIDEO_ANALYZER],
    };

    const navItems = [
        {
            pages: mainPages.LOGO,
            target: Page.LOGO_GEN,
            label: t('header_nav_logo'),
        },
        {
            pages: mainPages.IMAGE,
            target: Page.IMAGE_GEN,
            label: t('header_nav_image'),
        },
        {
            pages: mainPages.SCRIPT,
            target: Page.VIDEO_PROMPT_GEN,
            label: t('header_nav_script'),
        },
        {
            pages: mainPages.VIDEO,
            target: Page.VIDEO_GEN,
            label: t('header_nav_video'),
        },
        {
            pages: mainPages.ANALYZE,
            target: Page.VIDEO_ANALYZER,
            label: t('header_nav_analyzer'),
        },
    ];

    return (
        <nav className="flex items-center gap-2">
            {navItems.map(item => (
                <NavLink 
                    key={item.target}
                    text={item.label}
                    isActive={item.pages.includes(page)}
                    onClick={() => setPage(item.target)}
                />
            ))}
        </nav>
    );
};
