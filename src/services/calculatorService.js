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
  let totalChargeableWeight13 = 0; // Accumulated chargeable weight for 1:3 ratio
  let totalChargeableWeight16 = 0; // Accumulated chargeable weight for 1:6 ratio
  let totalCbm = 0;
  let totalLdm = 0;

  rows.forEach(row => {
    // Skip invalid rows - require pieces, length, width to be greater than 0
    const pieces = parseInt(row.pieces, 10) || 0;
    const length = parseFloat(row.length) || 0; // Keep in cm for calculations
    const width = parseFloat(row.width) || 0;   // Keep in cm for calculations
    const height = parseFloat(row.height) || 0; // Keep in cm for calculations
    const weight = parseFloat(row.weight) || 0; // Weight per piece in kg
    
    // Skip rows with zero or invalid values for required fields
    if (pieces <= 0 || length <= 0 || width <= 0 || height <= 0) {
      return;
    }
    
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

    // 2. CBM Amount calculation (height is required and > 0)
    // width x length x height x pieces (convert cm to m³)
    const cbm = (width / 100) * (length / 100) * (height / 100) * pieces;

    // 3. Volume weight calculation (height is required and > 0)
    let volumeWeight13 = 0; // For 1:3 ratio
    let volumeWeight16 = 0; // For 1:6 ratio
    
    // Calculate volume weight using actual height (height is already validated to be > 0)
    const volumeInCm3 = width * length * height * pieces;
    volumeWeight13 = volumeInCm3 / 3000; // 1:3 ratio
    volumeWeight16 = volumeInCm3 / 6000; // 1:6 ratio

    // Calculate chargeable weight for this row and double if non-stackable
    const rowGrossWeight = weight * pieces;
    let rowChargeableWeight13 = Math.max(rowGrossWeight, volumeWeight13);
    let rowChargeableWeight16 = Math.max(rowGrossWeight, volumeWeight16);
    
    if (!isStackable) {
      rowChargeableWeight13 = rowChargeableWeight13 * 2;
      rowChargeableWeight16 = rowChargeableWeight16 * 2;
    }

    // Accumulate totals
    totalPieces += pieces;
    totalGrossWeight += rowGrossWeight;
    totalVolumeWeight13 += volumeWeight13;
    totalVolumeWeight16 += volumeWeight16;
    totalChargeableWeight13 += rowChargeableWeight13;
    totalChargeableWeight16 += rowChargeableWeight16;
    totalCbm += cbm;
    totalLdm += ldm;
  });

  // 4. Use accumulated chargeable weights (already includes non-stackable doubling per row)
  let chargeableWeight13 = totalChargeableWeight13;
  let chargeableWeight16 = totalChargeableWeight16;

  // 6. Dense/Volumetric determination (before doubling)
  const isDense13 = totalGrossWeight >= totalVolumeWeight13;
  const isDense16 = totalGrossWeight >= totalVolumeWeight16;

  // 7. Density ratio = gross weight / CBM volume
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
  const pieces = parseInt(row.pieces, 10) || 0;
  const length = parseFloat(row.length) || 0;
  const width = parseFloat(row.width) || 0;
  const height = parseFloat(row.height) || 0;

  // Return zero metrics if required fields are zero or invalid
  if (pieces <= 0 || length <= 0 || width <= 0 || height <= 0) {
    return {
      ldm: 0,
      cbm: 0,
      volumeWeight13: 0,
      volumeWeight16: 0,
      volume: 0
    };
  }
  
  // Determine if stackable
  let isStackable = false;
  if (typeof row.stackable === 'boolean') {
    isStackable = row.stackable;
  } else if (typeof row.stackable === 'string') {
    isStackable = row.stackable.toLowerCase() === 'yes' || row.stackable === 'true';
  }

  // LDM calculation
  const ldm = (width / 100) * (length / 100) * pieces / 2.4;

  // CBM calculation (height is required and > 0)
  const cbm = (width / 100) * (length / 100) * (height / 100) * pieces;
  const volume = cbm; // Volume in m³ for display

  // Volume weight calculations (height is required and > 0)
  const volumeInCm3 = width * length * height * pieces;
  const volumeWeight13 = volumeInCm3 / 3000;
  const volumeWeight16 = volumeInCm3 / 6000;

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