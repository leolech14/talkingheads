import { AudioAsset, AudioAnalysis, AudioTimingSegment } from "../types";
import { VOICES } from "../constants";
import * as dbService from './dbService';

/**
 * Extracts the first sentence from a script.
 */
export const extractFirstSentence = (script: string): string => {
    if (!script) return "";
    const trimmedScript = script.trim();
    // Split by common sentence-ending punctuation.
    const sentences = trimmedScript.match(/[^.!?]+[.!?]+/g);
    return sentences ? sentences[0].trim() : trimmedScript;
};

/**
 * Creates a stable SHA-256 hash of a script and its style tags for caching.
 */
export const hashText = async (script: string, styleTags: string[] = []): Promise<string> => {
    // Create a canonical representation by sorting tags to ensure hash consistency
    const canonicalString = script + JSON.stringify(styleTags.sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Creates a deterministic, composite key for an audio asset to be used for caching.
 */
const createAudioCacheKey = (textHash: string, voiceName: string, scope: 'preview' | 'full'): string => {
    return `${textHash}-${voiceName}-${scope}`;
};

/**
 * Converts a base64 encoded string to a Blob.
 */
const base64ToBlob = (base64: string, contentType: string = ''): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
};

/**
 * Gets the precise duration of an audio blob using the Web Audio API.
 * @param blob The audio blob to analyze.
 * @returns A promise that resolves with the duration in seconds.
 */
const getAudioDuration = (blob: Blob): Promise<number> => {
    return new Promise((resolve, reject) => {
        if (blob.size === 0) {
            return resolve(0);
        }
        const audioContext = new (window.AudioContext)();
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                audioContext.decodeAudioData(e.target.result as ArrayBuffer,
                    (buffer) => resolve(buffer.duration),
                    (error) => reject(`Error decoding audio data: ${error}`)
                );
            } else {
                reject('Could not read audio file to determine duration.');
            }
        };
        reader.onerror = (error) => reject(`FileReader error while getting duration: ${error}`);
        reader.readAsArrayBuffer(blob);
    });
};

/**
 * Fetches high-quality audio from the Google Cloud TTS API.
 * @returns A promise that resolves to an object containing the audio blob and its duration.
 */
const fetchGoogleTTSAudio = async (text: string, voiceName: string): Promise<{ blob: Blob, durationSec: number }> => {
    const TTS_API_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.API_KEY}`;
    try {
        const languageCode = voiceName.split('-').slice(0, 2).join('-'); // e.g., 'en-US-Wavenet-A' -> 'en-US'
        const ssmlGender = VOICES.find(v => v.name === voiceName)?.gender === 'Male' ? 'MALE' : 'FEMALE';
        
        const response = await fetch(TTS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text },
                voice: { languageCode, name: voiceName, ssmlGender },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error("TTS API Error:", errorBody);
            throw new Error(`Google TTS API failed with status ${response.status}: ${errorBody.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        if (!data.audioContent) {
            throw new Error("No audio content in Google TTS API response.");
        }

        const blob = base64ToBlob(data.audioContent, 'audio/mp3');
        const durationSec = await getAudioDuration(blob);

        return { blob, durationSec };
    } catch (error: any) {
        console.error("Error fetching or processing TTS audio:", error);
        if (error instanceof TypeError) { // This often indicates a network error
            throw new Error("Audio generation failed: Could not connect to the text-to-speech service. Please check your network connection.");
        }
        // Re-throw errors from the API response or other issues, ensuring a consistent message format.
        throw new Error(`Audio generation failed: ${error.message}`);
    }
};

/**
 * Generates audio assets, checking for cached versions before generating new audio via API.
 */
const generateAudio = async (text: string, voiceName: string, styleTags: string[], scope: 'preview' | 'full'): Promise<AudioAsset> => {
    const textHash = await hashText(text, scope === 'full' ? styleTags : []);
    const cacheId = createAudioCacheKey(textHash, voiceName, scope);

    const cachedAsset = await dbService.getAudioAssetBy(textHash, voiceName, scope);
    if (cachedAsset) {
        return { ...cachedAsset, objectUrl: URL.createObjectURL(cachedAsset.blob) };
    }

    const { blob, durationSec } = await fetchGoogleTTSAudio(text, voiceName);

    const newAsset: Omit<AudioAsset, 'objectUrl'> = {
        id: cacheId,
        voiceName,
        scope,
        textHash,
        blob,
        durationSec,
        createdAt: Date.now(),
    };

    await dbService.saveAudioAsset(newAsset);
    return { ...newAsset, objectUrl: URL.createObjectURL(newAsset.blob) };
};

/**
 * Generates preview audio assets for the first sentence of a script across all voices.
 */
export const generatePreviewAudios = async (script: string): Promise<AudioAsset[]> => {
    const firstSentence = extractFirstSentence(script);
    if (!firstSentence) return [];

    const previewPromises = VOICES.map(voice =>
        generateAudio(firstSentence, voice.name, [], 'preview')
    );
    
    return Promise.all(previewPromises);
};

/**
 * Generates a full audio asset for the entire script.
 */
export const generateFullAudio = async (script: string, voiceName: string, styleTags: string[] = []): Promise<AudioAsset> => {
    return generateAudio(script, voiceName, styleTags, 'full');
};

/**
 * Analyzes a script to estimate audio timings for sentence segments based on a pre-measured duration.
 */
export const analyzeAudioTimings = async (totalSec: number, script: string): Promise<AudioAnalysis> => {
    if (totalSec <= 0) {
        return { totalSec: 0, segments: [] };
    }

    // Improved regex to handle the last sentence if it lacks punctuation
    const sentences = script.match(/[^.!?\n]+(?:[.!?\n]|$)+/g) || [script];
    const totalChars = sentences.reduce((sum, s) => sum + s.trim().length, 0);

    if (totalChars === 0) {
        return { totalSec, segments: [] };
    }

    let currentTime = 0;
    const segments: AudioTimingSegment[] = [];

    sentences.forEach((sentenceText, index) => {
        const text = sentenceText.trim();
        if (!text) return;

        const duration = (text.length / totalChars) * totalSec;
        const startSec = currentTime;
        const endSec = startSec + duration;
        
        // A more sophisticated heuristic for peak emphasis time
        const words = text.split(/\s+/).filter(Boolean).length;
        let peakPercentage: number;

        if (words <= 3) {
            peakPercentage = 0.50; // Middle for very short phrases
        } else if (words <= 8) {
            peakPercentage = 0.60; // Slightly after middle for medium phrases
        } else {
            peakPercentage = 0.70; // Later for longer sentences
        }

        // Adjust for punctuation, pushing emphasis towards the end for questions/exclamations
        if (text.endsWith('?') || text.endsWith('!')) {
            peakPercentage = Math.min(0.85, peakPercentage + 0.15);
        }

        const peakSec = startSec + (duration * peakPercentage);

        segments.push({
            id: index,
            text,
            startSec,
            endSec,
            peakSec,
        });

        currentTime = endSec;
    });

    return {
        totalSec,
        segments,
    };
};