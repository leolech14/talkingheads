
import React from 'react';

interface VideoPlayerProps {
    videoUrl: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl }) => {
    return (
        <div className="w-full max-w-2xl mx-auto">
            <video
                key={videoUrl} // Add key to force re-render on new URL
                controls
                autoPlay
                className="rounded-lg shadow-2xl w-full"
            >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        </div>
    );
};
