import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SingleOfferPage = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { id: 1, pieces: '', weight: '', length: '', width: '', height: '', stackable: 'No' }
  ]);
  const [entryMode, setEntryMode] = useState('detailed'); // 'detailed' or 'quick'
  const [chargeableWeight, setChargeableWeight] = useState('');
  const formRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (entryMode === 'detailed') {
      // Calculate volume and LDM for each row based on dimensions before navigating
      let totalLdm = 0;
      const rowsWithCalculations = rows.map(row => {
        // Only calculate if all required dimensions are present
        let volume = '';
        let ldm = 0;
        
        if (row.length && row.width && row.height && row.pieces) {
          // Convert dimensions from cm to m and calculate volume in m³
          const lengthM = parseFloat(row.length) / 100;
          const widthM = parseFloat(row.width) / 100;
          const heightM = parseFloat(row.height) / 100;
          const pieces = parseInt(row.pieces);
          
          // Calculate volume
          volume = (lengthM * widthM * heightM * pieces).toFixed(2);
          
          // Calculate LDM: width × length × pieces / 2.4
          ldm = (widthM * lengthM * pieces) / 2.4;
          totalLdm += ldm;
        }
        
        return { ...row, volume, ldm: ldm.toFixed(2) };
      });
      
      navigate('/results', { 
        state: { 
          rows: rowsWithCalculations, 
          calculationType: 'single',
          totalLdm: totalLdm.toFixed(2)
        } 
      });
    } else {
      // Quick entry with just chargeable weight
      navigate('/results', { 
        state: { 
          chargeableWeight: parseFloat(chargeableWeight) || 0,
          calculationType: 'single-quick'
        } 
      });
    }
  };

  const handleRowChange = (id, field, value) => {
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
          <h2 className="card-title">Single Offer Calculation</h2>
          
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
            {entryMode === 'detailed' ? (
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
                            className="w-full px-2 py-1 border rounded"
                            value={row.pieces}
                            onChange={(e) => handleRowChange(row.id, 'pieces', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border rounded"
                            value={row.weight}
                            onChange={(e) => handleRowChange(row.id, 'weight', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border rounded"
                            value={row.length}
                            onChange={(e) => handleRowChange(row.id, 'length', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border rounded"
                            value={row.width}
                            onChange={(e) => handleRowChange(row.id, 'width', e.target.value)}
                          />
                        </td>
                        <td className="px-4 py-2 border-b">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border rounded"
                            value={row.height}
                            onChange={(e) => handleRowChange(row.id, 'height', e.target.value)}
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
            ) : (
              <div className="flex justify-center mb-6">
                <div className="max-w-md w-1/2">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="chargeableWeight">
                    Chargeable Weight (kg)
                  </label>
                  <input
                    type="number"
                    id="chargeableWeight"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-center text-lg font-semibold"
                    value={chargeableWeight}
                    onChange={(e) => setChargeableWeight(e.target.value)}
                    placeholder="Enter value"
                  />
                </div>
              </div>
            )}
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

export default SingleOfferPage; 