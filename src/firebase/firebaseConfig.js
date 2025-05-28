// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJ1Vgx1koY0pnYb2gn7oy6UG663MJ8RiI",
  authDomain: "logistics-592a9.firebaseapp.com",
  projectId: "logistics-592a9",
  storageBucket: "logistics-592a9.appspot.com",
  messagingSenderId: "417103738201",
  appId: "1:417103738201:web:774ec71926e11264514848",
  measurementId: "G-XPZP86Q7EW"
};

// Initialize Firebase - only once
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  // If already initialized, use the existing app instance
  console.log("Firebase already initialized, using existing app");
  app = initializeApp();
}

// Initialize services
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, 'us-central1');

// Sign in anonymously - this will work with Firebase rules that require authentication
// but doesn't require user credentials
export const signInAnonymousUser = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log("Successfully signed in anonymously");
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in anonymously:", error);
    return null;
  }
};

// Enable local debug check with console logging
if (firebaseConfig.apiKey) {
  console.log("Firebase Config initialized with API Key ending in:", 
    firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4));
} else {
  console.error("Firebase API Key is missing!");
}

export { app, analytics, db, auth, storage, functions }; 