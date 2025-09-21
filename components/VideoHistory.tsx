import React from 'react';
import { VideoHistoryItem } from '../types';

interface VideoHistoryProps {
    history: VideoHistoryItem[];
    activeVideoUrl: string | null;
    onSelectVideo: (url: string) => void;
    onDeleteVideo: (id: string) => void;
    onClearHistory: () => void;
}

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


export const VideoHistory: React.FC<VideoHistoryProps> = ({ history, activeVideoUrl, onSelectVideo, onDeleteVideo, onClearHistory }) => {
    if (history.length === 0) {
        return null;
    }
    
    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent card selection when deleting
        if (window.confirm('Are you sure you want to delete this video?')) {
            onDeleteVideo(id);
        }
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to delete all videos from your history? This action cannot be undone.')) {
            onClearHistory();
        }
    };

    return (
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-5 w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-neutral-200">HISTORY</h2>
                <button
                    onClick={handleClear}
                    className="text-xs border border-neutral-800 text-neutral-400 font-semibold py-1 px-3 rounded-full hover:bg-neutral-800 hover:text-neutral-200 transition-colors flex items-center gap-1"
                    title="Clear all generation history"
                >
                    <DeleteIcon />
                    Clear All
                </button>
            </div>
            <div className="flex overflow-x-auto space-x-4 pb-2 -mb-2">
                {history.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => onSelectVideo(item.videoUrl)}
                        className={`group relative flex-shrink-0 w-64 rounded-lg cursor-pointer overflow-hidden transform transition-all duration-300 ${
                            item.videoUrl === activeVideoUrl ? 'ring-2 ring-neutral-400' : 'ring-1 ring-neutral-800 hover:ring-neutral-700'
                        }`}
                    >
                        <button 
                            onClick={(e) => handleDelete(e, item.id)}
                            className="absolute top-1.5 right-1.5 z-10 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-900 transition-all"
                            title="Delete this video"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <div className="relative">
                            <img src={item.thumbnailUrl} alt="Video thumbnail" className="w-full h-36 object-cover bg-black" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/50 group-hover:text-white/80 transition" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="p-2 bg-neutral-900">
                             <p className="text-xs text-neutral-300 truncate" title={item.script}>
                                {item.script}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                                {item.timestamp.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};