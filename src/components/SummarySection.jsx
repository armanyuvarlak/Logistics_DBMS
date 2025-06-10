import React, { useState, useEffect } from 'react'
import { getZipCodeData } from '../firebase/firebaseUtils'
import { calculateShipping } from '../services/calculatorService'

const SummarySection = ({ data }) => {
  const [zipCodeData, setZipCodeData] = useState([]);

  // Function to get branch name from zip code
  const getBranchFromZipCode = (zipCode) => {
    if (!zipCode || !zipCodeData.length) return zipCode || 'N/A';
    
    const zipData = zipCodeData.find(zipData => zipData.zipCode === zipCode);
    return zipData ? zipData.branchName : zipCode;
  };

  // Fetch zip code data on component mount
  useEffect(() => {
    const fetchZipCodes = async () => {
      try {
        const result = await getZipCodeData();
        if (result.success && result.data) {
          setZipCodeData(Array.isArray(result.data) ? result.data : [result.data]);
        }
      } catch (error) {
        console.error('Error fetching zip codes:', error);
      }
    };

    fetchZipCodes();
  }, []);

  // Check which calculation type was used
  const isQuickMode = data?.calculationType === 'quick' || data?.calculationType === 'single-quick';
  
  // For quick mode, use the directly entered chargeable weight
  const directChargeableWeight = data?.chargeableWeight || 0;
  
  // For detailed mode, calculate from rows using the new service
  const rows = data?.rows || [];
  
  let calculations = null;
  let summaryRows = [];
  
  if (isQuickMode) {
    // Quick mode - use directly entered chargeable weight
    summaryRows = [
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
    ];
  } else if (rows.length > 0) {
    // Detailed mode - use the new calculation service
    try {
      calculations = calculateShipping(rows, data?.originZip, data?.destinationZip);
      
      summaryRows = [
        {
          volumeRatio: "1:3",
          pieces: calculations.summary.totalPieces,
          grossWeight: parseFloat(calculations.summary.totalGrossWeight),
          volumeWeight: parseFloat(calculations.summary.ratios['1:3'].volumeWeight),
          chargeableWeight: parseFloat(calculations.summary.ratios['1:3'].chargeableWeight),
          denseVolumetric: calculations.summary.ratios['1:3'].denseOrVolumetric,
          densityRatio: calculations.summary.ratios['1:3'].densityRatio
        },
        {
          volumeRatio: "1:6",
          pieces: calculations.summary.totalPieces,
          grossWeight: parseFloat(calculations.summary.totalGrossWeight),
          volumeWeight: parseFloat(calculations.summary.ratios['1:6'].volumeWeight),
          chargeableWeight: parseFloat(calculations.summary.ratios['1:6'].chargeableWeight),
          denseVolumetric: calculations.summary.ratios['1:6'].denseOrVolumetric,
          densityRatio: calculations.summary.ratios['1:6'].densityRatio
        }
      ];
    } catch (error) {
      console.error('Calculation error:', error);
      summaryRows = [
        {
          volumeRatio: "1:3",
          pieces: 0,
          grossWeight: 0,
          volumeWeight: 0,
          chargeableWeight: 0,
          denseVolumetric: "-",
          densityRatio: "-"
        },
        {
          volumeRatio: "1:6",
          pieces: 0,
          grossWeight: 0,
          volumeWeight: 0,
          chargeableWeight: 0,
          denseVolumetric: "-",
          densityRatio: "-"
        }
      ];
    }
  }
  
  // Get LDM and CBM amounts from calculations
  const ldmAmount = isQuickMode ? "N/A" : (calculations?.summary.totalLdm || "0");
  const cbmAmount = isQuickMode ? "N/A" : (calculations?.summary.totalCbm || "0");
  
  // Create lane pair display using branch names vertically stacked
  const originBranch = getBranchFromZipCode(data?.originZip);
  const destinationBranch = getBranchFromZipCode(data?.destinationZip);
  const lanePairDisplay = (data?.originZip || data?.destinationZip) 
    ? (
        <div className="text-center">
          <div className="font-medium">{originBranch}</div>
          <div className="font-medium">{destinationBranch}</div>
        </div>
      )
    : (data?.lanePair || "");
  
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
                <th className="text-center relative group">
                  <span>Volume Weight (kg)</span>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-72 text-center">
                    Stackable: L×W×H×pieces / 3000 (1:3) or / 6000 (1:6)<br/>
                    Non-stackable: L×W×pieces×5.75/2.4 / 333 (1:3) or / 166.67 (1:6)
                  </span>
                </th>
                <th className="text-center">Chargeable Weight (kg)</th>
                <th className="text-center">Dense/Volumetric</th>
                <th className="text-center">Density Ratio</th>
                <th className="text-center relative group">
                  <span>LDM Amount</span>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 text-center">
                    Calculated as: width × length × pieces / 2.4
                  </span>
                </th>
                <th className="text-center relative group">
                  <span>CBM Amount</span>
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-64 text-center">
                    Stackable: L×W×H×pieces (in m³)<br/>
                    Non-stackable: L×W×pieces×5.75/2.4 (in m²)
                  </span>
                </th>
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
                    <td className="font-medium text-center" rowSpan={2}>{lanePairDisplay}</td>
                    <td className="text-center font-medium flex justify-center items-center h-full">
                      <span className="inline-block">{summaryRows[0]?.volumeRatio}</span>
                    </td>
                    <td className="text-center">{summaryRows[0]?.pieces}</td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[0]?.grossWeight?.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[0]?.volumeWeight?.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? directChargeableWeight : summaryRows[0]?.chargeableWeight?.toFixed(2)}
                    </td>
                    <td className="text-center">{summaryRows[0]?.denseVolumetric}</td>
                    <td className="text-center">{summaryRows[0]?.densityRatio}</td>
                    <td className="text-center font-bold" rowSpan={2}>{ldmAmount}</td>
                    <td className="text-center" rowSpan={2}>{cbmAmount}</td>
                  </tr>
                  <tr>
                    <td className="text-center font-medium flex justify-center items-center h-full">
                      <span className="inline-block">{summaryRows[1]?.volumeRatio}</span>
                    </td>
                    <td className="text-center">{summaryRows[1]?.pieces}</td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[1]?.grossWeight?.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? "-" : summaryRows[1]?.volumeWeight?.toFixed(2)}
                    </td>
                    <td className="text-center">
                      {isQuickMode ? directChargeableWeight : summaryRows[1]?.chargeableWeight?.toFixed(2)}
                    </td>
                    <td className="text-center">{summaryRows[1]?.denseVolumetric}</td>
                    <td className="text-center">{summaryRows[1]?.densityRatio}</td>
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