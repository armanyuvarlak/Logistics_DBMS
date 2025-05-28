/**
 * Service to handle shipping calculations
 */

/**
 * Calculate shipping metrics based on input data
 * @param {Array} rows - Array of row data objects
 * @param {string} originZip - Origin ZIP code
 * @param {string} destinationZip - Destination ZIP code
 * @returns {Object} - Calculated results
 */
export const calculateShipping = (rows, originZip, destinationZip) => {
  // Input validation
  if (!rows || rows.length === 0 || !originZip || !destinationZip) {
    throw new Error('Missing required calculation parameters');
  }

  // Perform calculations
  let totalPieces = 0;
  let totalGrossWeight = 0;
  let totalVolumeWeight = 0;
  let totalCbm = 0;
  let totalLdm = 0;

  rows.forEach(row => {
    // Skip invalid rows
    if (!row.pieces || !row.length || !row.width || !row.height || !row.grossWeight) {
      return;
    }

    const pieces = parseInt(row.pieces, 10);
    const length = parseFloat(row.length) / 100; // Convert cm to meters
    const width = parseFloat(row.width) / 100;   // Convert cm to meters
    const height = parseFloat(row.height) / 100; // Convert cm to meters
    const grossWeight = parseFloat(row.grossWeight);

    // Calculate volume in cubic meters
    const volumeInCbm = length * width * height * pieces;
    
    // Calculate volume weight (1 CBM = 167 kg volumetric weight by default)
    const volumeWeight = volumeInCbm * 167;
    
    // Calculate Load Meter (LDM) - width × length × pieces / 2.4
    const ldm = (width * length * pieces) / 2.4;

    totalPieces += pieces;
    totalGrossWeight += grossWeight * pieces;
    totalVolumeWeight += volumeWeight;
    totalCbm += volumeInCbm;
    totalLdm += ldm;
  });

  // Determine which weight to use (gross or volume)
  const chargeableWeight = Math.max(totalGrossWeight, totalVolumeWeight);
  const isDense = totalGrossWeight >= totalVolumeWeight;
  
  // Calculate density ratio
  const densityRatio = totalGrossWeight > 0 ? totalCbm > 0 ? totalGrossWeight / totalCbm : 0 : 0;
  
  // Calculate volume ratio
  const volumeRatio = totalVolumeWeight > 0 ? totalVolumeWeight / totalGrossWeight : 0;

  // Placeholder for zone calculation based on ZIP codes
  const zone = calculateZone(originZip, destinationZip);

  // Mock service options based on destination
  const serviceOptions = getServiceOptions(zone);

  return {
    summary: {
      volumeRatio: volumeRatio.toFixed(2),
      pieces: totalPieces,
      grossWeight: totalGrossWeight.toFixed(2),
      volumeWeight: totalVolumeWeight.toFixed(2),
      chargeableWeight: chargeableWeight.toFixed(2),
      denseOrVolumetric: isDense ? 'Dense' : 'Volumetric',
      densityRatio: densityRatio.toFixed(2),
      ldmAmount: totalLdm.toFixed(2),
      cbmAmount: totalCbm.toFixed(2)
    },
    results: {
      zone,
      serviceOptions
    }
  };
};

/**
 * Calculate zone based on origin and destination ZIP codes
 * @param {string} originZip 
 * @param {string} destinationZip 
 * @returns {string} - Calculated zone
 */
const calculateZone = (originZip, destinationZip) => {
  // Placeholder logic - this would be replaced with actual zone calculation
  const firstDigitOrigin = originZip.charAt(0);
  const firstDigitDest = destinationZip.charAt(0);
  
  if (firstDigitOrigin === firstDigitDest) {
    return 'Local';
  } else if (Math.abs(parseInt(firstDigitOrigin) - parseInt(firstDigitDest)) <= 2) {
    return 'Regional';
  } else {
    return 'National';
  }
};

/**
 * Get service options based on zone
 * @param {string} zone 
 * @returns {Array} - Available service options
 */
const getServiceOptions = (zone) => {
  // Return empty array - actual service options should be fetched from database
  return [];
}; 