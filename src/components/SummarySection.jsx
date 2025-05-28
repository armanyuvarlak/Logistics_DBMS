import React from 'react'

const SummarySection = ({ data }) => {
  // Check which calculation type was used
  const isQuickMode = data?.calculationType === 'quick';
  
  // For quick mode, use the directly entered chargeable weight
  const directChargeableWeight = data?.chargeableWeight || 0;
  
  // For detailed mode, calculate from rows
  const rows = data?.rows || [];
  
  // Calculate totals for detailed mode
  const totalPieces = rows.reduce((sum, row) => sum + (parseInt(row.pieces) || 0), 0);
  const totalGrossWeight = rows.reduce((sum, row) => sum + (parseFloat(row.weight) || 0), 0);
  const totalVolume = rows.reduce((sum, row) => sum + (parseFloat(row.volume) || 0), 0);
  
  // Use the pre-calculated LDM amount if available, otherwise calculate it
  const ldmAmount = data?.totalLdm || (isQuickMode ? "N/A" : calculateLdm());
  
  // Function to calculate LDM if it's not provided from data
  function calculateLdm() {
    if (isQuickMode) return "N/A";
    
    let totalLdm = 0;
    rows.forEach(row => {
      if (row.width && row.length && row.pieces) {
        const width = parseFloat(row.width) / 100;  // Convert cm to meters
        const length = parseFloat(row.length) / 100; // Convert cm to meters
        const pieces = parseInt(row.pieces);
        totalLdm += (width * length * pieces) / 2.4;
      }
    });
    
    return totalLdm > 0 ? totalLdm.toFixed(2) : "0";
  }
  
  // CBM amount is directly the volume in cubic meters
  const cbmAmount = isQuickMode ? "N/A" : totalVolume.toFixed(2);
  
  // Use lane pair from data or empty string if not available
  const lanePairValue = data?.lanePair || "";
  
  // Create summary rows based on calculation type
  const summaryRows = isQuickMode 
    ? [
        {
          volumeRatio: "1:3",
          pieces: "-",
          grossWeight: "-",
          volumeWeight: "-",
          chargeableWeight: directChargeableWeight,
          denseVolumetric: "-",
          densityRatio: "-"
        },
        {
          volumeRatio: "1:6",
          pieces: "-",
          grossWeight: "-",
          volumeWeight: "-",
          chargeableWeight: directChargeableWeight,
          denseVolumetric: "-",
          densityRatio: "-"
        }
      ]
    : [
        {
          volumeRatio: "1:3",
          pieces: totalPieces,
          grossWeight: totalGrossWeight,
          volumeWeight: totalVolume * 333, // Volume weight with 1:3 ratio (333 kg/m³)
          chargeableWeight: Math.max(totalGrossWeight, totalVolume * 333),
          denseVolumetric: totalGrossWeight > totalVolume * 333 ? "Dense" : "Volumetric",
          densityRatio: totalGrossWeight > 0 ? (totalGrossWeight / totalVolume).toFixed(2) : "N/A"
        },
        {
          volumeRatio: "1:6",
          pieces: totalPieces,
          grossWeight: totalGrossWeight,
          volumeWeight: totalVolume * 166.67, // Volume weight with 1:6 ratio (166.67 kg/m³)
          chargeableWeight: Math.max(totalGrossWeight, totalVolume * 166.67),
          denseVolumetric: totalGrossWeight > totalVolume * 166.67 ? "Dense" : "Volumetric",
          densityRatio: totalGrossWeight > 0 ? (totalGrossWeight / totalVolume).toFixed(2) : "N/A"
        }
      ];
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Summary</h2>
        {isQuickMode && (
          <div className="text-sm text-[var(--accent-color)] mt-1">
            Quick calculation based on directly entered chargeable weight
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="overflow-hidden rounded border border-gray-200">
          <table className="business-table">
            <thead>
              <tr>
                <th className="text-center">Lane Pair</th>
                <th className="text-center">Volume Ratio</th>
                <th className="text-center">Pieces</th>
                <th className="text-center">Gross Weight (kg)</th>
                <th className="text-center">Volume Weight (kg)</th>
                <th className="text-center">Chargeable Weight (kg)</th>
                <th className="text-center">Dense/Volumetric</th>
                <th className="text-center">Density Ratio</th>
                <th className="text-center relative group">
                  <span>LDM Amount</span>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 text-center">
                    Calculated as: width × length × pieces / 2.4
                  </span>
                </th>
                <th className="text-center">CBM Amount</th>
              </tr>
            </thead>
            <tbody>
              {!rows.length && !isQuickMode ? (
                <tr>
                  <td colSpan={10} className="text-center">No data available</td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td className="font-medium text-center" rowSpan={2}>{lanePairValue}</td>
                    <td className="text-center font-medium flex justify-center items-center h-full">
                      <span className="inline-block">{summaryRows[0].volumeRatio}</span>
                    </td>
                    <td className="text-center">{summaryRows[0].pieces}</td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[0].grossWeight.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[0].volumeWeight.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? directChargeableWeight : summaryRows[0].chargeableWeight.toFixed(2)}
                    </td>
                    <td className="text-center">{summaryRows[0].denseVolumetric}</td>
                    <td className="text-center">{summaryRows[0].densityRatio}</td>
                    <td className="text-center font-bold" rowSpan={2}>{ldmAmount}</td>
                    <td className="text-center" rowSpan={2}>{cbmAmount}</td>
                  </tr>
                  <tr>
                    <td className="text-center font-medium flex justify-center items-center h-full">
                      <span className="inline-block">{summaryRows[1].volumeRatio}</span>
                    </td>
                    <td className="text-center">{summaryRows[1].pieces}</td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[1].grossWeight.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[1].volumeWeight.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? directChargeableWeight : summaryRows[1].chargeableWeight.toFixed(2)}
                    </td>
                    <td className="text-center">{summaryRows[1].denseVolumetric}</td>
                    <td className="text-center">{summaryRows[1].densityRatio}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SummarySection 