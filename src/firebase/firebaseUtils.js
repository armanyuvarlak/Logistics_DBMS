import { db, auth, signInAnonymousUser, storage } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';

// Ensure user is authenticated before performing operations
const ensureAuth = async () => {
  if (!auth.currentUser) {
    await signInAnonymousUser();
  }
  return !!auth.currentUser;
};

// Add calculation result
export const saveCalculation = async (calculationData) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const docRef = await addDoc(collection(db, 'calculations'), {
      ...calculationData,
      userId: auth.currentUser.uid,
      timestamp: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving calculation: ", error);
    return { success: false, error: error.message };
  }
};

// Get all calculations
export const getCalculations = async () => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const querySnapshot = await getDocs(collection(db, 'calculations'));
    const calculations = [];
    querySnapshot.forEach((doc) => {
      calculations.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: calculations };
  } catch (error) {
    console.error("Error getting calculations: ", error);
    return { success: false, error: error.message };
  }
};

// Save zip code data
export const saveZipCode = async (zipCodeData) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const docRef = await addDoc(collection(db, 'zipCodes'), {
      ...zipCodeData,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving zip code: ", error);
    return { success: false, error: error.message };
  }
};

// Get zip code data
export const getZipCodeData = async (zipCode) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    if (zipCode) {
      // If zipCode is provided, get that specific zip code
      const q = query(collection(db, 'zipCodes'), where('zipCode', '==', zipCode));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data: data[0] };
    } else {
      // If no zipCode is provided, get all zip codes
      const querySnapshot = await getDocs(collection(db, 'zipCodes'));
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      return { success: true, data };
    }
  } catch (error) {
    console.error("Error getting zip code data: ", error);
    return { success: false, error: error.message };
  }
};

// Save rate/formula
export const saveRate = async (rateData) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const docRef = await addDoc(collection(db, 'rates'), {
      ...rateData,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving rate: ", error);
    return { success: false, error: error.message };
  }
};

// Get rates
export const getRates = async () => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const querySnapshot = await getDocs(collection(db, 'rates'));
    const rates = [];
    querySnapshot.forEach((doc) => {
      rates.push({ id: doc.id, ...doc.data() });
    });
    return { success: true, data: rates };
  } catch (error) {
    console.error("Error getting rates: ", error);
    return { success: false, error: error.message };
  }
};

// Update zip code data
export const updateZipCode = async (id, zipCodeData) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const zipCodeRef = doc(db, 'zipCodes', id);
    await updateDoc(zipCodeRef, {
      ...zipCodeData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating zip code: ", error);
    return { success: false, error: error.message };
  }
};

// Delete zip code data
export const deleteZipCode = async (id) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const zipCodeRef = doc(db, 'zipCodes', id);
    await deleteDoc(zipCodeRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting zip code: ", error);
    return { success: false, error: error.message };
  }
};

// Delete rate data
export const deleteRate = async (id) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const rateRef = doc(db, 'rates', id);
    await deleteDoc(rateRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting rate: ", error);
    return { success: false, error: error.message };
  }
};

// Upload PDF file to Firebase Storage
export const uploadPdf = async (file, path = 'pdfs') => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    // Create a unique filename
    const timestamp = new Date().getTime();
    const fileName = `${path}/${auth.currentUser.uid}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Return the URL and metadata
    return { 
      success: true, 
      url: downloadURL,
      path: fileName,
      contentType: file.type,
      size: file.size,
      name: file.name,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error uploading PDF: ", error);
    return { success: false, error: error.message };
  }
};

// Get download URL for a file
export const getPdfUrl = async (filePath) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const storageRef = ref(storage, filePath);
    const url = await getDownloadURL(storageRef);
    
    return { success: true, url };
  } catch (error) {
    console.error("Error getting PDF URL: ", error);
    return { success: false, error: error.message };
  }
};

// Delete PDF from storage
export const deletePdf = async (filePath) => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting PDF: ", error);
    return { success: false, error: error.message };
  }
};

// List all PDFs in a directory
export const listPdfs = async (directory = 'pdfs') => {
  try {
    // Make sure user is authenticated
    const isAuthenticated = await ensureAuth();
    if (!isAuthenticated) {
      return { success: false, error: "Authentication failed" };
    }
    
    const storageRef = ref(storage, directory);
    const fileList = await listAll(storageRef);
    
    // Get details for each item
    const items = await Promise.all(
      fileList.items.map(async (itemRef) => {
        try {
          const url = await getDownloadURL(itemRef);
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            url
          };
        } catch (error) {
          console.error(`Error getting details for ${itemRef.fullPath}:`, error);
          return {
            name: itemRef.name,
            fullPath: itemRef.fullPath,
            error: error.message
          };
        }
      })
    );
    
    return { success: true, items };
  } catch (error) {
    console.error("Error listing PDFs: ", error);
    return { success: false, error: error.message };
  }
}; 