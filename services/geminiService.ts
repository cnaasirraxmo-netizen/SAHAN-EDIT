import { GoogleGenAI, Modality, GenerateContentResponse, GenerateImagesResponse, GenerateVideosOperation, GetVideosOperationResponse } from "@google/genai";
import { AspectRatio, VideoAspectRatio, VideoResolution } from "../types";

const getGenAIClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
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


export const generateVideo = async (
    prompt: string,
    image: { base64: string; mimeType: string } | null,
    aspectRatio: VideoAspectRatio,
    resolution: VideoResolution,
    onProgress: (message: string) => void
): Promise<string> => {
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
    
    let getOperationResponse: GetVideosOperationResponse = operation;

    while (!getOperationResponse.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        onProgress("Checking video status...");
        try {
          getOperationResponse = await ai.operations.getVideosOperation({ operation: operation });
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
    const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.statusText}`);
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};
