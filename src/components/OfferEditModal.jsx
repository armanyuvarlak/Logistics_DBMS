import React, { useState, useEffect } from 'react';

const OfferEditModal = ({ offer, onSave, onClose }) => {
  const [editedOffer, setEditedOffer] = useState({});
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Generate weekly password same as database access
  const generateWeeklyPassword = () => {
    const today = new Date()
    
    // Get the start of the week (Sunday)
    const firstDayOfWeek = new Date(today)
    const dayOfWeek = today.getDay()
    firstDayOfWeek.setDate(today.getDate() - dayOfWeek)
    
    // Get year
    const year = firstDayOfWeek.getFullYear()
    
    // Calculate week number (1-52)
    const oneJan = new Date(year, 0, 1)
    const numberOfDays = Math.floor((firstDayOfWeek - oneJan) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)
    
    // Reverse the year digits
    const reverseYear = year.toString().split('').reverse().join('')
    
    // Generate the final password: TRdb + week number + reverse year
    return `TRdb${weekNumber}${reverseYear}`
  };

  useEffect(() => {
    if (offer) {
      setEditedOffer({
        status: offer.status || 'Pending'
      });
    }
  }, [offer]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === generateWeeklyPassword()) {
      setIsAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleSave = () => {
    onSave(offer.id, editedOffer);
  };

  const handleChange = (field, value) => {
    setEditedOffer(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!offer) return null;

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Password Required
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please enter the database password to edit this offer.
            </p>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Edit Offer - ID: {offer.id}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Route: {offer.originHub} → {offer.destinationHub}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Authenticated Successfully
            </div>
          </div>

          {/* Editable Status Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="text-lg font-medium text-yellow-800 mb-4">Editable Field</h4>
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={editedOffer.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Read-only Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Read-Only Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Service Type:</span>
                <span className="ml-2 text-gray-900">{offer.serviceType}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Term:</span>
                <span className="ml-2 text-gray-900">{offer.term}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Volume Ratio:</span>
                <span className="ml-2 text-gray-900">{offer.volumeRatio}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Chargeable Weight:</span>
                <span className="ml-2 text-gray-900">{offer.chargeableWeight} kg</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Created:</span>
                <span className="ml-2 text-gray-900">{new Date(offer.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Cost:</span>
                <span className="ml-2 text-gray-900 font-medium">€{parseFloat(offer.totalCost || 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Origin:</span>
                <span className="ml-2 text-gray-900">{offer.origin} ({offer.originHub})</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Destination:</span>
                <span className="ml-2 text-gray-900">{offer.destination} ({offer.destinationHub})</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferEditModal; 