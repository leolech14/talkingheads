import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { VideoPlayer } from './components/VideoPlayer';
import { Loader } from './components/Loader';
import { generateExpressiveImage, startVideoGeneration, checkVideoGenerationStatus, enhanceScriptWithAI, downloadVideo } from './services/geminiService';
import * as dbService from './services/dbService';
import { ExpressionIntensity, VideoOrientation, VideoHistoryItem, PipelineStage } from './types';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { VOICES } from './constants';
import { VideoHistory } from './components/VideoHistory';


/**
 * Generates a thumbnail from a video blob URL.
 * @param videoUrl The blob URL of the video.
 * @returns A promise that resolves to a base64 data URL of the thumbnail.
 */
const generateVideoThumbnail = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = "anonymous";
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            return reject(new Error('Canvas 2D context is not supported.'));
        }

        video.onloadeddata = () => {
            video.currentTime = 1; // Seek to 1 second
        };

        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            // DO NOT revoke the URL here; it's managed by the App component's lifecycle.
            resolve(thumbnailUrl);
        };

        video.onerror = () => {
            reject(new Error('Failed to load video for thumbnail generation.'));
        };

        video.src = videoUrl;
        video.load();
    });
};

const App: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [imageMimeType, setImageMimeType] = useState<string | null>(null);
    const [script, setScript] = useState<string>("Welcome to the future of video creation! With just a single image and a script, you can generate a lifelike talking head video, complete with natural expressions and perfectly synced audio.");
    const [voiceStyle, setVoiceStyle] = useState<string>(VOICES[0]?.name ?? '');
    const [expressionIntensity, setExpressionIntensity] = useState<ExpressionIntensity>(ExpressionIntensity.EXPRESSIVE);
    const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>(VideoOrientation.LANDSCAPE);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isEnhancingScript, setIsEnhancingScript] = useState<boolean>(false);
    const [currentStage, setCurrentStage] = useState<PipelineStage>('');
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
    const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Ref to hold the latest history for cleanup on unmount
    const videoHistoryRef = useRef(videoHistory);
    videoHistoryRef.current = videoHistory;

    // Effect to load history from IndexedDB on initial mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const items = await dbService.getVideoHistory();
                setVideoHistory(items);
                if (items.length > 0) {
                    setActiveVideoUrl(items[0].videoUrl);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load video history.');
            }
        };
        loadHistory();
    }, []);

    // Effect for cleaning up all generated blob URLs when the component unmounts
    useEffect(() => {
        return () => {
            console.log("Unmounting App component, cleaning up video blob URLs...");
            videoHistoryRef.current.forEach(item => {
                URL.revokeObjectURL(item.videoUrl);
            });
        };
    }, []);


    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const imageSrc = reader.result as string;
            setUploadedImage(imageSrc);
            setImageMimeType(file.type);
            setActiveVideoUrl(null); // Deselect active video, but don't clear persistent history
            setError(null);

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
            setCurrentStage('RENDERING_VIDEO');
            await new Promise(resolve => setTimeout(resolve, 10000));
            // No try/catch needed here; errors are propagated up to the main handler
            currentOperation = await checkVideoGenerationStatus(currentOperation);
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
        setActiveVideoUrl(null);

        let generatedVideoUrl: string | null = null;
        try {
            setCurrentStage('GENERATING_IMAGE');
            const base64OnlyImage = uploadedImage.split(',')[1];
            const expressiveImageResponse = await generateExpressiveImage(base64OnlyImage, imageMimeType, script, expressionIntensity, videoOrientation);
            
            setCurrentStage('STARTING_VIDEO');
            const selectedVoiceConfig = VOICES.find(v => v.name === voiceStyle);
            if (!selectedVoiceConfig) {
                throw new Error(`Internal configuration error: Voice style "${voiceStyle}" not found.`);
            }
            const finalVoicePrompt = selectedVoiceConfig.promptDescriptor;

            const videoOperation = await startVideoGeneration(expressiveImageResponse.base64, expressiveImageResponse.mimeType, script, finalVoicePrompt);

            const finalOperation = await pollForVideo(videoOperation);
            
            setCurrentStage('DOWNLOADING_VIDEO');
            const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;

            if (!downloadLink) {
                throw new Error("Video generation finished, but no download link was returned from the AI. This is a rare issue. Suggestion: Please try generating again.");
            }

            const videoBlob = await downloadVideo(downloadLink);
            generatedVideoUrl = URL.createObjectURL(videoBlob);
            
            setCurrentStage('CREATING_THUMBNAIL');
            const thumbnailUrl = await generateVideoThumbnail(generatedVideoUrl).catch(err => {
                console.error("Thumbnail generation failed:", err);
                throw new Error("The video was created, but there was an issue preparing it for display. Suggestion: Please try generating again.");
            });


            const newHistoryItem: VideoHistoryItem = {
                id: crypto.randomUUID(),
                videoUrl: generatedVideoUrl,
                thumbnailUrl,
                script,
                timestamp: new Date(),
            };
            
            await dbService.addVideoToHistory({ ...newHistoryItem, videoBlob });

            setVideoHistory(prevHistory => [newHistoryItem, ...prevHistory]);
            setActiveVideoUrl(generatedVideoUrl);
            
            // The URL is now managed by React state; prevent it from being revoked in the catch block.
            generatedVideoUrl = null;

        } catch (err: any) {
            console.error(err);
            // If a temporary video URL was created but an error occurred before it was stored, revoke it.
            if (generatedVideoUrl) {
                URL.revokeObjectURL(generatedVideoUrl);
            }
            setError(err.message || "An unknown error occurred during video generation.");
        } finally {
            setIsLoading(false);
            setCurrentStage('');
        }
    }, [uploadedImage, imageMimeType, script, expressionIntensity, pollForVideo, voiceStyle, videoOrientation]);

    const handleDeleteVideo = useCallback(async (id: string) => {
        try {
            await dbService.deleteVideo(id);
            setVideoHistory(prevHistory => {
                const itemToDelete = prevHistory.find(item => item.id === id);
                if (itemToDelete) {
                    URL.revokeObjectURL(itemToDelete.videoUrl); // Clean up memory
                    if (activeVideoUrl === itemToDelete.videoUrl) {
                        const nextHistory = prevHistory.filter(item => item.id !== id);
                        setActiveVideoUrl(nextHistory.length > 0 ? nextHistory[0].videoUrl : null);
                    }
                }
                return prevHistory.filter(item => item.id !== id);
            });
        } catch (err: any) {
            setError(err.message || 'Failed to delete video.');
        }
    }, [activeVideoUrl]);

    const handleClearHistory = useCallback(async () => {
        try {
            await dbService.clearHistory();
            // Revoke all current blob URLs before clearing the state
            videoHistory.forEach(item => URL.revokeObjectURL(item.videoUrl));
            setVideoHistory([]);
            setActiveVideoUrl(null);
        } catch (err: any) {
            setError(err.message || 'Failed to clear history.');
        }
    }, [videoHistory]);

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
                    <div className="flex flex-col gap-8">
                        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex items-center justify-center min-h-[400px] lg:min-h-0">
                            {isLoading ? (
                                <Loader currentStage={currentStage} />
                            ) : error ? (
                                <ErrorDisplay message={error} />
                            ) : activeVideoUrl ? (
                                <VideoPlayer videoUrl={activeVideoUrl} />
                            ) : (
                                <div className="text-center text-gray-400">
                                    <p className="text-lg">Your generated video will appear here.</p>
                                    <p className="text-sm mt-2">Upload an image and provide a script to get started.</p>
                                </div>
                            )}
                        </div>
                         <VideoHistory
                            history={videoHistory}
                            activeVideoUrl={activeVideoUrl}
                            onSelectVideo={setActiveVideoUrl}
                            onDeleteVideo={handleDeleteVideo}
                            onClearHistory={handleClearHistory}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
