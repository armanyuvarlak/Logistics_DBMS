/**
 * Service to manage offers - stored in localStorage for persistence
 */

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
    const offerDate = new Date(offer.createdAt);
    return offerDate.toDateString() === today;
  });
  
  const orderNumber = todaysOffers.length + 1;
  
  return `${day}${month}${year}${orderNumber}`;
};

// Get all offers from localStorage
export const getOffers = () => {
  try {
    const offers = localStorage.getItem('shipping_offers');
    return offers ? JSON.parse(offers) : [];
  } catch (error) {
    console.error('Error retrieving offers:', error);
    return [];
  }
};

// Save offer to localStorage
export const saveOffer = (offerData) => {
  try {
    const offers = getOffers();
    
    const newOffer = {
      id: generateOfferId(),
      ...offerData,
      createdAt: new Date().toISOString(),
      status: 'Pending' // Default status
    };
    
    offers.push(newOffer);
    localStorage.setItem('shipping_offers', JSON.stringify(offers));
    
    return {
      success: true,
      offer: newOffer
    };
  } catch (error) {
    console.error('Error saving offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete offer by ID
export const deleteOffer = (offerId) => {
  try {
    const offers = getOffers();
    const filteredOffers = offers.filter(offer => offer.id !== offerId);
    localStorage.setItem('shipping_offers', JSON.stringify(filteredOffers));
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting offer:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update offer status
export const updateOfferStatus = (offerId, status) => {
  try {
    const offers = getOffers();
    const offerIndex = offers.findIndex(offer => offer.id === offerId);
    
    if (offerIndex === -1) {
      return {
        success: false,
        error: 'Offer not found'
      };
    }
    
    offers[offerIndex].status = status;
    offers[offerIndex].updatedAt = new Date().toISOString();
    
    localStorage.setItem('shipping_offers', JSON.stringify(offers));
    
    return {
      success: true,
      offer: offers[offerIndex]
    };
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
    const offers = getOffers();
    const offerIndex = offers.findIndex(offer => offer.id === offerId);
    
    if (offerIndex === -1) {
      return {
        success: false,
        error: 'Offer not found'
      };
    }
    
    // Merge existing offer with updated data
    offers[offerIndex] = {
      ...offers[offerIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('shipping_offers', JSON.stringify(offers));
    
    return {
      success: true,
      offer: offers[offerIndex]
    };
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