import React, { useState, useEffect } from 'react';
import { generateVideoScript } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ClipboardDocumentListIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Page } from '../types';
import { ApiKeyError } from './common/ApiKeyError';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllScripts, StoredScript } from '../services/idb';


interface VideoPromptGeneratorProps {
    setPage: (page: Page) => void;
}

export const VideoPromptGenerator: React.FC<VideoPromptGeneratorProps> = ({ setPage }) => {
    const { t } = useLanguage();
    const [topic, setTopic] = useState<string>(t('video_script_default_topic'));
    const [platform, setPlatform] = useState<'TikTok' | 'YouTube'>('TikTok');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedScript, setGeneratedScript] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    
    const [history, setHistory] = useState<StoredScript[]>([]);
    const [activeScriptId, setActiveScriptId] = useState<string | null>(null);

    useEffect(() => {
        const loadHistory = async () => {
            const scripts = await getAllScripts();
            setHistory(scripts);
        };
        loadHistory();
    }, []);

    const platforms = [
        { value: 'TikTok', label: t('video_script_platform_tiktok') },
        { value: 'YouTube', label: t('video_script_platform_youtube') },
    ];

    const handleGenerate = async () => {
        if (!topic) {
            setError(t('error_enter_topic'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedScript(null);
        setIsCopied(false);
        try {
            const newScriptEntry = await generateVideoScript(topic, platform);
            setGeneratedScript(newScriptEntry.script);
            // Add to history state and set as active
            setHistory(prev => [newScriptEntry, ...prev]);
            setActiveScriptId(newScriptEntry.id);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (generatedScript) {
            navigator.clipboard.writeText(generatedScript);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        }
    };

    const handleSelectHistory = (script: StoredScript) => {
        setTopic(script.topic);
        setPlatform(script.platform);
        setGeneratedScript(script.script);
        setActiveScriptId(script.id);
        setError(null);
        setIsCopied(false);
    };

    const handleNewScript = () => {
        setTopic(t('video_script_default_topic'));
        setPlatform('TikTok');
        setGeneratedScript(null);
        setActiveScriptId(null);
        setError(null);
        setIsCopied(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">{t('video_script_title')}</h2>
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* History Sidebar */}
                <aside className="w-full md:w-1/3 lg:w-1/4">
                    <div className="sticky top-24">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-zinc-300">{t('video_script_history_title')}</h3>
                            <button 
                                onClick={handleNewScript}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
                                title={t('video_script_new_script')}
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>{t('video_script_new_script')}</span>
                            </button>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 max-h-[65vh] overflow-y-auto">
                            {isLoading && history.length === 0 ? (
                                <div className="p-4"><LoadingSpinner /></div>
                            ) : history.length > 0 ? (
                                <ul className="divide-y divide-zinc-700">
                                    {history.map(item => (
                                        <li key={item.id}>
                                            <button 
                                                onClick={() => handleSelectHistory(item)}
                                                className={`w-full text-left p-3 hover:bg-zinc-700/50 transition-colors ${activeScriptId === item.id ? 'bg-indigo-900/40' : ''}`}
                                            >
                                                <p className={`font-semibold truncate text-sm ${activeScriptId === item.id ? 'text-indigo-400' : 'text-zinc-200'}`}>{item.topic}</p>
                                                <p className="text-xs text-zinc-400 mt-1">{item.platform} - {new Date(item.createdAt).toLocaleDateString()}</p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-8 text-center text-zinc-500">
                                    <p>{t('video_script_no_history')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
                
                {/* Main Content */}
                <main className="w-full md:w-2/3 lg:w-3/4">
                    <div className="flex flex-col gap-4">
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={t('video_script_prompt_placeholder')}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-28 resize-none"
                            disabled={isLoading}
                        />
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <div className="w-full sm:w-auto">
                                <label htmlFor="platform" className="block text-sm font-medium text-zinc-300 mb-1">{t('video_script_platform_label')}</label>
                                <select
                                    id="platform"
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value as 'TikTok' | 'YouTube')}
                                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    disabled={isLoading}
                                >
                                    {platforms.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full sm:w-auto mt-2 sm:mt-0 sm:self-end bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? t('button_generating_script') : t('button_generate_script')}
                            </button>
                        </div>
                    </div>

                    {error && (
                        error.includes("API Key not found") ?
                        <ApiKeyError message={error} setPage={setPage} /> :
                        <p className="mt-4 text-red-400 text-center">{error}</p>
                    )}

                    <div className="mt-6 min-h-[400px] bg-zinc-800/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-zinc-700 relative">
                        {isLoading ? (
                            <LoadingSpinner message={t('loading_generating_script')} />
                        ) : generatedScript ? (
                            <div className="p-4 sm:p-6 w-full h-full">
                               <button 
                                   onClick={handleCopy} 
                                   className="absolute top-3 right-3 rtl:left-3 rtl:right-auto p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors text-zinc-300"
                                   aria-label={t('button_copy_script')}
                                >
                                   {isCopied ? t('button_copied') : <ClipboardDocumentListIcon className="w-5 h-5"/>}
                               </button>
                               <pre className="text-zinc-200 whitespace-pre-wrap font-sans text-sm leading-relaxed overflow-auto h-[60vh] p-2 text-left rtl:text-right">
                                   {generatedScript}
                               </pre>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-zinc-600"/>
                                <p className="mt-2 text-zinc-500">{t('video_script_output_placeholder')}</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};