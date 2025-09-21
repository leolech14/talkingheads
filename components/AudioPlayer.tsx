import React from 'react';

interface AudioPlayerProps {
    audioUrl: string;
}

const DownloadIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const MusicNoteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-700" viewBox="0 0 20 20" fill="currentColor">
        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
    </svg>
);


export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-4">
            <div className="text-center">
                <MusicNoteIcon />
                <p className="text-lg font-semibold mt-2">Full Audio Track</p>
                <p className="text-sm text-neutral-500">Review the complete narration before generating the video.</p>
            </div>
            <audio
                key={audioUrl}
                controls
                autoPlay
                className="rounded-lg w-full"
            >
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>
             <a
                href={audioUrl}
                download={`narration-${new Date().getTime()}.mp3`}
                className="inline-flex items-center justify-center bg-neutral-800 text-neutral-300 font-bold py-2 px-6 rounded-lg hover:bg-neutral-700 transition-all duration-300"
                title="Download the generated audio"
            >
                <DownloadIcon />
                Download Audio
            </a>
        </div>
    );
};