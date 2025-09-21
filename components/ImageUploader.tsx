import React, { useRef } from 'react';
import { ImageAsset } from '../types';
import { usePipeline } from '../contexts/PipelineContext';

interface ImageUploaderProps {
    images: ImageAsset[];
    onSelect: (id: string) => void;
    onUpload: (file: File) => void;
    onClearAll: () => void;
    onEnlarge: (image: ImageAsset) => void;
}

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const EnlargeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1v4m0 0h-4m4 0l-5-5M4 16v4m0 0h4m-4 0l5-5m11 1v-4m0 0h-4m4 0l-5 5" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const ClearIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;


export const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onSelect, onUpload, onClearAll, onEnlarge }) => {
    const { selection } = usePipeline();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear all uploaded and generated images? This action cannot be undone.')) {
            onClearAll();
        }
    }

    return (
        <div className="bg-neutral-950 border border-neutral-900 rounded-lg p-5 h-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-neutral-200">1. MEDIA GALLERY</h2>
                {images.length > 0 && (
                    <div className="flex items-center gap-2">
                         <button onClick={() => selection && onEnlarge(selection.image)} disabled={!selection} title="Full Screen" aria-label="Enlarge selected image" className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition"><EnlargeIcon /></button>
                         <a href={selection?.image.objectUrl} download={`asset-${selection?.imageId}.png`} title="Download Selected" aria-label="Download selected image" className={`p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 ${!selection ? 'opacity-50 pointer-events-none' : ''}`}><DownloadIcon /></a>
                         <button onClick={handleClear} title="Clear All Images" aria-label="Clear all images" className="p-2 rounded-full bg-neutral-800 hover:bg-red-900/50 transition"><ClearIcon /></button>
                    </div>
                )}
            </div>
            
            <div className="border border-dashed border-neutral-800 rounded-md p-2 flex-grow flex items-center justify-center bg-black/50 min-h-[30vh]">
                {selection ? (
                     <img src={selection.image.objectUrl} alt="Selected preview" className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                    <div onClick={handleUploadClick} className="text-center cursor-pointer text-neutral-600 p-4">
                        <UploadIcon />
                        <p className="font-semibold">Click to upload an image</p>
                        <p className="text-xs mt-1">PNG, JPG, or WEBP</p>
                    </div>
                )}
            </div>
            
             <div className="flex-shrink-0">
                <div className="flex items-center gap-4">
                     <button onClick={handleUploadClick} className="text-sm bg-neutral-800 text-neutral-300 font-semibold py-2 px-4 rounded-md hover:bg-neutral-700 transition-colors">
                        + Upload
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/webp" />
                    <div className="flex-grow overflow-x-auto whitespace-nowrap space-x-2 py-1">
                        {images.map(img => (
                            <div key={img.id} onClick={() => onSelect(img.id)} className={`inline-block w-16 h-16 rounded-md cursor-pointer relative overflow-hidden transition-all ${selection?.imageId === img.id ? 'ring-2 ring-neutral-400' : 'ring-1 ring-neutral-800 hover:ring-neutral-600'}`}>
                                <img src={img.objectUrl} alt="thumbnail" className="w-full h-full object-cover" />
                                {img.kind === 'generated' && (
                                     <svg xmlns="http://www.w3.org/2000/svg" className="absolute top-1 right-1 h-3.5 w-3.5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};