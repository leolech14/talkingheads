import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { VideoPlayer } from './components/VideoPlayer';
import { Loader } from './components/Loader';
import { startVideoGeneration, checkVideoGenerationStatus, downloadVideo, analyzeScriptForGestures, generateGestureKeyframe } from './services/geminiService';
import * as audioService from './services/audioService';
import * as dbService from './services/dbService';
import { VideoHistoryItem, PipelineStage, AudioAsset, GestureInstruction, ImageAsset } from './types';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { VideoHistory } from './components/VideoHistory';
import { AssetTray } from './components/AssetTray';
import { useGallery } from './hooks/useGallery';
import { useAbortableTask } from './hooks/useAbortableTask';
import { Lightbox } from './components/Lightbox';
import { AudioPlayer } from './components/AudioPlayer';

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
    const { images, addUploadedImage, addGeneratedImage, removeAllImages, selection, select } = useGallery();
    const [lightboxImage, setLightboxImage] = useState<ImageAsset | null>(null);

    // --- State Management ---
    const [script, setScript] = useState<string>("Welcome to the future of video creation! With this new workflow, we will first generate audio, analyze it for timing, create gestures, and then produce a perfectly synchronized video.");
    const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Pipeline State
    const [pipelineStage, setPipelineStage] = useState<PipelineStage>('IDLE');
    const [voicePreviews, setVoicePreviews] = useState<AudioAsset[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
    const [styleTags, setStyleTags] = useState<string[]>([]);
    const [fullAudio, setFullAudio] = useState<AudioAsset | null>(null);
    const [gesturePlan, setGesturePlan] = useState<GestureInstruction[]>([]);

    const videoGenerationTask = useAbortableTask();

    // Ref to hold the latest history for cleanup on unmount
    const videoHistoryRef = useRef(videoHistory);
    videoHistoryRef.current = videoHistory;

    // --- Effects ---
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

    useEffect(() => {
        return () => {
            videoHistoryRef.current.forEach(item => {
                URL.revokeObjectURL(item.videoUrl);
            });
        };
    }, []);

    // Reset pipeline if script or uploaded images change
    useEffect(() => {
        setPipelineStage('IDLE');
        setVoicePreviews([]);
        setSelectedVoice(null);
        setStyleTags([]);
        setFullAudio(null);
        setGesturePlan([]);
    }, [script, images]);

    // --- Handlers ---
    const handleGeneratePreviews = useCallback(async () => {
        setError(null);
        setPipelineStage('VOICE_PREVIEWS');
        try {
            const previews = await audioService.generatePreviewAudios(script);
            setVoicePreviews(previews);
        } catch (err: any) {
            setError(err.message || "Failed to generate voice previews.");
            setPipelineStage('ERROR');
        }
    }, [script]);

    const handleSelectVoice = useCallback((voiceName: string) => {
        setSelectedVoice(voiceName);
        setPipelineStage('VOICE_SELECTED');
    }, []);

    const handleGenerateFullAudio = useCallback(async () => {
        if (!selectedVoice || !script) return;
        setError(null);
        setPipelineStage('AUDIO_FULL');
        try {
            const audio = await audioService.generateFullAudio(script, selectedVoice, styleTags);
            setFullAudio(audio);
            
            setPipelineStage('AUDIO_ANALYSIS');
            const analysis = await audioService.analyzeAudioTimings(audio.durationSec ?? 0, script);

            setPipelineStage('GESTURE_PLANNING');
            const plan = await analyzeScriptForGestures(script, analysis.segments);
            setGesturePlan(plan);
            
            // Auto-trigger keyframe generation after planning
            if (plan.length > 0) {
                await handleGenerateKeyframes(plan);
            } else {
                 setPipelineStage('DONE'); // No gestures to make, ready for video
            }

        } catch (err: any) {
            setError(err.message || "Failed to process audio and gestures.");
            setPipelineStage('ERROR');
        }
    }, [script, selectedVoice, styleTags]);

    const handleGenerateKeyframes = useCallback(async (plan: GestureInstruction[]) => {
        const sourceImage = selection?.image;
        if (!sourceImage) {
            setError("Please select a source image before generating keyframes.");
            setPipelineStage('ERROR');
            return;
        }
        setError(null);
        setPipelineStage('KEYFRAME_GEN');
        
        try {
            const reader = new FileReader();
            reader.readAsDataURL(sourceImage.blob);
            await new Promise(resolve => reader.onload = resolve);
            const base64String = (reader.result as string).split(',')[1];

            for (const instruction of plan) {
                const keyframe = await generateGestureKeyframe(base64String, sourceImage.mimeType, instruction);
                await addGeneratedImage(keyframe.base64, `frame_at_${instruction.timeSec?.toFixed(2)}s`);
            }
            setPipelineStage('DONE');
        } catch (err: any) {
            setError(err.message || "Failed to generate keyframes.");
            setPipelineStage('ERROR');
        }
    }, [selection, addGeneratedImage]);

    const handleGenerateVideo = useCallback(async () => {
        const sourceImage = selection?.image;
        if (!sourceImage || !fullAudio || !selectedVoice) {
            setError("A source image, script, and selected voice are required.");
            return;
        }

        setError(null);
        setPipelineStage('VIDEO_START');

        const pollForVideo = async (operation: any, signal: AbortSignal) => {
            let currentOperation = operation;
            while (!currentOperation.done) {
                 if (signal.aborted) throw new Error("Cancelled");
                setPipelineStage('VIDEO_RENDER');
                await new Promise(resolve => setTimeout(resolve, 10000));
                 if (signal.aborted) throw new Error("Cancelled");
                currentOperation = await checkVideoGenerationStatus(currentOperation);
            }
            return currentOperation;
        };
        
        let generatedVideoUrl: string | null = null;
        
        videoGenerationTask.run(async (signal) => {
             try {
                const reader = new FileReader();
                reader.readAsDataURL(sourceImage.blob);
                await new Promise(resolve => reader.onload = resolve);
                const base64String = (reader.result as string).split(',')[1];
                
                // For now, we pass the voice prompt, as VEO doesn't accept custom audio.
                // The generated audio is used for timing analysis.
                const videoOperation = await startVideoGeneration(base64String, sourceImage.mimeType, script, selectedVoice, styleTags, gesturePlan);
                
                if (signal.aborted) return;
                
                const finalOperation = await pollForVideo(videoOperation, signal);
                
                 if (signal.aborted) return;
                setPipelineStage('VIDEO_DOWNLOAD');
                const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;
                if (!downloadLink) throw new Error("Video generation finished, but no download link was returned.");

                const videoBlob = await downloadVideo(downloadLink);
                generatedVideoUrl = URL.createObjectURL(videoBlob);
                
                const thumbnailUrl = await generateVideoThumbnail(generatedVideoUrl);

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
                setPipelineStage('DONE');
                generatedVideoUrl = null; // Prevent revocation in catch block

            } catch (err: any) {
                if (err.message === 'Cancelled') {
                    setPipelineStage('CANCELED');
                } else {
                    console.error(err);
                    setError(err.message || "An unknown error occurred during video generation.");
                    setPipelineStage('ERROR');
                }
                if (generatedVideoUrl) URL.revokeObjectURL(generatedVideoUrl);
            }
        });
    }, [selection, script, fullAudio, selectedVoice, styleTags, gesturePlan, videoGenerationTask]);
    
    const handleCancel = () => {
        videoGenerationTask.cancel();
    };

    const handleDeleteVideo = useCallback(async (id: string) => {
        try {
            await dbService.deleteVideo(id);
            setVideoHistory(prevHistory => {
                const itemToDelete = prevHistory.find(item => item.id === id);
                if (itemToDelete) {
                    URL.revokeObjectURL(itemToDelete.videoUrl);
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
            videoHistory.forEach(item => URL.revokeObjectURL(item.videoUrl));
            setVideoHistory([]);
            setActiveVideoUrl(null);
        } catch (err: any) {
            setError(err.message || 'Failed to clear history.');
        }
    }, [videoHistory]);

    const isBusy = !['IDLE', 'DONE', 'CANCELED', 'ERROR', 'VOICE_SELECTED'].includes(pipelineStage);

    return (
        <div className="min-h-screen bg-black text-neutral-300 font-sans p-4 sm:p-6 lg:p-8 flex flex-col">
            {lightboxImage && <Lightbox imageAsset={lightboxImage} onClose={() => setLightboxImage(null)} />}
            <div className="max-w-screen-2xl mx-auto w-full">
                <Header />
                <main className="mt-8 grid grid-cols-1 lg:grid-cols-10 gap-6">
                    <div className="lg:col-span-3">
                        <ImageUploader 
                            images={images}
                            selection={selection}
                            onSelect={select}
                            onUpload={addUploadedImage}
                            onClearAll={removeAllImages}
                            onEnlarge={setLightboxImage}
                         />
                    </div>
                    <div className="lg:col-span-3">
                        <ControlPanel
                            script={script}
                            setScript={setScript}
                            pipelineStage={pipelineStage}
                            onGeneratePreviews={handleGeneratePreviews}
                            voicePreviews={voicePreviews}
                            onSelectVoice={handleSelectVoice}
                            selectedVoice={selectedVoice}
                            styleTags={styleTags}
                            setStyleTags={setStyleTags}
                            onGenerateFullAudio={handleGenerateFullAudio}
                            fullAudio={fullAudio}
                            onGenerateVideo={handleGenerateVideo}
                            onCancel={handleCancel}
                            isBusy={isBusy}
                        />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-neutral-950 border border-neutral-900 rounded-lg flex items-center justify-center flex-grow min-h-[60vh]">
                            {isBusy && pipelineStage.startsWith('VIDEO') ? (
                                <Loader currentStage={pipelineStage} />
                            ) : error ? (
                                <ErrorDisplay message={error} />
                            ) : activeVideoUrl ? (
                                <VideoPlayer videoUrl={activeVideoUrl} />
                            ) : fullAudio && fullAudio.objectUrl && ['DONE', 'CANCELED', 'ERROR', 'VOICE_SELECTED'].includes(pipelineStage) ? (
                                <AudioPlayer audioUrl={fullAudio.objectUrl} />
                            ) : (
                                <div className="text-center text-neutral-600">
                                    <p className="text-lg">Your generated video will appear here.</p>

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
            <AssetTray 
                images={images}
                selection={selection}
                onSelect={select}
                onEnlarge={setLightboxImage}
            />
        </div>
    );
};

export default App;