import React, { useState } from 'react';

const PDFPreview = ({ pdfUrl, onDownload, onClose, onAddAsOffer, optionNumber }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [allowUnnamed, setAllowUnnamed] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'download' or 'addOffer'

  console.log('PDFPreview render - showClientModal:', showClientModal, 'pendingAction:', pendingAction);

  if (!pdfUrl) return null;

  const handleDownload = () => {
    console.log('Download clicked - showing client modal');
    setPendingAction('download');
    setShowClientModal(true);
  };

  const handleAddOffer = () => {
    console.log('Add offer clicked - showing client modal');
    setPendingAction('addOffer');
    setShowClientModal(true);
  };

  const handleClientModalClose = () => {
    setShowClientModal(false);
    setClientName('');
    setAllowUnnamed(false);
    setPendingAction(null);
  };

  const handleClientModalConfirm = () => {
    // Validate that either client name is provided or unnamed is allowed
    if (!clientName.trim() && !allowUnnamed) {
      alert('Please enter a client name or check "Allow unnamed client"');
      return;
    }

    const finalClientName = allowUnnamed && !clientName.trim() ? 'Unnamed Client' : clientName.trim();

    // Execute the pending action with client name
    if (pendingAction === 'download') {
      onDownload(finalClientName);
    } else if (pendingAction === 'addOffer') {
      onAddAsOffer(finalClientName);
    }

    handleClientModalClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-semibold">
              Offer Option {optionNumber} - PDF Preview
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleAddOffer}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
              >
                Add as an Offer
              </button>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          
          {/* PDF Viewer */}
          <div className="flex-1 p-4">
            <iframe
              src={pdfUrl}
              className="w-full h-full min-h-[500px] border border-gray-300 rounded"
              title={`Offer Option ${optionNumber} PDF`}
            />
          </div>
        </div>
      </div>

      {/* Client Name Modal */}
      {showClientModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center" 
          style={{ zIndex: 9999 }}
          onClick={handleClientModalClose}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border-4 border-blue-500" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Client Information {showClientModal ? '(Modal Active)' : ''}
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
                {pendingAction === 'download' ? 'Download PDF' : 'Add as Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PDFPreview; 