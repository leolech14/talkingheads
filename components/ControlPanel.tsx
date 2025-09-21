
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePipeline } from '../contexts/PipelineContext';
import * as audioService from '../services/audioService';
import * as geminiService from '../services/geminiService';
import * as dbService from '../services/dbService';
import { PipelineStage, VoiceOption, GestureInstruction, AudioAsset, AudioAnalysis } from '../types';
import { VOICES } from '../constants';
import { extractFirstSentence } from '../services/audioService';

const GenerateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0v-.5a1 1 0 00-1-1H6a1 1 0 01-1-1v-3a1 1 0 011-1h.5a1.5 1.5 0 000-3H6a1 1 0 01-1-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" /></svg>;
const NextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>;

interface ControlPanelProps {
    setPipelineStage: (stage: PipelineStage) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    resetState: () => void;
    setGestures: (gestures: GestureInstruction[]) => void;
    setAudioAnalysis: (analysis: AudioAnalysis | null) => void;
    setFullAudio: (audio: AudioAsset | null) => void;
    openGestureEditor: () => void;
    gestures: GestureInstruction[];
    audioAnalysis: AudioAnalysis | null;
    fullAudio: AudioAsset | null;
}


export const ControlPanel: React.FC<ControlPanelProps> = ({ setPipelineStage, setError, clearError, resetState, setGestures, setAudioAnalysis, setFullAudio, openGestureEditor, gestures, audioAnalysis, fullAudio }) => {
    const { pipelineStage, isBusy, selection } = usePipeline();
    const [script, setScript] = useState("Welcome to the future of video creation. With just a script and an image, you can generate professional-quality talking head videos in minutes. Let's get started!");
    const [styleTags, setStyleTags] = useState<string[]>(["Professional", "Engaging"]);
    const [currentTag, setCurrentTag] = useState('');
    const [voicePreviews, setVoicePreviews] = useState<AudioAsset[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(VOICES[0]);
    const [activeAudio, setActiveAudio] = useState<HTMLAudioElement | null>(null);

    const isInputDisabled = useMemo(() => isBusy || pipelineStage !== 'IDLE', [isBusy, pipelineStage]);

    // Cleanup audio on unmount or when changing
    useEffect(() => {
        return () => {
            if (activeAudio) {
                activeAudio.pause();
                setActiveAudio(null);
            }
        }
    }, [activeAudio]);

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && currentTag) {
            e.preventDefault();
            if (styleTags.length < 5 && !styleTags.includes(currentTag)) {
                setStyleTags([...styleTags, currentTag]);
            }
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setStyleTags(styleTags.filter(tag => tag !== tagToRemove));
    };

    const handleGenerateVoicePreviews = useCallback(async () => {
        clearError();
        if (!script || !selection) {
            setError("Please provide a script and select an image first.");
            return;
        }
        setPipelineStage('VOICE_PREVIEWS');
        try {
            const previews = await audioService.generatePreviewAudios(script);
            setVoicePreviews(previews);
            setPipelineStage('VOICE_SELECTED');
        } catch (e: any) {
            setError(e.message);
            setPipelineStage('ERROR');
        }
    }, [script, selection, setPipelineStage, setError, clearError]);

    const playPreview = (audioUrl: string) => {
        if (activeAudio) {
            activeAudio.pause();
        }
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Error playing audio preview:", e));
        setActiveAudio(audio);
    };

    const handleSelectVoice = useCallback(async () => {
        clearError();
        if (!script || !selectedVoice) {
            setError("Please select a voice.");
            return;
        }
        setPipelineStage('AUDIO_FULL');
        try {
            const audio = await audioService.generateFullAudio(script, selectedVoice.name, styleTags);
            setFullAudio(audio);
        } catch (e: any) {
            setError(e.message);
            setPipelineStage('ERROR');
        }
    }, [script, selectedVoice, styleTags, setPipelineStage, setError, clearError, setFullAudio]);

    const handleAnalyzeAudio = useCallback(async () => {
        if (!fullAudio?.durationSec || !script) return;
        clearError();
        setPipelineStage('AUDIO_ANALYSIS');
        try {
            const analysis = await audioService.analyzeAudioTimings(fullAudio.durationSec, script);
            setAudioAnalysis(analysis);
            setPipelineStage('GESTURE_PLANNING');
        } catch (e: any) {
            setError(e.message);
            setPipelineStage('ERROR');
        }
    }, [fullAudio, script, setPipelineStage, setError, clearError, setAudioAnalysis]);

    useEffect(() => {
        // Automatically move to next step after analysis
        if (pipelineStage === 'GESTURE_PLANNING') {
            handlePlanGestures();
        }
    }, [pipelineStage]);


    const handlePlanGestures = useCallback(async () => {
        if (!audioAnalysis || !script) return;
        clearError();
        try {
            const plannedGestures = await geminiService.analyzeScriptForGestures(script, audioAnalysis.segments, styleTags);
            setGestures(plannedGestures);
            setPipelineStage('GESTURE_EDITING');
        } catch (e: any) {
            setError(e.message);
            setPipelineStage('ERROR');
        }
    }, [audioAnalysis, script, styleTags, setPipelineStage, setError, clearError, setGestures]);
    
    const handleGenerateVideo = useCallback(async () => {
        clearError();
        if (!selection || !script || !selectedVoice) {
            setError("Missing image, script, or voice selection.");
            return;
        }

        setPipelineStage('VIDEO_START');
        let operation;
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(selection.image.blob);
            });

            operation = await geminiService.startVideoGeneration(
                base64,
                selection.image.mimeType,
                script,
                selectedVoice.promptDescriptor,
                styleTags,
                gestures
            );
        } catch (e: any) {
            setError(e.message);
            setPipelineStage('ERROR');
            return;
        }

        setPipelineStage('VIDEO_RENDER');
        try {
            while (operation && !operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await geminiService.checkVideoGenerationStatus(operation);
            }

            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!downloadLink) {
                throw new Error("Video generation completed, but no download link was found.");
            }

            setPipelineStage('VIDEO_DOWNLOAD');
            const videoBlob = await geminiService.downloadVideo(downloadLink);
            
            const newHistoryItem = {
                id: crypto.randomUUID(),
                videoBlob: videoBlob,
                thumbnailUrl: selection.image.objectUrl,
                script,
                timestamp: new Date(),
            };
            await dbService.addVideoToHistory(newHistoryItem);
            
            setPipelineStage('DONE');
            window.location.reload(); 
        } catch (e: any) {
            setError(e.message);
            setPipelineStage('ERROR');
        }
    }, [selection, script, selectedVoice, styleTags, gestures, setPipelineStage, setError, clearError]);

    const renderStepContent = () => {
        switch (pipelineStage) {
            case 'IDLE':
                return (
                    <>
                        <p className="text-sm text-neutral-400 mb-4">Craft the perfect message, then generate voice previews to find the right tone.</p>
                        <button onClick={handleGenerateVoicePreviews} disabled={isBusy || !script || !selection} className="w-full flex items-center justify-center bg-neutral-800 text-neutral-300 font-bold py-3 px-4 rounded-lg hover:bg-neutral-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                            <GenerateIcon />
                            Generate Voice Previews
                        </button>
                    </>
                );
            case 'VOICE_PREVIEWS':
                return <p className="text-center text-neutral-400">Generating voice previews...</p>;
            case 'VOICE_SELECTED':
                const previewSentence = extractFirstSentence(script);
                return (
                    <div>
                         <p className="text-sm text-neutral-400 mb-2">Previewing voices for: <i className="truncate">{`"${previewSentence}"`}</i></p>
                         <div className="max-h-60 overflow-y-auto space-y-2 pr-2 mb-4">
                            {VOICES.map((voice) => {
                                const audio = voicePreviews.find(p => p.voiceName === voice.name);
                                return (
                                    <div key={voice.name} onClick={() => setSelectedVoice(voice)}
                                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedVoice?.name === voice.name ? 'bg-neutral-800 border-neutral-600' : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'}`}>
                                        <div className="flex justify-between items-center">
                                             <p className="font-semibold text-sm">{voice.displayName}</p>
                                            {audio && (
                                                <button onClick={(e) => { e.stopPropagation(); playPreview(audio.objectUrl); }} className="p-2 rounded-full hover:bg-neutral-700 transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                         <div className="flex gap-2">
                            <button onClick={resetState} className="w-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold py-3 px-4 rounded-lg hover:bg-neutral-800 transition-all">
                               <BackIcon /> Back
                            </button>
                            <button onClick={handleSelectVoice} disabled={isBusy || !selectedVoice} className="w-full flex items-center justify-center bg-neutral-800 text-neutral-300 font-bold py-3 px-4 rounded-lg hover:bg-neutral-700 transition-all disabled:opacity-50">
                                Next <NextIcon />
                            </button>
                         </div>
                    </div>
                );
            case 'AUDIO_FULL':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-neutral-400 text-center">Full audio track generated. You can review it in the main player. Now, let's add some life with gestures.</p>
                         <div className="flex gap-2">
                             <button onClick={() => setPipelineStage('VOICE_SELECTED')} className="w-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold py-3 px-4 rounded-lg hover:bg-neutral-800 transition-all">
                                <BackIcon /> Change Voice
                            </button>
                            <button onClick={handleAnalyzeAudio} disabled={isBusy} className="w-full flex items-center justify-center bg-neutral-800 text-neutral-300 font-bold py-3 px-4 rounded-lg hover:bg-neutral-700 transition-all">
                                Analyze for Gestures <NextIcon />
                            </button>
                         </div>
                    </div>
                );
            case 'AUDIO_ANALYSIS':
            case 'GESTURE_PLANNING':
                 return <p className="text-center text-neutral-400">Analyzing audio and planning gestures...</p>;
            case 'GESTURE_EDITING':
                return (
                     <div className="space-y-4">
                        <p className="text-sm text-neutral-400 text-center">We've suggested some gestures. You can edit them or proceed to the final step.</p>
                         <div className="flex gap-2">
                            <button onClick={openGestureEditor} className="w-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-neutral-400 font-bold py-3 px-4 rounded-lg hover:bg-neutral-800 transition-all">
                                Edit Gestures
                            </button>
                            <button onClick={handleGenerateVideo} disabled={isBusy} className="w-full flex items-center justify-center bg-green-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-all">
                                Generate Video
                            </button>
                         </div>
                    </div>
                );
            case 'DONE':
            case 'ERROR':
            case 'CANCELED':
                 return <button onClick={resetState} className="w-full bg-neutral-800 text-neutral-300 font-bold py-3 px-4 rounded-lg hover:bg-neutral-700 transition-all">Start New Project</button>;
            default:
                return null;
        }
    };
    
    return (
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-5 flex flex-col gap-4">
            <div>
                <h2 className="text-lg font-bold text-neutral-200">2. SCRIPT & VOICE</h2>
                <div className="mt-4">
                    <label htmlFor="script" className="block text-sm font-medium text-neutral-400 mb-1">Script</label>
                    <textarea id="script" value={script} onChange={(e) => setScript(e.target.value)} disabled={isInputDisabled}
                        className="w-full h-36 bg-black/50 border border-neutral-800 rounded-md p-2 focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 transition"
                        placeholder="Enter your script here..."
                    />
                </div>
                 <div className="mt-4">
                    <label htmlFor="style-tags" className="block text-sm font-medium text-neutral-400 mb-1">Style Tags (Optional)</label>
                     <div className="flex flex-wrap gap-2 items-center bg-black/50 border border-neutral-800 rounded-md p-2">
                        {styleTags.map(tag => (
                            <span key={tag} className="flex items-center gap-1 bg-neutral-700 text-xs font-bold px-2 py-1 rounded-full">
                                {tag}
                                {!isInputDisabled && <button onClick={() => handleRemoveTag(tag)} className="text-neutral-400 hover:text-white">&times;</button>}
                            </span>
                        ))}
                        <input id="style-tags" type="text" value={currentTag} onChange={e => setCurrentTag(e.target.value)} onKeyDown={handleTagKeyDown} disabled={isInputDisabled}
                            className="bg-transparent focus:outline-none flex-grow" placeholder={styleTags.length < 5 ? "Add a tag..." : "Max 5 tags"} />
                    </div>
                </div>
            </div>
            <div className="border-t border-neutral-900 pt-4">
                <h2 className="text-lg font-bold text-neutral-200 mb-2">3. GENERATION</h2>
                {renderStepContent()}
            </div>
        </div>
    );
};
