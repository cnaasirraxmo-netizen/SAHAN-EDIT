import React, { useState } from 'react';
import { generateVideoScript } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const platforms = [
    { value: 'TikTok', label: 'TikTok (Short)' },
    { value: 'YouTube', label: 'YouTube (Long)' },
];

export const VideoPromptGenerator: React.FC = () => {
    const [topic, setTopic] = useState<string>('sheeko caruureed oo xiiso leh'); // "an interesting children's story"
    const [platform, setPlatform] = useState<'TikTok' | 'YouTube'>('TikTok');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedScript, setGeneratedScript] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const handleGenerate = async () => {
        if (!topic) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedScript(null);
        setIsCopied(false);
        try {
            const script = await generateVideoScript(topic, platform);
            setGeneratedScript(script);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
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
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Muuqaal Diyaarin (Video Script Generator)</h2>
            <div className="flex flex-col gap-4">
                <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Geli mawduuca muuqaalka..."
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-28 resize-none"
                    disabled={isLoading}
                />
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="platform" className="block text-sm font-medium text-zinc-300 mb-1">Platform</label>
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
                        {isLoading ? 'Diyaarinayaa...' : 'Diyaari Qoraal'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-center">{error}</p>}

            <div className="mt-6 min-h-[400px] bg-zinc-800/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-zinc-700 relative">
                {isLoading ? (
                    <LoadingSpinner message="Waanu diyaarinaynaa qoraalkaaga..." />
                ) : generatedScript ? (
                    <div className="p-4 sm:p-6 w-full h-full">
                       <button 
                           onClick={handleCopy} 
                           className="absolute top-3 right-3 p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors text-zinc-300"
                           aria-label="Copy script"
                        >
                           {isCopied ? 'Copied!' : <ClipboardDocumentListIcon className="w-5 h-5"/>}
                       </button>
                       <pre className="text-zinc-200 whitespace-pre-wrap font-sans text-sm leading-relaxed overflow-auto h-[60vh] p-2">
                           {generatedScript}
                       </pre>
                    </div>
                ) : (
                    <div className="text-center p-4">
                        <ClipboardDocumentListIcon className="w-12 h-12 mx-auto text-zinc-600"/>
                        <p className="mt-2 text-zinc-500">Qoraalka muuqaalkaagu halkan ayuu kasoo muuqan doonaa.</p>
                    </div>
                )}
            </div>
        </div>
    );
};