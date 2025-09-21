export enum VoiceStyle {
    MALE = 'Male',
    FEMALE = 'Female',
}

export interface VoiceOption {
    name: string;
    displayName: string;
    gender: VoiceStyle;
    promptDescriptor: string;
}

export enum ExpressionIntensity {
    NEUTRAL = 'Neutral',
    EXPRESSIVE = 'Expressive',
    VERY_EXPRESSIVE = 'Very Expressive',
}

export enum VideoOrientation {
    LANDSCAPE = 'Landscape (16:9)',
    PORTRAIT = 'Portrait (9:16)',
    SQUARE = 'Square (1:1)',
}

export interface ExpressiveImageResponse {
    base64: string;
    mimeType: string;
}

export interface VideoHistoryItem {
    id: string;
    videoUrl: string;
    thumbnailUrl: string;
    script: string;
    timestamp: Date;
}

export type PipelineStage =
    | 'GENERATING_IMAGE'
    | 'STARTING_VIDEO'
    | 'RENDERING_VIDEO'
    | 'DOWNLOADING_VIDEO'
    | 'CREATING_THUMBNAIL'
    | '';
