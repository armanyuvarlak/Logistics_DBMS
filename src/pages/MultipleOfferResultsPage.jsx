import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateOfferPdf } from '../firebase/pdfUtils';

const MultipleOfferResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from location state only
  const data = location.state;
  
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const selectedRoute = data?.routes?.[selectedRouteIndex] || data?.routes?.[0];
  
  // Go back to multiple offer page
  const handleBack = () => {
    navigate('/multiple-offer');
  };

  // Handle prepare offer button click
  const handlePrepareOffer = async () => {
    setIsGenerating(true);
    try {
      const offerData = {
        type: 'Multiple Offer',
        offerType: data.offerType,
        origin: selectedRoute.originZip || 'Not specified',
        destination: selectedRoute.destinationZip || 'Not specified',
        volumeRatio: data.volumeRatio,
        term: data.term,
        service: data.service,
        ranges: data.ranges,
        timestamp: new Date().toISOString()
      };
      
      const filename = `multiple-offer-${selectedRoute.originZip || 'unknown'}-${selectedRoute.destinationZip || 'unknown'}-${Date.now()}`;
      const result = await generateOfferPdf(offerData, filename, 'offers/multiple');
      
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
  };
  
  // Render table based on offer type
  const renderPricingTable = () => {
    const headerText = getPricingTableHeader();
    
    return (
      <div className="overflow-hidden rounded border border-gray-200 mb-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="px-4 py-2 bg-gray-50 text-gray-700 border-b text-sm font-medium">{headerText.min}</th>
              <th className="px-4 py-2 bg-gray-50 text-gray-700 border-b text-sm font-medium">{headerText.max}</th>
              <th className="px-4 py-2 bg-gray-50 text-gray-700 border-b text-sm font-medium">Price (€)</th>
            </tr>
          </thead>
          <tbody>
            {data?.ranges?.map((range) => (
              <tr key={range.id}>
                <td className="px-4 py-2 border-b text-center">{range.min} {headerText.unit}</td>
                <td className="px-4 py-2 border-b text-center">{range.max} {headerText.unit}</td>
                <td className="px-4 py-2 border-b text-center font-medium">{range.price} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Get header text based on offer type
  const getPricingTableHeader = () => {
    switch (data.offerType) {
      case 'Weight Range':
        return { min: 'Min Weight (kg)', max: 'Max Weight (kg)', unit: 'kg' };
      case 'LDM Amount':
        return { min: 'Min LDM', max: 'Max LDM', unit: 'ldm' };
      case 'CBM Amount':
        return { min: 'Min Volume (m³)', max: 'Max Volume (m³)', unit: 'm³' };
      case 'Euro Pallet':
        return { min: 'Min Pallets', max: 'Max Pallets', unit: 'pallets' };
      case 'Block Pallet':
        return { min: 'Min Pallets', max: 'Max Pallets', unit: 'pallets' };
      default:
        return { min: 'Min', max: 'Max', unit: '' };
    }
  };
  
  // Render route selector
  const renderRouteSelector = () => {
    if (data.routes.length <= 1) return null;
    
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Route
        </label>
        <select
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md"
          value={selectedRouteIndex}
          onChange={(e) => setSelectedRouteIndex(parseInt(e.target.value))}
        >
          {data.routes.map((route, index) => (
            <option key={route.id} value={index}>
              {route.originZip} → {route.destinationZip}
            </option>
          ))}
        </select>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Multiple Offer Results</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
          onClick={handleBack}
        >
          Back to Multiple Offer
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{data.offerType} Offer</h2>
        
        {/* Route Information */}
        {renderRouteSelector()}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Origin ZIP</h3>
            <p className="text-lg font-semibold">{selectedRoute.originZip}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Destination ZIP</h3>
            <p className="text-lg font-semibold">{selectedRoute.destinationZip}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Term</h3>
            <p className="text-lg font-semibold">{data.term}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Volume Ratio</h3>
            <p className="text-lg font-semibold">{data.volumeRatio}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Service</h3>
            <p className="text-lg font-semibold">{data.service}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Valid Until</h3>
            <p className="text-lg font-semibold">{
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
            }</p>
          </div>
        </div>
        
        <h3 className="text-md font-semibold mb-2 text-gray-800">Pricing Details</h3>
        {renderPricingTable()}
        
        <div className="flex justify-end mt-6">
          <button
            className="bg-[var(--primary-color)] text-white px-4 py-2 rounded hover:bg-[var(--primary-color-hover)] transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handlePrepareOffer}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Prepare Offer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultipleOfferResultsPage; 