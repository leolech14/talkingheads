
import React, { useState, useCallback, useEffect } from 'react';
import { GestureInstruction, AudioTimingSegment, ImageAsset } from '../types';
import * as geminiService from '../services/geminiService';

const RegenerateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 01-1 1z" clipRule="evenodd" /></svg>;
const Spinner = () => <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>;


interface GestureEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    gestures: GestureInstruction[];
    setGestures: (gestures: GestureInstruction[]) => void;
    segments: AudioTimingSegment[];
    baseImage: ImageAsset;
    addGeneratedImage: (base64: string, frameId: string) => Promise<void>;
    setError: (error: string | null) => void;
}

export const GestureEditorModal: React.FC<GestureEditorModalProps> = ({ isOpen, onClose, gestures, setGestures, segments, baseImage, addGeneratedImage, setError }) => {
    const [localGestures, setLocalGestures] = useState<GestureInstruction[]>([]);
    const [generatingFrameId, setGeneratingFrameId] = useState<number | null>(null);

    useEffect(() => {
        setLocalGestures(gestures);
    }, [gestures]);

    const handleDescriptionChange = (index: number, newDescription: string) => {
        const updated = [...localGestures];
        updated[index].gesture_description = newDescription;
        setLocalGestures(updated);
    };

    const handleSave = () => {
        setGestures(localGestures);
        onClose();
    };

    const handleRegenerateKeyframe = useCallback(async (index: number) => {
        setGeneratingFrameId(index);
        setError(null);
        try {
            const gesture = localGestures[index];
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(baseImage.blob);
            });
            const response = await geminiService.generateGestureKeyframe(base64, baseImage.mimeType, gesture);
            const frameId = `KF_${Date.now()}`;
            await addGeneratedImage(response.base64, frameId);
        } catch (e: any) {
            setError(`Failed to generate keyframe for "${localGestures[index].key_phrase}": ${e.message}`);
        } finally {
            setGeneratingFrameId(null);
        }
    }, [localGestures, baseImage, addGeneratedImage, setError]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex-shrink-0 mb-4">
                    <h2 className="text-2xl font-bold text-neutral-100">Gesture Plan</h2>
                    <p className="text-neutral-400 mt-1">Review and refine the AI-suggested gestures for each segment of your script.</p>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                    {localGestures.map((gesture, index) => {
                        const segment = segments.find(s => Math.abs(gesture.timeSec! - s.peakSec) < 0.01);
                        if (!segment) return null;

                        return (
                            <div key={segment.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
                                <div className="md:col-span-1">
                                    <p className="text-xs text-neutral-500 font-mono">SEGMENT {index + 1} ({segment.peakSec.toFixed(2)}s)</p>
                                    <p className="text-neutral-300 mt-1 italic">"{segment.text}"</p>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-xs text-neutral-500 font-mono">GESTURE DESCRIPTION</label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="text"
                                            value={gesture.gesture_description}
                                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                            className="w-full bg-black/50 border border-neutral-700 rounded-md p-2 focus:ring-2 focus:ring-neutral-600 focus:border-neutral-600 transition"
                                        />
                                        <button 
                                            onClick={() => handleRegenerateKeyframe(index)}
                                            disabled={generatingFrameId !== null}
                                            title="Generate a preview image of this gesture in the media gallery"
                                            className="p-2 rounded-md bg-neutral-800 hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-wait"
                                        >
                                           {generatingFrameId === index ? <Spinner /> : <RegenerateIcon />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="flex-shrink-0 flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="bg-neutral-800 text-neutral-300 font-bold py-2 px-6 rounded-lg hover:bg-neutral-700 transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="bg-green-800 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 transition">
                        Confirm Gestures
                    </button>
                </div>
            </div>
        </div>
    );
};
