import React from 'react';
import { ExpressionIntensity, VoiceStyle, VideoOrientation } from '../types';

interface ControlPanelProps {
    script: string;
    setScript: (script: string) => void;
    voiceStyle: VoiceStyle;
    setVoiceStyle: (style: VoiceStyle) => void;
    expressionIntensity: ExpressionIntensity;
    setExpressionIntensity: (intensity: ExpressionIntensity) => void;
    videoOrientation: VideoOrientation;
    setVideoOrientation: (orientation: VideoOrientation) => void;
    onGenerate: () => void;
    isLoading: boolean;
    isReady: boolean;
}

const Label: React.FC<{ htmlFor: string, children: React.ReactNode }> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-300 mb-2">{children}</label>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition ${props.className}`}>
        {props.children}
    </select>
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
    isReady
}) => {
    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col gap-6">
            <div>
                 <h2 className="text-xl font-bold text-cyan-400 mb-4">2. Configure Script & Video</h2>
            </div>
            <div>
                <Label htmlFor="script">Script</Label>
                <textarea
                    id="script"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-gray-200"
                    placeholder="Enter the text for the video..."
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="video-orientation">Video Orientation</Label>
                    <Select
                        id="video-orientation"
                        value={videoOrientation}
                        onChange={(e) => setVideoOrientation(e.target.value as VideoOrientation)}
                    >
                        {Object.values(VideoOrientation).map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                </div>
                <div>
                    <Label htmlFor="expression-intensity">Expression Intensity</Label>
                    <Select
                        id="expression-intensity"
                        value={expressionIntensity}
                        onChange={(e) => setExpressionIntensity(e.target.value as ExpressionIntensity)}
                    >
                        {Object.values(ExpressionIntensity).map(intensity => <option key={intensity} value={intensity}>{intensity}</option>)}
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="voice-style">Voice Style</Label>
                <Select
                    id="voice-style"
                    value={voiceStyle}
                    onChange={(e) => setVoiceStyle(e.target.value as VoiceStyle)}
                >
                    {Object.values(VoiceStyle).map(style => <option key={style} value={style}>{style}</option>)}
                </Select>
            </div>

            <div>
                <button
                    onClick={onGenerate}
                    disabled={isLoading || !isReady}
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