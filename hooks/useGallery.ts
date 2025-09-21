import { useState, useEffect, useCallback } from 'react';
import { ImageAsset, GallerySelection } from '../types';
import * as dbService from '../services/dbService';

export const useGallery = () => {
    const [images, setImages] = useState<ImageAsset[]>([]);
    const [selection, setSelection] = useState<GallerySelection>(null);

    // Load images from DB on initial mount
    useEffect(() => {
        let isMounted = true;
        const loadImages = async () => {
            const dbImages = await dbService.listImageAssets();
            if (isMounted) {
                const imageAssets = dbImages.map(dbImg => ({
                    ...dbImg,
                    objectUrl: URL.createObjectURL(dbImg.blob),
                }));
                setImages(imageAssets);
                if (imageAssets.length > 0) {
                    select(imageAssets[0].id, imageAssets);
                }
            }
        };
        loadImages();
        
        return () => {
            isMounted = false;
        };
    }, []);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            images.forEach(img => URL.revokeObjectURL(img.objectUrl));
        };
    }, [images]);

    const select = useCallback((imageId: string, imageList = images) => {
        const image = imageList.find(img => img.id === imageId);
        if (image) {
            setSelection({ imageId, image });
        }
    }, [images]);

    const addUploadedImage = useCallback(async (file: File) => {
        const newAsset: Omit<ImageAsset, 'objectUrl'> = {
            id: crypto.randomUUID(),
            kind: 'uploaded',
            blob: file,
            mimeType: file.type,
            createdAt: Date.now(),
        };
        await dbService.saveImageAsset(newAsset);
        
        const newImages = [{ ...newAsset, objectUrl: URL.createObjectURL(file) }, ...images];
        setImages(newImages);
        select(newAsset.id, newImages);
    }, [images, select]);

    const addGeneratedImage = useCallback(async (base64: string, frameId: string) => {
        const fetchRes = await fetch(`data:image/png;base64,${base64}`);
        const blob = await fetchRes.blob();

        const newAsset: Omit<ImageAsset, 'objectUrl'> = {
            id: crypto.randomUUID(),
            kind: 'generated',
            blob,
            mimeType: 'image/png',
            createdAt: Date.now(),
            frameId
        };
        await dbService.saveImageAsset(newAsset);
        
        const newImages = [...images, { ...newAsset, objectUrl: URL.createObjectURL(blob) }].sort((a,b) => b.createdAt - a.createdAt);
        setImages(newImages);
        select(newAsset.id, newImages);
    }, [images, select]);


    const removeAllImages = useCallback(async () => {
        await dbService.clearImageAssets();
        images.forEach(img => URL.revokeObjectURL(img.objectUrl));
        setImages([]);
        setSelection(null);
    }, [images]);

    return { images, selection, select, addUploadedImage, addGeneratedImage, removeAllImages };
};
