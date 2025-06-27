// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Firebase configuration using environment variables for security
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBJ1Vgx1koY0pnYb2gn7oy6UG663MJ8RiI",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "logistics-592a9.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "logistics-592a9",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "logistics-592a9.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "417103738201",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:417103738201:web:774ec71926e11264514848",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-XPZP86Q7EW"
};

// Initialize Firebase - only once
let app;
let analytics;
let db;
let auth;
let storage;
let functions;

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  try {
    // Check if Firebase is already initialized
    if (!window.firebaseInitialized) {
      app = initializeApp(firebaseConfig);
      window.firebaseInitialized = true;
      console.log("Firebase initialized successfully");
    } else {
      console.log("Using existing Firebase instance");
      // Get existing app instead of reinitializing
      app = getApps()[0];
    }
    
    // Initialize services with proper error handling
    if (app) {
      analytics = getAnalytics(app);
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      functions = getFunctions(app, 'us-central1');
      
      // Ensure auth is ready before allowing popup operations
      auth.onAuthStateChanged(() => {
        console.log("Auth state initialized");
      });
    }
    
    // Debug logging
    console.log("Firebase Config initialized with API Key ending in:", 
      firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4));
  } catch (error) {
    console.error("Error initializing Firebase:", error.message);
    
    // Try to recover if initialization failed due to duplicate app
    if (error.code === 'app/duplicate-app') {
      console.log("Attempting to recover from duplicate app error");
      app = getApps()[0];
      analytics = getAnalytics(app);
      db = getFirestore(app);
      auth = getAuth(app);
      storage = getStorage(app);
      functions = getFunctions(app, 'us-central1');
    }
  }
}

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

export { app, analytics, db, auth, storage, functions }; 