import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBJ1Vgx1koY0pnYb2gn7oy6UG663MJ8RiI",
  authDomain: "logistics-592a9.firebaseapp.com",
  projectId: "logistics-592a9",
  storageBucket: "logistics-592a9.appspot.com",
  messagingSenderId: "417103738201",
  appId: "1:417103738201:web:774ec71926e11264514848",
  measurementId: "G-XPZP86Q7EW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const firestore = db;
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Enable local debug check with console logging
if (firebaseConfig.apiKey) {
  console.log("Firebase Config initialized with API Key ending in:", 
    firebaseConfig.apiKey.substring(firebaseConfig.apiKey.length - 4));
} else {
  console.error("Firebase API Key is missing!");
}

// If in development environment, use Functions emulator
// Uncomment this section if you're using the local emulator
// if (process.env.NODE_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

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

export default app; 