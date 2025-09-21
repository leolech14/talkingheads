import React, { useRef, useEffect } from 'react';

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


/**
 * Decodes audio data and draws a waveform on a canvas.
 * @param canvas The HTMLCanvasElement to draw on.
 * @param audioUrl The URL of the audio file to visualize.
 */
const drawWaveform = async (canvas: HTMLCanvasElement, audioUrl: string): Promise<void> => {
    // Use a try/finally block to ensure the AudioContext is closed, preventing resource leaks.
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const data = audioBuffer.getChannelData(0); // Use the first channel

        // Setup canvas for high-DPI rendering
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(dpr, dpr);

        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const middleY = height / 2;

        // Clear canvas and set styles
        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#525252'; // tailwind neutral-600
        ctx.beginPath();
        
        const samples = Math.floor(width);
        const step = Math.ceil(data.length / samples);

        // Loop through samples, find min/max for each segment, and draw a vertical line
        for (let i = 0; i < samples; i++) {
            let min = 1.0;
            let max = -1.0;
            
            const startIndex = i * step;
            const endIndex = Math.min(startIndex + step, data.length);

            for (let j = startIndex; j < endIndex; j++) {
                const datum = data[j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            
            const x = i + 0.5; // Draw in the center of the pixel
            const yMin = (min * middleY) + middleY;
            const yMax = (max * middleY) + middleY;
            
            ctx.moveTo(x, yMin);
            ctx.lineTo(x, yMax);
        }
        ctx.stroke();

    } catch (error) {
        console.error("Error drawing waveform:", error);
    } finally {
        if (audioContext.state !== 'closed') {
            await audioContext.close();
        }
    }
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas && audioUrl) {
            let isActive = true;
            
            drawWaveform(canvas, audioUrl).catch(err => {
                // Only log errors if the component is still mounted and the effect is active.
                if (isActive) {
                    console.error("Failed to draw waveform:", err);
                }
            });

            // Cleanup function to prevent state updates on unmounted components.
            return () => {
                isActive = false;
            };
        }
    }, [audioUrl]);


    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6 p-4">
            <div className="text-center">
                <MusicNoteIcon />
                <p className="text-lg font-semibold mt-2">Full Audio Track</p>
                <p className="text-sm text-neutral-500">Review the complete narration before generating the video.</p>
            </div>
            
            <div className="w-full h-24 bg-neutral-900 rounded-lg p-2">
                <canvas ref={canvasRef} className="w-full h-full" />
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