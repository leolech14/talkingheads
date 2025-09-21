
import React, { useRef } from 'react';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
    uploadedImagePreview: string | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, uploadedImagePreview }) => {
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

    return (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">1. Upload Your Image</h2>
            <div
                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors duration-300 bg-gray-900/50"
                onClick={handleClick}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                />
                {uploadedImagePreview ? (
                    <img src={uploadedImagePreview} alt="Uploaded preview" className="max-h-48 mx-auto rounded-md object-contain" />
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
             {uploadedImagePreview && <p className="text-center text-sm text-gray-400 mt-4">Image loaded. You can now configure and generate the video.</p>}
        </div>
    );
};
