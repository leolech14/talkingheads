import { useState, useRef, useCallback } from 'react';

type AbortableTask<T> = (signal: AbortSignal) => Promise<T>;

export const useAbortableTask = () => {
    const [isCanceled, setIsCanceled] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const cancel = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsCanceled(true);
        }
    }, []);

    const run = useCallback(async <T>(task: AbortableTask<T>) => {
        if (abortControllerRef.current) {
            // Cancel previous task if a new one is started
            abortControllerRef.current.abort();
        }

        const newController = new AbortController();
        abortControllerRef.current = newController;
        setIsCanceled(false);

        try {
            const result = await task(newController.signal);
            if (newController.signal.aborted) {
                // Task might have finished after abort was called
                return;
            }
            return result;
        } catch (error) {
            if ((error as Error).name === 'AbortError' || newController.signal.aborted) {
                console.log('Task was aborted.');
            } else {
                // Re-throw other errors
                throw error;
            }
        } finally {
            if (abortControllerRef.current === newController) {
                abortControllerRef.current = null;
            }
        }
    }, []);

    return { run, cancel, isCanceled };
};
