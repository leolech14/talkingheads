
import React from 'react';

interface VideoPlayerProps {
    videoUrl: string;
}

const DownloadIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4">
            <video
                key={videoUrl} // Add key to force re-render on new URL
                controls
                autoPlay
                className="rounded-lg shadow-2xl w-full"
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
             <a
                href={videoUrl}
                download={`talking-head-${new Date().getTime()}.mp4`}
                className="inline-flex items-center justify-center bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
                title="Download the generated video"
            >
                <DownloadIcon />
                Download Video
            </a>
        </div>
    );
};
