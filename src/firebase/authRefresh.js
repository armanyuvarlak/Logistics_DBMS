/**
 * Utility functions for handling Firebase authentication token refresh
 */

import { auth } from './config';

/**
 * Ensure user has a valid, fresh authentication token
 * @returns {Promise<Object>} Object with token information
 */
export const ensureFreshToken = async () => {
  // Check if user is authenticated
  if (!auth.currentUser) {
    console.error('User not authenticated');
    throw new Error('User must be authenticated to perform this action');
  }

  try {
    console.log('Forcing token refresh');
    // Force token refresh
    await auth.currentUser.getIdToken(true);
    
    // Get the refreshed token
    const token = await auth.currentUser.getIdToken();
    
    console.log(`Token refreshed successfully. Length: ${token.length}`);
    
    // Return token information
    return {
      success: true,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      token: token,
      tokenLength: token.length,
      expirationTime: auth.currentUser.stsTokenManager?.expirationTime,
    };
  } catch (error) {
    console.error('Error refreshing authentication token:', error);
    throw new Error(`Failed to refresh authentication token: ${error.message}`);
  }
};

/**
 * Check if the current user is authenticated and token is still valid
 * @returns {Promise<boolean>} True if authenticated with valid token
 */
export const verifyAuthentication = async () => {
  if (!auth.currentUser) {
    return false;
  }
  
  try {
    // Check token validity - this will throw if token is invalid
    const token = await auth.currentUser.getIdToken();
    return !!token;
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return false;
  }
};

/**
 * Get information about the current authentication state
 * @returns {Object} Authentication state information
 */
export const getAuthInfo = () => {
  const user = auth.currentUser;
  
  if (!user) {
    return {
      authenticated: false,
      message: 'Not authenticated'
    };
  }
  
  return {
    authenticated: true,
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    provider: user.providerData[0]?.providerId || 'unknown',
    expirationTime: user.stsTokenManager?.expirationTime,
    creationTime: user.metadata?.creationTime,
    lastSignInTime: user.metadata?.lastSignInTime
  };
}; 