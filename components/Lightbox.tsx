import React, { useEffect } from 'react';
import { ImageAsset } from '../types';

interface LightboxProps {
    imageAsset: ImageAsset;
    onClose: () => void;
}

const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

export const Lightbox: React.FC<LightboxProps> = ({ imageAsset, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl max-h-[90vh] bg-neutral-950 p-4 rounded-lg flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image/modal
            >
                <img 
                    src={imageAsset.objectUrl} 
                    alt="Full screen view" 
                    className="object-contain w-full h-full"
                />
                 <a
                    href={imageAsset.objectUrl}
                    download={`asset-${imageAsset.id}.png`}
                    className="inline-flex items-center justify-center bg-neutral-800 text-neutral-300 font-bold py-2 px-6 rounded-lg hover:bg-neutral-700 transition-all duration-300 self-center"
                >
                    <DownloadIcon />
                    Download Image
                </a>
            </div>
        </div>
    );
};
