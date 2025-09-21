import React, { useState, useEffect } from 'react';
import { ExpressionIntensity, VoiceStyle, VideoOrientation, VoiceOption } from '../types';
import { VOICES } from '../constants';

interface ControlPanelProps {
    script: string;
    setScript: (script: string) => void;
    voiceStyle: string;
    setVoiceStyle: (name: string) => void;
    expressionIntensity: ExpressionIntensity;
    setExpressionIntensity: (intensity: ExpressionIntensity) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isReady: boolean;
    onEnhanceScript: () => void;
    isEnhancingScript: boolean;
}

const Label: React.FC<{ htmlFor?: string, children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">{children}</label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${props.className}`}>
        {props.children}
    </select>
);

const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;


export const ControlPanel: React.FC<ControlPanelProps> = ({
    script,
    setScript,
    voiceStyle,
    setVoiceStyle,
    expressionIntensity,
    setExpressionIntensity,
    onGenerate,
    isLoading,
    isReady,
    onEnhanceScript,
    isEnhancingScript,
}) => {
    const [auditioningVoiceName, setAuditioningVoiceName] = useState<string | null>(null);

    useEffect(() => {
        const stopSpeech = () => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
        };

        // Ensure voices are loaded before interacting
        const ensureVoices = (callback: () => void) => {
            if (speechSynthesis.getVoices().length > 0) {
                callback();
            } else {
                speechSynthesis.onvoiceschanged = callback;
            }
        };
        
        ensureVoices(() => {}); // Pre-load voices

        return () => {
            speechSynthesis.onvoiceschanged = null;
            stopSpeech();
        };
    }, []);

    const handleAudition = (voice: VoiceOption) => {
        if (!script || !isReady) return;
        
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            // If the user clicks the same voice again, treat it as a stop action.
            if (auditioningVoiceName === voice.name) {
                setAuditioningVoiceName(null);
                return;
            }
        }

        const allBrowserVoices = speechSynthesis.getVoices();
        let voiceToUse = allBrowserVoices.find(v => v.name === voice.name);
        
        if (!voiceToUse) {
            voiceToUse = allBrowserVoices.find(v => {
                const voiceName = v.name.toLowerCase();
                const genderMatch = (voice.gender === VoiceStyle.FEMALE && voiceName.includes('female')) ||
                                    (voice.gender === VoiceStyle.MALE && (voiceName.includes('male') || voiceName.includes('david')));
                return genderMatch && v.lang.startsWith('en');
            });
        }

        if (!voiceToUse) {
            alert(`Could not find a suitable voice in your browser to preview '${voice.displayName}'. The final video will still use the selected voice style.`);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(script);
        utterance.voice = voiceToUse;
        utterance.onstart = () => setAuditioningVoiceName(voice.name);
        utterance.onend = () => setAuditioningVoiceName(null);
        utterance.onerror = () => setAuditioningVoiceName(null);
        speechSynthesis.speak(utterance);
    };

    const isBusy = isLoading || isEnhancingScript;

    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-6">
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
                />
            </div>
            
            <div>
                <Label htmlFor="expression-intensity">Expression Intensity</Label>
                <Select
                    id="expression-intensity"
                    value={expressionIntensity}
                    onChange={(e) => setExpressionIntensity(e.target.value as ExpressionIntensity)}
                >
                    {Object.values(ExpressionIntensity).map(intensity => <option key={intensity} value={intensity}>{intensity}</option>)}
                </select>
            </div>

            <div>
                <Label>Voice Style</Label>
                <p className="text-xs text-gray-400 mb-3">Audio previews use browser voices for pacing. The final video will use a high-quality Google AI voice.</p>
                <div className="space-y-2">
                    {VOICES.map((voice) => (
                        <div key={voice.name} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                            <label htmlFor={`voice-${voice.name}`} className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    id={`voice-${voice.name}`}
                                    name="voice-style"
                                    value={voice.name}
                                    checked={voiceStyle === voice.name}
                                    onChange={(e) => setVoiceStyle(e.target.value)}
                                    className="form-radio h-4 w-4 text-cyan-500 bg-gray-800 border-gray-600 focus:ring-cyan-600"
                                />
                                <span className="text-gray-200">{voice.displayName}</span>
                            </label>
                             <button 
                                onClick={() => handleAudition(voice)} 
                                title={auditioningVoiceName === voice.name ? "Stop Audition" : "Audition Voice"} 
                                disabled={!isReady} 
                                className={`p-2 rounded-full transition-colors ${auditioningVoiceName === voice.name ? 'bg-red-600 hover:bg-red-500' : 'bg-teal-600 hover:bg-teal-500'} text-white disabled:bg-gray-600 disabled:cursor-not-allowed`}
                            >
                                {auditioningVoiceName === voice.name ? <StopIcon /> : <PlayIcon />}
                            </button>
                        </div>
                    ))}
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
    );
};