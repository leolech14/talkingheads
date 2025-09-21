export enum VoiceStyle {
    MALE = 'Male',
    FEMALE = 'Female',
}

export interface TTSVoiceOption {
    kind: 'tts';
    name: string; // e.g., en-US-Studio-O
    displayName: string;
    gender: VoiceStyle;
    promptDescriptor: string;
}

export interface ClonedVoiceOption {
    kind: 'cloned';
    id: string; // crypto.randomUUID()
    displayName: string;
    promptDescriptor: string; // User-provided or AI-generated description
    audioSampleFileName?: string; // If cloned from audio, store filename
}

export type VoiceOption = TTSVoiceOption | ClonedVoiceOption;


export enum VideoOrientation {
    LANDSCAPE = 'Landscape (16:9)',
    PORTRAIT = 'Portrait (9:16)',
    SQUARE = 'Square (1:1)',
}

export interface ExpressiveImageResponse {
    base64: string;
    mimeType: string;
}

export interface GestureInstruction {
    key_phrase: string;
    gesture_description: string;
    timeSec?: number; // The peak time of the gesture in the audio
}

export interface VideoHistoryItem {
    id:string;
    videoUrl: string;
    thumbnailUrl: string;
    script: string;
    timestamp: Date;
}

// --- New Types for Architecture Shift ---

export interface ImageAsset {
  id: string;
  kind: 'uploaded' | 'generated';
  blob: Blob;
  mimeType: string;
  createdAt: number;
  frameId?: string; // e.g., NB_001 if generated
  timeSec?: number; // peak time if generated
  objectUrl: string; // Revocable URL for display
}

export interface AudioAsset {
  id: string;
  voiceName: string;
  scope: 'preview' | 'full';
  textHash: string;
  blob: Blob;
  durationSec?: number;
  createdAt: number;
  objectUrl: string; // Revocable URL for playback
}

export type GallerySelection = { 
    imageId: string;
    image: ImageAsset;
} | null;

export type PipelineStage =
  | 'IDLE' 
  | 'VOICE_PREVIEWS' 
  | 'VOICE_SELECTED'
  | 'AUDIO_FULL' 
  | 'AUDIO_ANALYSIS'
  | 'GESTURE_PLANNING' 
  | 'GESTURE_EDITING'
  | 'KEYFRAME_GEN'
  | 'VIDEO_START' 
  | 'VIDEO_RENDER' 
  | 'VIDEO_DOWNLOAD'
  | 'CANCELED' 
  | 'ERROR' 
  | 'DONE';

export interface AudioTimingSegment {
    id: number;
    text: string;
    startSec: number;
    endSec: number;
    peakSec: number; // Estimated peak emphasis time
}

export interface AudioAnalysis {
    totalSec: number;
    segments: AudioTimingSegment[];
}