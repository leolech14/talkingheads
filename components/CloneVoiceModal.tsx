
import React, { useState, useRef, useCallback } from 'react';
import { ClonedVoiceOption } from '../types';
import * as geminiService from '../services/geminiService';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-neutral-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h1.586a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H13a4 4 0 014 4v1.586a1 1 0 01-.293.707l-1.414 1.414a1 1 0 00-.293.707V16a4 4 0 01-4 4H7z" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

interface CloneVoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVoiceCloned: (voice: ClonedVoiceOption) => void;
}

export const CloneVoiceModal: React.FC<CloneVoiceModalProps> = ({ isOpen, onClose, onVoiceCloned }) => {
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setAudioFile(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setDisplayName('');
        setIsLoading(false);
        setError(null);
    }, [audioUrl]);

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError("File size cannot exceed 10MB.");
                return;
            }
            setError(null);
            setAudioFile(file);
            const url = URL.createObjectURL(file);
            setAudioUrl(url);
            if (!displayName) {
                setDisplayName(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleClone = async () => {
        if (!audioFile || !displayName) {
            setError("Please provide an audio file and a name for the voice.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioFile);
            reader.onload = async () => {
                const base64Audio = (reader.result as string).split(',')[1];
                const promptDescriptor = await geminiService.analyzeVoiceFromAudio(base64Audio, audioFile.type);
                
                const newClonedVoice: ClonedVoiceOption = {
                    kind: 'cloned',
                    id: crypto.randomUUID(),
                    displayName,
                    promptDescriptor,
                    audioSampleFileName: audioFile.name,
                };

                onVoiceCloned(newClonedVoice);
                handleClose();
            };
            reader.onerror = () => {
                throw new Error("Could not read the audio file.");
            };
        } catch (e: any) {
            setError(e.message);
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 w-full max-w-lg flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                <div>
                    <h2 className="text-2xl font-bold text-neutral-100">Clone a Voice</h2>
                    <p className="text-neutral-400 mt-1">Upload a short, clear audio sample (MP3, WAV, FLAC under 10MB) to create a new voice option.</p>
                </div>

                {error && <div className="bg-red-900/50 border border-red-800 text-red-300 text-sm p-3 rounded-md">{error}</div>}

                <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 transition-colors rounded-lg p-6 text-center cursor-pointer bg-black/40">
                    {audioFile ? (
                        <div>
                            <p className="font-semibold text-neutral-300">{audioFile.name}</p>
                            <p className="text-xs text-neutral-500">Click to choose a different file</p>
                        </div>
                    ) : (
                        <div>
                            <UploadIcon />
                            <p className="font-semibold text-neutral-400">Click to upload audio</p>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="audio/mpeg, audio/wav, audio/flac" />
                </div>
                
                {audioUrl && (
                    <audio controls src={audioUrl} className="w-full" />
                )}

                <div>
                    <label htmlFor="voice-name" className="block text-sm font-medium text-neutral-400 mb-1">Voice Name</label>
                    <input id="voice-name" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                        className="w-full bg-black/50 border border-neutral-700 rounded-md p-2 focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 transition"
                        placeholder="e.g., Morgan's Voice"
                    />
                </div>

                <div className="flex justify-end gap-4 mt-2">
                    <button onClick={handleClose} className="bg-neutral-800 text-neutral-300 font-bold py-2 px-6 rounded-lg hover:bg-neutral-700 transition">
                        Cancel
                    </button>
                    <button onClick={handleClone} disabled={isLoading || !audioFile || !displayName} className="bg-green-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition flex items-center justify-center disabled:opacity-50 min-w-[120px]">
                        {isLoading ? <Spinner /> : 'Clone Voice'}
                    </button>
                </div>
            </div>
        </div>
    );
};
