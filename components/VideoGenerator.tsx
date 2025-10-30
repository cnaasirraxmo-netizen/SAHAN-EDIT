import React, { useState, useRef, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { VideoAspectRatio, VideoResolution } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ApiKeySelector } from './common/ApiKeySelector';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const fileToGenerativePart = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return { base64, mimeType: file.type };
};

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A majestic eagle soaring through a dramatic mountain range at sunset.');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [resolution, setResolution] = useState<VideoResolution>('720p');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);

    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            // @ts-ignore
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                // @ts-ignore
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            } else {
                // Fallback for environments where aistudio is not available
                console.warn('aistudio API not found. Assuming API key is set via environment.');
                setApiKeySelected(true);
            }
        };
        checkKey();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        setProgressMessage('Preparing your request...');
        
        try {
            let imagePart: { base64: string; mimeType: string } | null = null;
            if (imageFile) {
                imagePart = await fileToGenerativePart(imageFile);
            }
            
            const { url } = await generateVideo(prompt, imagePart, aspectRatio, resolution, setProgressMessage);
            setGeneratedVideo(url);
            setProgressMessage('Video ready!');
        } catch (err) {
            let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found.")) {
                errorMessage = "API Key error. Please re-select your API key.";
                setApiKeySelected(false);
            }
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!apiKeySelected) {
        return <ApiKeySelector onKeySelected={() => setApiKeySelected(true)} />;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Video Generator</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the video you want to create..."
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-36 resize-none"
                        disabled={isLoading}
                    />
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer p-4 border-2 border-dashed border-zinc-600 rounded-lg text-center hover:border-indigo-500 hover:bg-zinc-800/50 transition-colors"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/png, image/jpeg, image/webp"
                            className="hidden"
                            disabled={isLoading}
                        />
                        <div className="flex flex-col items-center">
                            <ArrowUpTrayIcon className="w-8 h-8 text-zinc-400 mb-2"/>
                            <p className="text-zinc-300 text-sm">
                                {imageFile ? `Image: ${imageFile.name}` : 'Add an optional starting image'}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                             <label htmlFor="aspect-ratio-vid" className="block text-sm font-medium text-zinc-300 mb-1">Aspect Ratio</label>
                            <select id="aspect-ratio-vid" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as VideoAspectRatio)} className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="resolution" className="block text-sm font-medium text-zinc-300 mb-1">Resolution</label>
                            <select id="resolution" value={resolution} onChange={e => setResolution(e.target.value as VideoResolution)} className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}>
                                <option value="720p">HD (720p)</option>
                                <option value="1080p">Full HD (1080p)</option>
                            </select>
                        </div>
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Generating Video...' : 'Generate Video'}
                    </button>
                </div>
                <div className="min-h-[300px] bg-zinc-900/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-zinc-700 p-4">
                    {isLoading ? (
                        <LoadingSpinner message={progressMessage} />
                    ) : generatedVideo ? (
                        <video src={generatedVideo} controls className="rounded-lg max-w-full max-h-[40vh]" />
                    ) : imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="rounded-lg max-w-full max-h-[40vh] object-contain" />
                    ) : (
                        <p className="text-zinc-500 text-center">Your generated video or image preview will appear here.</p>
                    )}
                </div>
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
    );
};