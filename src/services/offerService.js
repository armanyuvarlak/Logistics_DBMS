/**
 * Optimized service to manage offers with better performance and error handling
 */

// Cache for offers to reduce localStorage reads
let offersCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate systematic offer ID (DDMMYYO format where O is order)
const generateOfferId = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2); // Last 2 digits
  
  // Get existing offers for today to determine order
  const offers = getOffers();
  const today = now.toDateString();
  const todaysOffers = offers.filter(offer => {
    try {
      const offerDate = new Date(offer.createdAt);
      return offerDate.toDateString() === today;
    } catch {
      return false;
    }
  });
  
  const orderNumber = todaysOffers.length + 1;
  
  return `${day}${month}${year}${orderNumber}`;
};

// Validate offer data structure
const validateOfferData = (offerData) => {
  const required = ['origin', 'destination', 'serviceType'];
  const missing = required.filter(field => !offerData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
};

// Get all offers with caching
export const getOffers = () => {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (offersCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return offersCache;
    }
    
    const offers = localStorage.getItem('shipping_offers');
    const parsedOffers = offers ? JSON.parse(offers) : [];
    
    // Update cache
    offersCache = parsedOffers;
    cacheTimestamp = now;
    
    return parsedOffers;
  } catch (error) {
    console.error('Error retrieving offers:', error);
    // Clear corrupted cache
    offersCache = null;
    return [];
  }
};

// Save offers to localStorage and update cache
const saveOffersToStorage = (offers) => {
  try {
    localStorage.setItem('shipping_offers', JSON.stringify(offers));
    // Update cache
    offersCache = offers;
    cacheTimestamp = Date.now();
    return true;
  } catch (error) {
    console.error('Error saving offers to storage:', error);
    return false;
  }
};

// Clear cache - useful for testing or when data is stale
export const clearCache = () => {
  offersCache = null;
  cacheTimestamp = 0;
};

// Save offer with validation
export const saveOffer = (offerData) => {
  try {
    validateOfferData(offerData);
    
    const offers = getOffers();
    
    const newOffer = {
      id: generateOfferId(),
      ...offerData,
      createdAt: new Date().toISOString(),
      status: 'Pending' // Default status
    };
    
    offers.push(newOffer);
    
    if (saveOffersToStorage(offers)) {
      return {
        success: true,
        offer: newOffer
      };
    } else {
      throw new Error('Failed to save offer to storage');
    }
  } catch (error) {
    console.error('Error saving offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Batch save multiple offers
export const saveOffers = (offersData) => {
  try {
    const validOffers = [];
    const errors = [];
    
    offersData.forEach((offerData, index) => {
      try {
        validateOfferData(offerData);
        validOffers.push({
          id: generateOfferId(),
          ...offerData,
          createdAt: new Date().toISOString(),
          status: 'Pending'
        });
      } catch (error) {
        errors.push({ index, error: error.message });
      }
    });
    
    if (validOffers.length === 0) {
      return {
        success: false,
        error: 'No valid offers to save',
        errors
      };
    }
    
    const existingOffers = getOffers();
    const allOffers = [...existingOffers, ...validOffers];
    
    if (saveOffersToStorage(allOffers)) {
      return {
        success: true,
        offers: validOffers,
        errors: errors.length > 0 ? errors : null
      };
    } else {
      throw new Error('Failed to save offers to storage');
    }
  } catch (error) {
    console.error('Error batch saving offers:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete offer by ID
export const deleteOffer = (offerId) => {
  try {
    if (!offerId) {
      throw new Error('Offer ID is required');
    }
    
    const offers = getOffers();
    const originalLength = offers.length;
    const filteredOffers = offers.filter(offer => offer.id !== offerId);
    
    if (filteredOffers.length === originalLength) {
      return {
        success: false,
        error: 'Offer not found'
      };
    }
    
    if (saveOffersToStorage(filteredOffers)) {
      return {
        success: true
      };
    } else {
      throw new Error('Failed to delete offer from storage');
    }
  } catch (error) {
    console.error('Error deleting offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Batch delete multiple offers
export const deleteOffers = (offerIds) => {
  try {
    if (!Array.isArray(offerIds) || offerIds.length === 0) {
      throw new Error('Valid offer IDs array is required');
    }
    
    const offers = getOffers();
    const filteredOffers = offers.filter(offer => !offerIds.includes(offer.id));
    const deletedCount = offers.length - filteredOffers.length;
    
    if (deletedCount === 0) {
      return {
        success: false,
        error: 'No offers found with the provided IDs'
      };
    }
    
    if (saveOffersToStorage(filteredOffers)) {
      return {
        success: true,
        deletedCount
      };
    } else {
      throw new Error('Failed to delete offers from storage');
    }
  } catch (error) {
    console.error('Error batch deleting offers:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update offer status
export const updateOfferStatus = (offerId, status) => {
  try {
    if (!offerId || !status) {
      throw new Error('Offer ID and status are required');
    }
    
    const offers = getOffers();
    const offerIndex = offers.findIndex(offer => offer.id === offerId);
    
    if (offerIndex === -1) {
      return {
        success: false,
        error: 'Offer not found'
      };
    }
    
    offers[offerIndex] = {
      ...offers[offerIndex],
      status,
      updatedAt: new Date().toISOString()
    };
    
    if (saveOffersToStorage(offers)) {
      return {
        success: true,
        offer: offers[offerIndex]
      };
    } else {
      throw new Error('Failed to update offer status');
    }
  } catch (error) {
    console.error('Error updating offer status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update entire offer
export const updateOffer = (offerId, updatedData) => {
  try {
    if (!offerId) {
      throw new Error('Offer ID is required');
    }
    
    const offers = getOffers();
    const offerIndex = offers.findIndex(offer => offer.id === offerId);
    
    if (offerIndex === -1) {
      return {
        success: false,
        error: 'Offer not found'
      };
    }
    
    // Validate updated data if provided
    if (updatedData && Object.keys(updatedData).length > 0) {
      const mergedData = { ...offers[offerIndex], ...updatedData };
      validateOfferData(mergedData);
    }
    
    // Merge existing offer with updated data
    offers[offerIndex] = {
      ...offers[offerIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    if (saveOffersToStorage(offers)) {
      return {
        success: true,
        offer: offers[offerIndex]
      };
    } else {
      throw new Error('Failed to update offer');
    }
  } catch (error) {
    console.error('Error updating offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get offer by ID
export const getOfferById = (offerId) => {
  try {
    if (!offerId) {
      throw new Error('Offer ID is required');
    }
    
    const offers = getOffers();
    const offer = offers.find(offer => offer.id === offerId);
    
    return offer ? {
      success: true,
      offer
    } : {
      success: false,
      error: 'Offer not found'
    };
  } catch (error) {
    console.error('Error getting offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Search offers with filters
export const searchOffers = (filters = {}) => {
  try {
    const offers = getOffers();
    
    let filteredOffers = offers;
    
    // Apply filters
    if (filters.status) {
      filteredOffers = filteredOffers.filter(offer => offer.status === filters.status);
    }
    
    if (filters.serviceType) {
      filteredOffers = filteredOffers.filter(offer => offer.serviceType === filters.serviceType);
    }
    
    if (filters.origin) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.origin && offer.origin.toLowerCase().includes(filters.origin.toLowerCase())
      );
    }
    
    if (filters.destination) {
      filteredOffers = filteredOffers.filter(offer => 
        offer.destination && offer.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filteredOffers = filteredOffers.filter(offer => 
        new Date(offer.createdAt) >= fromDate
      );
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filteredOffers = filteredOffers.filter(offer => 
        new Date(offer.createdAt) <= toDate
      );
    }
    
    return {
      success: true,
      offers: filteredOffers,
      total: filteredOffers.length
    };
  } catch (error) {
    console.error('Error searching offers:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 