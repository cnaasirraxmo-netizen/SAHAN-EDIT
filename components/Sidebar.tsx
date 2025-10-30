import React from 'react';
import { Page } from '../types';
import { HomeIcon, SparklesIcon, PaintBrushIcon, VideoCameraIcon, FilmIcon, Cog6ToothIcon, SwatchIcon, ClipboardDocumentListIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface SidebarProps {
    page: Page;
    setPage: (page: Page) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
    icon: React.ReactNode;
    text: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, text, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full text-left px-4 py-3 text-sm rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-indigo-600 text-white font-semibold shadow-lg'
                : 'text-zinc-300 hover:bg-zinc-700 hover:text-white'
        }`}
    >
        <span className="w-6 h-6 mr-3">{icon}</span>
        {text}
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ page, setPage, isOpen, setIsOpen }) => {
    
    const navItems = [
        { id: Page.HOME, text: 'Home', icon: <HomeIcon /> },
        { id: Page.LOGO_GEN, text: 'Generate Logo', icon: <SparklesIcon /> },
        { id: Page.LOGO_EDIT, text: 'Edit Logo', icon: <SwatchIcon /> },
        { id: Page.IMAGE_GEN, text: 'Generate Image', icon: <PhotoIcon /> },
        { id: Page.IMAGE_EDIT, text: 'Edit Image', icon: <PaintBrushIcon /> },
        { id: Page.VIDEO_PROMPT_GEN, text: 'Muuqaal Diyaarin', icon: <ClipboardDocumentListIcon /> },
        { id: Page.VIDEO_GEN, text: 'Generate Video', icon: <VideoCameraIcon /> },
        { id: Page.VIDEO_EDIT, text: 'Video Edit', icon: <FilmIcon /> },
        { id: Page.SETTINGS, text: 'Settings', icon: <Cog6ToothIcon /> },
    ];

    return (
        <>
            <aside className={`fixed top-0 left-0 h-full w-64 bg-zinc-800 text-zinc-300 border-r border-zinc-700 z-40 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="flex flex-col h-full">
                    {/* This div pushes the content below the fixed header */}
                    <div className="h-16 flex-shrink-0 lg:hidden"></div>
                    <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
                        {navItems.map(item => (
                            <NavLink
                                key={item.id}
                                icon={item.icon}
                                text={item.text}
                                isActive={page === item.id}
                                onClick={() => setPage(item.id)}
                            />
                        ))}
                    </nav>
                    <div className="p-4 mt-auto text-center text-xs text-zinc-500">
                        <p>Powered by SAHAN TEAM</p>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile view */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    aria-hidden="true"
                ></div>
            )}
        </>
    );
};