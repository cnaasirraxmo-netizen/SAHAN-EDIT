import React, { useState, useRef } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { AspectRatio, Page } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { ApiKeyError } from './common/ApiKeyError';
import { useLanguage } from '../contexts/LanguageContext';
// FIX: Import translations to define a type for translation keys.
import { translations } from '../services/i18n';

// FIX: Define a type for valid translation keys.
type TranslationKey = keyof typeof translations.en;


const aspectRatios: { value: AspectRatio; label: string; key: TranslationKey }[] = [
    { value: '1:1', label: 'Square', key: 'aspect_square' },
    { value: '16:9', label: 'Landscape', key: 'aspect_landscape' },
    { value: '9:16', label: 'Portrait', key: 'aspect_portrait' },
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

interface GenerateLogoProps {
    setPage: (page: Page) => void;
}

export const GenerateLogo: React.FC<GenerateLogoProps> = ({ setPage }) => {
    const { t } = useLanguage();
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
                setError(t('error_file_too_large'));
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
            setError(t('error_enter_prompt'));
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            if (imageFile) {
                const fullPrompt = `Generate a new logo design inspired by the uploaded image, incorporating these details: ${prompt}`;
                const { base64, mimeType } = await fileToGenerativePart(imageFile);
                const result = await editImage(fullPrompt, base64, mimeType);
                if (result.imageUrl) {
                    setGeneratedImage(result.imageUrl);
                }
            } else {
                const fullPrompt = `logo design, vector art, minimalist, white background: ${prompt}`;
                const result = await generateImage(fullPrompt, aspectRatio);
                if (result.imageUrl) {
                    setGeneratedImage(result.imageUrl);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
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
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">{t('logo_gen_title')}</h2>
            <div className="flex flex-col gap-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('logo_gen_prompt_placeholder')}
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-28 resize-none"
                    disabled={isLoading}
                />

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <p className="text-sm font-medium text-zinc-300 mb-2">{t('logo_gen_inspiration_title')}</p>
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
                                {imageFile ? `${t('image_edit_selected')}: ${imageFile.name}` : t('logo_gen_inspiration_upload')}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">{t('logo_gen_inspiration_info')}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className={`w-full sm:w-auto transition-opacity duration-300 ${imageFile ? 'opacity-50' : 'opacity-100'}`} title={imageFile ? t('logo_gen_aspect_ratio_disabled_tooltip') : ""}>
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-zinc-300 mb-1">{t('aspect_ratio_label')}</label>
                        <select
                            id="aspect-ratio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            disabled={isLoading || !!imageFile}
                        >
                            {aspectRatios.map(ar => (
                                <option key={ar.value} value={ar.value}>{t(ar.key)} ({ar.value})</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full sm:w-auto mt-2 sm:mt-0 sm:self-end bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? t('button_generating') : t('button_generate')}
                    </button>
                </div>
            </div>

            {error && (
                error.includes("API Key not found") ?
                <ApiKeyError message={error} setPage={setPage} /> :
                <p className="text-red-400 text-center">{error}</p>
            )}

            <div className={`mt-6 ${originalImage ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : ''}`}>
                {originalImage && (
                    <div className="flex flex-col items-center">
                        <h3 className="text-lg font-semibold mb-2 text-zinc-400">{t('logo_gen_inspiration_label')}</h3>
                        <div className="w-full aspect-square bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                            <img src={originalImage} alt={t('logo_gen_inspiration_label')} className="rounded-lg max-w-full max-h-full object-contain" />
                        </div>
                    </div>
                )}
                <div className={`flex flex-col items-center ${originalImage ? '' : 'col-span-1'}`}>
                    {originalImage && <h3 className="text-lg font-semibold mb-2 text-zinc-400">{t('logo_gen_generated_logo')}</h3>}
                    <div className={`w-full ${originalImage ? 'aspect-square' : 'min-h-[300px]'} bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700`}>
                        {isLoading ? (
                            <LoadingSpinner message={t('loading_creating_masterpiece')} />
                        ) : generatedImage ? (
                            <img src={generatedImage} alt={t('logo_gen_generated_logo')} className="rounded-lg max-w-full max-h-[60vh] object-contain" />
                        ) : (
                            <p className="text-zinc-500">
                                {originalImage ? t('logo_gen_output_placeholder_with_inspiration') : t('logo_gen_output_placeholder')}
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
                        {t('button_download_logo')}
                    </button>
                </div>
            )}
        </div>
    );
};
