import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MultipleOfferPage = () => {
  const navigate = useNavigate();
  const [offerType, setOfferType] = useState('Weight Range');
  const [routes, setRoutes] = useState([{ origin: '', destination: '' }]);
  const [volumeRatio, setVolumeRatio] = useState('1:3');
  const [term, setTerm] = useState('P2P');
  const [service, setService] = useState('Standard');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/offer/multiple-offer/results', { 
      state: { 
        routes: routes.map((route, index) => ({
          id: index + 1,
          originZip: route.origin,
          destinationZip: route.destination
        })),
        volumeRatio: volumeRatio,
        term: term,
        service: service,
        offerType: offerType,
        ranges: [
          { id: 1, min: '0', max: '100', price: '45' },
          { id: 2, min: '101', max: '300', price: '75' },
          { id: 3, min: '301', max: '500', price: '120' }
        ]
      } 
    });
  };

  const addRoute = () => {
    setRoutes([...routes, { origin: '', destination: '' }]);
  };

  const removeRoute = (index) => {
    const newRoutes = routes.filter((_, i) => i !== index);
    setRoutes(newRoutes);
  };

  const handleRouteChange = (index, field, value) => {
    const newRoutes = [...routes];
    newRoutes[index] = { ...newRoutes[index], [field]: value };
    setRoutes(newRoutes);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Multiple Offer Calculation</h2>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer Type
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={offerType}
                onChange={(e) => setOfferType(e.target.value)}
                required
              >
                <option value="Weight Range">Weight Range</option>
                <option value="LDM Amount">LDM Amount</option>
                <option value="CBM Amount">CBM Amount</option>
                <option value="Euro Pallet">Euro Pallet</option>
                <option value="Block Pallet">Block Pallet</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Routes
              </label>
              {routes.map((route, index) => (
                <div key={index} className="flex gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Origin ZIP"
                    className="flex-1 px-3 py-2 border rounded"
                    value={route.origin}
                    onChange={(e) => handleRouteChange(index, 'origin', e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Destination ZIP"
                    className="flex-1 px-3 py-2 border rounded"
                    value={route.destination}
                    onChange={(e) => handleRouteChange(index, 'destination', e.target.value)}
                    required
                  />
                  {routes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoute(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRoute}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Route
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume Ratio
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={volumeRatio}
                onChange={(e) => setVolumeRatio(e.target.value)}
                required
              >
                <option value="1:3">1:3</option>
                <option value="1:6">1:6</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Term
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                required
              >
                <option value="P2P">Port to Port (P2P)</option>
                <option value="P2D">Port to Door (P2D)</option>
                <option value="D2P">Door to Port (D2P)</option>
                <option value="D2D">Door to Door (D2D)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service
              </label>
              <select
                className="w-full px-3 py-2 border rounded"
                value={service}
                onChange={(e) => setService(e.target.value)}
                required
              >
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Economy">Economy</option>
              </select>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-[var(--primary-color)] text-white px-6 py-2 rounded hover:bg-[var(--primary-color-hover)] transition-colors"
              >
                Calculate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MultipleOfferPage; 