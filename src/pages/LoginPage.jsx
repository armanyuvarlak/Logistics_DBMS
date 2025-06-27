import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signInUser, registerUser, resendVerificationEmail, signOutUser } from '../firebase/authUtils';
import GoogleSignInButton from '../components/GoogleSignInButton';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // If already authenticated and email verified, redirect to home
  useEffect(() => {
    if (isAuthenticated && user?.emailVerified) {
      navigate('/offer/single-offer');
    } else if (isAuthenticated && !user?.emailVerified) {
      // If signed in but email not verified, sign out
      const handleAutoSignOut = async () => {
        await signOutUser();
      };
      handleAutoSignOut();
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    setVerificationSent(false);

    try {
      if (isRegistering) {
        // Handle registration
        const result = await registerUser(email, password, name);
        if (result.success) {
          // Display success message after registration
          setSuccess(result.message || "Account created successfully. Please check your email for verification.");
          setVerificationSent(true);
          // Clear form fields
          setEmail('');
          setPassword('');
          setName('');
          // Switch to login view after successful registration
          setIsRegistering(false);
        } else {
          // Format registration error messages
          handleAuthError(result.error);
        }
      } else {
        // Handle sign in
        const result = await signInUser(email, password);
        if (result.success) {
          if (result.user.emailVerified) {
            navigate('/offer/single-offer');
          } else {
            // Sign out if email not verified
            await signOutUser();
            setError('Please verify your email before signing in. Check your inbox for a verification email.');
          }
        } else {
          // Format sign-in error messages
          handleAuthError(result.error);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert Firebase error codes to user-friendly messages
  const handleAuthError = (error) => {
    const errorMessage = (() => {
      switch (error.code) {
        case 'auth/invalid-credential':
          return 'Invalid email or password. Please check your credentials and try again.';
        case 'auth/user-not-found':
          return 'No account found with this email. Please check your email or create a new account.';
        case 'auth/wrong-password':
          return 'Incorrect password. Please try again.';
        case 'auth/email-already-in-use':
          return 'This email address is already in use. Please use a different email or try signing in.';
        case 'auth/weak-password':
          return 'Password is too weak. Please use a stronger password (at least 6 characters).';
        case 'auth/invalid-email':
          return 'Invalid email address. Please enter a valid email.';
        case 'auth/too-many-requests':
          return 'Too many unsuccessful login attempts. Please try again later or reset your password.';
        case 'auth/network-request-failed':
          return 'Network error. Please check your internet connection and try again.';
        default:
          return error.message || 'An error occurred during authentication. Please try again.';
      }
    })();
    
    setError(errorMessage);
  };

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        setVerificationSent(true);
        setSuccess("Verification email sent! Please check your inbox.");
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError('Failed to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (user) => {
    // Google sign-in automatically verifies email
    navigate('/offer/single-offer');
  };

  const handleGoogleError = (error) => {
    setError(error.message || 'Failed to sign in with Google');
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setName('');
    setVerificationSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 p-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-2xl">
        <div>
          {/* Logistics Icon - Container and Transportation */}
          <div className="flex justify-center mb-4">
            <svg className="w-20 h-20 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          </div>
          
          <h1 className="text-center text-3xl font-bold text-blue-600 mb-2">
            Road Freight Management System
          </h1>
          <h2 className="mt-2 text-center text-xl font-semibold text-gray-900">
            {isRegistering ? 'Create Your Account' : 'Sign in to Your Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access our comprehensive transportation management system
          </p>
        </div>
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded" role="alert">
            <p className="text-sm text-green-700">{success}</p>
            {verificationSent && (
              <button 
                onClick={handleResendVerification}
                disabled={loading}
                className="mt-2 text-sm text-green-700 underline hover:text-green-900"
              >
                Resend verification email
              </button>
            )}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded" role="alert">
            <p className="text-sm text-red-700">{error}</p>
            {error.includes('verify your email') && (
              <button 
                onClick={handleResendVerification}
                disabled={loading}
                className="mt-2 text-sm text-red-700 underline hover:text-red-900"
              >
                Resend verification email
              </button>
            )}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegistering && (
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required={isRegistering}
                  className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm ${
                  isRegistering ? '' : 'rounded-t-md'
                }`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                isRegistering ? 'Create Account' : 'Sign In'
              )}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="border-t border-gray-300 flex-grow mr-3"></div>
            <span className="text-sm text-gray-500">OR</span>
            <div className="border-t border-gray-300 flex-grow ml-3"></div>
          </div>

          <div className="flex justify-center">
            <GoogleSignInButton 
              onSuccess={handleGoogleSuccess} 
              onError={handleGoogleError} 
            />
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200"
              onClick={toggleMode}
            >
              {isRegistering 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Create one"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 