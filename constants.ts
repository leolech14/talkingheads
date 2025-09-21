import { VoiceStyle, VoiceOption } from "./types";

export const TEXT_MODEL = 'gemini-2.5-flash';
export const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image-preview';
export const VIDEO_GEN_MODEL = 'veo-2.0-generate-001';

// A curated list of voices for the browser's SpeechSynthesis API and video generation.
// 'name' should be a unique identifier, and preferably match a name from `speechSynthesis.getVoices()` for better auditioning.
// 'displayName' is for the UI.
// 'promptDescriptor' is used to instruct the video generation model.
export const VOICES: VoiceOption[] = [
    { 
        name: 'Google US English', 
        displayName: 'Female - Friendly & Clear', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a standard female voice with a friendly and clear tone' 
    },
    { 
        name: 'Microsoft David - English (United States)', 
        displayName: 'Male - Professional & Confident', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a standard male voice with a professional and confident tone'
    },
    { 
        name: 'Google UK English Female', 
        displayName: 'Female - British Accent, Polished', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a female voice with a polished and refined British accent'
    },
    { 
        name: 'Google UK English Male', 
        displayName: 'Male - British Accent, Storyteller', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a male voice with a classic British accent, suitable for storytelling'
    },
    { 
        name: 'Microsoft Zira - English (United States)', 
        displayName: 'Female - Upbeat & Energetic', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'an upbeat and energetic female voice'
    },
    { 
        name: '...male_deep', // Unique name for voices without a direct browser equivalent
        displayName: 'Male - Deep & Authoritative', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a deep, authoritative male voice for narration'
    },
    { 
        name: '...female_warm', // Unique name for voices without a direct browser equivalent
        displayName: 'Female - Warm & Soothing', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a warm and soothing female voice, like for meditation or storytelling'
    },
     { 
        name: '...male_friendly', // Unique name for voices without a direct browser equivalent
        displayName: 'Male - Casual & Friendly', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a casual and friendly male voice, like a podcast host'
    },
];
