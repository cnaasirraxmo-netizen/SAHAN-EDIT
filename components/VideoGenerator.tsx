import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { Page, VideoAspectRatio, VideoResolution } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ApiKeyError } from './common/ApiKeyError';
import { useLanguage } from '../contexts/LanguageContext';
import { ApiKeySelector } from './common/ApiKeySelector';
import { ArrowUpTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import type { GenerateVideosOperationResponse, Video } from '@google/genai';

interface VideoGeneratorProps {
    setPage: (page: Page) => void;
    setVideoContext: (context: { video: Video, url: string } | null) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
};

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ setPage, setVideoContext }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState<string>('A neon hologram of a cat driving at top speed');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [resolution, setResolution] = useState<VideoResolution>('720p');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<{ url: string; operation: GenerateVideosOperationResponse } | null>(null);
    const [hasApiKey, setHasApiKey] = useState(false);
    const [isCheckingKey, setIsCheckingKey] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            // @ts-ignore
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                try {
                    // @ts-ignore
                    const keyStatus = await window.aistudio.hasSelectedApiKey();
                    setHasApiKey(keyStatus);
                } catch (e) {
                    console.error("Error checking for API key:", e);
                    setHasApiKey(false);
                }
            }
            setIsCheckingKey(false);
        };
        checkKey();
    }, []);

    const handleGenerate = async () => {
        if (!prompt) {
            setError(t('error_enter_prompt'));
            return;
        }

        // Final check before generation
        // @ts-ignore
        if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
             setError("API Key not selected. Please select an API key to proceed.");
             setHasApiKey(false);
             return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        setProgressMessage('');

        try {
            let imagePayload: { base64: string; mimeType: string } | null = null;
            if (imageFile) {
                const base64 = await fileToBase64(imageFile);
                imagePayload = { base64, mimeType: imageFile.type };
            }
            const result = await generateVideo(prompt, imagePayload, aspectRatio, resolution, setProgressMessage);
            
            setGeneratedVideo(result);
            if (result.operation.response?.generatedVideos?.[0]?.video) {
                setVideoContext({
                    video: result.operation.response.generatedVideos[0].video,
                    url: result.url
                });
            }

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : t('error_unknown');
            // Handle specific error for invalid API key
            if (errorMessage.includes("entity was not found")) {
                 setError("The selected API key is invalid or not found. Please select a different key.");
                 setHasApiKey(false); // Force re-selection
            } else {
                 setError(errorMessage);
            }
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError(t('error_file_too_large'));
                return;
            }
            setImageFile(file);
            setError(null);
        }
    };
    
    if (isCheckingKey) {
        return <LoadingSpinner />;
    }

    if (!hasApiKey) {
        return <ApiKeySelector onKeySelected={() => { setHasApiKey(true); setError(null); }} />;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">{t('video_gen_title')}</h2>
            
            <div className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-zinc-300 mb-1">{t('video_gen_prompt_label')}</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('video_gen_prompt_placeholder')}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-24 resize-none"
                        disabled={isLoading}
                    />
                </div>

                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg">
                    <p className="text-sm font-medium text-zinc-300 mb-2">{t('video_gen_image_label')}</p>
                    <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer p-4 border-2 border-dashed border-zinc-600 rounded-lg text-center hover:border-indigo-500 hover:bg-zinc-800 transition-colors">
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/png, image/jpeg, image/webp" className="hidden" disabled={isLoading} />
                        <div className="flex flex-col items-center">
                            <ArrowUpTrayIcon className="w-8 h-8 text-zinc-400 mb-2"/>
                            <p className="text-zinc-300 text-sm">{imageFile ? `${t('image_edit_selected')}: ${imageFile.name}` : t('video_gen_image_upload')}</p>
                            <p className="text-xs text-zinc-500 mt-1">{t('video_gen_image_info')}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-auto">
                        <label htmlFor="aspect-ratio" className="block text-sm font-medium text-zinc-300 mb-1">{t('aspect_ratio_label')}</label>
                        <select id="aspect-ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)} className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}>
                            <option value="16:9">{t('aspect_landscape')} (16:9)</option>
                            <option value="9:16">{t('aspect_portrait')} (9:16)</option>
                        </select>
                    </div>
                    <div className="w-full sm:w-auto">
                        <label htmlFor="resolution" className="block text-sm font-medium text-zinc-300 mb-1">{t('video_gen_resolution_label')}</label>
                        <select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value as VideoResolution)} className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}>
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                        </select>
                    </div>
                    <button onClick={handleGenerate} disabled={isLoading} className="w-full sm:w-auto mt-2 sm:mt-0 sm:self-end bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed">
                        {isLoading ? t('button_generating') : t('button_generate')}
                    </button>
                </div>
            </div>

            {error && <ApiKeyError message={error} setPage={setPage} />}
            
            <div className="mt-6 min-h-[400px] bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                {isLoading ? (
                    <LoadingSpinner message={progressMessage || t('video_gen_generating_long')} />
                ) : generatedVideo ? (
                    <video src={generatedVideo.url} controls autoPlay loop className="rounded-lg max-w-full max-h-[70vh] object-contain" />
                ) : (
                    <div className="text-center p-4">
                        <SparklesIcon className="w-16 h-16 mx-auto text-zinc-600"/>
                        <p className="mt-2 text-zinc-500">{t('video_gen_output_placeholder')}</p>
                    </div>
                )}
            </div>
            
            {generatedVideo && !isLoading && (
                <div className="flex justify-center">
                    <button onClick={() => setPage(Page.VIDEO_EDIT)} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                        {t('video_gen_extending')}
                    </button>
                </div>
            )}
        </div>
    );
};
