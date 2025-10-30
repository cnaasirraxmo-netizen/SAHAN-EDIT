import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { AspectRatio } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const aspectRatios: { value: AspectRatio; label: string }[] = [
    { value: '1:1', label: 'Square' },
    { value: '16:9', label: 'Landscape' },
    { value: '9:16', label: 'Portrait' },
];

const fileToGenerativePart = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return { base64, mimeType: file.type };
};


export const GenerateLogo: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A minimalist logo for a tech startup called "SAHAN", vector, on a clean white background');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError('File is too large. Please upload an image under 4MB.');
                return;
            }
            setImageFile(file);
            setOriginalImage(URL.createObjectURL(file));
            setGeneratedImage(null); // Clear previous result
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            if (imageFile) {
                const fullPrompt = `Generate a new logo design inspired by the uploaded image, incorporating these details: ${prompt}`;
                const { base64, mimeType } = await fileToGenerativePart(imageFile);
                const imageUrl = await editImage(fullPrompt, base64, mimeType);
                setGeneratedImage(imageUrl);
            } else {
                const fullPrompt = `logo design, vector art, minimalist, white background: ${prompt}`;
                const imageUrl = await generateImage(fullPrompt, aspectRatio);
                setGeneratedImage(imageUrl);
            }
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

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <p className="text-sm font-medium text-zinc-300 mb-2">Optional: Use an image as inspiration</p>
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer p-4 border-2 border-dashed border-zinc-600 rounded-lg text-center hover:border-indigo-500 hover:bg-zinc-800 transition-colors"
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
                                {imageFile ? `Selected: ${imageFile.name}` : 'Upload your logo or an image'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">PNG, JPG, WEBP &lt; 4MB</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className={`w-full sm:w-auto transition-opacity duration-300 ${imageFile ? 'opacity-50' : 'opacity-100'}`} title={imageFile ? "Aspect ratio is determined by the uploaded image" : ""}>
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-zinc-300 mb-1">Aspect Ratio</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={isLoading || !!imageFile}
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

            <div className={`mt-6 ${originalImage ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
                {originalImage && (
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-2 text-zinc-400">Inspiration</h3>
                        <div className="w-full aspect-square bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                            <img src={originalImage} alt="Inspiration" className="rounded-lg max-w-full max-h-full object-contain" />
                        </div>
                    </div>
                )}
                <div className={`flex flex-col items-center ${originalImage ? '' : 'col-span-1'}`}>
                    {originalImage && <h3 className="text-lg font-semibold mb-2 text-zinc-400">Generated Logo</h3>}
                    <div className={`w-full ${originalImage ? 'aspect-square' : 'min-h-[300px]'} bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700`}>
                        {isLoading ? (
                            <LoadingSpinner message="Creating your masterpiece..." />
                        ) : generatedImage ? (
                            <img src={generatedImage} alt="Generated Logo" className="rounded-lg max-w-full max-h-[60vh] object-contain" />
                        ) : (
                            <p className="text-zinc-500">
                                {originalImage ? 'Your new logo will appear here.' : 'Your generated logo will appear here.'}
                            </p>
                        )}
                    </div>
                </div>
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