import { VideoHistoryItem } from '../types';

const DB_NAME = 'VideoHistoryDB';
const STORE_NAME = 'videos';
const DB_VERSION = 1;

let db: IDBDatabase;

// This interface represents the object we store in IndexedDB.
// We store the blob directly, not a URL.
interface StoredVideoHistoryItem {
    id: string;
    videoBlob: Blob;
    thumbnailUrl: string; // Storing thumbnail as data URL is fine for IndexedDB
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
            if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
                dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
};

export const addVideoToHistory = async (item: Omit<VideoHistoryItem, 'videoUrl'> & { videoBlob: Blob }): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const itemToStore: StoredVideoHistoryItem = {
      id: item.id,
      videoBlob: item.videoBlob,
      thumbnailUrl: item.thumbnailUrl,
      script: item.script,
      timestamp: item.timestamp,
    };
    
    return new Promise((resolve, reject) => {
        const request = store.add(itemToStore);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to add video to DB:', request.error);
            reject('Failed to save video to history.');
        };
    });
};

export const getVideoHistory = async (): Promise<VideoHistoryItem[]> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = store.getAll();

        request.onerror = () => {
            console.error('Failed to get history from DB:', request.error);
            reject('Failed to load video history.');
        };

        request.onsuccess = () => {
            const storedItems: StoredVideoHistoryItem[] = request.result;
            // Sort by timestamp descending to show newest first
            storedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            const historyItems: VideoHistoryItem[] = storedItems.map(item => ({
                ...item,
                videoUrl: URL.createObjectURL(item.videoBlob), // Create a fresh URL
            }));
            resolve(historyItems);
        };
    });
};

export const deleteVideo = async (id: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to delete video from DB:', request.error);
            reject('Failed to delete video from history.');
        };
    });
};

export const clearHistory = async (): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Failed to clear history from DB:', request.error);
            reject('Failed to clear video history.');
        };
    });
};
