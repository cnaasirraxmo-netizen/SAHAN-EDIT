import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDR3C-1_smNgJG58Zq9KsMvYrhyaKkhsv8",
  authDomain: "films-6e93b.firebaseapp.com",
  projectId: "sahan-films-6e93b",
  storageBucket: "sahan-films-6e93b.firebasestorage.app",
  messagingSenderId: "1027839066415",
  appId: "1:1027839066415:web:a91e62f7f1123d3ed3a1da"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };