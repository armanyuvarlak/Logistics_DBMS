import React, { useState, useEffect } from 'react'

import { useLocation, useNavigate } from 'react-router-dom'
import { getZipCodeData, getLanePairData } from '../firebase/firebaseUtils'
import { calculatePricing, formatCurrency } from '../services/pricingService'
import { calculateShipping } from '../services/calculatorService'
import { generateOfferPDF } from '../utils/pdfGenerator'
import { saveOffer } from '../services/offerService'
import PDFPreview from './PDFPreview'

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
  const [option1Hub, setOption1Hub] = useState('')
  const [option1Term, setOption1Term] = useState('P2P')
  const [option1VolumeRatio, setOption1VolumeRatio] = useState('1:3')
  const [option1SelectedTerm, setOption1SelectedTerm] = useState('Express')
  
  const [option2Hub, setOption2Hub] = useState('')
  const [option2Term, setOption2Term] = useState('P2P')
  const [option2VolumeRatio, setOption2VolumeRatio] = useState('1:6')
  const [option2SelectedTerm, setOption2SelectedTerm] = useState('Express')

  // PDF preview states
  const [pdfPreview, setPdfPreview] = useState(null)
  const [currentPdfOption, setCurrentPdfOption] = useState(null)

  // Function to get hub name from zip code
  const getHubFromZipCode = (zipCode) => {
    if (!zipCode || !zipCodeData.length) return zipCode || 'N/A';
    
    const zipData = zipCodeData.find(data => data.zipCode === zipCode);
    return zipData ? (zipData.hubName || zipData.branchName) : zipCode;
  };

  // Function to get zone from zip code
  const getZoneFromZipCode = (zipCode) => {
    if (!zipCode || !zipCodeData.length) return 'N/A';
    
    const zipData = zipCodeData.find(data => data.zipCode === zipCode);
    return zipData ? zipData.zone : 'N/A';
  };

  // Function to get chargeable weight based on volume ratio
  const getChargeableWeightForRatio = (volumeRatio) => {
    // For detailed calculations, use the calculated chargeable weight for the specific ratio
    if (calculations && calculations.summary && calculations.summary.ratios) {
      const ratio = volumeRatio === '1:3' ? '1:3' : '1:6';
      return parseFloat(calculations.summary.ratios[ratio].chargeableWeight) || 0;
    }
    
    // For quick mode, both ratios use the same entered chargeable weight
    // Volume ratio dropdown is just for display/categorization, not pricing calculation
    return chargeableWeight || 0;
  };

  // Function to fetch FTL fee from lane pair data
  const fetchFtlFee = async () => {
    try {
      if (!originZip || !destinationZip || !zipCodeData.length) return;

      const originHub = getHubFromZipCode(originZip);
      const destinationHub = getHubFromZipCode(destinationZip);

      if (!originHub || !destinationHub) return;

      const lanePairResult = await getLanePairData();
      if (lanePairResult.success && lanePairResult.data) {
        const lanePairData = Array.isArray(lanePairResult.data) ? lanePairResult.data : [lanePairResult.data];
        
        // Find the lane pair (either direction)
        const lanePair = lanePairData.find(pair => 
          ((pair.originHub || pair.originBranch) === originHub && (pair.destinationHub || pair.destinationBranch) === destinationHub) ||
          ((pair.originHub || pair.originBranch) === destinationHub && (pair.destinationHub || pair.destinationBranch) === originHub)
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
      console.log('Calculating pricing for both options with their respective settings');
      
              // Calculate pricing for Option 1 using its selected volume ratio
        const option1Weight = getChargeableWeightForRatio(option1VolumeRatio);
        console.log('Option 1 - Volume Ratio:', option1VolumeRatio, 'Weight:', option1Weight, 'Service:', option1Term, 'Term:', option1SelectedTerm);
        const option1Result = await calculatePricing(
          option1Weight,
          originZip,
          destinationZip,
          option1Term,
          option1SelectedTerm,
          option1VolumeRatio
        );
        setOption1Pricing(option1Result);
        
        // Calculate pricing for Option 2 using its selected volume ratio
        const option2Weight = getChargeableWeightForRatio(option2VolumeRatio);
        console.log('Option 2 - Volume Ratio:', option2VolumeRatio, 'Weight:', option2Weight, 'Service:', option2Term, 'Term:', option2SelectedTerm);
        const option2Result = await calculatePricing(
          option2Weight,
          originZip,
          destinationZip,
          option2Term,
          option2SelectedTerm,
          option2VolumeRatio
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
    console.log('useEffect triggered - Dependencies changed:', {
      zipCodeDataLength: zipCodeData.length,
      calculationType,
      option1Term,
      option1SelectedTerm,
      option1VolumeRatio,
      option2Term,
      option2SelectedTerm,
      option2VolumeRatio
    });
    
    if (zipCodeData.length > 0 && (calculations || calculationType === 'quick' || calculationType === 'single-quick')) {
      console.log('Triggering calculatePricingForOptions...');
      calculatePricingForOptions();
    } else {
      console.log('Conditions not met for pricing calculation:', {
        hasZipCodeData: zipCodeData.length > 0,
        hasCalculations: !!calculations,
        calculationType
      });
    }
  }, [zipCodeData, calculations, option1Term, option1SelectedTerm, option1VolumeRatio, option2Term, option2SelectedTerm, option2VolumeRatio]);

  // Cleanup PDF URLs on component unmount
  useEffect(() => {
    return () => {
      if (pdfPreview && pdfPreview.cleanup) {
        pdfPreview.cleanup();
      }
    };
  }, [pdfPreview]);

  // Function to determine service text based on service type and row index
  const getServiceText = (index, term) => {
    if (index === 2) return ''; // Third row is always empty
    if (term.startsWith('D') && index === 0) return 'Pick Up';
    if (term.endsWith('D') && index === 1) return 'Delivery';
    return '';
  };

  // Function to generate route string (e.g., "ISTFRA")
  const getRouteString = () => {
    const originHub = getHubFromZipCode(originZip);
    const destinationHub = getHubFromZipCode(destinationZip);
    
    if (!originHub || !destinationHub || originHub === 'N/A' || destinationHub === 'N/A') {
      return 'ROUTE';
    }
    
    // Take first 3 characters of each hub name and combine
    const originCode = originHub.substring(0, 3).toUpperCase();
    const destinationCode = destinationHub.substring(0, 3).toUpperCase();
    
    return `${originCode}${destinationCode}`;
  };
  

  
  // Handler for prepare offer buttons
  const handlePrepareOffer = async (option) => {
    console.log('handlePrepareOffer called with option:', option);
    setIsGenerating(true);
    try {
      // Determine which option we're working with
      const pricing = option === 1 ? option1Pricing : option2Pricing;
      const term = option === 1 ? option1Term : option2Term;
      const selectedTerm = option === 1 ? option1SelectedTerm : option2SelectedTerm;
      const volumeRatio = option === 1 ? option1VolumeRatio : option2VolumeRatio;
      
      if (!pricing || !pricing.success) {
        alert('No pricing data available for this option. Please calculate pricing first.');
        return;
      }

      // Prepare offer data for PDF
      const offerData = {
        origin: originZip,
        destination: destinationZip,
        originZone: getZoneFromZipCode(originZip),
        destinationZone: getZoneFromZipCode(destinationZip),
        serviceType: term,
        selectedTerm: selectedTerm,
        volumeRatio: volumeRatio,
        chargeableWeight: getChargeableWeightForRatio(volumeRatio),
        ftlFee: ftlFee || 0,
        breakdown: pricing.breakdown,
        routeString: getRouteString(),
        packageDetails: rows || [] // Include package details for table
      };
      
      // Generate PDF
      console.log('Calling generateOfferPDF...');
      const pdfResult = await generateOfferPDF(option, offerData);
      console.log('PDF result:', pdfResult);
      
      if (pdfResult.success) {
        console.log('PDF generation successful, showing preview');
        // Show PDF preview
        setPdfPreview(pdfResult);
        setCurrentPdfOption(option);
      } else {
        console.log('PDF generation failed:', pdfResult.error);
        alert(`Error generating PDF: ${pdfResult.error}`);
      }
      
    } catch (error) {
      console.error('Offer preparation error:', error);
      alert(`Error preparing offer: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  // Close PDF preview
  const closePdfPreview = () => {
    if (pdfPreview && pdfPreview.cleanup) {
      pdfPreview.cleanup();
    }
    setPdfPreview(null);
    setCurrentPdfOption(null);
  }

  // Download PDF and automatically save as offer
  const downloadPdf = async (clientName) => {
    console.log('Downloading PDF for client:', clientName);
    try {
      // Regenerate PDF with client name
      const optionNumber = currentPdfOption;
      const pricing = optionNumber === 1 ? option1Pricing : option2Pricing;
      const term = optionNumber === 1 ? option1Term : option2Term;
      const selectedTerm = optionNumber === 1 ? option1SelectedTerm : option2SelectedTerm;
      const volumeRatio = optionNumber === 1 ? option1VolumeRatio : option2VolumeRatio;
      
      if (!pricing || !pricing.success) {
        alert('No pricing data available for this option');
        return;
      }
      
      // Prepare offer data for PDF
      const offerData = {
        origin: originZip,
        destination: destinationZip,
        originZone: getZoneFromZipCode(originZip),
        destinationZone: getZoneFromZipCode(destinationZip),
        serviceType: term,
        selectedTerm: selectedTerm,
        volumeRatio: volumeRatio,
        chargeableWeight: getChargeableWeightForRatio(volumeRatio),
        ftlFee: ftlFee || 0,
        breakdown: pricing.breakdown,
        routeString: getRouteString(),
        packageDetails: rows || [] // Include package details for table
      };
      
      // Generate PDF with client name
      const pdfResult = await generateOfferPDF(optionNumber, offerData, clientName);
      
      if (pdfResult.success) {
        // First, save the offer to get the ID
        const saveOfferData = {
          optionNumber,
          calculationType,
          origin: originZip,
          destination: destinationZip,
          originHub: getHubFromZipCode(originZip),
          destinationHub: getHubFromZipCode(destinationZip),
          serviceType: term,
          term: selectedTerm,
          volumeRatio,
          chargeableWeight: getChargeableWeightForRatio(volumeRatio),
          totalCost: pricing.breakdown.totalCost,
          ftlFee,
          breakdown: pricing.breakdown,
          rows: rows || [],
          routeString: getRouteString(),
          clientName: clientName // Add client name to offer data
        };

        // Save the offer to get the ID
        const saveResult = saveOffer(saveOfferData);
        
        if (saveResult.success) {
          // Create custom filename: ClientName-OfferID
          const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9]/g, '');
          const customFilename = `${sanitizedClientName}-${saveResult.offer.id}`;
          
          // Download PDF with custom filename
          if (pdfResult.downloadPDF) {
            pdfResult.downloadPDF(customFilename);
            alert(`PDF downloaded as "${customFilename}.pdf"!\n\nOffer ${saveResult.offer.id} has been added to Review Offers for client: ${clientName}`);
          } else {
            alert(`Offer ${saveResult.offer.id} saved successfully, but PDF download failed.`);
          }
          
          // Clean up the PDF blob
          if (pdfResult.cleanup) {
            setTimeout(() => pdfResult.cleanup(), 1000);
          }
        } else {
          // If save fails, still allow PDF download with original name
          if (pdfResult.downloadPDF) {
            pdfResult.downloadPDF();
            alert(`PDF downloaded successfully!\n\nNote: Could not automatically save to Review Offers: ${saveResult.error}`);
          }
          
          // Clean up the PDF blob
          if (pdfResult.cleanup) {
            setTimeout(() => pdfResult.cleanup(), 1000);
          }
        }
        
        // Close the PDF preview
        closePdfPreview();
      } else {
        alert('Error generating PDF for download');
      }
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Error downloading PDF: ${error.message}`);
    }
  }

  // Add as offer function
  const handleAddAsOffer = async (clientName) => {
    try {
      // Determine which option we're working with
      const optionNumber = currentPdfOption;
      const pricing = optionNumber === 1 ? option1Pricing : option2Pricing;
      const term = optionNumber === 1 ? option1Term : option2Term;
      const selectedTerm = optionNumber === 1 ? option1SelectedTerm : option2SelectedTerm;
      const volumeRatio = optionNumber === 1 ? option1VolumeRatio : option2VolumeRatio;
      
      if (!pricing || !pricing.success) {
        alert('No pricing data available for this option');
        return;
      }

      // Create offer data object
      const offerData = {
        optionNumber,
        calculationType,
        origin: originZip,
        destination: destinationZip,
        originHub: getHubFromZipCode(originZip),
        destinationHub: getHubFromZipCode(destinationZip),
        serviceType: term,
        term: selectedTerm,
        volumeRatio,
        chargeableWeight: getChargeableWeightForRatio(volumeRatio),
        totalCost: pricing.breakdown.totalCost,
        ftlFee,
        breakdown: pricing.breakdown,
        rows: rows || [],
        routeString: getRouteString(),
        clientName: clientName // Add client name to offer data
      };

      // Save the offer
      const result = saveOffer(offerData);
      
      if (result.success) {
        alert(`Offer ${result.offer.id} has been successfully added to Review Offers for client: ${clientName}!`);
        // Close the PDF preview
        closePdfPreview();
      } else {
        alert(`Failed to save offer: ${result.error}`);
      }
      
    } catch (error) {
      console.error('Error adding offer:', error);
      alert(`Error adding offer: ${error.message}`);
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
          <div className="grid grid-cols-2 gap-8 w-full max-w-[1400px]">
            {/* First Result Table */}
            <div className="p-6 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-blue-800 border-b-2 border-blue-300 pb-2 bg-blue-100 -mx-6 -mt-6 mb-6 px-6 pt-4 rounded-t-lg">
                <span className="inline-flex items-center">
                  <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-2">1</span>
                  Option 1
                </span>
              </h3>
              
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
                    onChange={(e) => {
                      console.log('Option 1 Service changed to:', e.target.value);
                      setOption1Term(e.target.value);
                    }}
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
                    onChange={(e) => {
                      console.log('Option 1 Volume Ratio changed to:', e.target.value);
                      setOption1VolumeRatio(e.target.value);
                    }}
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
                      <th className="text-center border border-gray-200 p-3">Euro in Total</th>
                      <th className="text-center border border-gray-200 p-3">Ftl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* First Row - Origin */}
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="text-center border border-gray-200 p-3">{originZip}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(originZip)}</td>
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
                      <td className="text-center border border-gray-200 p-3">{destinationZip}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(destinationZip)}</td>
                      <td className="text-center border border-gray-200 p-3 font-semibold">
                        {pricingLoading ? 'Calculating...' : (option1Pricing?.success ? formatCurrency(option1Pricing.breakdown.destination.totalCost) : '€0.00')}
                      </td>
                    </tr>
                    {/* Third Row - Total (including lane pair calculations) */}
                    <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                      <td colSpan="2" className="text-center border border-gray-200 p-3 font-bold text-gray-800">
                        {getRouteString()}
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
            <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-green-800 border-b-2 border-green-300 pb-2 bg-green-100 -mx-6 -mt-6 mb-6 px-6 pt-4 rounded-t-lg">
                <span className="inline-flex items-center">
                  <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-2">2</span>
                  Option 2
                </span>
              </h3>
              
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
                      <th className="text-center border border-gray-200 p-3">Euro in Total</th>
                      <th className="text-center border border-gray-200 p-3">Ftl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* First Row - Origin */}
                    <tr className="bg-white hover:bg-gray-50">
                      <td className="text-center border border-gray-200 p-3">{originZip}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(originZip)}</td>
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
                      <td className="text-center border border-gray-200 p-3">{destinationZip}</td>
                      <td className="text-center border border-gray-200 p-3">{getZoneFromZipCode(destinationZip)}</td>
                      <td className="text-center border border-gray-200 p-3 font-semibold">
                        {pricingLoading ? 'Calculating...' : (option2Pricing?.success ? formatCurrency(option2Pricing.breakdown.destination.totalCost) : '€0.00')}
                      </td>
                    </tr>
                    {/* Third Row - Total (including lane pair calculations) */}
                    <tr className="bg-yellow-50 border-t-2 border-yellow-400">
                      <td colSpan="2" className="text-center border border-gray-200 p-3 font-bold text-gray-800">
                        {getRouteString()}
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

      {/* PDF Preview Modal */}
      {pdfPreview && (
        <PDFPreview
          pdfUrl={pdfPreview.pdfUrl}
          onDownload={downloadPdf}
          onClose={closePdfPreview}
          onAddAsOffer={handleAddAsOffer}
          optionNumber={currentPdfOption}
        />
      )}
    </div>
  )
}

export default ResultsSection 
