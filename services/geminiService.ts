import { GoogleGenAI, Modality, GenerateContentResponse, GenerateImagesResponse, GenerateVideosOperation, GetVideosOperationResponse, Video } from "@google/genai";
import { AspectRatio, VideoAspectRatio, VideoResolution } from "../types";
import { addImage, addRequestToQueue, QueuedRequest, StoredScript, addScript } from './idb';
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';
import { auth } from './firebase';
import { addScriptToFirestore } from './firestoreService';


// --- START: API Key Management ---
const API_KEYS_STORAGE_KEY = 'sahan-edit-api-keys';

type ApiKeys = {
    [key: string]: string | undefined;
};

// Helper function to get all keys
const getAllApiKeys = (): ApiKeys => {
    const keysJson = localStorage.getItem(API_KEYS_STORAGE_KEY);
    try {
        return keysJson ? JSON.parse(keysJson) : {};
    } catch (e) {
        console.error("Failed to parse API keys from localStorage", e);
        return {};
    }
};

export const saveApiKey = (service: string, apiKey: string) => {
    const keys = getAllApiKeys();
    const trimmedApiKey = apiKey.trim();
    if (trimmedApiKey) {
        keys[service] = trimmedApiKey;
    } else {
        delete keys[service];
    }
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
};

export const getApiKey = (service: string): string | null => {
    const keys = getAllApiKeys();
    return keys[service] || null;
};
// --- END: API Key Management ---

const getGenAIClient = () => {
    const apiKey = getApiKey('gemini');
    if (!apiKey) {
        throw new Error("Google Gemini API Key not found. Please set your API key in the Settings page.");
    }
    // Create a new client for each request to ensure the latest API key is used.
    return new GoogleGenAI({ apiKey });
}

// --- START: API Call Retry Logic ---
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function withRetry<T>(apiCall: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await apiCall();
        } catch (err) {
            lastError = err as Error;
            // Check for the specific overload/unavailable error messages from Gemini API
            if (err instanceof Error && (err.message.includes('overloaded') || err.message.includes('UNAVAILABLE'))) {
                if (attempt < MAX_RETRIES - 1) {
                    // Exponential backoff with jitter
                    const delay = INITIAL_DELAY_MS * Math.pow(2, attempt) + Math.random() * 1000;
                    console.log(`Model overloaded. Retrying in ${Math.round(delay / 1000)}s... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
                    await sleep(delay);
                }
            } else {
                // For other errors (e.g., invalid API key, bad request), fail immediately
                throw err;
            }
        }
    }
    // If all retries failed, throw a user-friendly error
    console.error("API call failed after multiple retries.", lastError);
    throw new Error(`The model is currently overloaded. Please try again later. (Failed after ${MAX_RETRIES} attempts)`);
}
// --- END: API Call Retry Logic ---

const handleOfflineRequest = async (type: QueuedRequest['type'], payload: any): Promise<{ id: string, status: 'queued' }> => {
    const requestId = uuidv4();
    await addRequestToQueue({
        id: requestId,
        type,
        payload,
        createdAt: new Date(),
        retries: 0,
    });
    // Add a placeholder to the images table for optimistic UI
    if (type === 'generateImage' || type === 'editImage') {
        await addImage({
            id: requestId,
            prompt: payload.prompt,
            status: 'queued',
            createdAt: new Date(),
        });
    }
    return { id: requestId, status: 'queued' };
};


export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<{ id: string, status: 'completed' | 'queued', imageUrl?: string }> => {
    if (!navigator.onLine) {
        return handleOfflineRequest('generateImage', { prompt, aspectRatio });
    }
    
    return withRetry(async () => {
        const ai = getGenAIClient();
        const response: GenerateImagesResponse = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
            const imageId = uuidv4();
            await addImage({ id: imageId, prompt, status: 'completed', imageUrl, createdAt: new Date() });
            return { id: imageId, status: 'completed', imageUrl };
        }
        throw new Error("Image generation failed or returned no images.");
    });
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<{ id: string, status: 'completed' | 'queued', imageUrl?: string }> => {
    if (!navigator.onLine) {
        return handleOfflineRequest('editImage', { prompt, imageBase64, mimeType });
    }

    return withRetry(async () => {
        const ai = getGenAIClient();
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: imageBase64,
                            mimeType,
                        },
                    },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                const imageId = uuidv4();
                await addImage({ id: imageId, prompt, status: 'completed', imageUrl, createdAt: new Date() });
                return { id: imageId, status: 'completed', imageUrl };
            }
        }
        throw new Error("Image editing failed or returned no image data.");
    });
};

export const generateVideoScript = async (topic: string, platform: 'TikTok' | 'YouTube'): Promise<StoredScript> => {
     if (!navigator.onLine) {
        throw new Error("You must be online to generate video scripts.");
    }
    return withRetry(async () => {
        const ai = getGenAIClient();

        let systemInstruction = '';
        if (platform === 'TikTok') {
            systemInstruction = `You are a creative assistant specializing in short-form video content. Your task is to generate a concise, engaging script for a TikTok video. The script should be easily readable in under 60 seconds and formatted with clear visual cues and spoken parts. The language must be Somali.`;
        } else if (platform === 'YouTube') {
            systemInstruction = `You are an expert scriptwriter for long-form YouTube content. Your task is to generate a detailed, well-structured video script that is suitable for a 13+ minute video. The script must include an introduction, a main body with multiple sections, and a conclusion with a call to action. Include suggestions for visuals and b-roll. The language must be Somali.`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a video script about the following topic: "${topic}"`,
            config: {
                systemInstruction,
            },
        });

        const currentUser = auth.currentUser;
        const newScriptData = {
            topic,
            platform,
            script: response.text,
        };
        
        let scriptId = uuidv4();
        if (currentUser) {
            try {
                scriptId = await addScriptToFirestore(currentUser.uid, newScriptData);
            } catch (firestoreError) {
                console.error("Failed to save script to Firestore, will only save locally.", firestoreError);
            }
        }

        const newScript: StoredScript = {
            id: scriptId,
            ...newScriptData,
            createdAt: new Date(),
        };

        // Always save to IndexedDB for offline access/backup
        await addScript(newScript);
        return newScript;
    });
};


const pollAndFetchVideo = async (operation: GenerateVideosOperation, ai: GoogleGenAI, onProgress: (message: string) => void): Promise<{ operation: GetVideosOperationResponse, url: string }> => {
    let getOperationResponse: GetVideosOperationResponse = operation;
    
    while (!getOperationResponse.done) {
        await sleep(10000); // Wait 10 seconds between polls
        onProgress("Checking video status...");
        
        // This will retry on failure and throw if all retries are exhausted.
        getOperationResponse = await withRetry(() => ai.operations.getVideosOperation({ operation }));
    }

    onProgress("Video processing complete. Fetching video data...");
    
    const downloadLink = getOperationResponse.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }
    
    const apiKey = getApiKey('gemini');
    if (!apiKey) {
        throw new Error("API key not found for video download. Please set your Google Gemini API key in the Settings page.");
    }
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    const url = URL.createObjectURL(videoBlob);
    return { operation: getOperationResponse, url };
};


export const generateVideo = async (
    prompt: string,
    image: { base64: string; mimeType: string } | null,
    aspectRatio: VideoAspectRatio,
    resolution: VideoResolution,
    onProgress: (message: string) => void
): Promise<{ operation: GetVideosOperationResponse, url: string }> => {
     if (!navigator.onLine) {
        throw new Error("You must be online to generate videos.");
    }
    const ai = getGenAIClient();
    onProgress("Initializing video generation...");

    const operation: GenerateVideosOperation = await withRetry(() => ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution,
            aspectRatio,
        }
    }));
    
    onProgress("Video generation started. This may take several minutes...");
    
    return pollAndFetchVideo(operation, ai, onProgress);
};

export const extendVideo = async (
    prompt: string,
    previousVideo: Video,
    onProgress: (message: string) => void
): Promise<{ operation: GetVideosOperationResponse, url: string }> => {
    if (!navigator.onLine) {
        throw new Error("You must be online to extend videos.");
    }
    const ai = getGenAIClient();
    onProgress("Initializing video extension...");

    if (previousVideo.resolution !== '720p') {
        throw new Error("Only 720p videos can be extended.");
    }

    const operation: GenerateVideosOperation = await withRetry(() => ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        video: previousVideo,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: previousVideo.aspectRatio,
        }
    }));
    
    onProgress("Video extension started. This may take several minutes...");

    return pollAndFetchVideo(operation, ai, onProgress);
};