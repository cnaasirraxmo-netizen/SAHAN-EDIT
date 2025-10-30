import { getQueuedRequests, removeRequestFromQueue, updateImage, updateRequestInQueue, QueuedRequest } from './idb';
import { generateImage as performGenerateImage, editImage as performEditImage } from './geminiService';
import { v4 as uuidv4 } from 'https://jspm.dev/uuid';

const MAX_SYNC_RETRIES = 3;

export const processSyncQueue = async () => {
    console.log("Checking for items to sync...");
    const requests = await getQueuedRequests();
    if (requests.length === 0) {
        console.log("Sync queue is empty.");
        return;
    }

    console.log(`Found ${requests.length} item(s) in the sync queue.`);

    for (const req of requests) {
        try {
            console.log(`Processing request ${req.id} of type ${req.type}`);
            let result: { id: string, status: 'completed' | 'queued', imageUrl?: string } | null = null;

            // This is a bit of a hack to avoid circular dependencies.
            // When we call the service again, it will be online and won't re-queue.
            const tempNavigator = globalThis.navigator as any;
            const originalOnLine = tempNavigator.onLine;
            Object.defineProperty(tempNavigator, 'onLine', { value: true, configurable: true });

            if (req.type === 'generateImage') {
                result = await performGenerateImage(req.payload.prompt, req.payload.aspectRatio!);
            } else if (req.type === 'editImage') {
                result = await performEditImage(req.payload.prompt, req.payload.imageBase64!, req.payload.mimeType!);
            }
            
            Object.defineProperty(tempNavigator, 'onLine', { value: originalOnLine, configurable: true });


            if (result && result.status === 'completed') {
                // Update the original placeholder image record with the new data
                await updateImage(req.id, {
                    status: 'completed',
                    imageUrl: result.imageUrl,
                    // The new result has a new ID, but we keep the original for UI consistency
                });
                // Remove from queue on success
                await removeRequestFromQueue(req.id);
                console.log(`Successfully synced and processed request ${req.id}.`);
            } else {
                 throw new Error("Sync operation did not complete as expected.");
            }

        } catch (error) {
            console.error(`Failed to process request ${req.id}:`, error);
            
            if (req.retries < MAX_SYNC_RETRIES) {
                req.retries += 1;
                await updateRequestInQueue(req);
                console.log(`Request ${req.id} failed, will retry. Attempt ${req.retries}/${MAX_SYNC_RETRIES}.`);
            } else {
                await updateImage(req.id, { status: 'failed', error: (error as Error).message });
                await removeRequestFromQueue(req.id);
                console.log(`Request ${req.id} failed after ${MAX_SYNC_RETRIES} retries and was removed from the queue.`);
            }
        }
    }
};