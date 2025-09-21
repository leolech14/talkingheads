import { VideoHistoryItem, ImageAsset, AudioAsset } from '../types';

const DB_NAME = 'VideoHistoryDB';
const VIDEO_STORE_NAME = 'videos';
const IMAGE_STORE_NAME = 'images';
const AUDIO_STORE_NAME = 'audios';
const DB_VERSION = 3; // Incremented version for new schema

let db: IDBDatabase;

interface StoredVideoHistoryItem {
    id: string;
    videoBlob: Blob;
    thumbnailUrl: string;
    script: string;
    timestamp: Date;
}

const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB error:', request.error);
            reject('Error opening IndexedDB.');
        };

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            if (!dbInstance.objectStoreNames.contains(VIDEO_STORE_NAME)) {
                dbInstance.createObjectStore(VIDEO_STORE_NAME, { keyPath: 'id' });
            }
            if (!dbInstance.objectStoreNames.contains(IMAGE_STORE_NAME)) {
                dbInstance.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' });
            }
            // Upgrade logic for the audio store to use a composite primary key instead of an index.
            // This is a simple migration; it will clear any existing audio cache.
            if (dbInstance.objectStoreNames.contains(AUDIO_STORE_NAME)) {
                dbInstance.deleteObjectStore(AUDIO_STORE_NAME);
            }
            dbInstance.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
        };
    });
};

// --- Video History ---
export const addVideoToHistory = async (item: Omit<VideoHistoryItem, 'videoUrl'> & { videoBlob: Blob }): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    const itemToStore: StoredVideoHistoryItem = {
      id: item.id, videoBlob: item.videoBlob, thumbnailUrl: item.thumbnailUrl, script: item.script, timestamp: item.timestamp,
    };
    return new Promise((resolve, reject) => {
        const request = store.add(itemToStore);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save video to history.');
    });
};

export const getVideoHistory = async (): Promise<VideoHistoryItem[]> => {
    const db = await initDB();
    const transaction = db.transaction(VIDEO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject('Failed to load video history.');
        request.onsuccess = () => {
            const storedItems: StoredVideoHistoryItem[] = request.result;
            storedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            const historyItems: VideoHistoryItem[] = storedItems.map(item => ({
                ...item, videoUrl: URL.createObjectURL(item.videoBlob),
            }));
            resolve(historyItems);
        };
    });
};

export const deleteVideo = async (id: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to delete video from history.');
    });
};

export const clearHistory = async (): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(VIDEO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(VIDEO_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to clear video history.');
    });
};

// --- Image Assets ---
export const saveImageAsset = async (asset: Omit<ImageAsset, 'objectUrl'>): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(IMAGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.put(asset);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save image asset.');
    });
};

export const listImageAssets = async (): Promise<Omit<ImageAsset, 'objectUrl'>[]> => {
    const db = await initDB();
    const transaction = db.transaction(IMAGE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject('Failed to list image assets.');
        request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    });
};

export const clearImageAssets = async (): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(IMAGE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to clear image assets.');
    });
};


// --- Audio Assets ---
export const saveAudioAsset = async (asset: Omit<AudioAsset, 'objectUrl'>): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.put(asset);
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to save audio asset.');
    });
};

export const getAudioAssetBy = async (hash: string, voiceName: string, scope: 'preview' | 'full'): Promise<Omit<AudioAsset, 'objectUrl'> | null> => {
    const db = await initDB();
    const transaction = db.transaction(AUDIO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    const id = `${hash}-${voiceName}-${scope}`;
    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject('Failed to get audio asset.');
        request.onsuccess = () => resolve(request.result || null);
    });
};

export const clearAudioAssets = async (): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject('Failed to clear audio assets.');
    });
};