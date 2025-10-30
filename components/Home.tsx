import React from 'react';
import { Page } from '../types';
import { SparklesIcon, PaintBrushIcon, VideoCameraIcon, FilmIcon, Cog6ToothIcon, ArrowRightIcon, SwatchIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

interface HomeProps {
    setPage: (page: Page) => void;
}

const ToolCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
}> = ({ icon, title, description, onClick }) => (
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
                Start Creating
                <ArrowRightIcon className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    </div>
);


export const Home: React.FC<HomeProps> = ({ setPage }) => {
    return (
        <div className="space-y-10">
            <header className="text-left">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                    Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">SAHAN edit</span>
                </h1>
                <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
                    Your all-in-one AI-powered creative suite. Generate logos, edit images, and create stunning videos from a simple idea. Choose a tool to begin.
                </p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ToolCard
                    icon={<SparklesIcon className="w-6 h-6" />}
                    title="Generate Logo"
                    description="Create a unique, professional logo for your brand in seconds."
                    onClick={() => setPage(Page.LOGO_GEN)}
                />
                 <ToolCard
                    icon={<SwatchIcon className="w-6 h-6" />}
                    title="Edit Logo"
                    description="Upload your logo to generate new variations and styles."
                    onClick={() => setPage(Page.LOGO_EDIT)}
                />
                <ToolCard
                    icon={<PaintBrushIcon className="w-6 h-6" />}
                    title="Edit Image"
                    description="Upload an image and use AI to modify it with text prompts."
                    onClick={() => setPage(Page.IMAGE_EDIT)}
                />
                 <ToolCard
                    icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
                    title="Muuqaal Diyaarin"
                    description="Generate video scripts for platforms like TikTok and YouTube from a topic."
                    onClick={() => setPage(Page.VIDEO_PROMPT_GEN)}
                />
                 <ToolCard
                    icon={<VideoCameraIcon className="w-6 h-6" />}
                    title="Generate Video"
                    description="Bring your ideas to life by generating video clips from text or an image."
                    onClick={() => setPage(Page.VIDEO_GEN)}
                />
                 <ToolCard
                    icon={<FilmIcon className="w-6 h-6" />}
                    title="Video Edit"
                    description="Create a new story by generating sequential scenes from your video's first frame."
                    onClick={() => setPage(Page.VIDEO_EDIT)}
                />
                 <ToolCard
                    icon={<Cog6ToothIcon className="w-6 h-6" />}
                    title="Settings"
                    description="Configure application settings and preferences (coming soon)."
                    onClick={() => setPage(Page.SETTINGS)}
                />
            </div>
        </div>
    );
};