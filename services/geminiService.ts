import { GoogleGenAI, Modality, Type } from "@google/genai";
import { IMAGE_EDIT_MODEL, VIDEO_GEN_MODEL, TEXT_MODEL } from '../constants';
import { ExpressiveImageResponse, GestureInstruction, AudioTimingSegment } from "../types";

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const analyzeScriptForGestures = async (script: string, segments: AudioTimingSegment[], styleTags: string[]): Promise<GestureInstruction[]> => {
    let styleInstruction = '';
    if (styleTags && styleTags.length > 0) {
        styleInstruction = `The desired speaking style is: **${styleTags.join(', ')}**. The gestures should reflect this style. For example, a 'Confident' style might use more definitive or assertive gestures, while a 'Warm' style could involve more open and inviting hand movements. Tailor your suggestions accordingly.\n\n`;
    }

    const prompt = `You are a professional presentation coach and video director. Your task is to analyze the following script and its corresponding timed segments. For each segment, suggest a natural, subtle hand gesture that would accompany the key phrase within it.

${styleInstruction}Constraints:
- Return a gesture for EACH segment provided.
- Gestures should be simple and professional (e.g., open palm, a subtle finger count, a gentle hand movement to emphasize a point). Avoid exaggerated or theatrical movements.
- The output must be a JSON array of objects, where each object corresponds to a segment and contains 'key_phrase', 'gesture_description', and the 'timeSec' of the gesture's peak, which you should take directly from the input segment's 'peakSec'.

Input Script: "${script}"

Input Timed Segments (with peak emphasis time):
${JSON.stringify(segments.map(s => ({ text: s.text, peakSec: s.peakSec })), null, 2)}
`;

    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            key_phrase: { type: Type.STRING },
                            gesture_description: { type: Type.STRING },
                            timeSec: { type: Type.NUMBER },
                        },
                        required: ["key_phrase", "gesture_description", "timeSec"],
                    },
                },
            },
        });
        
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as GestureInstruction[];
    } catch (error: any) {
        console.error("Error analyzing script for gestures:", error);
        if (error instanceof SyntaxError) {
            throw new Error("Gesture analysis failed: The AI returned an invalid data format. Please try modifying your script slightly.");
        }
        const errorMessage = error.toString().toLowerCase();
        if (errorMessage.includes('quota')) {
            throw new Error("Gesture analysis failed: API quota exceeded. Please check your Google AI Studio account for usage limits and billing details.");
        }
        if (errorMessage.includes('permission denied') || errorMessage.includes('api key not valid')) {
            throw new Error("Gesture analysis failed: Invalid API Key. Please ensure your API key is correctly configured in your environment.");
        }
        if (errorMessage.includes('invalid argument')) {
            throw new Error("Gesture analysis failed: The AI considers the provided script or parameters invalid. Please try modifying your inputs.");
        }
        if (errorMessage.includes('safety')) {
            throw new Error("Gesture analysis failed: The request was blocked due to safety policies. Please modify your script.");
        }
        throw new Error("Could not analyze script for gestures. The service might be busy, or there could be a network issue.");
    }
};


export const generateGestureKeyframe = async (
    base64ImageData: string,
    mimeType: string,
    gesture: GestureInstruction
): Promise<ExpressiveImageResponse> => {
    const prompt = `**CRITICAL INSTRUCTION: Perform an in-place edit only.** You will be given a ground-truth image of a person. Your ONLY task is to modify the person's hands and arms to perform a specific gesture. The person should have their mouth open slightly, as if mid-speech.

**DO NOT CHANGE:**
- The person's facial identity, hair, or head position (maintain yaw, pitch, roll).
- The person's clothing or accessories.
- The background.
- The lighting.
- The camera angle.
- **Do NOT add any text, watermarks, subtitles, or other overlays to the image.**

The original image is the source of truth for the subject's appearance. You must preserve it perfectly.

**Gesture to Apply:**
The person is saying "${gesture.key_phrase}". At this moment, they should make the following gesture: **${gesture.gesture_description}**.

Regenerate the image showing only this subtle change.`;

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
            throw new Error(`The AI did not return an image for the phrase: "${gesture.key_phrase}". This could be due to safety filters.`);
        }
    } catch (error: any) {
        const keyPhraseContext = `for "${gesture.key_phrase}"`;
        console.error(`Error generating gesture keyframe ${keyPhraseContext}:`, error);
        const errorMessage = error.toString().toLowerCase();

        if (errorMessage.includes('quota')) {
            throw new Error(`Keyframe generation failed ${keyPhraseContext}: API quota exceeded. Please check your Google AI Studio account for usage limits and billing details.`);
        }
        if (errorMessage.includes('permission denied') || errorMessage.includes('api key not valid')) {
            throw new Error(`Keyframe generation failed ${keyPhraseContext}: Invalid API Key. Please ensure your API key is correctly configured in your environment.`);
        }
        if (errorMessage.includes('invalid argument')) {
            throw new Error(`Keyframe generation failed ${keyPhraseContext}: The AI considers the provided image or parameters invalid. Please try modifying your inputs.`);
        }
        if (errorMessage.includes('safety')) {
            throw new Error(`The gesture ${keyPhraseContext} was blocked due to safety policies. Please try a different description.`);
        }
        throw new Error(`Failed to generate a keyframe ${keyPhraseContext}. The service might be busy, or there could be a network issue.`);
    }
};

export const startVideoGeneration = async (
    base64ImageData: string,
    mimeType: string,
    script: string,
    voicePromptDescriptor: string,
    styleTags: string[],
    gestures: GestureInstruction[] = []
): Promise<any> => {
    try {
        let voicePrompt = voicePromptDescriptor;
        if (styleTags.length > 0) {
            voicePrompt += `, with a tone that is ${styleTags.join(', ')}`;
        }

        let finalPrompt = `Narrate the following script in ${voicePrompt}: "${script}"\n\n`;
        finalPrompt += `**IMPORTANT: Do NOT add any text, subtitles, or captions to the video.** The final video should only contain the speaking subject against their original background.\n\n`;

        if (gestures.length > 0) {
            finalPrompt += `Animate the subject speaking the script naturally. As they speak, incorporate the following gestures at the specified times:\n`;
            gestures.forEach(g => {
                finalPrompt += `- At ${g.timeSec?.toFixed(2)} seconds, when saying "${g.key_phrase}", the subject should perform: "${g.gesture_description}".\n`;
            });
            finalPrompt += `Ensure the lip-sync is perfect and the transition between gestures is smooth and lifelike. Maintain the subject's appearance from the provided image throughout the video.`
        }

        const operation = await ai.models.generateVideos({
            model: VIDEO_GEN_MODEL,
            prompt: finalPrompt,
            image: {
                imageBytes: base64ImageData,
                mimeType: mimeType,
            },
            config: {
                numberOfVideos: 1,
            }
        });
        return operation;
    } catch (error: any) {
        console.error("Error starting video generation:", error);
        const errorMessage = error.toString().toLowerCase();
        if (errorMessage.includes('quota')) {
             throw new Error("Video generation failed: API quota exceeded. Please check your Google AI Studio account for usage limits and billing details.");
        }
        if (errorMessage.includes('permission denied') || errorMessage.includes('api key not valid')) {
            throw new Error("Video generation failed: Invalid API Key. Please ensure your API key is correctly configured in your environment.");
        }
        if (errorMessage.includes('invalid argument')) {
            throw new Error("Video generation failed: The AI considers the provided script, image, or parameters invalid. Please try modifying your inputs.");
        }
        if (errorMessage.includes('safety')) {
            throw new Error("Video generation failed: The request was blocked due to safety policies. Please modify your script or image.");
        }
        throw new Error("Could not start the video generation process. The service might be busy, or there could be a network issue.");
    }
};


export const checkVideoGenerationStatus = async (operation: any): Promise<any> => {
    try {
        const status = await ai.operations.getVideosOperation({ operation: operation });
        return status;
    } catch (error) {
        console.error("Error checking video generation status:", error);
        throw new Error("Lost connection while checking video status.");
    }
};

export const downloadVideo = async (downloadLink: string): Promise<Blob> => {
    if (!process.env.API_KEY) {
        throw new Error("Application is not configured correctly (missing API key).");
    }
    try {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Download failed with status: ${response.statusText}`);
        }
        return await response.blob();
    } catch (error) {
        console.error("Error downloading video:", error);
        throw new Error("The video was generated, but the download failed.");
    }
}

export const analyzeVoiceFromAudio = async (base64AudioData: string, mimeType: string): Promise<string> => {
    const prompt = `You are an expert voice analyst. Analyze the provided audio sample and generate a concise, descriptive prompt that can be used to instruct a text-to-speech AI to replicate this voice. Focus on key characteristics like:
- Gender (e.g., male, female)
- Age range (e.g., young adult, middle-aged, senior)
- Pitch (e.g., deep, high-pitched, baritone)
- Pace (e.g., fast-paced, measured, slow)
- Tone/Emotion (e.g., authoritative, friendly, energetic, calm, serious)
- Accent (if discernible, e.g., American, British, etc.)

The output must be a single string, no longer than 30 words, that captures the essence of the voice. For example: "A deep, authoritative male voice with a measured pace, suitable for narration."`;

    try {
        const response = await ai.models.generateContent({
            model: TEXT_MODEL,
            contents: {
                parts: [
                    { inlineData: { data: base64AudioData, mimeType } },
                    { text: prompt },
                ],
            },
        });
        
        return response.text.trim();
    } catch (error: any) {
        console.error("Error analyzing voice from audio:", error);
        const errorMessage = error.toString().toLowerCase();
        if (errorMessage.includes('quota')) {
            throw new Error("Voice analysis failed: API quota exceeded. Please check your account.");
        }
        if (errorMessage.includes('safety')) {
            throw new Error("Voice analysis failed: The audio was blocked due to safety policies.");
        }
        throw new Error("Could not analyze the provided audio sample. The service may be busy or the file format may be unsupported.");
    }
};