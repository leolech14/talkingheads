import React from 'react';
import { PipelineStage, AudioAsset } from '../types';
import { VOICES } from '../constants';

interface ControlPanelProps {
    script: string;
    setScript: (script: string) => void;
    pipelineStage: PipelineStage;
    onGeneratePreviews: () => void;
    voicePreviews: AudioAsset[];
    onSelectVoice: (voiceName: string) => void;
    selectedVoice: string | null;
    styleTags: string[];
    setStyleTags: (tags: string[]) => void;
    onGenerateFullAudio: () => void;
    fullAudio: AudioAsset | null;
    onGenerateVideo: () => void;
    onCancel: () => void;
    isBusy: boolean;
}

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className="block text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-2">{children}</label>
);

const Step: React.FC<{ number: number, title: string, children: React.ReactNode, isActive: boolean }> = ({ number, title, children, isActive }) => (
     <div className={`border-l-2 ${isActive ? 'border-neutral-500' : 'border-neutral-800'} pl-4 py-2 transition-all`}>
        <h3 className={`font-bold text-md ${isActive ? 'text-neutral-200' : 'text-neutral-600'}`}>
            {number}. {title}
        </h3>
        <div className={`mt-3 ${!isActive ? 'opacity-50' : ''}`}>
            {children}
        </div>
    </div>
);

const SUGGESTED_TAGS = ['Confident', 'Warm', 'Authoritative', 'Friendly', 'Calm', 'Energetic'];

export const ControlPanel: React.FC<ControlPanelProps> = ({
    script, setScript, pipelineStage, onGeneratePreviews, voicePreviews, onSelectVoice,
    selectedVoice, styleTags, setStyleTags, onGenerateFullAudio, fullAudio, onGenerateVideo, onCancel, isBusy
}) => {
    
    const isLoadingPreviews = pipelineStage === 'VOICE_PREVIEWS';
    const isLoadingFullAudio = ['AUDIO_FULL', 'AUDIO_ANALYSIS', 'GESTURE_PLANNING', 'KEYFRAME_GEN'].includes(pipelineStage);
    const isGeneratingVideo = ['VIDEO_START', 'VIDEO_RENDER', 'VIDEO_DOWNLOAD'].includes(pipelineStage);
    const isDone = pipelineStage === 'DONE' || pipelineStage === 'VOICE_SELECTED'; // Allow generation right after voice selection if no gestures are needed

    const handleAddTag = (tag: string) => {
        const trimmed = tag.trim();
        if (trimmed && !styleTags.includes(trimmed)) {
            setStyleTags([...styleTags, trimmed]);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setStyleTags(styleTags.filter(tag => tag !== tagToRemove));
    };

    const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.target as HTMLInputElement;
            handleAddTag(input.value);
            input.value = '';
        }
    };

    const finalStepActive = fullAudio && (pipelineStage === 'DONE' || pipelineStage === 'VOICE_SELECTED' || isGeneratingVideo)

    return (
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-5 flex flex-col gap-5 h-full">
            <h2 className="text-lg font-bold text-neutral-200">2. CONFIGURE & GENERATE</h2>
            
            <Step number={1} title="Write Script" isActive={true}>
                <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 bg-neutral-900 border border-neutral-800 rounded-md focus:ring-1 focus:ring-neutral-500 transition text-neutral-300 text-sm"
                    placeholder="Enter the text for the video..."
                    disabled={isBusy}
                />
            </Step>

            <Step number={2} title="Choose Voice" isActive={!!script}>
                {!selectedVoice && (
                    <button onClick={onGeneratePreviews} disabled={!script || isBusy} className="w-full btn-secondary">
                        {isLoadingPreviews ? "Generating..." : "Generate Voice Previews"}
                    </button>
                )}
                <div className="space-y-2 mt-2">
                    {voicePreviews.map(preview => (
                        <div key={preview.id} className={`p-2 rounded-md transition-all duration-300 transform ${selectedVoice === preview.voiceName ? 'bg-neutral-700 scale-105' : selectedVoice ? 'bg-neutral-800/50 opacity-60 hover:opacity-100' : 'bg-neutral-800/50'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-300">{VOICES.find(v => v.name === preview.voiceName)?.displayName}</span>
                                <button onClick={() => onSelectVoice(preview.voiceName)} disabled={isBusy} className="text-xs bg-neutral-600 hover:bg-neutral-500 px-2 py-1 rounded-md">
                                    {selectedVoice === preview.voiceName ? 'Selected' : 'Select'}
                                </button>
                            </div>
                            <audio src={preview.objectUrl} controls className="w-full h-8 mt-2" />
                        </div>
                    ))}
                </div>
            </Step>
            
            <Step number={3} title="Generate Audio & Gestures" isActive={!!selectedVoice}>
                {!!selectedVoice && (
                    <>
                    {!fullAudio && (
                        <div className="space-y-4">
                            <div>
                                <Label>Voice Style (Optional)</Label>
                                <div className="flex flex-wrap gap-2 mb-2 p-2 bg-neutral-900 border border-neutral-800 rounded-md min-h-[40px] items-center">
                                    {styleTags.map(tag => (
                                        <span key={tag} className="flex items-center bg-neutral-700 text-neutral-200 text-xs font-medium px-2.5 py-1 rounded-full">
                                            {tag}
                                            <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-neutral-400 hover:text-white">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                                            </button>
                                        </span>
                                    ))}
                                    <input
                                        type="text"
                                        onKeyDown={handleTagInput}
                                        placeholder={styleTags.length === 0 ? "e.g., Confident..." : "+ add tag"}
                                        className="flex-grow bg-transparent focus:outline-none text-sm p-1"
                                        disabled={isBusy}
                                    />
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {SUGGESTED_TAGS.map(tag => (
                                        <button key={tag} onClick={() => handleAddTag(tag)} disabled={isBusy || styleTags.includes(tag)}
                                            className="text-xs bg-neutral-800 px-2 py-1 rounded-md hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <button onClick={onGenerateFullAudio} disabled={isBusy} className="w-full btn-secondary">
                                {isLoadingFullAudio ? "Processing..." : "Generate Full Audio & Gestures"}
                            </button>
                        </div>
                    )}

                    {fullAudio && (
                         <div className="p-3 rounded-md bg-green-950/40 border border-green-800 flex items-center justify-center gap-2 transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                             </svg>
                             <p className="text-sm text-green-400 font-medium">Audio & Gestures Ready</p>
                         </div>
                    )}
                    </>
                )}
            </Step>

            <div className="mt-auto pt-4">
                <Step number={4} title="Generate Video" isActive={finalStepActive}>
                     {isGeneratingVideo ? (
                        <button onClick={onCancel} className="w-full btn-danger">
                           Cancel Generation
                        </button>
                     ) : (
                        <button onClick={onGenerateVideo} disabled={!finalStepActive || isBusy} className="w-full btn-primary">
                            Generate Video
                        </button>
                     )}
                </Step>
            </div>
             <style>{`
                .btn-primary { @apply w-full bg-neutral-100 text-black font-bold py-3 px-4 rounded-lg hover:bg-white transition-all duration-300 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed; }
                .btn-secondary { @apply w-full bg-neutral-800 text-neutral-300 font-bold py-2 px-4 rounded-lg hover:bg-neutral-700 transition-all duration-300 disabled:bg-neutral-800/50 disabled:text-neutral-500 disabled:cursor-not-allowed; }
                .btn-danger { @apply w-full bg-red-900/80 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-800 transition-all duration-300; }
            `}</style>
        </div>
    );
};