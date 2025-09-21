import { VoiceStyle, TTSVoiceOption } from "./types";

export const TEXT_MODEL = 'gemini-2.5-flash';
export const IMAGE_EDIT_MODEL = 'gemini-2.5-flash-image-preview';
export const VIDEO_GEN_MODEL = 'veo-2.0-generate-001';

// A curated list of high-quality voices from the Google Cloud Text-to-Speech API.
export const VOICES: TTSVoiceOption[] = [
    { 
        kind: 'tts',
        name: 'en-US-Studio-O', 
        displayName: 'Female (US) - Friendly & Clear', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a standard female voice with a friendly and clear American accent' 
    },
    { 
        kind: 'tts',
        name: 'en-US-Studio-M', 
        displayName: 'Male (US) - Professional & Confident', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a standard male voice with a professional and confident American accent'
    },
    { 
        kind: 'tts',
        name: 'en-GB-Studio-C', 
        displayName: 'Female (UK) - Polished & Refined', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a female voice with a polished and refined British accent'
    },
    { 
        kind: 'tts',
        name: 'en-GB-News-J', 
        displayName: 'Male (UK) - Storyteller', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a male voice with a classic British accent, suitable for storytelling'
    },
    { 
        kind: 'tts',
        name: 'en-AU-Studio-B', 
        displayName: 'Male (AU) - Relaxed & Natural', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a male voice with a relaxed and natural Australian accent'
    },
    { 
        kind: 'tts',
        name: 'en-IN-Wavenet-D', 
        displayName: 'Male (IN) - Professional', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a professional male voice with a standard Indian English accent'
    },
    { 
        kind: 'tts',
        name: 'en-US-Wavenet-H', 
        displayName: 'Female (US) - Upbeat & Energetic', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'an upbeat and energetic female voice with an American accent'
    },
    { 
        kind: 'tts',
        name: 'en-US-Wavenet-D',
        displayName: 'Male (US) - Deep & Authoritative', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a deep, authoritative male voice with an American accent for narration'
    },
    { 
        kind: 'tts',
        name: 'en-US-Wavenet-F',
        displayName: 'Female (US) - Warm & Soothing', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a warm and soothing female voice with an American accent, like for meditation or storytelling'
    },
    { 
        kind: 'tts',
        name: 'fr-FR-Studio-A', 
        displayName: 'Female - French, Elegant', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'an elegant female voice with a Parisian French accent'
    },
    { 
        kind: 'tts',
        name: 'es-ES-Studio-A', 
        displayName: 'Female - Spanish, Clear', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a female voice with a clear Castilian Spanish accent'
    },
    { 
        kind: 'tts',
        name: 'de-DE-Studio-B', 
        displayName: 'Male - German, Formal', 
        gender: VoiceStyle.MALE,
        promptDescriptor: 'a formal male voice with a standard German accent'
    },
    { 
        kind: 'tts',
        name: 'ja-JP-Wavenet-C', 
        displayName: 'Female - Japanese, Standard', 
        gender: VoiceStyle.FEMALE,
        promptDescriptor: 'a standard female Japanese voice'
    },
];
