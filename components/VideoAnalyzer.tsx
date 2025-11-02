import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { analyzeVideoFrames } from '../services/geminiService';
import { ApiKeyError } from './common/ApiKeyError';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ArrowUpTrayIcon, DocumentMagnifyingGlassIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

type AnalysisType = 'summary' | 'flashcards' | 'highlights';

interface VideoAnalyzerProps {
    setPage: (page: Page) => void;
}

export const VideoAnalyzer: React.FC<VideoAnalyzerProps> = ({ setPage }) => {
    const { t } = useLanguage();

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [analysisType, setAnalysisType] = useState<AnalysisType>('summary');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Clean up object URL when component unmounts or video changes
    useEffect(() => {
        return () => {
            if (videoSrc) {
                URL.revokeObjectURL(videoSrc);
            }
        };
    }, [videoSrc]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoSrc(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };
    
    const extractFrames = (maxFrames: number = 16): Promise<string[]> => {
      return new Promise((resolve, reject) => {
        if (!videoRef.current || !canvasRef.current || !videoFile) {
          return reject(new Error("Video or canvas element not ready."));
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("Canvas context not available."));

        const frames: string[] = [];
        const duration = video.duration;
        const interval = duration > 1 ? duration / (maxFrames + 1) : 0;
        let currentTime = interval; // Start a bit into the video
        let framesExtracted = 0;
        
        video.currentTime = 0; // Reset video to start

        const onSeeked = () => {
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(dataUrl.split(',')[1]);
          framesExtracted++;
          currentTime += interval;

          if (currentTime < duration && framesExtracted < maxFrames) {
            video.currentTime = currentTime;
          } else {
            video.removeEventListener('seeked', onSeeked);
            resolve(frames);
          }
        };
        
        video.addEventListener('seeked', onSeeked);
        
        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            // Start the process
            video.currentTime = currentTime;
        };
        
        video.onerror = () => {
            reject(new Error(t('error_failed_to_load_video')));
        }
      });
    };

    const getPromptForAnalysis = (type: AnalysisType): string => {
        switch (type) {
            case 'summary':
                return 'Analyze these frames from a video and provide a concise summary of what is happening.';
            case 'flashcards':
                return 'Based on these video frames, generate a set of key-value flashcards for studying. Format them as "Term: Definition".';
            case 'highlights':
                return 'From these video frames, extract key marketing highlights or bullet points that could be used for promotion. Focus on exciting or important moments.';
            default:
                return 'Describe what you see in these video frames.';
        }
    };

    const handleAnalyze = async () => {
        if (!videoFile) {
            setError(t('error_upload_video_to_analyze'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);
        setProgressMessage(t('video_analyzer_progress_extracting'));

        try {
            const frames = await extractFrames();
            
            setProgressMessage(t('video_analyzer_progress_analyzing'));
            
            const prompt = getPromptForAnalysis(analysisType);
            const analysisResult = await analyzeVideoFrames(prompt, frames);
            
            setResult(analysisResult);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('error_unknown'));
            console.error(err);
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };
    
    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    const UploadPlaceholder = () => (
        <div className="flex flex-col items-center justify-center text-center h-full min-h-[60vh] bg-zinc-800/50 p-8 rounded-xl border-2 border-dashed border-zinc-700">
            <DocumentMagnifyingGlassIcon className="w-16 h-16 text-zinc-500" />
            <h2 className="mt-6 text-2xl font-bold text-white">{t('video_analyzer_upload_title')}</h2>
            <p className="mt-2 text-zinc-400 mb-6 max-w-md">{t('video_analyzer_upload_desc')}</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <ArrowUpTrayIcon className="w-5 h-5" />
                <span>{t('video_analyzer_upload_cta')}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
        </div>
    );
    
    if (!videoFile) {
        return <UploadPlaceholder />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                 <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">{t('video_analyzer_title')}</h2>
                 <button onClick={() => setVideoFile(null)} className="bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors text-sm">
                    {t('video_analyzer_change_video')}
                 </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side: Video & Controls */}
                <div className="space-y-4">
                    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                        <video ref={videoRef} src={videoSrc ?? ''} controls className="w-full h-full" />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-3">
                        <label className="block text-lg font-semibold text-zinc-300">{t('video_analyzer_analysis_type')}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {(['summary', 'flashcards', 'highlights'] as AnalysisType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setAnalysisType(type)}
                                    disabled={isLoading}
                                    className={`p-3 text-center rounded-lg border-2 transition-all duration-200 ${analysisType === type ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500 text-zinc-200'}`}
                                >
                                    <span className="font-semibold text-sm">{t(`video_analyzer_type_${type}` as any)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                     <button onClick={handleAnalyze} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
                        {isLoading ? t('video_analyzer_button_analyzing') : t('video_analyzer_button_analyze')}
                    </button>
                </div>

                {/* Right Side: Output */}
                <div className="bg-zinc-800/50 rounded-lg border border-dashed border-zinc-700 flex flex-col">
                    <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-zinc-200">{t('video_analyzer_output_title')}</h3>
                         {result && !isLoading && (
                             <button 
                               onClick={handleCopy} 
                               className="p-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition-colors text-zinc-300"
                               aria-label={t('button_copy_script')}
                            >
                               {isCopied ? t('button_copied') : <ClipboardDocumentIcon className="w-5 h-5"/>}
                            </button>
                         )}
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto min-h-[40vh]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner message={progressMessage || t('loading_analyzing_video')} />
                            </div>
                        ) : error ? (
                             error.includes("API Key not found") ?
                                <ApiKeyError message={error} setPage={setPage} /> :
                                <p className="text-red-400 text-center">{error}</p>
                        ) : result ? (
                            <pre className="text-zinc-200 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                                {result}
                            </pre>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-zinc-500">
                                <p>{t('video_analyzer_output_placeholder')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};