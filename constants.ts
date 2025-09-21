import { VoiceStyle, VoiceOption } from "./types";

export const TEXT_MODEL = 'gemini-2.5-flash';
export const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image-preview';
export const VIDEO_GEN_MODEL = 'veo-2.0-generate-001';

// A curated list of high-quality voices from the Google Cloud Text-to-Speech API.
export const VOICES: VoiceOption[] = [
    { 
        name: 'en-US-Studio-O', 
        displayName: 'Female - Friendly & Clear', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a standard female voice with a friendly and clear tone' 
    },
    { 
        name: 'en-US-Studio-M', 
        displayName: 'Male - Professional & Confident', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a standard male voice with a professional and confident tone'
    },
    { 
        name: 'en-GB-Studio-C', 
        displayName: 'Female - British Accent, Polished', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a female voice with a polished and refined British accent'
    },
    { 
        name: 'en-GB-News-J', 
        displayName: 'Male - British Accent, Storyteller', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a male voice with a classic British accent, suitable for storytelling'
    },
    { 
        name: 'en-US-Wavenet-H', 
        displayName: 'Female - Upbeat & Energetic', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'an upbeat and energetic female voice'
    },
    { 
        name: 'en-US-Wavenet-D',
        displayName: 'Male - Deep & Authoritative', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a deep, authoritative male voice for narration'
    },
    { 
        name: 'en-US-Wavenet-F',
        displayName: 'Female - Warm & Soothing', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a warm and soothing female voice, like for meditation or storytelling'
    },
];