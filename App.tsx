
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useGallery } from './hooks/useGallery';
import * as dbService from './services/dbService';
import { PipelineStage, ImageAsset, VideoHistoryItem, GestureInstruction, AudioAsset, AudioAnalysis } from './types';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ControlPanel } from './components/ControlPanel';
import { VideoPlayer } from './components/VideoPlayer';
import { VideoHistory } from './components/VideoHistory';
import { Loader } from './components/Loader';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Lightbox } from './components/Lightbox';
import { PipelineProvider } from './contexts/PipelineContext';
import { AssetTray }from './components/AssetTray';
import { AudioPlayer } from './components/AudioPlayer';
import { GestureEditorModal } from './components/GestureEditorModal';

const App: React.FC = () => {
    const { images, selection, select, addUploadedImage, addGeneratedImage, removeAllImages } = useGallery();
    const [pipelineStage, setPipelineStage] = useState<PipelineStage>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<VideoHistoryItem[]>([]);
    const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
    const [lightboxImage, setLightboxImage] = useState<ImageAsset | null>(null);
    const [isGestureModalOpen, setGestureModalOpen] = useState(false);

    // Persisted state between pipeline runs
    const [gestures, setGestures] = useState<GestureInstruction[]>([]);
    const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
    const [fullAudio, setFullAudio] = useState<AudioAsset | null>(null);

    const isBusy = useMemo(() => ![
        'IDLE', 'VOICE_SELECTED', 'AUDIO_FULL', 'GESTURE_EDITING', 'DONE', 'ERROR', 'CANCELED'
    ].includes(pipelineStage), [pipelineStage]);

    const pipelineContextValue = useMemo(() => ({
        pipelineStage,
        isBusy,
        selection,
    }), [pipelineStage, isBusy, selection]);

    const loadHistory = useCallback(async () => {
        const historyItems = await dbService.getVideoHistory();
        setHistory(historyItems);
        if (historyItems.length > 0 && !activeVideoUrl) {
            setActiveVideoUrl(historyItems[0].videoUrl);
        }
    }, [activeVideoUrl]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const clearError = () => setError(null);

    const resetState = useCallback(() => {
        clearError();
        setPipelineStage('IDLE');
        setGestures([]);
        setAudioAnalysis(null);
        setFullAudio(null);
    }, []);

    const handleDeleteVideo = async (id: string) => {
        const videoToDelete = history.find(item => item.id === id);
        if (activeVideoUrl === videoToDelete?.videoUrl) {
            setActiveVideoUrl(null);
        }
        await dbService.deleteVideo(id);
        const newHistory = history.filter(item => item.id !== id);
        setHistory(newHistory);
        if (newHistory.length > 0) {
            setActiveVideoUrl(newHistory[0].videoUrl);
        }
    };

    const handleClearHistory = async () => {
        await dbService.clearHistory();
        setHistory([]);
        setActiveVideoUrl(null);
    };

    const renderMainContent = () => {
        if (['VIDEO_START', 'VIDEO_RENDER', 'VIDEO_DOWNLOAD'].includes(pipelineStage)) {
            return <Loader currentStage={pipelineStage} />;
        }
        if (pipelineStage === 'AUDIO_FULL' && fullAudio) {
            return <AudioPlayer audioUrl={fullAudio.objectUrl} />;
        }
        if (activeVideoUrl) {
            return <VideoPlayer videoUrl={activeVideoUrl} />;
        }
        return (
            <div className="text-center text-neutral-600 p-8 bg-black/30 rounded-lg">
                <h3 className="text-lg font-bold text-neutral-400">Welcome to Talkingheads</h3>
                <p className="mt-2">Upload an image and enter a script to get started.</p>
                <p>Your generated videos will appear here.</p>
            </div>
        );
    };

    return (
        <PipelineProvider value={pipelineContextValue}>
            <div className="bg-neutral-900 text-neutral-100 min-h-screen font-sans">
                <main className="container mx-auto p-4 md:p-6 lg:p-8">
                    <Header />
                    {error && (
                         <div className="my-4">
                            <ErrorDisplay message={error} />
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        <div className="flex flex-col gap-6">
                            <ImageUploader 
                                images={images}
                                onSelect={select}
                                onUpload={addUploadedImage}
                                onClearAll={removeAllImages}
                                onEnlarge={setLightboxImage}
                            />
                            <ControlPanel 
                                setPipelineStage={setPipelineStage}
                                setError={setError}
                                clearError={clearError}
                                resetState={resetState}
                                setGestures={setGestures}
                                setAudioAnalysis={setAudioAnalysis}
                                setFullAudio={setFullAudio}
                                openGestureEditor={() => setGestureModalOpen(true)}
                                gestures={gestures}
                                audioAnalysis={audioAnalysis}
                                fullAudio={fullAudio}
                            />
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-5 flex-grow flex items-center justify-center min-h-[50vh] lg:min-h-0">
                                {renderMainContent()}
                            </div>
                            {pipelineStage === 'IDLE' && images.length > 1 && (
                               <AssetTray images={images} selection={selection} onSelect={select} onEnlarge={setLightboxImage} />
                            )}
                             <VideoHistory 
                                history={history} 
                                activeVideoUrl={activeVideoUrl}
                                onSelectVideo={setActiveVideoUrl}
                                onDeleteVideo={handleDeleteVideo}
                                onClearHistory={handleClearHistory}
                            />
                        </div>
                    </div>
                </main>
                {lightboxImage && <Lightbox imageAsset={lightboxImage} onClose={() => setLightboxImage(null)} />}
                {isGestureModalOpen && audioAnalysis && selection && (
                    <GestureEditorModal 
                        isOpen={isGestureModalOpen}
                        onClose={() => setGestureModalOpen(false)}
                        gestures={gestures}
                        setGestures={setGestures}
                        segments={audioAnalysis.segments}
                        baseImage={selection.image}
                        addGeneratedImage={addGeneratedImage}
                        setError={setError}
                    />
                )}
            </div>
        </PipelineProvider>
    );
};

export default App;
