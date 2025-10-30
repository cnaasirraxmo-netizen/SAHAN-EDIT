import { GoogleGenAI, Modality, GenerateContentResponse, GenerateImagesResponse, GenerateVideosOperation, GetVideosOperationResponse, Video } from "@google/genai";
import { AspectRatio, VideoAspectRatio, VideoResolution } from "../types";

const getGenAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
    // Create a new client for each request to ensure the latest API key is used.
    return new GoogleGenAI({ apiKey });
}

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
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
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("Image generation failed or returned no images.");
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
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
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error("Image editing failed or returned no image data.");
};

export const generateVideoScript = async (topic: string, platform: 'TikTok' | 'YouTube'): Promise<string> => {
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

    return response.text;
};


const pollAndFetchVideo = async (operation: GenerateVideosOperation, ai: GoogleGenAI, onProgress: (message: string) => void): Promise<{ operation: GetVideosOperationResponse, url: string }> => {
    let getOperationResponse: GetVideosOperationResponse = operation;
    
    while (!getOperationResponse.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onProgress("Checking video status...");
        try {
          getOperationResponse = await ai.operations.getVideosOperation({ operation });
        } catch (e) {
          console.error("Error polling video status:", e);
          onProgress("Error checking status. Retrying...");
        }
    }

    onProgress("Video processing complete. Fetching video data...");
    
    const downloadLink = getOperationResponse.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
        throw new Error("Video generation completed but no download link was found.");
    }
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set for video download.");
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
    const ai = getGenAIClient();
    onProgress("Initializing video generation...");

    let operation: GenerateVideosOperation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
            numberOfVideos: 1,
            resolution,
            aspectRatio,
        }
    });
    
    onProgress("Video generation started. This may take several minutes...");
    
    return pollAndFetchVideo(operation, ai, onProgress);
};

export const extendVideo = async (
    prompt: string,
    previousVideo: Video,
    onProgress: (message: string) => void
): Promise<{ operation: GetVideosOperationResponse, url: string }> => {
    const ai = getGenAIClient();
    onProgress("Initializing video extension...");

    if (previousVideo.resolution !== '720p') {
        throw new Error("Only 720p videos can be extended.");
    }

    let operation: GenerateVideosOperation = await ai.models.generateVideos({
        model: 'veo-3.1-generate-preview',
        prompt,
        video: previousVideo,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: previousVideo.aspectRatio,
        }
    });
    
    onProgress("Video extension started. This may take several minutes...");

    return pollAndFetchVideo(operation, ai, onProgress);
};