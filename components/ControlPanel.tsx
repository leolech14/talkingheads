import React, { useState, useEffect } from 'react';
import { ExpressionIntensity, VoiceOption, VideoOrientation } from '../types';
import { VOICES } from '../constants';

interface ControlPanelProps {
    script: string;
    setScript: (script: string) => void;
    voiceStyle: string;
    setVoiceStyle: (name: string) => void;
    expressionIntensity: ExpressionIntensity;
    setExpressionIntensity: (intensity: ExpressionIntensity) => void;
    videoOrientation: VideoOrientation;
    setVideoOrientation: (orientation: VideoOrientation) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isReady: boolean;
    onEnhanceScript: () => void;
    isEnhancingScript: boolean;
    onGeneratePreview: () => void;
    isGeneratingPreview: boolean;
}

const Label: React.FC<{ htmlFor?: string, children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">{children}</label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:bg-gray-700/50 disabled:cursor-not-allowed ${props.className}`}>
        {props.children}
    </select>
);

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);


export const ControlPanel: React.FC<ControlPanelProps> = ({
    script,
    setScript,
    voiceStyle,
    setVoiceStyle,
    expressionIntensity,
    setExpressionIntensity,
    videoOrientation,
    setVideoOrientation,
    onGenerate,
    isLoading,
    isReady,
    onEnhanceScript,
    isEnhancingScript,
    onGeneratePreview,
    isGeneratingPreview
}) => {
    const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [speakingVoiceName, setSpeakingVoiceName] = useState<string | null>(null);
    const [estimatedCost, setEstimatedCost] = useState<string>('0.00');

    // Cost per character for estimation. This is a hypothetical value.
    const COST_PER_CHARACTER = 0.0005;

    useEffect(() => {
        const calculateCost = () => {
            if (!script) {
                setEstimatedCost('0.00');
                return;
            }
            const cost = script.length * COST_PER_CHARACTER;
            setEstimatedCost(cost.toFixed(2));
        };

        // Debounce calculation to avoid updating on every keystroke
        const handler = setTimeout(calculateCost, 300);
        return () => clearTimeout(handler);

    }, [script]);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setSystemVoices(voices);
            }
        };
        // Voices load asynchronously.
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Cleanup on unmount
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
        };
    }, []);

    const handleAudition = (voice: VoiceOption) => {
        const { name: voiceName, displayName } = voice;
        const isCurrentlySpeaking = speakingVoiceName === voiceName;
        
        // Always stop any current speech first.
        window.speechSynthesis.cancel();

        // If the clicked voice was the one speaking, we just stop it.
        if (isCurrentlySpeaking) {
            setSpeakingVoiceName(null);
            return;
        }

        // Otherwise, we start a new speech.
        const textToSpeak = (script.split(/[.!?]/)[0] || "Hello, this is a voice preview.").trim();
        if (!textToSpeak) return;

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        const systemVoice = systemVoices.find(v => v.name === voiceName);

        if (!systemVoice) {
            alert(`A preview voice for "${displayName}" is not available on your browser. The final video will still be generated with the correct high-quality voice.`);
            return;
        }

        utterance.voice = systemVoice;

        utterance.onstart = () => {
            setSpeakingVoiceName(voiceName);
        };

        utterance.onend = () => {
            setSpeakingVoiceName(null);
        };
        
        utterance.onerror = (event) => {
            console.error('SpeechSynthesis Error:', event.error);
            setSpeakingVoiceName(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    const isBusy = isLoading || isEnhancingScript || isGeneratingPreview;

    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-6 h-full">
            <div>
                 <h2 className="text-xl font-bold text-cyan-400 mb-4">2. Configure Script & Video</h2>
            </div>
            <div>
                 <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="script">Script</Label>
                    <button
                        onClick={onEnhanceScript}
                        disabled={isBusy || !script}
                        className="text-xs bg-teal-600/50 text-teal-200 font-semibold py-1 px-3 rounded-full hover:bg-teal-600/80 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                        title="Rewrite script for clarity and impact"
                    >
                        {isEnhancingScript ? (
                            <>
                               <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Enhancing...
                            </>
                        ) : (
                           "✨ Enhance with AI"
                        )}
                    </button>
                </div>
                <textarea
                    id="script"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-gray-200"
                    placeholder="Enter the text for the video..."
                    disabled={isBusy}
                />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div>
                    <Label htmlFor="expression-intensity">Expression Intensity</Label>
                     <div className="flex items-center gap-2">
                        <Select
                            id="expression-intensity"
                            value={expressionIntensity}
                            onChange={(e) => setExpressionIntensity(e.target.value as ExpressionIntensity)}
                            className="flex-grow"
                            disabled={isBusy}
                        >
                            {Object.values(ExpressionIntensity).map(intensity => <option key={intensity} value={intensity}>{intensity}</option>)}
                        </Select>
                         <button
                            onClick={onGeneratePreview}
                            disabled={isBusy || !isReady}
                            className="p-3 bg-teal-600/50 text-teal-200 rounded-md hover:bg-teal-600/80 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            title="Generate a still image preview of the expression"
                        >
                            {isGeneratingPreview ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            )}
                        </button>
                    </div>
                </div>
                <div>
                    <Label htmlFor="video-orientation">Video Orientation</Label>
                    <Select
                        id="video-orientation"
                        value={videoOrientation}
                        onChange={(e) => setVideoOrientation(e.target.value as VideoOrientation)}
                        disabled={isBusy}
                    >
                        {Object.values(VideoOrientation).map(orientation => <option key={orientation} value={orientation}>{orientation}</option>)}
                    </Select>
                </div>
            </div>

            <div>
                 <div className="flex items-center gap-2 mb-3">
                    <Label>Voice Style</Label>
                    <div className="group relative flex items-center">
                        <InfoIcon />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs text-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Audition uses your browser's text-to-speech. The final video will feature a higher-quality AI-generated voice.
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    {VOICES.map((voice) => {
                        const isPlaying = speakingVoiceName === voice.name;
                        return (
                            <div key={voice.name} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                <label htmlFor={`voice-${voice.name}`} className="flex items-center gap-3 cursor-pointer w-full">
                                    <input
                                        type="radio"
                                        id={`voice-${voice.name}`}
                                        name="voice-style"
                                        value={voice.name}
                                        checked={voiceStyle === voice.name}
                                        onChange={(e) => setVoiceStyle(e.target.value)}
                                        className="form-radio h-4 w-4 text-cyan-500 bg-gray-800 border-gray-600 focus:ring-cyan-600"
                                        disabled={isBusy}
                                    />
                                    <span className="text-gray-200">{voice.displayName}</span>
                                </label>
                                 <button 
                                    onClick={() => handleAudition(voice)} 
                                    title={isPlaying ? "Stop Audition" : "Audition Voice Sample"} 
                                    className={`p-2 rounded-full transition-colors ${isPlaying ? 'bg-red-600 hover:bg-red-500' : 'bg-teal-600 hover:bg-teal-500'} text-white`}
                                    disabled={systemVoices.length === 0 || isBusy}
                                >
                                    {isPlaying ? <StopIcon /> : <PlayIcon />}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-auto">
                <div className="text-center text-sm text-gray-400 mb-4">
                    <div className="flex items-center justify-center gap-2">
                        <span>Estimated Generation Cost: <strong className="text-yellow-400">${estimatedCost}</strong></span>
                        <div className="group relative flex items-center">
                            <InfoIcon />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-white text-xs text-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Cost is an estimate based on script length. Final price may vary slightly.
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <button
                        onClick={onGenerate}
                        disabled={isBusy || !isReady}
                        className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : (
                           "✨ Generate Video"
                        )}
                    </button>
                     {!isReady && <p className="text-xs text-center text-yellow-400 mt-2">Please upload an image to enable generation.</p>}
                </div>
            </div>
        </div>
    );
};