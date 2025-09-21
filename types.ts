export enum VoiceStyle {
    MALE = 'Male',
    FEMALE = 'Female',
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
