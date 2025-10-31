import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowUpTrayIcon, FilmIcon, PlusIcon, TrashIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// @ts-ignore - FFmpeg is loaded from a script tag in index.html
const { FFmpeg } = window.FFmpeg;

interface TextOverlay {
    id: number;
    text: string;
    startTime: number;
    endTime: number;
    fontSize: number;
    color: string;
}

interface VideoEditorProps {
    setPage: (page: Page) => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ setPage }) => {
    const { t } = useLanguage();
    const [ffmpeg, setFfmpeg] = useState<any>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [trimStart, setTrimStart] = useState<number>(0);
    const [trimEnd, setTrimEnd] = useState<number>(0);
    const [volume, setVolume] = useState<number>(1);
    const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
    
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load FFmpeg on component mount
    useEffect(() => {
        const loadFFmpeg = async () => {
            const ffmpegInstance = new FFmpeg();
            ffmpegInstance.on('log', ({ message }: { message: string }) => {
                 console.log(message);
            });
             ffmpegInstance.on('progress', ({ progress, time }: { progress: number, time: number }) => {
                if (progress > 0 && progress <= 1) {
                    setProgress(progress);
                }
            });
            await ffmpegInstance.load({
                coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js"
            });
            setFfmpeg(ffmpegInstance);
            setIsLoading(false);
        };
        loadFFmpeg();
    }, []);
    
    // Effect to control video volume in the preview player
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setVideoFile(file);
            const url = URL.createObjectURL(file);
            setVideoSrc(url);
            setProcessedVideoUrl(null); // Reset on new file upload
        }
    };

    const handleVideoMetadata = () => {
        if (videoRef.current) {
            const videoDuration = videoRef.current.duration;
            setDuration(videoDuration);
            setTrimEnd(videoDuration);
        }
    };

    const addTextOverlay = () => {
        const newOverlay: TextOverlay = {
            id: Date.now(),
            text: 'Hello World',
            startTime: 0,
            endTime: Math.min(duration, 3),
            fontSize: 48,
            color: 'white',
        };
        setTextOverlays([...textOverlays, newOverlay]);
    };
    
    const updateTextOverlay = (id: number, updates: Partial<TextOverlay>) => {
        setTextOverlays(overlays =>
            overlays.map(o => (o.id === id ? { ...o, ...updates } : o))
        );
    };

    const removeTextOverlay = (id: number) => {
        setTextOverlays(overlays => overlays.filter(o => o.id !== id));
    };

    const handleExport = async () => {
        if (!ffmpeg || !videoFile) return;

        setIsProcessing(true);
        setProcessedVideoUrl(null);
        setProgress(0);

        try {
            const videoData = new Uint8Array(await videoFile.arrayBuffer());
            await ffmpeg.writeFile(videoFile.name, videoData);

            const textFilters: string[] = [];
            textOverlays.forEach(overlay => {
                // Sanitize text for FFmpeg command
                const sanitizedText = overlay.text.replace(/'/g, "'\\''");
                textFilters.push(
                    `drawtext=text='${sanitizedText}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=${overlay.fontSize}:fontcolor=${overlay.color}:enable='between(t,${overlay.startTime},${overlay.endTime})'`
                );
            });
            
            const command: string[] = ['-i', videoFile.name];

            // Trimming
            command.push('-ss', trimStart.toString());
            command.push('-to', trimEnd.toString());

            // Video filters (text overlays)
            if (textFilters.length > 0) {
                const filterComplex = textFilters.join(',');
                command.push('-vf', filterComplex);
            }
            
            // Audio filter (volume)
            command.push('-af', `volume=${volume}`);
            
            // Output settings
            command.push('-c:v', 'libx264', '-preset', 'ultrafast', 'output.mp4');

            await ffmpeg.exec(command);
            
            const data = await ffmpeg.readFile('output.mp4');
            const blob = new Blob([data], { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setProcessedVideoUrl(url);

        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const milliseconds = Math.floor((time % 1) * 100);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
    };

    // UI Components
    const UploadPlaceholder = () => (
        <div className="flex flex-col items-center justify-center text-center h-full min-h-[50vh] bg-zinc-800/50 p-8 rounded-xl border-2 border-dashed border-zinc-700">
            <FilmIcon className="w-16 h-16 text-zinc-500" />
            <h2 className="mt-6 text-2xl font-bold text-white">{t('video_edit_upload_title')}</h2>
            <p className="mt-2 text-zinc-400 mb-6">{t('video_edit_upload_desc')}</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <ArrowUpTrayIcon className="w-5 h-5" />
                <span>{t('video_edit_upload_cta')}</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
        </div>
    );
    
    if (isLoading) {
        return <div className="text-center p-10">{t('video_edit_loading_ffmpeg')}</div>;
    }

    if (!videoFile || !videoSrc) {
        return <UploadPlaceholder />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                 <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">{t('video_edit_title')}</h2>
                 <button onClick={() => setVideoFile(null)} className="bg-zinc-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-zinc-600 transition-colors text-sm">
                    {t('video_edit_change_video')}
                 </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                     {/* Video Player */}
                     <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-zinc-700">
                        <video 
                            ref={videoRef} 
                            src={videoSrc} 
                            controls 
                            className="w-full h-full"
                            onLoadedMetadata={handleVideoMetadata}
                         />
                    </div>
                     {/* Timeline */}
                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                        <div className="relative w-full h-12 bg-zinc-700 rounded-md" ref={timelineRef}>
                            <div 
                                className="absolute top-0 bottom-0 bg-indigo-500/50"
                                style={{
                                    left: `${(trimStart / duration) * 100}%`,
                                    right: `${100 - (trimEnd / duration) * 100}%`
                                }}
                            >
                                <div className="absolute left-0 -ml-1 top-0 bottom-0 w-2 bg-indigo-400 cursor-ew-resize rounded-l-full"></div>
                                <div className="absolute right-0 -mr-1 top-0 bottom-0 w-2 bg-indigo-400 cursor-ew-resize rounded-r-full"></div>
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-zinc-400">
                            <span>{formatTime(trimStart)}</span>
                            <span>{formatTime(trimEnd)}</span>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 space-y-4 h-fit">
                    <h3 className="text-xl font-bold text-zinc-200 border-b border-zinc-700 pb-2">{t('video_edit_controls_title')}</h3>
                    
                    {/* Volume Control */}
                    <div className="space-y-2 pt-2">
                        <label htmlFor="volume-slider" className="flex justify-between items-center text-sm font-semibold text-zinc-300">
                           <span>{t('video_edit_volume_label')}</span>
                           <span className="text-zinc-400 font-mono">{Math.round(volume * 100)}%</span>
                        </label>
                        <input
                            id="volume-slider"
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                    </div>

                    {/* Text Overlays */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2">
                        {textOverlays.map(overlay => (
                            <div key={overlay.id} className="p-3 bg-zinc-800 rounded-md border border-zinc-700 space-y-2">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-semibold text-zinc-300">{t('video_edit_text_overlay')}</p>
                                    <button onClick={() => removeTextOverlay(overlay.id)} className="text-zinc-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                                <input type="text" value={overlay.text} onChange={e => updateTextOverlay(overlay.id, { text: e.target.value })} className="w-full bg-zinc-700 p-1.5 rounded text-sm" placeholder={t('video_edit_text_placeholder')} />
                                <div className="flex gap-2 text-xs items-center">
                                    <input type="number" value={overlay.startTime} onChange={e => updateTextOverlay(overlay.id, { startTime: parseFloat(e.target.value) })} className="w-1/2 bg-zinc-700 p-1.5 rounded" step="0.1" min="0" max={duration} />
                                    <span>-</span>
                                    <input type="number" value={overlay.endTime} onChange={e => updateTextOverlay(overlay.id, { endTime: parseFloat(e.target.value) })} className="w-1/2 bg-zinc-700 p-1.5 rounded" step="0.1" min="0" max={duration} />
                                </div>
                                 <div className="flex gap-2 text-xs items-center">
                                    <input type="color" value={overlay.color} onChange={e => updateTextOverlay(overlay.id, { color: e.target.value })} className="w-8 h-8 p-0 border-none rounded bg-zinc-700 cursor-pointer" />
                                    <input type="number" value={overlay.fontSize} onChange={e => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })} className="w-full bg-zinc-700 p-1.5 rounded" placeholder={t('video_edit_font_size')} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={addTextOverlay} className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-600/20 text-indigo-300 rounded-md hover:bg-indigo-600/40 border border-indigo-500/50 text-sm">
                        <PlusIcon className="w-4 h-4"/> {t('video_edit_add_text')}
                    </button>
                    
                    <button onClick={handleExport} disabled={isProcessing} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
                        {isProcessing ? `${t('video_edit_exporting')} ${(progress * 100).toFixed(0)}%` : t('video_edit_export')}
                    </button>
                </div>
            </div>

            {/* Processed Video Output */}
            {(isProcessing || processedVideoUrl) && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-zinc-300">{t('video_edit_output_title')}</h3>
                     <div className="w-full aspect-video bg-zinc-800/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                        {isProcessing ? (
                             <div className="w-full max-w-md p-4">
                                <p className="text-center text-zinc-300 mb-2">{t('video_edit_processing_message')}</p>
                                <div className="w-full bg-zinc-700 rounded-full h-2.5">
                                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress * 100}%` }}></div>
                                </div>
                            </div>
                        ) : processedVideoUrl ? (
                            <div className="p-4 w-full flex flex-col items-center gap-4">
                                <video src={processedVideoUrl} controls className="rounded-lg max-w-full max-h-[60vh] object-contain" />
                                <a href={processedVideoUrl} download={`${videoFile.name.split('.')[0]}-edited.mp4`} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2">
                                     <ArrowDownTrayIcon className="w-5 h-5" />
                                    {t('button_download_edited_image')}
                                </a>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};