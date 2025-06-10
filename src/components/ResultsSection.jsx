import React, { useState, useEffect } from 'react'
import { generateOfferPdf } from '../firebase/pdfUtils'
import { useLocation, useNavigate } from 'react-router-dom'
import { getZipCodeData, getLanePairData } from '../firebase/firebaseUtils'
import { calculatePricing, formatCurrency } from '../services/pricingService'
import { calculateShipping } from '../services/calculatorService'

const ResultsSection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { rows, calculationType, chargeableWeight, totalLdm, originZip, destinationZip } = location.state || {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [zipCodeData, setZipCodeData] = useState([]);
  const [ftlFee, setFtlFee] = useState(0);
  const [calculations, setCalculations] = useState(null);
  
  // Pricing states for both options
  const [option1Pricing, setOption1Pricing] = useState(null);
  const [option2Pricing, setOption2Pricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // State for dropdown values - moved to top to avoid initialization errors
  const [option1Branch, setOption1Branch] = useState('')
  const [option1Term, setOption1Term] = useState('P2P')
  const [option1VolumeRatio, setOption1VolumeRatio] = useState('1:3')
  const [option1SelectedTerm, setOption1SelectedTerm] = useState('Express')
  
  const [option2Branch, setOption2Branch] = useState('')
  const [option2Term, setOption2Term] = useState('P2P')
  const [option2VolumeRatio, setOption2VolumeRatio] = useState('1:6')
  const [option2SelectedTerm, setOption2SelectedTerm] = useState('Express')

  // Function to get branch name from zip code
  const getBranchFromZipCode = (zipCode) => {
    if (!zipCode || !zipCodeData.length) return zipCode || 'N/A';
    
    const zipData = zipCodeData.find(data => data.zipCode === zipCode);
    return zipData ? zipData.branchName : zipCode;
  };

  // Function to get zone from zip code
  const getZoneFromZipCode = (zipCode) => {
    if (!zipCode || !zipCodeData.length) return 'N/A';
    
    const zipData = zipCodeData.find(data => data.zipCode === zipCode);
    return zipData ? zipData.zone : 'N/A';
  };

  // Function to get chargeable weight based on volume ratio
  const getChargeableWeightForRatio = (volumeRatio) => {
    if (calculationType === 'quick' || calculationType === 'single-quick') {
      return chargeableWeight || 0;
    }
    
    if (calculations && calculations.summary && calculations.summary.ratios) {
      const ratio = volumeRatio === '1:3' ? '1:3' : '1:6';
      return parseFloat(calculations.summary.ratios[ratio].chargeableWeight) || 0;
    }
    
    return chargeableWeight || 0;
  };

  // Function to fetch FTL fee from lane pair data
  const fetchFtlFee = async () => {
    try {
      if (!originZip || !destinationZip || !zipCodeData.length) return;

      const originBranch = getBranchFromZipCode(originZip);
      const destinationBranch = getBranchFromZipCode(destinationZip);

      if (!originBranch || !destinationBranch) return;

      const lanePairResult = await getLanePairData();
      if (lanePairResult.success && lanePairResult.data) {
        const lanePairData = Array.isArray(lanePairResult.data) ? lanePairResult.data : [lanePairResult.data];
        
        // Find the lane pair (either direction)
        const lanePair = lanePairData.find(pair => 
          (pair.originBranch === originBranch && pair.destinationBranch === destinationBranch) ||
          (pair.originBranch === destinationBranch && pair.destinationBranch === originBranch)
        );

        if (lanePair && lanePair.ftlFee) {
          setFtlFee(lanePair.ftlFee);
        }
      }
    } catch (error) {
      console.error('Error fetching FTL fee:', error);
    }
  };

  // Calculate pricing for options when dependencies change
  const calculatePricingForOptions = async () => {
    if (!originZip || !destinationZip) return;
    
    setPricingLoading(true);
    try {
      // Get chargeable weights for both ratios
      const chargeableWeight13 = getChargeableWeightForRatio('1:3');
      const chargeableWeight16 = getChargeableWeightForRatio('1:6');
      
      console.log('Calculating pricing with weights:', { chargeableWeight13, chargeableWeight16 });
      
      // Calculate pricing for Option 1 (1:3 ratio)
      const option1Result = await calculatePricing(
        chargeableWeight13,
        originZip,
        destinationZip,
        option1Term,
        option1SelectedTerm,
        '1:3'
      );
      setOption1Pricing(option1Result);
      
      // Calculate pricing for Option 2 (1:6 ratio)
      const option2Result = await calculatePricing(
        chargeableWeight16,
        originZip,
        destinationZip,
        option2Term,
        option2SelectedTerm,
        '1:6'
      );
      setOption2Pricing(option2Result);
      
    } catch (error) {
      console.error('Error calculating pricing:', error);
    } finally {
      setPricingLoading(false);
    }
  };

  // Calculate shipping data for detailed mode
  useEffect(() => {
    if (rows && rows.length > 0 && (calculationType === 'detailed' || calculationType === 'single')) {
      try {
        const calculationResults = calculateShipping(rows, originZip, destinationZip);
        setCalculations(calculationResults);
      } catch (error) {
        console.error('Error calculating shipping data:', error);
      }
    }
  }, [rows, originZip, destinationZip, calculationType]);

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

  // Fetch FTL fee when zip code data is loaded
  useEffect(() => {
    if (zipCodeData.length > 0) {
      fetchFtlFee();
    }
  }, [zipCodeData, originZip, destinationZip]);

  // Recalculate pricing when relevant states change
  useEffect(() => {
    if (zipCodeData.length > 0 && (calculations || calculationType === 'quick' || calculationType === 'single-quick')) {
      calculatePricingForOptions();
    }
  }, [zipCodeData, calculations, option1Term, option1SelectedTerm, option1VolumeRatio, option2Term, option2SelectedTerm, option2VolumeRatio]);

  // Function to determine service text based on service type and row index
  const getServiceText = (index, term) => {
    if (index === 2) return ''; // Third row is always empty
    if (term.startsWith('D') && index === 0) return 'Pick Up';
    if (term.endsWith('D') && index === 1) return 'Delivery';
    return '';
  };
  

  
  // Handler for prepare offer buttons
  const handlePrepareOffer = async (option) => {
    setIsGenerating(true);
    try {
      const branch = option === 1 ? option1Branch : option2Branch;
      const term = option === 1 ? option1Term : option2Term;
      const volumeRatio = option === 1 ? option1VolumeRatio : option2VolumeRatio;
      const pricing = option === 1 ? option1Pricing : option2Pricing;
      
      const offerData = {
        type: calculationType === 'single-quick' ? 'Single Offer (Quick)' : 'Single Offer',
        option: option,
        origin: originZip || 'Not specified',
        destination: destinationZip || 'Not specified',
        branch: branch,
        volumeRatio: volumeRatio,
        term: term,
        service: term, // Using term as the service type now
        chargeableWeight: pricing?.breakdown?.chargeableWeight || chargeableWeight,
        rows: rows,
        ftlValue: `€${ftlFee.toFixed(2)}`,
        pricing: pricing?.breakdown,
        timestamp: new Date().toISOString()
      };
      
      const filename = `single-offer-${originZip || 'unknown'}-${destinationZip || 'unknown'}-option${option}-${Date.now()}`;
      const result = await generateOfferPdf(offerData, filename, 'offers/single');
      
      if (result.success) {
        alert(`PDF Generated Successfully! It will open in a new tab.`);
        window.open(result.downloadUrl, '_blank');
      } else {
        alert('Failed to generate PDF. Please try again.');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      alert(`Error generating PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add CSS to remove spinner buttons from number inputs */}
      <style jsx="true">{`
        /* Remove number input spinners for Webkit browsers (Chrome, Safari, Edge) */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        /* Remove number input spinners for Firefox */
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
      
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title">
                {calculationType === 'single-quick' ? 'Calculation Results (Quick Entry)' : 'Calculation Results'}
              </h2>
              {calculationType === 'single-quick' && (
                <p className="text-sm text-gray-600 mt-1">Calculation based on chargeable weight: {chargeableWeight} kg</p>
              )}
              
              {/* Display branch names from zip codes - bigger and more prominent */}
              {(originZip || destinationZip) && (
                <div className="mt-4 mb-2 text-center bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-lg font-bold text-blue-800 mb-1">Lane Pair</div>
                  <div className="text-xl font-semibold text-blue-900">
                    {getBranchFromZipCode(originZip)} → {getBranchFromZipCode(destinationZip)}
                  </div>
                </div>
              )}
            </div>
            
            {/* Back to Calculation button in header */}
            <button
              onClick={() => navigate('/offer/single-offer')}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Calculation
            </button>
          </div>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-[30px] justify-between w-full max-w-[1400px]">
            {/* First Result Table */}
            <div className="flex-1 basis-[45%] max-w-full">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-dark)] border-b pb-2">Option 1</h3>
              
              {/* Dropdowns Row */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-center"
                    value={option1SelectedTerm}
                    onChange={(e) => setOption1SelectedTerm(e.target.value)}
                  >
                    <option value="Express">Express</option>
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-center"
                    value={option1Term}
                    onChange={(e) => setOption1Term(e.target.value)}
                  >
                    <option value="P2P">Port to Port (P2P)</option>
                    <option value="P2D">Port to Door (P2D)</option>
                    <option value="D2P">Door to Port (D2P)</option>
                    <option value="D2D">Door to Door (D2D)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume Ratio</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-center"
                    value={option1VolumeRatio}
                    onChange={(e) => setOption1VolumeRatio(e.target.value)}
                  >
                    <option value="1:3">1:3</option>
                    <option value="1:6">1:6</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-hidden rounded border border-gray-200">
                <table className="business-table w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-center border border-gray-200 p-3">Branch</th>
                      <th className="text-center border border-gray-200 p-3">Zone</th>
                      <th className="text-center border border-gray-200 p-3">Term</th>
                      <th className="text-center border border-gray-200 p-3">Service</th>
                      <th className="text-center border border-gray-200 p-3">Euro in Total</th>
                      <th className="text-center border border-gray-200 p-3">Ftl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* First Row - Origin */}
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="text-center border border-gray-200 p-3">{getBranchFromZipCode(originZip)}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(originZip)}</td>
                      <td rowSpan="3" className="align-middle text-center font-bold bg-green-50 border border-gray-200 p-3">
                        <div className="flex justify-center items-center h-full">
                          <span className="inline-block text-lg font-medium text-green-700">{option1SelectedTerm}</span>
                        </div>
                      </td>
                      <td rowSpan="3" className="align-middle text-center font-bold bg-blue-50 border border-gray-200 p-3">
                        <div className="flex justify-center items-center h-full">
                          <span className="inline-block text-lg font-medium text-blue-700">{option1Term}</span>
                        </div>
                      </td>
                      <td className="text-center border border-gray-200 p-3 font-semibold">
                        {pricingLoading ? 'Calculating...' : (option1Pricing?.success ? formatCurrency(option1Pricing.breakdown.origin.totalCost) : '€0.00')}
                      </td>
                      <td rowSpan="3" className="align-middle text-center font-bold bg-gray-50 border border-gray-200 p-3">
                        <div className="flex justify-center items-center h-full">
                          <span className="inline-block text-lg">€{ftlFee.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                    {/* Second Row - Destination */}
                    <tr className="bg-gray-50 hover:bg-gray-100">
                      <td className="text-center border border-gray-200 p-3">{getBranchFromZipCode(destinationZip)}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(destinationZip)}</td>
                      <td className="text-center border border-gray-200 p-3 font-semibold">
                        {pricingLoading ? 'Calculating...' : (option1Pricing?.success ? formatCurrency(option1Pricing.breakdown.destination.totalCost) : '€0.00')}
                      </td>
                    </tr>
                    {/* Third Row - Total (including lane pair calculations) */}
                    <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                      <td colSpan="2" className="text-center border border-gray-200 p-3 font-bold text-gray-800">
                        TOTAL
                      </td>
                      <td className="text-center border border-gray-200 p-3 font-bold text-lg text-green-700">
                        {pricingLoading ? 'Calculating...' : (option1Pricing?.success ? formatCurrency(option1Pricing.breakdown.totalCost) : '€0.00')}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <button
                    className="bg-[var(--primary-color)] text-white px-4 py-2 rounded hover:bg-[var(--primary-color-hover)] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePrepareOffer(1)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Prepare Offer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Second Result Table */}
            <div className="flex-1 basis-[45%] max-w-full">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-dark)] border-b pb-2">Option 2</h3>
              
              {/* Dropdowns Row */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-center"
                    value={option2SelectedTerm}
                    onChange={(e) => setOption2SelectedTerm(e.target.value)}
                  >
                    <option value="Express">Express</option>
                    <option value="Economy">Economy</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-center"
                    value={option2Term}
                    onChange={(e) => setOption2Term(e.target.value)}
                  >
                    <option value="P2P">Port to Port (P2P)</option>
                    <option value="P2D">Port to Door (P2D)</option>
                    <option value="D2P">Door to Port (D2P)</option>
                    <option value="D2D">Door to Door (D2D)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume Ratio</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-center"
                    value={option2VolumeRatio}
                    onChange={(e) => setOption2VolumeRatio(e.target.value)}
                  >
                    <option value="1:3">1:3</option>
                    <option value="1:6">1:6</option>
                  </select>
                </div>
              </div>
              
              <div className="overflow-hidden rounded border border-gray-200">
                <table className="business-table w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-center border border-gray-200 p-3">Branch</th>
                      <th className="text-center border border-gray-200 p-3">Zone</th>
                      <th className="text-center border border-gray-200 p-3">Term</th>
                      <th className="text-center border border-gray-200 p-3">Service</th>
                      <th className="text-center border border-gray-200 p-3">Euro in Total</th>
                      <th className="text-center border border-gray-200 p-3">Ftl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* First Row - Origin */}
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="text-center border border-gray-200 p-3">{getBranchFromZipCode(originZip)}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(originZip)}</td>
                      <td rowSpan="3" className="align-middle text-center font-bold bg-green-50 border border-gray-200 p-3">
                        <div className="flex justify-center items-center h-full">
                          <span className="inline-block text-lg font-medium text-green-700">{option2SelectedTerm}</span>
                        </div>
                      </td>
                      <td rowSpan="3" className="align-middle text-center font-bold bg-blue-50 border border-gray-200 p-3">
                        <div className="flex justify-center items-center h-full">
                          <span className="inline-block text-lg font-medium text-blue-700">{option2Term}</span>
                        </div>
                      </td>
                      <td className="text-center border border-gray-200 p-3 font-semibold">
                        {pricingLoading ? 'Calculating...' : (option2Pricing?.success ? formatCurrency(option2Pricing.breakdown.origin.totalCost) : '€0.00')}
                      </td>
                      <td rowSpan="3" className="align-middle text-center font-bold bg-gray-50 border border-gray-200 p-3">
                        <div className="flex justify-center items-center h-full">
                          <span className="inline-block text-lg">€{ftlFee.toFixed(2)}</span>
                        </div>
                      </td>
                    </tr>
                    {/* Second Row - Destination */}
                    <tr className="bg-gray-50 hover:bg-gray-100">
                      <td className="text-center border border-gray-200 p-3">{getBranchFromZipCode(destinationZip)}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(destinationZip)}</td>
                      <td className="text-center border border-gray-200 p-3 font-semibold">
                        {pricingLoading ? 'Calculating...' : (option2Pricing?.success ? formatCurrency(option2Pricing.breakdown.destination.totalCost) : '€0.00')}
                      </td>
                    </tr>
                    {/* Third Row - Total (including lane pair calculations) */}
                    <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                      <td colSpan="2" className="text-center border border-gray-200 p-3 font-bold text-gray-800">
                        TOTAL
                      </td>
                      <td className="text-center border border-gray-200 p-3 font-bold text-lg text-green-700">
                        {pricingLoading ? 'Calculating...' : (option2Pricing?.success ? formatCurrency(option2Pricing.breakdown.totalCost) : '€0.00')}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                  <button
                    className="bg-[var(--primary-color)] text-white px-4 py-2 rounded hover:bg-[var(--primary-color-hover)] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handlePrepareOffer(2)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Prepare Offer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResultsSection 
