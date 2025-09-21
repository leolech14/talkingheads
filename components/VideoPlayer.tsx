import React, { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
    videoUrl: string;
}

const DownloadIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playbackRate, setPlaybackRate] = useState(1);
    const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2];

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
        }
    }, [playbackRate]);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4 p-4">
            <video
                ref={videoRef}
                key={videoUrl} // Add key to force re-render on new URL
                controls
                autoPlay
                className="rounded-lg w-full"
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-400">Speed:</span>
                    <div className="flex items-center bg-neutral-900 rounded-md">
                        {PLAYBACK_SPEEDS.map(speed => (
                             <button 
                                key={speed}
                                onClick={() => setPlaybackRate(speed)}
                                className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${playbackRate === speed ? 'bg-neutral-600 text-white' : 'text-neutral-400 hover:bg-neutral-700'}`}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                </div>
                 <a
                    href={videoUrl}
                    download={`talking-head-${new Date().getTime()}.mp4`}
                    className="inline-flex items-center justify-center bg-neutral-800 text-neutral-300 font-bold py-2 px-6 rounded-lg hover:bg-neutral-700 transition-all duration-300"
                    title="Download the generated video"
                >
                    <DownloadIcon />
                    Download Video
                </a>
            </div>
        </div>
    );
};