import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getZipCodeData, getLanePairData } from '../firebase/firebaseUtils';
import { calculateRowMetrics, calculateShipping } from '../services/calculatorService';

const SingleOfferPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { id: 1, pieces: '', weight: '', length: '', width: '', height: '', stackable: 'No' }
  ]);
  const [entryMode, setEntryMode] = useState('detailed'); // 'detailed' or 'quick'
  const [chargeableWeight, setChargeableWeight] = useState('');
  const [originZip, setOriginZip] = useState('');
  const [destinationZip, setDestinationZip] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const formRef = useRef(null);

  // Function to get hub name from zip code
const getHubFromZipCode = async (zipCode, zipCodeData) => {
  const zipData = zipCodeData.find(data => data.zipCode === zipCode);
  return zipData ? (zipData.hubName || zipData.branchName) : null;
};

  // Function to validate lane pair exists
  const validateLanePair = async (originZip, destinationZip) => {
    try {
      // Fetch zip code data to get hub names
      const zipResult = await getZipCodeData();
      if (!zipResult.success || !zipResult.data) {
        throw new Error('Unable to fetch zip code data');
      }

      const zipCodeData = Array.isArray(zipResult.data) ? zipResult.data : [zipResult.data];
      
      // Get hub names for origin and destination
      const originHub = await getHubFromZipCode(originZip, zipCodeData);
      const destinationHub = await getHubFromZipCode(destinationZip, zipCodeData);

      if (!originHub) {
        throw new Error(`Origin zip code "${originZip}" not found in database`);
      }

      if (!destinationHub) {
        throw new Error(`Destination zip code "${destinationZip}" not found in database`);
      }

      // Fetch lane pair data
      const lanePairResult = await getLanePairData();
      if (!lanePairResult.success || !lanePairResult.data) {
        throw new Error('Unable to fetch lane pair data');
      }

      const lanePairData = Array.isArray(lanePairResult.data) ? lanePairResult.data : [lanePairResult.data];
      
      // Check if lane pair exists (either direction)
      const lanePairExists = lanePairData.some(pair => 
        ((pair.originHub || pair.originBranch) === originHub && (pair.destinationHub || pair.destinationBranch) === destinationHub) ||
        ((pair.originHub || pair.originBranch) === destinationHub && (pair.destinationHub || pair.destinationBranch) === originHub)
      );

      if (!lanePairExists) {
        throw new Error(`No lane pair found for route ${originHub} ↔ ${destinationHub}. Please contact administrator to add this route.`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setIsValidating(true);

    // Basic form validation
    if (!originZip.trim() || !destinationZip.trim()) {
      setValidationError('Please enter both origin and destination zip codes');
      setIsValidating(false);
      return;
    }

    if (originZip.trim() === destinationZip.trim()) {
      setValidationError('Origin and destination zip codes must be different');
      setIsValidating(false);
      return;
    }

    try {
      // Validate lane pair exists
      await validateLanePair(originZip.trim(), destinationZip.trim());

      // If validation passes, proceed with navigation
      if (entryMode === 'detailed') {
        // Validation for detailed entry mode
        if (rows.length === 0) {
          setValidationError('Please add at least one row with item details');
          setIsValidating(false);
          return;
        }
        
        const invalidRows = [];
        
        rows.forEach((row, index) => {
          const pieces = parseInt(row.pieces, 10) || 0;
          const length = parseFloat(row.length) || 0;
          const width = parseFloat(row.width) || 0;
          const height = parseFloat(row.height) || 0;
          const weight = parseFloat(row.weight) || 0;
          
          const missingFields = [];
          if (pieces <= 0) missingFields.push('Pieces');
          if (weight <= 0) missingFields.push('Weight');
          if (length <= 0) missingFields.push('Length');
          if (width <= 0) missingFields.push('Width');
          if (height <= 0) missingFields.push('Height');
          
          if (missingFields.length > 0) {
            invalidRows.push(`Row ${index + 1}: ${missingFields.join(', ')} must be greater than 0`);
          }
        });
        
        if (invalidRows.length > 0) {
          setValidationError('Please fix the following issues:\n\n' + invalidRows.join('\n'));
          setIsValidating(false);
          return;
        }

        // Calculate metrics for each row using the new calculation service
        const rowsWithCalculations = rows.map(row => {
          const metrics = calculateRowMetrics(row);
          return { 
            ...row, 
            volume: metrics.volume,
            ldm: metrics.ldm,
            cbm: metrics.cbm,
            volumeWeight13: metrics.volumeWeight13,
            volumeWeight16: metrics.volumeWeight16
          };
        });
        
        // Calculate total LDM using the new service
        const calculations = calculateShipping(rows, originZip.trim(), destinationZip.trim());
        
        navigate('/results', { 
          state: { 
            rows: rowsWithCalculations, 
            calculationType: 'single',
            totalLdm: calculations.summary.totalLdm,
            originZip: originZip.trim(),
            destinationZip: destinationZip.trim()
          } 
        });
      } else {
        // Quick entry with just chargeable weight
        if (!chargeableWeight || parseFloat(chargeableWeight) <= 0) {
          setValidationError('Please enter a chargeable weight greater than 0');
          setIsValidating(false);
          return;
        }

        navigate('/results', { 
          state: { 
            chargeableWeight: parseFloat(chargeableWeight) || 0,
            calculationType: 'single-quick',
            originZip: originZip.trim(),
            destinationZip: destinationZip.trim()
          } 
        });
      }
    } catch (error) {
      console.error('Lane pair validation error:', error);
      setValidationError(error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRowChange = (id, field, value) => {
    // For numeric fields, prevent zero values but allow empty strings for typing
    if (['pieces', 'weight', 'length', 'width', 'height'].includes(field)) {
      if (value !== '' && parseFloat(value) <= 0) {
        return; // Don't update if value is zero or negative
      }
    }
    
    const newRows = [...rows];
    const index = newRows.findIndex(row => row.id === id);
    if (index !== -1) {
      newRows[index] = { ...newRows[index], [field]: value };
      setRows(newRows);
    }
  };

  const handleAddRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(row => row.id)) + 1 : 1;
    const newRow = { 
      id: newId, 
      pieces: '', 
      weight: '', 
      length: '', 
      width: '', 
      height: '', 
      stackable: 'No' 
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (id) => {
    // Only remove if there's more than one row
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const toggleStackable = (id) => {
    const newRows = [...rows];
    const index = newRows.findIndex(row => row.id === id);
    if (index !== -1) {
      newRows[index] = { 
        ...newRows[index], 
        stackable: newRows[index].stackable === 'Yes' ? 'No' : 'Yes' 
      };
      setRows(newRows);
    }
  };

  const toggleEntryMode = (mode) => {
    setEntryMode(mode);
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
          <h2 className="card-title">Offer Preparation</h2>
          
          <div className="mt-4 inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                entryMode === 'detailed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } border border-gray-300`}
              onClick={() => toggleEntryMode('detailed')}
            >
              Detailed Entry
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                entryMode === 'quick'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              } border border-l-0 border-gray-300`}
              onClick={() => toggleEntryMode('quick')}
            >
              Quick Entry
            </button>
          </div>
        </div>
        
        <div className="card-body">
          <form ref={formRef} onSubmit={handleSubmit}>
            {/* Origin and Destination Zip Code fields */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
              
              {/* Validation Error Display */}
              {validationError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Validation Error</h3>
                      <div className="text-sm text-red-700 mt-1 whitespace-pre-line">{validationError}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="origin-zip">
                    Origin Zip Code
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    id="origin-zip"
                    type="text"
                    placeholder="Enter origin zip code"
                    value={originZip}
                    onChange={(e) => setOriginZip(e.target.value.toUpperCase())}
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="destination-zip">
                    Destination Zip Code
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    id="destination-zip"
                    type="text"
                    placeholder="Enter destination zip code"
                    value={destinationZip}
                    onChange={(e) => setDestinationZip(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>

            {/* Item Information Forms */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Item Information</h3>
            </div>
            
            {entryMode === 'detailed' ? (
              <>
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Required Input Units</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        Please enter all measurements using these units:
                        <ul className="list-disc list-inside mt-1 space-y-0.5">
                          <li><strong>Weight:</strong> Kilograms (kg)</li>
                          <li><strong>Dimensions (Length, Width, Height):</strong> Centimeters (cm)</li>
                          <li><strong>Pieces:</strong> Number of items</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 border-b text-center">Pieces</th>
                        <th className="px-4 py-2 border-b text-center">Weight</th>
                        <th className="px-4 py-2 border-b text-center">Length</th>
                        <th className="px-4 py-2 border-b text-center">Width</th>
                        <th className="px-4 py-2 border-b text-center">Height</th>
                        <th className="px-4 py-2 border-b text-center">Stackable</th>
                        <th className="px-4 py-2 border-b text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="px-4 py-2 border-b">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="w-full px-2 py-1 border rounded"
                              value={row.pieces}
                              onChange={(e) => handleRowChange(row.id, 'pieces', e.target.value)}
                              placeholder="Number > 0"
                            />
                          </td>
                          <td className="px-4 py-2 border-b">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              className="w-full px-2 py-1 border rounded"
                              value={row.weight}
                              onChange={(e) => handleRowChange(row.id, 'weight', e.target.value)}
                              placeholder="Weight > 0 kg"
                            />
                          </td>
                          <td className="px-4 py-2 border-b">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              className="w-full px-2 py-1 border rounded"
                              value={row.length}
                              onChange={(e) => handleRowChange(row.id, 'length', e.target.value)}
                              placeholder="Length > 0 cm"
                            />
                          </td>
                          <td className="px-4 py-2 border-b">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              className="w-full px-2 py-1 border rounded"
                              value={row.width}
                              onChange={(e) => handleRowChange(row.id, 'width', e.target.value)}
                              placeholder="Width > 0 cm"
                            />
                          </td>
                          <td className="px-4 py-2 border-b">
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              className="w-full px-2 py-1 border rounded"
                              value={row.height}
                              onChange={(e) => handleRowChange(row.id, 'height', e.target.value)}
                              placeholder="Height > 0 cm"
                            />
                          </td>
                          <td className="px-4 py-2 border-b">
                            <button
                              type="button"
                              onClick={() => toggleStackable(row.id)}
                              className={`w-full px-3 py-1 rounded font-medium ${
                                row.stackable === 'Yes' 
                                  ? 'bg-green-100 text-green-800 border border-green-400'
                                  : 'bg-red-100 text-red-800 border border-red-400'
                              }`}
                            >
                              {row.stackable}
                            </button>
                          </td>
                          <td className="px-4 py-2 border-b">
                            {rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="7" className="px-4 py-2 border-b text-center">
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="text-blue-500 hover:text-blue-700 font-semibold"
                          >
                            + Add Row
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex justify-center mb-6">
                <div className="max-w-md w-96">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="chargeableWeight">
                    Chargeable Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="chargeableWeight"
                    min="0.01"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-lg font-semibold"
                    value={chargeableWeight}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for typing, but prevent 0 values
                      if (value === '' || parseFloat(value) > 0) {
                        setChargeableWeight(value);
                      }
                    }}
                    placeholder="Enter weight > 0 kg"
                  />
                </div>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isValidating}
                className="bg-[var(--primary-color)] text-white px-6 py-2 rounded hover:bg-[var(--primary-color-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isValidating && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isValidating ? 'Validating Route...' : 'Calculate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SingleOfferPage; 