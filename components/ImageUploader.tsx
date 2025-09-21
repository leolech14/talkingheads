import React, { useRef } from 'react';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    uploadedImagePreview: string | null;
    expressionPreviewImage: string | null;
    onRevertPreview: () => void;
}

const RevertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImagePreview, expressionPreviewImage, onRevertPreview }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageUpload(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };
    
    const displayImage = expressionPreviewImage || uploadedImagePreview;

    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 relative h-full flex flex-col">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">1. Upload Your Image</h2>
             {expressionPreviewImage && (
                <div className="absolute top-6 right-6 z-10">
                    <button onClick={onRevertPreview} className="flex items-center text-xs bg-yellow-600/50 text-yellow-200 font-semibold py-1.5 px-3 rounded-full hover:bg-yellow-600/80 transition-colors">
                        <RevertIcon />
                        Revert to Original
                    </button>
                </div>
            )}
            <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300 bg-gray-900/50 flex-grow flex flex-col items-center justify-center"
                onClick={handleClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                {displayImage ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        {expressionPreviewImage && (
                            <span className="absolute top-2 left-2 text-xs bg-cyan-500/80 text-white font-bold py-0.5 px-2 rounded-full z-10">
                                Expression Preview
                            </span>
                        )}
                        <img src={displayImage} alt="Uploaded preview" className="max-w-full max-h-full object-contain rounded-md" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-semibold">Click to upload an image</p>
                        <p className="text-xs mt-1">PNG, JPG, or WEBP</p>
                    </div>
                )}
            </div>
            {uploadedImagePreview && !expressionPreviewImage && <p className="text-center text-sm text-gray-400 mt-4">Image loaded. You can now preview expressions or generate the video.</p>}
            {expressionPreviewImage && <p className="text-center text-sm text-gray-400 mt-4">Preview generated. You can now generate the video or revert the image.</p>}
        </div>
    );
};