import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AspectRatio } from '../types';

const DB_NAME = 'sahan-edit-db';
const DB_VERSION = 2; // Incremented version for schema change
const IMAGE_STORE = 'generated-images';
const QUEUE_STORE = 'sync-queue';
const VIDEO_SCRIPT_STORE = 'video-scripts';

export interface StoredImage {
  id: string;
  prompt: string;
  status: 'queued' | 'completed' | 'failed';
  imageUrl?: string; // Base64 data URL
  createdAt: Date;
  error?: string;
}

export interface QueuedRequest {
    id: string;
    type: 'generateImage' | 'editImage';
    payload: {
        prompt: string;
        aspectRatio?: AspectRatio;
        imageBase64?: string;
        mimeType?: string;
    };
    createdAt: Date;
    retries: number;
}

export interface StoredScript {
  id: string;
  topic: string;
  platform: 'TikTok' | 'YouTube';
  script: string;
  createdAt: Date;
}


interface SahanDB extends DBSchema {
  [IMAGE_STORE]: {
    key: string;
    value: StoredImage;
    indexes: { 'createdAt': Date };
  };
  [QUEUE_STORE]: {
    key: string;
    value: QueuedRequest;
    indexes: { 'createdAt': Date };
  };
  [VIDEO_SCRIPT_STORE]: {
    key: string;
    value: StoredScript;
    indexes: { 'createdAt': Date };
  };
}

let dbPromise: Promise<IDBPDatabase<SahanDB>> | null = null;

export const initDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB<SahanDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
            const store = db.createObjectStore(IMAGE_STORE, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(QUEUE_STORE)) {
            const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt');
        }
      }
      if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(VIDEO_SCRIPT_STORE)) {
              const store = db.createObjectStore(VIDEO_SCRIPT_STORE, { keyPath: 'id' });
              store.createIndex('createdAt', 'createdAt');
          }
      }
    },
  });
  return dbPromise;
};

// --- Image Store Functions ---

export const addImage = async (image: StoredImage) => {
  const db = await initDB();
  return db.put(IMAGE_STORE, image);
};

export const updateImage = async (id: string, updates: Partial<StoredImage>) => {
    const db = await initDB();
    const tx = db.transaction(IMAGE_STORE, 'readwrite');
    const store = tx.objectStore(IMAGE_STORE);
    const image = await store.get(id);
    if (image) {
        Object.assign(image, updates);
        await store.put(image);
    }
    return tx.done;
};

export const getAllImages = async (): Promise<StoredImage[]> => {
  const db = await initDB();
  return db.getAllFromIndex(IMAGE_STORE, 'createdAt');
};

// --- Queue Store Functions ---

export const addRequestToQueue = async (request: QueuedRequest) => {
  const db = await initDB();
  return db.add(QUEUE_STORE, request);
};

export const getQueuedRequests = async (): Promise<QueuedRequest[]> => {
  const db = await initDB();
  return db.getAll(QUEUE_STORE);
};

export const removeRequestFromQueue = async (id: string) => {
  const db = await initDB();
  return db.delete(QUEUE_STORE, id);
};

export const updateRequestInQueue = async (request: QueuedRequest) => {
    const db = await initDB();
    return db.put(QUEUE_STORE, request);
};

// --- Script Store Functions ---

export const addScript = async (script: StoredScript) => {
  const db = await initDB();
  return db.put(VIDEO_SCRIPT_STORE, script);
};

export const getAllScripts = async (): Promise<StoredScript[]> => {
  const db = await initDB();
  const scripts = await db.getAllFromIndex(VIDEO_SCRIPT_STORE, 'createdAt');
  return scripts.reverse(); // Newest first
};