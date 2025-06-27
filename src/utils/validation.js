// Central validation utilities for input security and data validation

/**
 * Sanitize string input to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate ZIP code format (US 5-digit or 5+4)
 * @param {string} zipCode - ZIP code to validate
 * @returns {boolean} - Is valid ZIP code
 */
export const isValidZipCode = (zipCode) => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
};

/**
 * Validate numeric input with range
 * @param {string|number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {object} - Validation result
 */
export const validateNumericRange = (value, min = 0, max = Infinity) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Must be a valid number' };
  }
  
  if (num < min) {
    return { isValid: false, error: `Must be at least ${min}` };
  }
  
  if (num > max) {
    return { isValid: false, error: `Must be no more than ${max}` };
  }
  
  return { isValid: true, value: num };
};

/**
 * Validate required fields in an object
 * @param {object} data - Data object to validate
 * @param {array} requiredFields - Array of required field names
 * @returns {object} - Validation result
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }
  
  return { isValid: true };
};

/**
 * Validate offer data structure
 * @param {object} offer - Offer object to validate
 * @returns {object} - Validation result
 */
export const validateOfferData = (offer) => {
  const requiredFields = ['origin', 'destination', 'serviceType'];
  const fieldValidation = validateRequiredFields(offer, requiredFields);
  
  if (!fieldValidation.isValid) {
    return fieldValidation;
  }
  
  // Validate specific fields
  if (offer.origin && typeof offer.origin !== 'string') {
    return { isValid: false, error: 'Origin must be a string' };
  }
  
  if (offer.destination && typeof offer.destination !== 'string') {
    return { isValid: false, error: 'Destination must be a string' };
  }
  
  if (offer.weight) {
    const weightValidation = validateNumericRange(offer.weight, 0.1, 100000);
    if (!weightValidation.isValid) {
      return { isValid: false, error: `Weight: ${weightValidation.error}` };
    }
  }
  
  if (offer.dimensions) {
    const { length, width, height } = offer.dimensions;
    if (length || width || height) {
      const lengthValidation = validateNumericRange(length, 0.1, 1000);
      const widthValidation = validateNumericRange(width, 0.1, 1000);
      const heightValidation = validateNumericRange(height, 0.1, 1000);
      
      if (!lengthValidation.isValid) {
        return { isValid: false, error: `Length: ${lengthValidation.error}` };
      }
      if (!widthValidation.isValid) {
        return { isValid: false, error: `Width: ${widthValidation.error}` };
      }
      if (!heightValidation.isValid) {
        return { isValid: false, error: `Height: ${heightValidation.error}` };
      }
    }
  }
  
  return { isValid: true };
};

/**
 * Validate lane pair data
 * @param {object} lanePair - Lane pair object to validate
 * @returns {object} - Validation result
 */
export const validateLanePairData = (lanePair) => {
  const requiredFields = ['origin', 'destination'];
  const fieldValidation = validateRequiredFields(lanePair, requiredFields);
  
  if (!fieldValidation.isValid) {
    return fieldValidation;
  }
  
  // Validate ZIP codes if provided
  if (lanePair.originZip && !isValidZipCode(lanePair.originZip)) {
    return { isValid: false, error: 'Invalid origin ZIP code format' };
  }
  
  if (lanePair.destinationZip && !isValidZipCode(lanePair.destinationZip)) {
    return { isValid: false, error: 'Invalid destination ZIP code format' };
  }
  
  return { isValid: true };
};

/**
 * Rate limiting helper
 * @param {string} key - Unique key for the operation
 * @param {number} maxAttempts - Maximum attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} - Rate limit status
 */
export const checkRateLimit = (key, maxAttempts = 10, windowMs = 60000) => {
  const now = Date.now();
  const rateLimitKey = `rateLimit_${key}`;
  
  try {
    const stored = localStorage.getItem(rateLimitKey);
    const attempts = stored ? JSON.parse(stored) : { count: 0, resetTime: now + windowMs };
    
    // Reset if window has expired
    if (now > attempts.resetTime) {
      attempts.count = 0;
      attempts.resetTime = now + windowMs;
    }
    
    // Check if limit exceeded
    if (attempts.count >= maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: attempts.resetTime,
        error: `Rate limit exceeded. Try again in ${Math.ceil((attempts.resetTime - now) / 1000)} seconds.`
      };
    }
    
    // Increment counter
    attempts.count++;
    localStorage.setItem(rateLimitKey, JSON.stringify(attempts));
    
    return {
      allowed: true,
      remaining: maxAttempts - attempts.count,
      resetTime: attempts.resetTime
    };
  } catch (error) {
    // If localStorage fails, allow the request but log the error
    console.warn('Rate limiting failed:', error);
    return { allowed: true, remaining: maxAttempts - 1 };
  }
};

/**
 * Validate and sanitize form data
 * @param {object} formData - Form data to validate
 * @param {object} schema - Validation schema
 * @returns {object} - Validation result with sanitized data
 */
export const validateFormData = (formData, schema) => {
  const sanitizedData = {};
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = formData[field];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    // Skip validation for optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Sanitize string inputs
    if (rules.type === 'string') {
      sanitizedData[field] = sanitizeInput(value);
      
      // Check min/max length
      if (rules.minLength && sanitizedData[field].length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`;
      }
      if (rules.maxLength && sanitizedData[field].length > rules.maxLength) {
        errors[field] = `${field} must be no more than ${rules.maxLength} characters`;
      }
    }
    
    // Validate numeric inputs
    if (rules.type === 'number') {
      const numValidation = validateNumericRange(value, rules.min, rules.max);
      if (!numValidation.isValid) {
        errors[field] = numValidation.error;
      } else {
        sanitizedData[field] = numValidation.value;
      }
    }
    
    // Validate email
    if (rules.type === 'email') {
      if (!isValidEmail(value)) {
        errors[field] = 'Invalid email format';
      } else {
        sanitizedData[field] = sanitizeInput(value);
      }
    }
    
    // Validate ZIP code
    if (rules.type === 'zipcode') {
      if (!isValidZipCode(value)) {
        errors[field] = 'Invalid ZIP code format';
      } else {
        sanitizedData[field] = sanitizeInput(value);
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    data: sanitizedData,
    errors
  };
}; 