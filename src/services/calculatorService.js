/**
 * Service to handle shipping calculations with corrected formulas
 */

/**
 * Calculate shipping metrics based on input data
 * @param {Array} rows - Array of row data objects
 * @param {string} originZip - Origin ZIP code
 * @param {string} destinationZip - Destination ZIP code
 * @param {string} volumeRatio - Volume ratio ('1:3' or '1:6')
 * @returns {Object} - Calculated results
 */
export const calculateShipping = (rows, originZip, destinationZip, volumeRatio = '1:3') => {
  // Input validation
  if (!rows || rows.length === 0) {
    throw new Error('Missing required row data');
  }

  // Perform calculations
  let totalPieces = 0;
  let totalGrossWeight = 0;
  let totalVolumeWeight13 = 0; // Volume weight for 1:3 ratio
  let totalVolumeWeight16 = 0; // Volume weight for 1:6 ratio
  let totalCbm = 0;
  let totalLdm = 0;

  rows.forEach(row => {
    // Skip invalid rows - only require pieces, length, width for basic calculations
    if (!row.pieces || !row.length || !row.width) {
      return;
    }

    const pieces = parseInt(row.pieces, 10) || 0;
    const length = parseFloat(row.length) || 0; // Keep in cm for calculations
    const width = parseFloat(row.width) || 0;   // Keep in cm for calculations
    const height = parseFloat(row.height) || 0; // Keep in cm for calculations
    const weight = parseFloat(row.weight) || 0; // Weight per piece in kg
    
    // Determine if stackable (handle both boolean and string formats)
    let isStackable = false;
    if (typeof row.stackable === 'boolean') {
      isStackable = row.stackable;
    } else if (typeof row.stackable === 'string') {
      isStackable = row.stackable.toLowerCase() === 'yes' || row.stackable === 'true';
    }

    // 1. LDM Amount = width x length x pieces / 2.4
    // Convert cm to meters for LDM calculation
    const ldm = (width / 100) * (length / 100) * pieces / 2.4;

    // 2. CBM Amount calculation
    let cbm = 0;
    if (isStackable && height > 0) {
      // If stackable: width x length x height x pieces (convert cm to m³)
      cbm = (width / 100) * (length / 100) * (height / 100) * pieces;
    } else {
      // If not stackable: width x length x pieces x 5.75 / 2.4 (convert cm to m²)
      cbm = (width / 100) * (length / 100) * pieces * 5.75 / 2.4;
    }

    // 3. Volume weight calculation
    let volumeWeight13 = 0; // For 1:3 ratio
    let volumeWeight16 = 0; // For 1:6 ratio
    
    if (isStackable && height > 0) {
      // If stackable: width x length x height x pieces / 3000 or 6000
      const volumeInCm3 = width * length * height * pieces;
      volumeWeight13 = volumeInCm3 / 3000; // 1:3 ratio
      volumeWeight16 = volumeInCm3 / 6000; // 1:6 ratio
    } else {
      // If not stackable: width x length x pieces x 5.75 / 2.4 / 333 or 166.67
      const baseValue = (width / 100) * (length / 100) * pieces * 5.75 / 2.4;
      volumeWeight13 = baseValue / 333;     // 1:3 ratio
      volumeWeight16 = baseValue / 166.67;  // 1:6 ratio
    }

    // Accumulate totals
    totalPieces += pieces;
    totalGrossWeight += weight * pieces; // Total weight for all pieces
    totalVolumeWeight13 += volumeWeight13;
    totalVolumeWeight16 += volumeWeight16;
    totalCbm += cbm;
    totalLdm += ldm;
  });

  // 4. Chargeable weight = max(gross weight, volume weight)
  const chargeableWeight13 = Math.max(totalGrossWeight, totalVolumeWeight13);
  const chargeableWeight16 = Math.max(totalGrossWeight, totalVolumeWeight16);

  // 5. Dense/Volumetric determination
  const isDense13 = totalGrossWeight >= totalVolumeWeight13;
  const isDense16 = totalGrossWeight >= totalVolumeWeight16;

  // 6. Density ratio = gross weight / CBM volume
  const densityRatio = totalCbm > 0 ? totalGrossWeight / totalCbm : 0;

  // Calculate zone if zip codes provided
  const zone = (originZip && destinationZip) ? calculateZone(originZip, destinationZip) : null;
  const serviceOptions = zone ? getServiceOptions(zone) : [];

  return {
    summary: {
      totalPieces,
      totalGrossWeight: totalGrossWeight.toFixed(2),
      totalLdm: totalLdm.toFixed(2),
      totalCbm: totalCbm.toFixed(2),
      ratios: {
        '1:3': {
          volumeWeight: totalVolumeWeight13.toFixed(2),
          chargeableWeight: chargeableWeight13.toFixed(2),
          denseOrVolumetric: isDense13 ? 'Dense' : 'Volumetric',
          densityRatio: densityRatio.toFixed(2)
        },
        '1:6': {
          volumeWeight: totalVolumeWeight16.toFixed(2),
          chargeableWeight: chargeableWeight16.toFixed(2),
          denseOrVolumetric: isDense16 ? 'Dense' : 'Volumetric',
          densityRatio: densityRatio.toFixed(2)
        }
      }
    },
    results: {
      zone,
      serviceOptions
    }
  };
};

/**
 * Calculate individual row metrics for display purposes
 * @param {Object} row - Single row data
 * @returns {Object} - Row calculations
 */
export const calculateRowMetrics = (row) => {
  if (!row.pieces || !row.length || !row.width) {
    return {
      ldm: 0,
      cbm: 0,
      volumeWeight13: 0,
      volumeWeight16: 0,
      volume: 0
    };
  }

  const pieces = parseInt(row.pieces, 10) || 0;
  const length = parseFloat(row.length) || 0;
  const width = parseFloat(row.width) || 0;
  const height = parseFloat(row.height) || 0;
  
  // Determine if stackable
  let isStackable = false;
  if (typeof row.stackable === 'boolean') {
    isStackable = row.stackable;
  } else if (typeof row.stackable === 'string') {
    isStackable = row.stackable.toLowerCase() === 'yes' || row.stackable === 'true';
  }

  // LDM calculation
  const ldm = (width / 100) * (length / 100) * pieces / 2.4;

  // CBM calculation
  let cbm = 0;
  let volume = 0; // Volume in m³ for display
  
  if (isStackable && height > 0) {
    cbm = (width / 100) * (length / 100) * (height / 100) * pieces;
    volume = cbm; // Same for stackable items
  } else {
    cbm = (width / 100) * (length / 100) * pieces * 5.75 / 2.4;
    volume = cbm; // Use the calculated CBM as volume
  }

  // Volume weight calculations
  let volumeWeight13 = 0;
  let volumeWeight16 = 0;
  
  if (isStackable && height > 0) {
    const volumeInCm3 = width * length * height * pieces;
    volumeWeight13 = volumeInCm3 / 3000;
    volumeWeight16 = volumeInCm3 / 6000;
  } else {
    const baseValue = (width / 100) * (length / 100) * pieces * 5.75 / 2.4;
    volumeWeight13 = baseValue / 333;
    volumeWeight16 = baseValue / 166.67;
  }

  return {
    ldm: ldm.toFixed(2),
    cbm: cbm.toFixed(2),
    volume: volume.toFixed(2),
    volumeWeight13: volumeWeight13.toFixed(2),
    volumeWeight16: volumeWeight16.toFixed(2)
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