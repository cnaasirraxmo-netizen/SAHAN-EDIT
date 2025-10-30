import React, { useState, useRef, useEffect } from 'react';
import { generateVideo, extendVideo } from '../services/geminiService';
import { VideoAspectRatio, VideoResolution } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ApiKeySelector } from './common/ApiKeySelector';
import { ArrowUpTrayIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { GetVideosOperationResponse } from '@google/genai';

type GeneratedClip = { operation: GetVideosOperationResponse; url: string; };

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

        video.onloadeddata = () => video.currentTime = 0.01;
        
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
        
        video.onerror = (e) => {
            cleanup();
            reject(new Error('Failed to load video file for frame extraction.'));
        };

        video.play().catch(e => {
           // Playback can be interrupted by the browser, but seeking should still work.
        });
    });
};


export const VideoEditor: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A hero embarks on a journey through a mystical forest.');
    const [extensionPrompt, setExtensionPrompt] = useState<string>('Suddenly, they discover a hidden, glowing portal.');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const resolution: VideoResolution = '720p'; // Fixed to 720p for extension capability

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isExtending, setIsExtending] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState<string>('');
    
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [generatedClips, setGeneratedClips] = useState<GeneratedClip[]>([]);

    useEffect(() => {
        const checkKey = async () => {
            // @ts-ignore
            if (window.aistudio?.hasSelectedApiKey) {
                // @ts-ignore
                setApiKeySelected(await window.aistudio.hasSelectedApiKey());
            } else {
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
            setGeneratedClips([]);
            setError(null);
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt || !videoFile) {
            setError('Please upload a video and provide a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedClips([]);
        try {
            setProgressMessage('Extracting first frame...');
            const imagePart = await extractFirstFrame(videoFile);
            
            const result = await generateVideo(prompt, imagePart, aspectRatio, resolution, setProgressMessage);
            setGeneratedClips([result]);
            setProgressMessage('Clip 1 ready!');
        } catch (err) {
            handleApiError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExtend = async () => {
        if (!extensionPrompt || generatedClips.length === 0) {
            setError('Please provide a prompt to extend the story.');
            return;
        }
        setIsExtending(true);
        setError(null);
        try {
            const lastClip = generatedClips[generatedClips.length - 1];
            const previousVideo = lastClip.operation.response?.generatedVideos?.[0]?.video;

            if (!previousVideo) {
                throw new Error("Could not find video data from the previous clip to extend.");
            }

            const result = await extendVideo(extensionPrompt, previousVideo, setProgressMessage);
            setGeneratedClips(prev => [...prev, result]);
            setExtensionPrompt('');
            setProgressMessage(`Clip ${generatedClips.length + 1} ready!`);

        } catch (err) {
            handleApiError(err);
        } finally {
            setIsExtending(false);
        }
    };
    
    const handleApiError = (err: unknown) => {
        let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        if (errorMessage.includes("Requested entity was not found.")) {
            errorMessage = "API Key error. Please re-select your API key.";
            setApiKeySelected(false);
        }
        setError(errorMessage);
        console.error(err);
    }
    
    if (!apiKeySelected) {
        return <ApiKeySelector onKeySelected={() => setApiKeySelected(true)} />;
    }

    const disableAllInputs = isLoading || isExtending;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Video Edit</h2>
                <p className="text-center text-zinc-400 text-sm">Create a new story, one scene at a time, based on your video's first frame.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-300">1. Setup Your Scene</h3>
                     <div 
                        onClick={() => !disableAllInputs && fileInputRef.current?.click()}
                        className={`p-4 border-2 border-dashed border-zinc-600 rounded-lg text-center transition-colors ${disableAllInputs ? 'cursor-not-allowed bg-zinc-800/50' : 'cursor-pointer hover:border-indigo-500 hover:bg-zinc-800/50'}`}
                    >
                        <input type="file" ref={fileInputRef} onChange={handleVideoUpload} accept="video/*" className="hidden" disabled={disableAllInputs} />
                        <div className="flex flex-col items-center">
                            <ArrowUpTrayIcon className="w-8 h-8 text-zinc-400 mb-2"/>
                            <p className="text-zinc-300 text-sm">{videoFile ? `Selected: ${videoFile.name}` : 'Upload a starting video'}</p>
                        </div>
                    </div>

                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the opening scene..." className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-28 resize-none" disabled={disableAllInputs || !videoFile} />
                    
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="aspect-ratio-vid-edit" className="block text-sm font-medium text-zinc-300 mb-1">Aspect Ratio</label>
                            <select id="aspect-ratio-vid-edit" value={aspectRatio} onChange={e => setAspectRatio(e.target.value as VideoAspectRatio)} className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg" disabled={disableAllInputs}>
                                <option value="16:9">Landscape (16:9)</option>
                                <option value="9:16">Portrait (9:16)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-zinc-300 mb-1">Resolution</label>
                            <div className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400">{resolution} (for extension)</div>
                        </div>
                    </div>
                     <button onClick={handleGenerate} disabled={disableAllInputs || !videoFile} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center">
                        {isLoading ? 'Generating Scene 1...' : 'Generate Story'}
                    </button>
                </div>
                
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-zinc-300">Original Video Preview</h3>
                    <div className="aspect-video bg-zinc-900/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                         {videoPreview ? ( <video src={videoPreview} controls className="rounded-lg max-w-full max-h-full" /> ) : ( <p className="text-zinc-500 p-4">Upload a video to start</p> )}
                    </div>
                </div>
            </div>

            {isLoading && <LoadingSpinner message={progressMessage} />}
            {error && <p className="text-red-400 text-center">{error}</p>}

            {generatedClips.length > 0 && (
                <div className="space-y-6 pt-8 border-t border-zinc-700">
                    <div>
                        <h3 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Your Generated Story</h3>
                        <p className="text-center text-zinc-400 text-sm">A new clip has been generated. Review and extend your story below.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {generatedClips.map((clip, index) => (
                            <div key={index} className="space-y-2">
                                <p className="font-semibold text-zinc-300 text-center">Clip {index + 1}</p>
                                <video src={clip.url} controls className="rounded-lg w-full" />
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-zinc-700 space-y-4 max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-zinc-300">2. Extend Your Story</h3>
                        <textarea value={extensionPrompt} onChange={(e) => setExtensionPrompt(e.target.value)} placeholder="What happens next?" className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none" disabled={disableAllInputs} />
                        <button onClick={handleExtend} disabled={disableAllInputs} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            <PlusCircleIcon className="w-5 h-5" />
                            {isExtending ? 'Generating Next Scene...' : 'Extend Story'}
                        </button>
                        {isExtending && <LoadingSpinner message={progressMessage} />}
                    </div>
                </div>
            )}
        </div>
    );
};