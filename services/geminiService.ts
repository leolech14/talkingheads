import { GoogleGenAI, Modality } from "@google/genai";
import { IMAGE_EDIT_MODEL, VIDEO_GEN_MODEL, TEXT_MODEL } from '../constants';
import { ExpressionIntensity, ExpressiveImageResponse, VideoOrientation, VoiceStyle } from "../types";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const enhanceScriptWithAI = async (currentScript: string): Promise<string> => {
    const prompt = `You are an expert copywriter specializing in video scripts. Rewrite the following text to be more engaging, clear, and concise for a talking head video. Maintain the original meaning but improve the flow and impact. Return only the revised script text, without any additional explanations or preamble. Original script: "${currentScript}"`;
    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
        });
        return response.text.trim();
    } catch(error) {
        console.error("Error enhancing script:", error);
        throw new Error("Failed to enhance script with AI. Please try again.");
    }
};

const getExpressionPromptText = (intensity: ExpressionIntensity): string => {
    switch (intensity) {
        case ExpressionIntensity.NEUTRAL:
            return 'a neutral, calm expression';
        case ExpressionIntensity.EXPRESSIVE:
            return 'an expressive and engaging look';
        case ExpressionIntensity.VERY_EXPRESSIVE:
            return 'a very expressive and highly animated look';
        default:
            return 'an engaging look';
    }
};

const getOrientationPromptText = (orientation: VideoOrientation): string => {
    switch (orientation) {
        case VideoOrientation.LANDSCAPE:
            return 'in a landscape 16:9 aspect ratio';
        case VideoOrientation.PORTRAIT:
            return 'in a portrait 9:16 aspect ratio';
        case VideoOrientation.SQUARE:
            return 'in a square 1:1 aspect ratio';
        default:
            return '';
    }
}

export const generateExpressiveImage = async (
    base64ImageData: string,
    mimeType: string,
    script: string,
    intensity: ExpressionIntensity,
    orientation: VideoOrientation,
): Promise<ExpressiveImageResponse> => {
    const expressionText = getExpressionPromptText(intensity);
    const orientationText = getOrientationPromptText(orientation);
    const prompt = `Based on the provided image, regenerate it to show the person with ${expressionText} as if they are about to speak the following script: "${script}". Make them look natural and ready to speak. Render the final image ${orientationText}. Do not change the person, their clothing, or the background. Only adjust their facial expression and slight head posture for a natural speaking look.`;

    try {
        const response = await ai.models.generateContent({
            model: IMAGE_EDIT_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: base64ImageData, mimeType } },
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        
        if (imagePart?.inlineData) {
            return {
                base64: imagePart.inlineData.data,
                mimeType: imagePart.inlineData.mimeType,
            };
        } else {
            throw new Error("AI did not return an expressive image. Please try again.");
        }
    } catch (error) {
        console.error("Error generating expressive image:", error);
        throw new Error("Failed to generate expressive image from AI.");
    }
};


export const startVideoGeneration = async (
    base64ImageData: string,
    mimeType: string,
    script: string,
    voicePrompt: string,
): Promise<any> => {
    try {
        const operation = await ai.models.generateVideos({
            model: VIDEO_GEN_MODEL,
            prompt: `Narrate the following script in ${voicePrompt}: "${script}"`,
            image: {
                imageBytes: base64ImageData,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
            }
        });
        return operation;
    } catch (error) {
        console.error("Error starting video generation:", error);
        throw new Error("Failed to start video generation.");
    }
};


export const checkVideoGenerationStatus = async (operation: any): Promise<any> => {
    try {
        const status = await ai.operations.getVideosOperation({ operation: operation });
        return status;
    } catch (error) {
        console.error("Error checking video generation status:", error);
        throw new Error("Failed to check video generation status.");
    }
};