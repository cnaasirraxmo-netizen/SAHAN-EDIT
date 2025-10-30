import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Page } from '../types';
import { ApiKeyError } from './common/ApiKeyError';

const fileToGenerativePart = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return { base64, mimeType: file.type };
};

const editTypes = [
    { value: 'Generate variations of this logo', label: 'Generate Variations' },
    { value: 'Modernize this logo, make it sleek and professional', label: 'Modernize' },
    { value: 'Add a 3D effect to this logo', label: 'Add 3D Effect' },
    { value: 'Make this logo minimalist, clean lines, simple', label: 'Make Minimalist' },
    { value: 'Change the color palette of this logo to blues and greens', label: 'Change Color Palette' },
];

interface LogoEditorProps {
    setPage: (page: Page) => void;
}

export const LogoEditor: React.FC<LogoEditorProps> = ({ setPage }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [editType, setEditType] = useState<string>(editTypes[0].value);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
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
            setEditedImage(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile) {
            setError('Please upload a logo to edit.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);
        try {
            const fullPrompt = `${editType}. ${prompt}`;
            const { base64, mimeType } = await fileToGenerativePart(imageFile);
            const imageUrl = await editImage(fullPrompt.trim(), base64, mimeType);
            setEditedImage(imageUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        const originalName = imageFile?.name.split('.').slice(0, -1).join('.') || 'edited-logo';
        const extension = editedImage.split(';')[0].split('/')[1] || 'png';
        link.download = `${originalName}-edited.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Edit Logo</h2>
            
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-6 border-2 border-dashed border-zinc-600 rounded-lg text-center hover:border-indigo-500 hover:bg-zinc-800/50 transition-colors"
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
                    <ArrowUpTrayIcon className="w-10 h-10 text-zinc-400 mb-2"/>
                    <p className="text-zinc-300">
                        {imageFile ? `Selected: ${imageFile.name}` : 'Click to upload your logo (PNG, JPG, WEBP < 4MB)'}
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div>
                    <label htmlFor="edit-type" className="block text-sm font-medium text-zinc-300 mb-1">Edit Style</label>
                    <select
                        id="edit-type"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        disabled={isLoading || !originalImage}
                    >
                        {editTypes.map(et => (
                            <option key={et.value} value={et.value}>{et.label}</option>
                        ))}
                    </select>
                </div>
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Optional: Add more specific instructions..."
                    className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow duration-200 h-24 resize-none"
                    disabled={isLoading || !originalImage}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !originalImage}
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:bg-zinc-600 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? 'Generating...' : 'Generate New Design'}
                </button>
            </div>

            {error && (
                error.includes("API Key not found") ?
                <ApiKeyError message={error} setPage={setPage} /> :
                <p className="text-red-400 text-center">{error}</p>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2 text-zinc-400">Original Logo</h3>
                    <div className="w-full aspect-square bg-zinc-900/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                        {originalImage ? (
                            <img src={originalImage} alt="Original Logo" className="rounded-lg max-w-full max-h-full object-contain" />
                        ) : (
                            <p className="text-zinc-500">Upload a logo to start</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-semibold mb-2 text-zinc-400">Generated Design</h3>
                     <div className="w-full aspect-square bg-zinc-900/50 rounded-lg flex items-center justify-center border border-dashed border-zinc-700">
                        {isLoading ? (
                            <LoadingSpinner message="Reimagining your logo..." />
                        ) : editedImage ? (
                            <img src={editedImage} alt="Edited Logo" className="rounded-lg max-w-full max-h-full object-contain" />
                        ) : (
                            <p className="text-zinc-500">Your new logo design will appear here</p>
                        )}
                    </div>
                </div>
            </div>
            {editedImage && !isLoading && (
                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleDownload}
                        className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Download New Design
                    </button>
                </div>
            )}
        </div>
    );
};