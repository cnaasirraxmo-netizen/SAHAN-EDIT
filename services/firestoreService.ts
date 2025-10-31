import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from './firebase';
import { StoredScript } from './idb';

const SCRIPTS_COLLECTION = 'scripts';

// Add a script to Firestore for a specific user
export const addScriptToFirestore = async (userId: string, scriptData: Omit<StoredScript, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "users", userId, SCRIPTS_COLLECTION), {
            ...scriptData,
            createdAt: serverTimestamp() // Use server timestamp for consistency
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding document to Firestore: ", error);
        throw error;
    }
};

// Get all scripts from Firestore for a specific user
export const getAllScriptsFromFirestore = async (userId: string): Promise<StoredScript[]> => {
    try {
        const scriptsQuery = query(
            collection(db, "users", userId, SCRIPTS_COLLECTION),
            orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(scriptsQuery);
        const scripts: StoredScript[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            scripts.push({
                id: doc.id,
                topic: data.topic,
                platform: data.platform,
                script: data.script,
                // Convert Firestore Timestamp to JS Date, provide fallback
                createdAt: data.createdAt?.toDate() || new Date(),
            });
        });
        return scripts;
    } catch (error) {
        console.error("Error getting documents from Firestore: ", error);
        // Return empty array on error to allow fallback to IndexedDB or show empty state
        return [];
    }
};
