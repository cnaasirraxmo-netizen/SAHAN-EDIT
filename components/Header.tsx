import React from 'react';
import { Bars3Icon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { AnimatedLogo } from './common/AnimatedLogo';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-800/90 backdrop-blur-md border-b border-zinc-700 z-50 flex items-center px-4 justify-between">
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick} className="text-zinc-300 hover:text-white lg:hidden">
                    <span className="sr-only">Open menu</span>
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <div className="hidden lg:block">
                  <AnimatedLogo />
                </div>
            </div>
            
            <div className="flex-1 flex justify-center px-4">
                <div className="w-full max-w-lg relative">
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-full py-2 pl-5 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                         <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500" />
                    </div>
                </div>
            </div>

            <div className="flex items-center">
                <button className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-700">
                    <span className="sr-only">User profile</span>
                    <UserCircleIcon className="w-8 h-8" />
                </button>
            </div>
        </header>
    );
};