import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { AspectRatio, Page } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ArrowDownTrayIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { ApiKeyError } from './common/ApiKeyError';

const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '16:9', label: 'Landscape' },
    { value: '1:1', label: 'Square' },
    { value: '9:16', label: 'Portrait' },
    { value: '4:3', label: 'Standard' },
    { value: '3:4', label: 'Tall' },
];

const styles = [
    { name: 'Cinematic', description: 'Dramatic lighting, movie-like quality.' },
    { name: 'Anime', description: 'Japanese animation style, vibrant colors.' },
    { name: 'Realistic', description: 'True-to-life details and textures.' },
    { name: 'Vintage', description: 'Old-fashioned, nostalgic look.' },
    { name: 'Photorealistic', description: 'Indistinguishable from a real photo.' },
    { name: 'Digital Art', description: 'Modern, illustrative style.' },
    { name: 'Cyberpunk', description: 'Futuristic, neon-lit aesthetic.' },
    { name: 'Fantasy', description: 'Magical, otherworldly scenes.' },
];

interface CinematicImageGeneratorProps {
    setPage: (page: Page) => void;
}

export const CinematicImageGenerator: React.FC<CinematicImageGeneratorProps> = ({ setPage }) => {
    const [prompt, setPrompt] = useState<string>('A majestic castle on a cliff overlooking a stormy sea');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [selectedStyle, setSelectedStyle] = useState<string>(styles[0].name);
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
            const fullPrompt = `${selectedStyle} style, high resolution, ${prompt}`;
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
        const fileName = prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 50) || 'sahan-generated-image';
        link.download = `${fileName}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Image Generator</h2>
            <div className="flex flex-col gap-6">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter a detailed prompt for your image..."
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-28 resize-none"
                    disabled={isLoading}
                />
                
                <div>
                    <h3 className="text-lg font-semibold text-zinc-300 mb-3">Choose a Style</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {styles.map(style => (
                            <button
                                key={style.name}
                                onClick={() => setSelectedStyle(style.name)}
                                className={`p-3 text-left rounded-lg border-2 transition-all duration-200 ${selectedStyle === style.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
                                disabled={isLoading}
                            >
                                <p className={`font-bold ${selectedStyle === style.name ? 'text-indigo-400' : 'text-zinc-200'}`}>{style.name}</p>
                                <p className="text-xs text-zinc-400 mt-1">{style.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

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
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                </div>
            </div>

            {error && (
                error.includes("API Key not found") ?
                <ApiKeyError message={error} setPage={setPage} /> :
                <p className="text-red-400 text-center">{error}</p>
            )}
            
            <div className="mt-6 min-h-[400px] bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                {isLoading ? (
                    <LoadingSpinner message="Conjuring pixels from the digital ether..." />
                ) : generatedImage ? (
                    <img src={generatedImage} alt="Generated Art" className="rounded-lg max-w-full max-h-[70vh] object-contain" />
                ) : (
                    <div className="text-center p-4">
                        <PhotoIcon className="w-16 h-16 mx-auto text-zinc-600"/>
                        <p className="mt-2 text-zinc-500">Your generated image will appear here.</p>
                    </div>
                )}
            </div>
            
            {generatedImage && !isLoading && (
                <div className="flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download Image
                    </button>
                </div>
            )}
        </div>
    );
};