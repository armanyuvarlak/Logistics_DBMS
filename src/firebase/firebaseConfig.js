// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBJ1Vgx1koY0pnYb2gn7oy6UG663MJ8RiI",
  authDomain: "logistics-592a9.firebaseapp.com",
  projectId: "logistics-592a9",
  storageBucket: "logistics-592a9.firebasestorage.app",
  messagingSenderId: "417103738201",
  appId: "1:417103738201:web:774ec71926e11264514848",
  measurementId: "G-XPZP86Q7EW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db }; 