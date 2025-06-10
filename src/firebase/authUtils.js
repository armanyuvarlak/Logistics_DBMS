import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from './firebaseConfig';

// Register new user without signing them in
export const registerUser = async (email, password, name) => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Get the user for email verification
    const user = userCredential.user;
    
    // Update the user's profile to include their name
    await updateProfile(user, {
      displayName: name
    });
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Immediately sign out the user - this is crucial
    await signOut(auth);
    
    return { 
      success: true, 
      message: "Account created successfully. Please check your email for verification."
    };
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Send verification email to current user
export const resendVerificationEmail = async () => {
  try {
    if (!auth.currentUser) {
      return { 
        success: false, 
        error: { message: "No user is currently signed in" } 
      };
    }
    await sendEmailVerification(auth.currentUser);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Sign in existing user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    // Check if auth is properly initialized
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ 
      prompt: 'select_account',
      // Add additional parameters to ensure clean popup behavior
      include_granted_scopes: 'true',
      access_type: 'online'
    });
    
    // Add timeout to prevent hanging promises
    const popupPromise = signInWithPopup(auth, provider);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Popup timeout')), 60000); // 60 second timeout
    });
    
    const userCredential = await Promise.race([popupPromise, timeoutPromise]);
    return { success: true, user: userCredential.user };
  } catch (error) {
    // Handle specific popup-related errors
    let errorMessage = error.message;
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in was cancelled. Please try again.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Popup was blocked by your browser. Please allow popups for this site and try again.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Another sign-in attempt is in progress. Please wait.';
    } else if (error.message === 'Popup timeout') {
      errorMessage = 'Sign-in timed out. Please try again.';
    }
    
    return { 
      success: false, 
      error: {
        code: error.code,
        message: errorMessage
      }
    };
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Subscribe to auth state changes
export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    console.error("Auth not initialized yet");
    return () => {};
  }
  
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Utility to check if auth is ready for popup operations
export const isAuthReady = () => {
  return auth && auth.app;
};

// Clear any pending popup operations (useful for cleanup)
export const clearPendingPopupOperations = () => {
  // This is mainly for debugging - Firebase handles cleanup internally
  console.log("Auth state check - Ready:", isAuthReady());
};