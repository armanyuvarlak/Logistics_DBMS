import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOffers, deleteOffer, updateOfferStatus, updateOffer, getOfferById } from '../services/offerService';
import OfferViewModal from '../components/OfferViewModal';
import OfferEditModal from '../components/OfferEditModal';

const ReviewOffersPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  
  // State for offers
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [viewModalOffer, setViewModalOffer] = useState(null);
  const [editModalOffer, setEditModalOffer] = useState(null);
  
  // Define available tabs
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'client', label: 'Client' },
    { id: 'approval', label: 'Approval' },
    { id: 'service-type', label: 'Service Type' },
    { id: 'origin', label: 'Origin' },
    { id: 'destination', label: 'Destination' },
    { id: 'lane-pair', label: 'Lane Pair' }
  ];
  
  // Find current tab
  const currentTab = tabs.find(t => t.id === tab) || tabs[0];
  
  // Fetch offers when component mounts
  useEffect(() => {
    fetchOffers();
  }, [tab]);
  
  // Fetch offers from localStorage
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const savedOffers = getOffers();
      setOffers(savedOffers);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError("Failed to fetch offers. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tabId) => {
    navigate(`/offer/review-offers/${tabId}`);
  };
  


  // Authentication states for delete
  const [deleteOfferId, setDeleteOfferId] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Generate weekly password same as database access and edit modal
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

  // Handle delete offer - now requires authentication
  const handleDeleteOffer = async (offerId) => {
    setDeleteOfferId(offerId);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError('');
  };

  // Handle password submission for delete
  const handleDeletePasswordSubmit = (e) => {
    e.preventDefault();
    if (deletePassword === generateWeeklyPassword()) {
      // Password is correct, proceed with deletion
      const result = deleteOffer(deleteOfferId);
      if (result.success) {
        // Remove from local state
        setOffers(offers.filter(o => o.id !== deleteOfferId));
        setShowDeleteModal(false);
        setDeleteOfferId(null);
        setDeletePassword('');
        setDeletePasswordError('');
      } else {
        setDeletePasswordError('Failed to delete offer: ' + result.error);
      }
    } else {
      setDeletePasswordError('Incorrect password. Please try again.');
      setDeletePassword('');
    }
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteOfferId(null);
    setDeletePassword('');
    setDeletePasswordError('');
  };

  // Status update functionality removed - status can only be changed through Edit modal

  // Handle view offer
  const handleViewOffer = async (offerId) => {
    const result = getOfferById(offerId);
    if (result.success) {
      setViewModalOffer(result.offer);
    } else {
      alert('Failed to load offer details: ' + result.error);
    }
  };

  // Handle edit offer
  const handleEditOffer = async (offerId) => {
    const result = getOfferById(offerId);
    if (result.success) {
      setEditModalOffer(result.offer);
    } else {
      alert('Failed to load offer details: ' + result.error);
    }
  };

  // Handle save edited offer
  const handleSaveOffer = async (offerId, updatedData) => {
    const result = updateOffer(offerId, updatedData);
    if (result.success) {
      // Update local state
      setOffers(offers.map(o => 
        o.id === offerId 
          ? { ...o, ...updatedData, updatedAt: new Date().toISOString() }
          : o
      ));
      setEditModalOffer(null);
      alert('Offer updated successfully!');
    } else {
      alert('Failed to update offer: ' + result.error);
    }
  };

  // Close modals
  const closeViewModal = () => setViewModalOffer(null);
  const closeEditModal = () => setEditModalOffer(null);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Offers</h1>
      </div>
      
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8" aria-label="Review Tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                t.id === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {loading ? (
          <div className="text-center py-8">
            <p>Loading offers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          renderTabContent(tab, offers, handleDeleteOffer, handleViewOffer, handleEditOffer)
        )}
      </div>

      {/* Delete Authentication Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Delete Confirmation
                </h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Please enter the database password to delete this offer.
              </p>
              
              <form onSubmit={handleDeletePasswordSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter password"
                    required
                  />
                  {deletePasswordError && (
                    <p className="text-red-500 text-sm mt-1">{deletePasswordError}</p>
                  )}
                </div>
                
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModalOffer && (
        <OfferViewModal
          offer={viewModalOffer}
          onClose={closeViewModal}
        />
      )}

      {/* Edit Modal */}
      {editModalOffer && (
        <OfferEditModal
          offer={editModalOffer}
          onSave={handleSaveOffer}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
};

// Render different content based on the selected tab
const renderTabContent = (tab, offers, handleDeleteOffer, handleViewOffer, handleEditOffer) => {
  switch(tab) {
    case 'general':
      return <GeneralTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    case 'client':
      return <ClientTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    case 'approval':
      return <ApprovalTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    case 'service-type':
      return <ServiceTypeTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    case 'origin':
      return <OriginTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    case 'destination':
      return <DestinationTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    case 'lane-pair':
      return <LanePairTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
    default:
      return <GeneralTab offers={offers} onDeleteOffer={handleDeleteOffer} onViewOffer={handleViewOffer} onEditOffer={handleEditOffer} />;
  }
};

// Placeholder tab components
const GeneralTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">General Offers</h2>
    {offers.length === 0 ? (
      <div className="text-center py-8 text-gray-500">
        <p>No offers found. Create offers from the Results page to see them here.</p>
      </div>
    ) : (
      <>
        <p className="text-gray-600 mb-4">View all offers regardless of category.</p>
        <OfferTable 
          offers={offers}
          onDeleteOffer={onDeleteOffer}
          onViewOffer={onViewOffer}
          onEditOffer={onEditOffer}
        />
      </>
    )}
  </div>
);

const ClientTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [selectedClient, setSelectedClient] = useState('');
  const [showClientless, setShowClientless] = useState(false);
  
  // Extract unique client names from offers (excluding "Unnamed Client")
  const uniqueClients = [...new Set(
    offers
      .filter(offer => offer.clientName && offer.clientName.trim() !== '' && offer.clientName !== 'Unnamed Client')
      .map(offer => offer.clientName)
  )].sort();
  
  // Check if there are offers with "Unnamed Client"
  const hasClientlessOffers = offers.some(offer => offer.clientName === 'Unnamed Client');
  
  // Filter offers based on selection
  const filteredOffers = offers.filter(offer => {
    if (selectedClient && showClientless) {
      // Show both selected client and Unnamed Client offers
      return offer.clientName === selectedClient || offer.clientName === 'Unnamed Client';
    } else if (selectedClient) {
      // Show only selected client offers
      return offer.clientName === selectedClient;
    } else if (showClientless) {
      // Show only Unnamed Client offers
      return offer.clientName === 'Unnamed Client';
    } else {
      // Show all offers when no filter is applied
      return true;
    }
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedClient('');
    setShowClientless(false);
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Offers by Client</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Filter Options</h3>
        <div className="flex items-center gap-6">
          {/* Client Dropdown */}
          {uniqueClients.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="client-select" className="text-sm font-medium text-gray-700">
                Client:
              </label>
              <select
                id="client-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Clients</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Clientless Checkbox */}
          {hasClientlessOffers && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="clientless-checkbox"
                checked={showClientless}
                onChange={(e) => setShowClientless(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="clientless-checkbox" className="text-sm font-medium text-gray-700">
                Include offers without client
              </label>
            </div>
          )}
          
          {/* Reset Button */}
          {(selectedClient || showClientless) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {/* Filter Summary */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
          {selectedClient && ` for client "${selectedClient}"`}
          {showClientless && selectedClient && ' and offers without client'}
          {showClientless && !selectedClient && ' without client'}
        </div>
      </div>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers found. Create offers from the Results page to see them here.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers match the selected criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">View offers organized by client.</p>
          <OfferTable 
            offers={filteredOffers}
            onDeleteOffer={onDeleteOffer}
            onViewOffer={onViewOffer}
            onEditOffer={onEditOffer}
          />
        </>
      )}
    </div>
  );
};



const ApprovalTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [showApproved, setShowApproved] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const [showPending, setShowPending] = useState(false);
  
  // Count offers by status
  const approvedCount = offers.filter(offer => offer.status === 'Approved').length;
  const rejectedCount = offers.filter(offer => offer.status === 'Rejected').length;
  const pendingCount = offers.filter(offer => offer.status === 'Pending').length;
  
  // Filter offers based on selection
  const filteredOffers = offers.filter(offer => {
    if (!showApproved && !showRejected && !showPending) {
      // Show all offers when no filter is applied
      return true;
    }
    
    // Show offers that match any selected status
    return (
      (showApproved && offer.status === 'Approved') ||
      (showRejected && offer.status === 'Rejected') ||
      (showPending && offer.status === 'Pending')
    );
  });
  
  // Reset filters
  const resetFilters = () => {
    setShowApproved(false);
    setShowRejected(false);
    setShowPending(false);
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Offers by Approval Status</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Filter by Status</h3>
        <div className="flex items-center gap-8">
          {/* Approved Checkbox */}
          {approvedCount > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="approved-checkbox"
                checked={showApproved}
                onChange={(e) => setShowApproved(e.target.checked)}
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
              />
              <label htmlFor="approved-checkbox" className="text-sm font-medium text-gray-700">
                Approved ({approvedCount})
              </label>
            </div>
          )}
          
          {/* Rejected Checkbox */}
          {rejectedCount > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rejected-checkbox"
                checked={showRejected}
                onChange={(e) => setShowRejected(e.target.checked)}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
              />
              <label htmlFor="rejected-checkbox" className="text-sm font-medium text-gray-700">
                Rejected ({rejectedCount})
              </label>
            </div>
          )}
          
          {/* Pending Checkbox */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pending-checkbox"
                checked={showPending}
                onChange={(e) => setShowPending(e.target.checked)}
                className="w-4 h-4 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500 focus:ring-2"
              />
              <label htmlFor="pending-checkbox" className="text-sm font-medium text-gray-700">
                Pending ({pendingCount})
              </label>
            </div>
          )}
          
          {/* Reset Button */}
          {(showApproved || showRejected || showPending) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {/* Filter Summary */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
          {(showApproved || showRejected || showPending) && (
            <span>
              {' '}(
              {[
                showApproved && 'Approved',
                showRejected && 'Rejected', 
                showPending && 'Pending'
              ].filter(Boolean).join(', ')}
              )
            </span>
          )}
        </div>
      </div>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers found. Create offers from the Results page to see them here.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers match the selected status criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">View offers organized by their approval status.</p>
          <OfferTable 
            offers={filteredOffers}
            onDeleteOffer={onDeleteOffer}
            onViewOffer={onViewOffer}
            onEditOffer={onEditOffer}
          />
        </>
      )}
    </div>
  );
};

const ServiceTypeTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [selectedServiceType, setSelectedServiceType] = useState('');
  
  // Define available service types
  const availableServiceTypes = ['D2D', 'D2P', 'P2D', 'P2P'];
  
  // Check which service types exist in the offers
  const existingServiceTypes = availableServiceTypes.filter(serviceType =>
    offers.some(offer => offer.serviceType === serviceType)
  );
  
  // Filter offers based on selection
  const filteredOffers = offers.filter(offer => {
    if (!selectedServiceType) {
      // Show all offers when no filter is applied
      return true;
    }
    return offer.serviceType === selectedServiceType;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedServiceType('');
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Offers by Service Type</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Filter Options</h3>
        <div className="flex items-center gap-6">
          {/* Service Type Dropdown */}
          {existingServiceTypes.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="servicetype-select" className="text-sm font-medium text-gray-700">
                Service Type:
              </label>
              <select
                id="servicetype-select"
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Service Types</option>
                {existingServiceTypes.map(serviceType => (
                  <option key={serviceType} value={serviceType}>
                    {serviceType}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Reset Button */}
          {selectedServiceType && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {/* Service Type Explanation */}
        <div className="mt-3 text-xs text-gray-500">
          D2D = Door to Door | D2P = Door to Port | P2D = Port to Door | P2P = Port to Port
        </div>
        
        {/* Filter Summary */}
        <div className="mt-2 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
          {selectedServiceType && ` for service type "${selectedServiceType}"`}
        </div>
      </div>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers found. Create offers from the Results page to see them here.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers match the selected criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">View offers organized by service type.</p>
          <OfferTable 
            offers={filteredOffers}
            onDeleteOffer={onDeleteOffer}
            onViewOffer={onViewOffer}
            onEditOffer={onEditOffer}
          />
        </>
      )}
    </div>
  );
};

const OriginTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [selectedOrigin, setSelectedOrigin] = useState('');
  
  // Extract unique origins from offers
  const uniqueOrigins = [...new Set(
    offers
      .filter(offer => offer.origin && offer.origin.trim() !== '')
      .map(offer => offer.origin)
  )].sort();
  
  // Filter offers based on selection
  const filteredOffers = offers.filter(offer => {
    if (!selectedOrigin) {
      // Show all offers when no filter is applied
      return true;
    }
    return offer.origin === selectedOrigin;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedOrigin('');
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Offers by Origin</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Filter Options</h3>
        <div className="flex items-center gap-6">
          {/* Origin Dropdown */}
          {uniqueOrigins.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="origin-select" className="text-sm font-medium text-gray-700">
                Origin:
              </label>
              <select
                id="origin-select"
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Origins</option>
                {uniqueOrigins.map(origin => (
                  <option key={origin} value={origin}>{origin}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Reset Button */}
          {selectedOrigin && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {/* Filter Summary */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
          {selectedOrigin && ` for origin "${selectedOrigin}"`}
        </div>
      </div>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers found. Create offers from the Results page to see them here.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers match the selected criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">View offers organized by origin location.</p>
          <OfferTable 
            offers={filteredOffers}
            onDeleteOffer={onDeleteOffer}
            onViewOffer={onViewOffer}
            onEditOffer={onEditOffer}
          />
        </>
      )}
    </div>
  );
};

const DestinationTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [selectedDestination, setSelectedDestination] = useState('');
  
  // Extract unique destinations from offers
  const uniqueDestinations = [...new Set(
    offers
      .filter(offer => offer.destination && offer.destination.trim() !== '')
      .map(offer => offer.destination)
  )].sort();
  
  // Filter offers based on selection
  const filteredOffers = offers.filter(offer => {
    if (!selectedDestination) {
      // Show all offers when no filter is applied
      return true;
    }
    return offer.destination === selectedDestination;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedDestination('');
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Offers by Destination</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Filter Options</h3>
        <div className="flex items-center gap-6">
          {/* Destination Dropdown */}
          {uniqueDestinations.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="destination-select" className="text-sm font-medium text-gray-700">
                Destination:
              </label>
              <select
                id="destination-select"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Destinations</option>
                {uniqueDestinations.map(destination => (
                  <option key={destination} value={destination}>{destination}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Reset Button */}
          {selectedDestination && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {/* Filter Summary */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
          {selectedDestination && ` for destination "${selectedDestination}"`}
        </div>
      </div>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers found. Create offers from the Results page to see them here.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers match the selected criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">View offers organized by destination location.</p>
          <OfferTable 
            offers={filteredOffers}
            onDeleteOffer={onDeleteOffer}
            onViewOffer={onViewOffer}
            onEditOffer={onEditOffer}
          />
        </>
      )}
    </div>
  );
};

const LanePairTab = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [selectedLanePair, setSelectedLanePair] = useState('');
  
  // Extract unique lane pairs from offers
  const uniqueLanePairs = [...new Set(
    offers
      .filter(offer => offer.origin && offer.destination && 
                      offer.origin.trim() !== '' && offer.destination.trim() !== '')
      .map(offer => `${offer.origin} → ${offer.destination}`)
  )].sort();
  
  // Filter offers based on selection
  const filteredOffers = offers.filter(offer => {
    if (!selectedLanePair) {
      // Show all offers when no filter is applied
      return true;
    }
    const offerLanePair = `${offer.origin} → ${offer.destination}`;
    return offerLanePair === selectedLanePair;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedLanePair('');
  };
  
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Offers by Lane Pair</h2>
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-md font-medium mb-3">Filter Options</h3>
        <div className="flex items-center gap-6">
          {/* Lane Pair Dropdown */}
          {uniqueLanePairs.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="lanepair-select" className="text-sm font-medium text-gray-700">
                Lane Pair:
              </label>
              <select
                id="lanepair-select"
                value={selectedLanePair}
                onChange={(e) => setSelectedLanePair(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
              >
                <option value="">All Lane Pairs</option>
                {uniqueLanePairs.map(lanePair => (
                  <option key={lanePair} value={lanePair}>{lanePair}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Reset Button */}
          {selectedLanePair && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
        
        {/* Filter Summary */}
        <div className="mt-3 text-sm text-gray-600">
          Showing {filteredOffers.length} of {offers.length} offers
          {selectedLanePair && ` for lane pair "${selectedLanePair}"`}
        </div>
      </div>
      
      {offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers found. Create offers from the Results page to see them here.</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No offers match the selected criteria.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-600 mb-4">View offers organized by origin-destination pairs.</p>
          <OfferTable 
            offers={filteredOffers}
            onDeleteOffer={onDeleteOffer}
            onViewOffer={onViewOffer}
            onEditOffer={onEditOffer}
          />
        </>
      )}
    </div>
  );
};

// Common offer table component used by all tabs
const OfferTable = ({ offers, onDeleteOffer, onViewOffer, onEditOffer }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  // Handle column sorting
  const handleSort = (key) => {
    let direction = 'desc'; // Default to descending on first click
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc'; // Switch to ascending on second click
    }
    setSortConfig({ key, direction });
  };

  // Sort offers based on current sort configuration
  const sortedOffers = React.useMemo(() => {
    if (!sortConfig.key) return offers;

    return [...offers].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'totalCost':
          aValue = parseFloat(a.totalCost) || 0;
          bValue = parseFloat(b.totalCost) || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [offers, sortConfig]);

  // Render sort indicator
  const renderSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return (
      <span className="text-blue-600 ml-1">
        {sortConfig.direction === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('id')}
            >
              ID {renderSortIndicator('id')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Origin
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Destination
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Service Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('totalCost')}
            >
              Total Cost {renderSortIndicator('totalCost')}
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
              onClick={() => handleSort('createdAt')}
            >
              Created {renderSortIndicator('createdAt')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedOffers.map((offer) => (
            <tr key={offer.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="font-medium">{offer.id}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.calculationType || 'Standard'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.origin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.destination}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.serviceType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.clientName || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium">
                €{offer.totalCost ? parseFloat(offer.totalCost).toFixed(2) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(offer.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs leading-5 font-semibold rounded ${
                  offer.status === 'Approved' 
                    ? 'bg-green-100 text-green-800' 
                    : offer.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {offer.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button 
                  onClick={() => onViewOffer(offer.id)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  View
                </button>
                <button 
                  onClick={() => onEditOffer(offer.id)}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDeleteOffer(offer.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReviewOffersPage; 