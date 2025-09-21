import React from 'react';
import { ImageAsset, GallerySelection } from '../types';

interface AssetTrayProps {
    images: ImageAsset[];
    selection: GallerySelection;
    onSelect: (id: string) => void;
    onEnlarge: (image: ImageAsset) => void;
}

export const AssetTray: React.FC<AssetTrayProps> = ({ images, selection, onSelect, onEnlarge }) => {
    if (images.length === 0) {
        return null;
    }
    
    return (
        <div className="sticky bottom-0 left-0 right-0 bg-neutral-950/80 backdrop-blur-sm border-t border-neutral-800 z-20 mt-auto">
            <div className="max-w-screen-2xl mx-auto p-2">
                <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-neutral-500 uppercase flex-shrink-0">Assets</span>
                     <div className="flex-grow overflow-x-auto whitespace-nowrap space-x-2">
                        {images.map(img => (
                            <div 
                                key={img.id} 
                                onClick={() => onSelect(img.id)}
                                className={`group inline-block w-16 h-16 rounded-md cursor-pointer relative overflow-hidden transition-all ${selection?.imageId === img.id ? 'ring-2 ring-neutral-400' : 'ring-1 ring-neutral-800 hover:ring-neutral-600'}`}
                            >
                                <img src={img.objectUrl} alt="thumbnail" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onEnlarge(img); }}
                                        className="p-1 rounded-full bg-white/20 hover:bg-white/40"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                    </button>
                                </div>
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
