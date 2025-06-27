import React, { useState, useCallback, useMemo } from 'react';

const PDFPreview = ({ pdfUrl, onDownload, onClose, onAddAsOffer, optionNumber }) => {
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [allowUnnamed, setAllowUnnamed] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'download' or 'addOffer'

  // Memoize the iframe title to prevent recreation
  const iframeTitle = useMemo(() => `Offer Option ${optionNumber} PDF`, [optionNumber]);

  const handleDownload = useCallback(() => {
    setPendingAction('download');
    setShowClientModal(true);
  }, []);

  const handleAddOffer = useCallback(() => {
    setPendingAction('addOffer');
    setShowClientModal(true);
  }, []);

  const handleClientModalClose = useCallback(() => {
    setShowClientModal(false);
    setClientName('');
    setAllowUnnamed(false);
    setPendingAction(null);
  }, []);

  const handleClientModalConfirm = useCallback(() => {
    // Validate that either client name is provided or unnamed is allowed
    if (!clientName.trim() && !allowUnnamed) {
      // Better user feedback instead of alert
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
  }, [clientName, allowUnnamed, pendingAction, onDownload, onAddAsOffer, handleClientModalClose]);

  const handleUnnamedToggle = useCallback((e) => {
    const checked = e.target.checked;
    setAllowUnnamed(checked);
    if (checked) {
      setClientName('');
    }
  }, []);

  const handleModalClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Validation for form submission
  const isFormValid = clientName.trim() || allowUnnamed;
  const submitButtonText = pendingAction === 'download' ? 'Download PDF' : 'Add as Offer';

  if (!pdfUrl) return null;

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
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                type="button"
              >
                Add as an Offer
              </button>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="button"
              >
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                type="button"
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
              title={iframeTitle}
              loading="lazy"
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
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border-4 border-blue-500" 
            onClick={handleModalClick}
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Client Information
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleClientModalConfirm(); }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Enter client name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                  disabled={allowUnnamed}
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowUnnamed}
                    onChange={handleUnnamedToggle}
                    className="mr-2 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Allow unnamed client (no client name required)
                  </span>
                </label>
              </div>

              {!isFormValid && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">
                    Please enter a client name or check "Allow unnamed client"
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClientModalClose}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {submitButtonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PDFPreview; 