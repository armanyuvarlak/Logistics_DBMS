import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getZipCodeData } from '../firebase/firebaseUtils';

const ReviewOffersPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  
  // State for selected offers and all offers
  const [selectedOffers, setSelectedOffers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define available tabs
  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'client', label: 'Client' },
    { id: 'by-date', label: 'By Date' },
    { id: 'approval', label: 'Approval' },
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
  
  // Fetch offers - temporarily using zipcode data as placeholder
  const fetchOffers = async () => {
    setLoading(true);
    try {
      const result = await getZipCodeData();
      if (result.success) {
        // Transform zipcode data into offer format as a temporary solution
        const mockOffers = Array.isArray(result.data) ? result.data.map((item, index) => ({
          id: `OF${1000 + index}`,
          type: 'Single',
          origin: item.zipCode || '10000',
          destination: '20000',
          service: index % 3 === 0 ? 'Express' : 'Standard',
          createdAt: new Date().toISOString().split('T')[0],
          status: index % 3 === 0 ? 'Approved' : index % 3 === 1 ? 'Pending' : 'Rejected'
        })) : [];
        
        setOffers(mockOffers);
      } else {
        setError(result.error || "Failed to fetch offers");
      }
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
  
  // Handle offer selection
  const handleSelectOffer = (offerId, isSelected) => {
    if (isSelected) {
      // Get the offer data based on ID
      const offer = offers.find(o => o.id === offerId);
      
      if (offer) {
        setSelectedOffers([...selectedOffers, offer]);
      }
    } else {
      setSelectedOffers(selectedOffers.filter(o => o.id !== offerId));
    }
  };
  
  // Handle select all offers
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      setSelectedOffers(offers);
    } else {
      setSelectedOffers([]);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Offers</h1>
        <div className="text-sm text-gray-500">
          {selectedOffers.length} offers selected
        </div>
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
          renderTabContent(tab, offers, selectedOffers, handleSelectOffer, handleSelectAll)
        )}
      </div>
    </div>
  );
};

// Render different content based on the selected tab
const renderTabContent = (tab, offers, selectedOffers, handleSelectOffer, handleSelectAll) => {
  // Get IDs of selected offers for checking state
  const selectedOfferIds = selectedOffers.map(o => o.id);
  
  switch(tab) {
    case 'general':
      return <GeneralTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    case 'client':
      return <ClientTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    case 'by-date':
      return <ByDateTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    case 'approval':
      return <ApprovalTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    case 'origin':
      return <OriginTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    case 'destination':
      return <DestinationTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    case 'lane-pair':
      return <LanePairTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
    default:
      return <GeneralTab offers={offers} selectedOfferIds={selectedOfferIds} onSelectOffer={handleSelectOffer} onSelectAll={handleSelectAll} />;
  }
};

// Placeholder tab components
const GeneralTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">General Offers</h2>
    <p className="text-gray-600 mb-4">View all offers regardless of category.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

const ClientTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Offers by Client</h2>
    <p className="text-gray-600 mb-4">View offers organized by client.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

const ByDateTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Offers by Date</h2>
    <p className="text-gray-600 mb-4">View offers organized by creation date.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

const ApprovalTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Offers by Approval Status</h2>
    <p className="text-gray-600 mb-4">View offers organized by their approval status.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

const OriginTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Offers by Origin</h2>
    <p className="text-gray-600 mb-4">View offers organized by origin location.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

const DestinationTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Offers by Destination</h2>
    <p className="text-gray-600 mb-4">View offers organized by destination location.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

const LanePairTab = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => (
  <div>
    <h2 className="text-lg font-semibold mb-4">Offers by Lane Pair</h2>
    <p className="text-gray-600 mb-4">View offers organized by origin-destination pairs.</p>
    <OfferTable 
      offers={offers}
      selectedOfferIds={selectedOfferIds} 
      onSelectOffer={onSelectOffer}
      onSelectAll={onSelectAll}
    />
  </div>
);

// Common offer table component used by all tabs
const OfferTable = ({ offers, selectedOfferIds, onSelectOffer, onSelectAll }) => {
  // Check if all items are selected
  const allSelected = offers.length > 0 && selectedOfferIds.length === offers.length;
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input 
                type="checkbox" 
                className="mr-2"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
              ID
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
              Service
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
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
          {offers.map((offer) => (
            <tr key={offer.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={selectedOfferIds.includes(offer.id)}
                  onChange={(e) => onSelectOffer(offer.id, e.target.checked)}
                />
                <span className="font-medium">{offer.id}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.origin}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.destination}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.service}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {offer.createdAt}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                <button className="text-blue-600 hover:text-blue-900 mr-3">
                  View
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