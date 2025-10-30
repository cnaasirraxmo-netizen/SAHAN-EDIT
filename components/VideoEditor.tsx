import React, { useState, useRef, useEffect } from 'react';
import { generateVideo } from '../services/geminiService';
import { VideoAspectRatio, VideoResolution } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ApiKeySelector } from './common/ApiKeySelector';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const extractFirstFrame = (videoFile: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;
        video.playsInline = true;

        const cleanup = () => {
            URL.revokeObjectURL(video.src);
            video.remove();
        };

        video.onloadeddata = () => {
            video.currentTime = 0;
        };
        
        video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                cleanup();
                return reject(new Error('Could not get canvas context'));
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            const base64 = dataUrl.split(',')[1];
            
            cleanup();
            resolve({ base64, mimeType: 'image/jpeg' });
        };
        
        video.onerror = () => {
            cleanup();
            reject(new Error('Failed to load video file for frame extraction.'));
        };

        video.play().catch(() => {});
    });
};


export const VideoEditor: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Make this scene look like a vintage 1980s movie.');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [resolution, setResolution] = useState<VideoResolution>('720p');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkKey = async () => {
            // @ts-ignore
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                // @ts-ignore
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            } else {
                console.warn('aistudio API not found. Assuming API key is set via environment.');
                setApiKeySelected(true);
            }
        };
        checkKey();
    }, []);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
            setGeneratedVideo(null);
            setError(null);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt) {
            setError('Please enter a prompt.');
            return;
        }
        if (!videoFile) {
            setError('Please upload a video to edit.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        
        try {
            setProgressMessage('Extracting first frame from video...');
            const imagePart = await extractFirstFrame(videoFile);
            
            setProgressMessage('Starting video generation...');
            const videoUrl = await generateVideo(prompt, imagePart, aspectRatio, resolution, setProgressMessage);

            setGeneratedVideo(videoUrl);
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
            <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Video Editor</h2>
            <p className="text-center text-gray-400 text-sm -mt-4">Re-imagine your video based on its first frame and a new prompt.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer p-4 border-2 border-dashed border-gray-600 rounded-lg text-center hover:border-indigo-500 hover:bg-gray-700/50 transition-colors"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleVideoUpload}
                            accept="video/*"
                            className="hidden"
                            disabled={isLoading}
                        />
                        <div className="flex flex-col items-center">
                            <ArrowUpTrayIcon className="w-8 h-8 text-gray-400 mb-2"/>
                            <p className="text-gray-300 text-sm">
                                {videoFile ? `Selected: ${videoFile.name}` : 'Click to upload a video'}
                            </p>
                        </div>
                    </div>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the edits or new scene..."
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-28 resize-none"
                        disabled={isLoading || !videoFile}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                             <label htmlFor="aspect-ratio-vid-edit" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                            <select id="aspect-ratio-vid-edit" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as VideoAspectRatio)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label htmlFor="resolution-edit" className="block text-sm font-medium text-gray-300 mb-1">Resolution</label>
                            <select id="resolution-edit" value={resolution} onChange={e => setResolution(e.target.value as VideoResolution)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={isLoading}>
                                <option value="720p">HD (720p)</option>
                                <option value="1080p">Full HD (1080p)</option>
                            </select>
                        </div>
                    </div>
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !videoFile}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? 'Re-imagining Video...' : 'Re-imagine Video'}
                    </button>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-400 text-center">Original Video</h3>
                    <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-600">
                         {videoPreview ? (
                            <video src={videoPreview} controls className="rounded-lg max-w-full max-h-full" />
                        ) : (
                            <p className="text-gray-500 text-center p-4">Your uploaded video will appear here.</p>
                        )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-400 text-center">Re-imagined Video</h3>
                    <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-600">
                        {isLoading ? (
                            <LoadingSpinner message={progressMessage} />
                        ) : generatedVideo ? (
                            <video src={generatedVideo} controls className="rounded-lg max-w-full max-h-full" />
                        ) : (
                            <p className="text-gray-500 text-center p-4">Your new video will appear here.</p>
                        )}
                    </div>
                </div>
            </div>
            {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
    );
};
