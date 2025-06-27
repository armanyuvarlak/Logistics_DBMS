/**
 * Centralized authentication utilities
 * Replaces duplicated password generation across components
 */

// Generate weekly password - simple version
export const generateWeeklyPassword = () => {
  const today = new Date();
  
  // Get the start of the week (Sunday)
  const firstDayOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  firstDayOfWeek.setDate(today.getDate() - dayOfWeek);
  
  // Get year
  const year = firstDayOfWeek.getFullYear();
  
  // Calculate week number (1-52)
  const oneJan = new Date(year, 0, 1);
  const numberOfDays = Math.floor((firstDayOfWeek - oneJan) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  
  // Reverse the year digits
  const reverseYear = year.toString().split('').reverse().join('');
  
  // Generate the final password: TRdb + week number + reverse year
  return `TRdb${weekNumber}${reverseYear}`;
};

// Rate limiting for authentication attempts
const authAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export const checkRateLimit = (identifier = 'default') => {
  const now = Date.now();
  const attempts = authAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  
  // Reset if lockout time has passed
  if (now - attempts.lastAttempt > LOCKOUT_TIME) {
    attempts.count = 0;
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    const timeLeft = LOCKOUT_TIME - (now - attempts.lastAttempt);
    if (timeLeft > 0) {
      return {
        allowed: false,
        timeLeft: Math.ceil(timeLeft / 1000 / 60) // minutes
      };
    }
  }
  
  return { allowed: true };
};

export const recordAuthAttempt = (identifier = 'default', success = false) => {
  const now = Date.now();
  const attempts = authAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  
  if (success) {
    // Reset on successful auth
    authAttempts.delete(identifier);
  } else {
    // Increment failed attempts
    attempts.count += 1;
    attempts.lastAttempt = now;
    authAttempts.set(identifier, attempts);
  }
};

// Validate password with rate limiting
export const validatePassword = (inputPassword, identifier = 'default') => {
  const rateLimit = checkRateLimit(identifier);
  
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Too many failed attempts. Please try again in ${rateLimit.timeLeft} minutes.`,
      rateLimited: true
    };
  }
  
  const correctPassword = generateWeeklyPassword();
  const isValid = inputPassword === correctPassword;
  
  recordAuthAttempt(identifier, isValid);
  
  return {
    success: isValid,
    error: isValid ? null : 'Incorrect password. Please try again.'
  };
};

// Database access management with session tokens
const DB_ACCESS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export const hasDBAccess = () => {
  try {
    const accessToken = localStorage.getItem('dbAccessToken');
    const expiry = localStorage.getItem('dbAccessExpiry');
    
    if (!accessToken || !expiry) return false;
    
    const now = Date.now();
    return now < parseInt(expiry);
  } catch {
    return false;
  }
};

export const grantDBAccess = () => {
  const now = Date.now();
  const expiry = now + DB_ACCESS_DURATION;
  const token = Math.random().toString(36).substring(2) + now.toString(36);
  
  localStorage.setItem('dbAccessToken', token);
  localStorage.setItem('dbAccessExpiry', expiry.toString());
  
  return token;
};

export const revokeDBAccess = () => {
  localStorage.removeItem('dbAccessToken');
  localStorage.removeItem('dbAccessExpiry');
}; 