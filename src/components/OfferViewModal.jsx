import React, { useState, useEffect } from 'react';
import { generateOfferPDF } from '../utils/pdfGenerator';

const OfferViewModal = ({ offer, onClose }) => {
  const [pdfData, setPdfData] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [allowUnnamed, setAllowUnnamed] = useState(false);

  // Generate PDF when component mounts
  useEffect(() => {
    if (offer) {
      generatePDF();
    }
    
    // Cleanup PDF URL on unmount
    return () => {
      if (pdfData && pdfData.cleanup) {
        pdfData.cleanup();
      }
    };
  }, [offer]);

  const generatePDF = async () => {
    setPdfLoading(true);
    try {
      // Prepare offer data for PDF
      const offerData = {
        origin: offer.origin,
        destination: offer.destination,
        originZone: offer.originZone || 'N/A',
        destinationZone: offer.destinationZone || 'N/A',
        serviceType: offer.serviceType,
        selectedTerm: offer.term,
        volumeRatio: offer.volumeRatio,
        chargeableWeight: offer.chargeableWeight,
        ftlFee: offer.ftlFee || 0,
        breakdown: offer.breakdown,
        routeString: offer.routeString || 'ROUTE'
      };
      
      const pdfResult = await generateOfferPDF(offer.optionNumber || 1, offerData);
      if (pdfResult.success) {
        setPdfData(pdfResult);
      } else {
        console.error('PDF generation failed:', pdfResult.error);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadPdf = () => {
    // Check if the offer already has a client name
    if (offer.clientName) {
      // Use existing client name
      if (pdfData && pdfData.downloadPDF) {
        console.log('Downloading PDF for existing client:', offer.clientName);
        pdfData.downloadPDF();
      }
    } else {
      // Show client name modal
      setShowClientModal(true);
    }
  };

  const handleClientModalClose = () => {
    setShowClientModal(false);
    setClientName('');
    setAllowUnnamed(false);
  };

  const handleClientModalConfirm = async () => {
    // Validate that either client name is provided or unnamed is allowed
    if (!clientName.trim() && !allowUnnamed) {
      alert('Please enter a client name or check "Allow unnamed client"');
      return;
    }

    const finalClientName = allowUnnamed && !clientName.trim() ? 'Unnamed Client' : clientName.trim();
    
    try {
      // Regenerate PDF with client name for download
      const offerData = {
        origin: offer.origin,
        destination: offer.destination,
        originZone: offer.originZone || 'N/A',
        destinationZone: offer.destinationZone || 'N/A',
        serviceType: offer.serviceType,
        selectedTerm: offer.term,
        volumeRatio: offer.volumeRatio,
        chargeableWeight: offer.chargeableWeight,
        ftlFee: offer.ftlFee || 0,
        breakdown: offer.breakdown,
        routeString: offer.routeString || 'ROUTE'
      };
      
      // Generate PDF with client name
      const pdfResult = await generateOfferPDF(offer.optionNumber || 1, offerData, finalClientName);
      
      if (pdfResult.success && pdfResult.downloadPDF) {
        console.log('Downloading PDF for client:', finalClientName);
        pdfResult.downloadPDF();
        // Clean up the new PDF blob
        if (pdfResult.cleanup) {
          setTimeout(() => pdfResult.cleanup(), 1000); // Clean up after download
        }
      } else {
        alert('Error generating PDF for download');
      }
    } catch (error) {
      console.error('Error generating PDF with client name:', error);
      alert(`Error generating PDF: ${error.message}`);
    }

    handleClientModalClose();
  };

  if (!offer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Offer Details - ID: {offer.id}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Created: {new Date(offer.createdAt).toLocaleDateString()} at {new Date(offer.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPdf(!showPdf)}
              disabled={pdfLoading || !pdfData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pdfLoading ? 'Loading PDF...' : showPdf ? 'Hide PDF' : 'Show PDF'}
            </button>
            {pdfData && (
              <button
                onClick={downloadPdf}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* PDF Viewer */}
          {showPdf && pdfData && (
            <div className="border-b border-gray-200 p-4">
              <iframe
                src={pdfData.pdfUrl}
                className="w-full h-96 border border-gray-300 rounded"
                title={`Offer ${offer.id} PDF`}
              />
            </div>
          )}
          
          {/* Details Section */}
          <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Option Number:</span>
                  <span className="text-gray-900">Option {offer.optionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Calculation Type:</span>
                  <span className="text-gray-900 capitalize">{offer.calculationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    offer.status === 'Approved' 
                      ? 'bg-green-100 text-green-800' 
                      : offer.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {offer.status}
                  </span>
                </div>
                {offer.clientName && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Client Name:</span>
                    <span className="text-gray-900">{offer.clientName}</span>
                  </div>
                )}
                {offer.updatedAt && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-600">Last Updated:</span>
                    <span className="text-gray-900">{new Date(offer.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-blue-800">Route Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Origin:</span>
                  <span className="text-gray-900">{offer.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Origin Hub:</span>
                  <span className="text-gray-900">{offer.originHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Destination:</span>
                  <span className="text-gray-900">{offer.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Destination Hub:</span>
                  <span className="text-gray-900">{offer.destinationHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Route:</span>
                  <span className="text-gray-900 font-medium">{offer.routeString}</span>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-green-800">Service Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Service Type:</span>
                  <span className="text-gray-900">{offer.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Term:</span>
                  <span className="text-gray-900">{offer.term}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Volume Ratio:</span>
                  <span className="text-gray-900">{offer.volumeRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Chargeable Weight:</span>
                  <span className="text-gray-900">{offer.chargeableWeight} kg</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-yellow-800">Cost Breakdown</h4>
              <div className="space-y-3">
                {offer.breakdown && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Origin Cost:</span>
                      <span className="text-gray-900">€{parseFloat(offer.breakdown.origin?.totalCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Destination Cost:</span>
                      <span className="text-gray-900">€{parseFloat(offer.breakdown.destination?.totalCost || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Lane Pair Cost:</span>
                      <span className="text-gray-900">€{parseFloat(offer.breakdown.lanePair?.totalCost || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">FTL Fee:</span>
                  <span className="text-gray-900">€{parseFloat(offer.ftlFee || 0).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span className="text-gray-800">Total Cost:</span>
                  <span className="text-green-700">€{parseFloat(offer.totalCost || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Shipment Details */}
          {offer.rows && offer.rows.length > 0 && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold mb-4 text-gray-800">Shipment Details</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pieces</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Weight (kg)</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dimensions (cm)</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stackable</th>
                      <th className="border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Chargeable Weight</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {offer.rows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2">{row.pieces}</td>
                        <td className="border border-gray-200 px-3 py-2">{row.weight}</td>
                        <td className="border border-gray-200 px-3 py-2">{row.length} × {row.width} × {row.height}</td>
                        <td className="border border-gray-200 px-3 py-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            row.stackable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {row.stackable ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">{row.chargeableWeight} kg</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          </div>
        </div>
      </div>

      {/* Client Name Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Client Information
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={allowUnnamed}
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={allowUnnamed}
                  onChange={(e) => {
                    setAllowUnnamed(e.target.checked);
                    if (e.target.checked) {
                      setClientName('');
                    }
                  }}
                  className="mr-2 rounded"
                />
                <span className="text-sm text-gray-700">
                  Allow unnamed client (no client name required)
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={handleClientModalClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClientModalConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferViewModal; 