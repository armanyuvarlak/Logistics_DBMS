import React, { useState } from 'react';
import { signInWithGoogle, signOutUser, isAuthReady } from '../firebase/authUtils';

const GoogleSignInButton = ({ onSuccess, onError, buttonText = 'Sign in with Google' }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // Prevent multiple simultaneous popup attempts
    if (isLoading) {
      return;
    }

    // Check if auth is ready
    if (!isAuthReady()) {
      if (onError) onError({ message: "Authentication system is not ready. Please refresh the page and try again." });
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // Google accounts are usually already verified, but double check
        if (result.user.emailVerified) {
          if (onSuccess) onSuccess(result.user);
        } else {
          // In the rare case a Google account is not verified
          await signOutUser();
          if (onError) onError({ message: "Your Google account email is not verified. Please verify your email and try again." });
        }
      } else {
        if (onError) onError(result.error);
        console.error("Google sign in failed:", result.error);
      }
    } catch (error) {
      if (onError) onError(error);
      console.error("Error during Google sign in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="google-signin-button"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        backgroundColor: isLoading ? '#f5f5f5' : 'white',
        color: isLoading ? '#999' : '#757575',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '10px 16px',
        fontWeight: '500',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.3s',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? (
        <>
          <div 
            className="loading-spinner"
            style={{
              width: '18px',
              height: '18px',
              border: '2px solid #ddd',
              borderTop: '2px solid #4285f4',
              borderRadius: '50%',
            }}
          />
          Signing in...
        </>
      ) : (
        <>
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
};

export default GoogleSignInButton; 