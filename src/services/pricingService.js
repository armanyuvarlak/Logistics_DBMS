/**
 * Service to handle pricing calculations for shipping options
 */

import { getZipCodeData, getLanePairData } from '../firebase/firebaseUtils';

/**
 * Calculate pricing for shipping based on various factors
 * @param {number} chargeableWeight - The chargeable weight in kg
 * @param {string} originZip - Origin zip code
 * @param {string} destinationZip - Destination zip code
 * @param {string} serviceType - Service type (P2P, P2D, D2P, D2D)
 * @param {string} term - Service level (Economy, Standard, Express)
 * @param {string} volumeRatio - Volume ratio (1:3 or 1:6)
 * @returns {Object} - Calculated pricing breakdown
 */
export const calculatePricing = async (chargeableWeight, originZip, destinationZip, serviceType, term, volumeRatio) => {
  try {
    // Fetch zip code and lane pair data
    const zipCodeResult = await getZipCodeData();
    const lanePairResult = await getLanePairData();
    
    if (!zipCodeResult.success || !lanePairResult.success) {
      throw new Error('Failed to fetch pricing data');
    }
    
    const zipCodeData = Array.isArray(zipCodeResult.data) ? zipCodeResult.data : [zipCodeResult.data];
    const lanePairData = Array.isArray(lanePairResult.data) ? lanePairResult.data : [lanePairResult.data];
    
    // Find origin and destination zip data
    const originZipData = zipCodeData.find(data => data.zipCode === originZip);
    const destinationZipData = zipCodeData.find(data => data.zipCode === destinationZip);
    
    if (!originZipData || !destinationZipData) {
      throw new Error('Zip code data not found');
    }
    
    // Find lane pair data
    const lanePair = lanePairData.find(pair => 
      ((pair.originHub || pair.originBranch) === (originZipData.hubName || originZipData.branchName) && 
       (pair.destinationHub || pair.destinationBranch) === (destinationZipData.hubName || destinationZipData.branchName)) ||
      ((pair.originHub || pair.originBranch) === (destinationZipData.hubName || destinationZipData.branchName) && 
       (pair.destinationHub || pair.destinationBranch) === (originZipData.hubName || originZipData.branchName))
    );
    
    if (!lanePair) {
      throw new Error('Lane pair data not found');
    }
    
    // Calculate origin cost
    let originCost = 0;
    const originFee = originZipData.extraFee || originZipData.fee || 0;
    if (originFee && originFee > 0) {
      originCost = chargeableWeight * (originFee / 100); // Convert percentage to decimal
    }
    
    // Add door service fee for origin if applicable (D2P or D2D)
    if (serviceType === 'D2P' || serviceType === 'D2D') {
      originCost += originCost * 0.05; // Add 5% for door service
    }
    
    // Calculate destination cost
    let destinationCost = 0;
    const destinationFee = destinationZipData.extraFee || destinationZipData.fee || 0;
    if (destinationFee && destinationFee > 0) {
      destinationCost = chargeableWeight * (destinationFee / 100); // Convert percentage to decimal
    }
    
    // Add door service fee for destination if applicable (P2D or D2D)
    if (serviceType === 'P2D' || serviceType === 'D2D') {
      destinationCost += destinationCost * 0.05; // Add 5% for door service
    }
    
    // Calculate lane pair cost
    let lanePairCost = 0;
    if (lanePair.fee && lanePair.fee > 0) {
      lanePairCost = chargeableWeight * (lanePair.fee / 100); // Convert percentage to decimal
    }
    
    // Apply service level fee to lane pair cost
    let serviceMultiplier = 1.0;
    switch (term.toLowerCase()) {
      case 'economy':
        serviceMultiplier = 1.0; // 0% additional
        break;
      case 'standard':
        serviceMultiplier = 1.03; // 3% additional
        break;
      case 'express':
        serviceMultiplier = 1.10; // 10% additional
        break;
      default:
        serviceMultiplier = 1.0;
    }
    
    lanePairCost = lanePairCost * serviceMultiplier;
    
    // Calculate total cost
    const totalCost = originCost + destinationCost + lanePairCost;
    
    return {
      success: true,
      breakdown: {
        origin: {
          hub: originZipData.hubName || originZipData.branchName,
          zone: originZipData.zone,
          baseCost: chargeableWeight * (originFee / 100),
          doorFee: (serviceType === 'D2P' || serviceType === 'D2D') ? (chargeableWeight * (originFee / 100)) * 0.05 : 0,
          totalCost: originCost
        },
        destination: {
          hub: destinationZipData.hubName || destinationZipData.branchName,
          zone: destinationZipData.zone,
          baseCost: chargeableWeight * (destinationFee / 100),
          doorFee: (serviceType === 'P2D' || serviceType === 'D2D') ? (chargeableWeight * (destinationFee / 100)) * 0.05 : 0,
          totalCost: destinationCost
        },
        lanePair: {
          route: `${originZipData.hubName || originZipData.branchName} → ${destinationZipData.hubName || destinationZipData.branchName}`,
          baseCost: chargeableWeight * (lanePair.fee / 100),
          serviceFee: (chargeableWeight * (lanePair.fee / 100)) * (serviceMultiplier - 1),
          totalCost: lanePairCost,
          ftlFee: lanePair.ftlFee || 0
        },
        totalCost: totalCost,
        chargeableWeight: chargeableWeight,
        serviceType: serviceType,
        term: term,
        volumeRatio: volumeRatio
      }
    };
    
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return {
      success: false,
      error: error.message,
      breakdown: {
        origin: { totalCost: 0 },
        destination: { totalCost: 0 },
        lanePair: { totalCost: 0, ftlFee: 0 },
        totalCost: 0
      }
    };
  }
};

/**
 * Get chargeable weight based on volume ratio from calculation data
 * @param {Object} data - Calculation data from location state
 * @param {string} volumeRatio - Volume ratio (1:3 or 1:6)
 * @param {Object} calculations - Calculations from calculateShipping service
 * @returns {number} - Chargeable weight
 */
export const getChargeableWeight = (data, volumeRatio, calculations) => {
  // For quick mode, use directly entered chargeable weight
  if (data.calculationType === 'quick' || data.calculationType === 'single-quick') {
    return data.chargeableWeight || 0;
  }
  
  // For detailed mode, use calculations from the calculation service
  if (calculations && calculations.summary && calculations.summary.ratios) {
    const ratio = volumeRatio === '1:3' ? '1:3' : '1:6';
    return parseFloat(calculations.summary.ratios[ratio].chargeableWeight) || 0;
  }
  
  // Fallback to any chargeable weight in data
  return data.chargeableWeight || 0;
};

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `€${amount.toFixed(2)}`;
}; 