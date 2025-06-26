import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { validatePassword } from '../utils/authUtils';

const OfferEditModal = ({ offer, onSave, onClose }) => {
  const [editedOffer, setEditedOffer] = useState({});
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize the initial offer data to prevent unnecessary re-renders
  const initialOfferData = useMemo(() => ({
    status: offer?.status || 'Pending'
  }), [offer?.status]);

  useEffect(() => {
    if (offer) {
      setEditedOffer(initialOfferData);
    }
  }, [offer, initialOfferData]);

  // Use useCallback to prevent function recreation on every render
  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const validation = validatePassword(password, 'offer-edit');
      
      if (validation.success) {
        setIsAuthenticated(true);
        setPasswordError('');
      } else {
        setPasswordError(validation.error);
        if (!validation.rateLimited) {
          setPassword('');
        }
      }
    } catch (error) {
      setPasswordError('Authentication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, isSubmitting]);

  const handleSave = useCallback(() => {
    if (offer?.id) {
      onSave(offer.id, editedOffer);
    }
  }, [offer?.id, editedOffer, onSave]);

  const handleChange = useCallback((field, value) => {
    setEditedOffer(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Memoize the status options to prevent recreation
  const statusOptions = useMemo(() => [
    { value: 'Pending', label: 'Pending' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ], []);

  if (!offer) return null;

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Authentication Required
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Please enter the authentication code to edit this offer.
            </p>
            
            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authentication Code
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter authentication code"
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
                {passwordError && (
                  <p className="text-red-500 text-sm mt-1" role="alert">{passwordError}</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Verifying...' : 'Authenticate'}
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
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
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
                value={editedOffer.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
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
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            type="button"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferEditModal; 