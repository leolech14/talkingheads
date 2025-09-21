import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { VideoPlayer } from './components/VideoPlayer';
import { Loader } from './components/Loader';
import { generateExpressiveImage, startVideoGeneration, checkVideoGenerationStatus, enhanceScriptWithAI } from './services/geminiService';
import { ExpressionIntensity, VoiceStyle, VideoOrientation } from './types';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { VOICES } from './constants';

const App: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [script, setScript] = useState<string>("Welcome to the future of video creation! With just a single image and a script, you can generate a lifelike talking head video, complete with natural expressions and perfectly synced audio.");
    const [voiceStyle, setVoiceStyle] = useState<string>(VOICES[0]?.name ?? '');
    const [expressionIntensity, setExpressionIntensity] = useState<ExpressionIntensity>(ExpressionIntensity.EXPRESSIVE);
    const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>(VideoOrientation.LANDSCAPE);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEnhancingScript, setIsEnhancingScript] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageSrc = reader.result as string;
            setUploadedImage(imageSrc);
            setImageMimeType(file.type);
            setGeneratedVideoUrl(null);
            setError(null);

            // Automatically detect image orientation
            const img = new Image();
            img.onload = () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                if (aspectRatio > 1.2) {
                    setVideoOrientation(VideoOrientation.LANDSCAPE);
                } else if (aspectRatio < 0.85) {
                    setVideoOrientation(VideoOrientation.PORTRAIT);
                } else {
                    setVideoOrientation(VideoOrientation.SQUARE);
                }
            };
            img.src = imageSrc;
        };
        reader.onerror = () => {
            setError("Failed to read the image file.");
        };
        reader.readAsDataURL(file);
    };

    const pollForVideo = useCallback(async (operation: any) => {
        let currentOperation = operation;
        while (!currentOperation.done) {
            setLoadingMessage('Rendering video... This can take a few minutes. Please wait.');
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            try {
                 currentOperation = await checkVideoGenerationStatus(currentOperation);
            } catch(e) {
                console.error("Polling failed:", e);
                throw new Error("Failed to get video generation status.");
            }
        }
        return currentOperation;
    }, []);

    const handleEnhanceScript = useCallback(async () => {
        if (!script) {
            setError("Please enter a script to enhance.");
            return;
        }
        setIsEnhancingScript(true);
        setError(null);
        try {
            const enhancedScript = await enhanceScriptWithAI(script);
            setScript(enhancedScript);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to enhance the script.");
        } finally {
            setIsEnhancingScript(false);
        }
    }, [script]);

    const handleGenerateVideo = useCallback(async () => {
        if (!uploadedImage || !imageMimeType || !script) {
            setError("Please upload an image and provide a script before generating a video.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);

        try {
            // Step 1: Generate an expressive image
            setLoadingMessage('Analyzing script and generating expressive image...');
            const base64OnlyImage = uploadedImage.split(',')[1];
            const expressiveImageResponse = await generateExpressiveImage(base64OnlyImage, imageMimeType, script, expressionIntensity, videoOrientation);
            
            // Step 2: Start video generation with the new image
            setLoadingMessage('Initializing video generation...');
            const selectedVoiceConfig = VOICES.find(v => v.name === voiceStyle);
            if (!selectedVoiceConfig) {
                throw new Error(`Voice style "${voiceStyle}" not found in configuration.`);
            }
            const finalVoicePrompt = selectedVoiceConfig.promptDescriptor;

            const videoOperation = await startVideoGeneration(expressiveImageResponse.base64, expressiveImageResponse.mimeType, script, finalVoicePrompt);

            // Step 3: Poll for video completion
            const finalOperation = await pollForVideo(videoOperation);
            
            setLoadingMessage('Finalizing video...');
            const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;

            if (!downloadLink) {
                throw new Error("Video generation completed, but no download link was found.");
            }

            // Step 4: Fetch the video and create a URL
            if(!process.env.API_KEY){
                throw new Error("API_KEY environment variable not set.");
            }
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            if (!videoResponse.ok) {
                throw new Error(`Failed to download the generated video. Status: ${videoResponse.statusText}`);
            }
            
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);

            setGeneratedVideoUrl(videoUrl);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unknown error occurred during video generation.");
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [uploadedImage, imageMimeType, script, expressionIntensity, pollForVideo, voiceStyle, videoOrientation]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Header />
                <main className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-8">
                        <ImageUploader onImageUpload={handleImageUpload} uploadedImagePreview={uploadedImage} />
                        <ControlPanel
                            script={script}
                            setScript={setScript}
                            voiceStyle={voiceStyle}
                            setVoiceStyle={setVoiceStyle}
                            expressionIntensity={expressionIntensity}
                            setExpressionIntensity={setExpressionIntensity}
                            onGenerate={handleGenerateVideo}
                            isLoading={isLoading}
                            isReady={!!uploadedImage}
                            onEnhanceScript={handleEnhanceScript}
                            isEnhancingScript={isEnhancingScript}
                        />
                    </div>
                    <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center justify-center min-h-[400px] lg:min-h-0">
                        {isLoading ? (
                            <Loader message={loadingMessage} />
                        ) : error ? (
                             <ErrorDisplay message={error} />
                        ) : generatedVideoUrl ? (
                            <VideoPlayer videoUrl={generatedVideoUrl} />
                        ) : (
                            <div className="text-center text-gray-400">
                                <p className="text-lg">Your generated video will appear here.</p>
                                <p className="text-sm mt-2">Upload an image and provide a script to get started.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;