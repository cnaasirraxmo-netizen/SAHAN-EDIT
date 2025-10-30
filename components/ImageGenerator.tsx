import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { AspectRatio } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'Square' },
    { value: '16:9', label: 'Landscape' },
    { value: '9:16', label: 'Portrait' },
];

export const GenerateLogo: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A minimalist logo for a tech startup called "SAHAN", vector, on a clean white background');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const fullPrompt = `logo design, vector art, minimalist, white background: ${prompt}`;
            const imageUrl = await generateImage(fullPrompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage;
        const fileName = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'sahan-logo';
        link.download = `${fileName}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Logo Generator</h2>
            <div className="flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a detailed prompt for your logo..."
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-28 resize-none"
                    disabled={isLoading}
                />
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-zinc-300 mb-1">Aspect Ratio</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={isLoading}
                        >
                            {aspectRatios.map(ar => (
                                <option key={ar.value} value={ar.value}>{ar.label} ({ar.value})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full sm:w-auto mt-2 sm:mt-0 sm:self-end bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>

            {error && <p className="text-red-400 text-center">{error}</p>}

            <div className="mt-6 min-h-[300px] bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                {isLoading ? (
                    <LoadingSpinner message="Creating your masterpiece..." />
                ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated Logo" className="rounded-lg max-w-full max-h-[60vh] object-contain" />
                ) : (
                    <p className="text-zinc-500">Your generated logo will appear here.</p>
                )}
            </div>
            
            {generatedImage && !isLoading && (
                <div className="flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download Logo
                    </button>
                </div>
            )}
        </div>
    );
};