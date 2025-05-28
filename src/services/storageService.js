/**
 * Storage service that handles data storage using Firebase Firestore or localStorage
 * depending on the environment and user preferences
 */
import { db } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc, deleteDoc, collection } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// Check if we're running in Electron
const isElectron = () => {
  return window && window.electronAPI;
};

/**
 * Get user ID for storage
 * @returns {string} - The user ID or 'anonymous' if not logged in
 */
const getUserId = () => {
  // Try to get the current user from auth context
  try {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user?.uid || 'anonymous';
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'anonymous';
  }
};

/**
 * Save data to storage
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveData = async (key, data) => {
  try {
    if (isElectron()) {
      // Use Electron store
      return await window.electronAPI.setData(key, data);
    } else {
      // Store in Firestore if user is logged in, otherwise use localStorage
      const userId = getUserId();
      
      // Always save to localStorage as a backup
      localStorage.setItem(key, JSON.stringify(data));
      
      // Save to Firestore if we have a valid user
      if (userId !== 'anonymous') {
        await setDoc(doc(db, 'userData', userId, 'data', key), { 
          value: data,
          updatedAt: new Date().toISOString()
        });
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

/**
 * Load data from storage
 * @param {string} key - The key to load data from
 * @returns {Promise<any>} - The loaded data
 */
export const loadData = async (key) => {
  try {
    if (isElectron()) {
      // Use Electron store
      return await window.electronAPI.getData(key);
    } else {
      // Try to get from Firestore first, then fall back to localStorage
      const userId = getUserId();
      
      if (userId !== 'anonymous') {
        const docRef = doc(db, 'userData', userId, 'data', key);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return docSnap.data().value;
        }
      }
      
      // Fall back to localStorage
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    
    // Try localStorage as a fallback if Firestore fails
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }
};

/**
 * Remove data from storage
 * @param {string} key - The key to remove data from
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const removeData = async (key) => {
  try {
    if (isElectron()) {
      // Use Electron store - set to null to delete
      return await window.electronAPI.setData(key, null);
    } else {
      // Remove from both localStorage and Firestore
      localStorage.removeItem(key);
      
      const userId = getUserId();
      if (userId !== 'anonymous') {
        await deleteDoc(doc(db, 'userData', userId, 'data', key));
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
}; 