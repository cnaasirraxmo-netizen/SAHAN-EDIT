import React from 'react';
import { MagnifyingGlassIcon, UserCircleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { AnimatedLogo } from './common/AnimatedLogo';
import { HeaderMenu } from './common/HeaderMenu';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Page } from '../types';

interface HeaderProps {
    page: Page;
    setPage: (page: Page) => void;
    onProfileClick: () => void;
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ page, setPage, onProfileClick, onMenuClick }) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    
    const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : null;

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-800/90 backdrop-blur-md border-b border-zinc-700 z-50 flex items-center px-4 justify-between">
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700 lg:hidden"
                    aria-label="Open menu"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <div className="hidden lg:block">
                     <AnimatedLogo />
                </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center">
                <HeaderMenu page={page} setPage={setPage} />
            </div>
            
            <div className="flex-1 flex justify-center px-4 lg:hidden">
                 <AnimatedLogo />
            </div>

            <div className="flex items-center gap-2">
                 <div className="w-full max-w-xs relative hidden md:block">
                    <input 
                        type="text" 
                        placeholder={t('header_search_placeholder')}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-2 pl-5 pr-12 rtl:pl-12 rtl:pr-5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center pr-4 rtl:pl-4 rtl:pr-0 pointer-events-none">
                         <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500" />
                    </div>
                </div>
                <button onClick={onProfileClick} className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700">
                    <span className="sr-only">User profile</span>
                    {currentUser && userInitial ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                            {userInitial}
                        </div>
                    ) : (
                        <UserCircleIcon className="w-8 h-8" />
                    )}
                </button>
            </div>
        </header>
    );
};