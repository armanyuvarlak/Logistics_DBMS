import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthChanges, signOutUser } from '../firebase/authUtils';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges((user) => {
      // If a user is logged in but email isn't verified, sign them out
      if (user && !user.emailVerified) {
        signOutUser().then(() => {
          console.log('Signed out user with unverified email');
          setUser(null);
        }).catch(error => {
          console.error('Error signing out user with unverified email:', error);
          // Still set user to null to ensure UI is consistent
          setUser(null);
        });
      } else {
        setUser(user);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    // Check if user is authenticated AND email is verified
    isEmailVerified: user ? user.emailVerified : false,
    // Only consider fully authenticated if email is verified
    isFullyAuthenticated: !!user && user.emailVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 