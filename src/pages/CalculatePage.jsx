import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculateRowMetrics } from '../services/calculatorService'

const CalculatePage = () => {
  const [rows, setRows] = useState([
    { id: 1, pieces: '', weight: '', length: '', width: '', height: '', stackable: false }
  ])
  const [entryMode, setEntryMode] = useState('detailed') // 'detailed' or 'quick'
  const [chargeableWeight, setChargeableWeight] = useState('')
  const formRef = useRef(null)
  const navigate = useNavigate()

  const handleCalculate = () => {
    // Validation for quick entry mode
    if (entryMode === 'quick') {
      if (!chargeableWeight || parseFloat(chargeableWeight) <= 0) {
        alert('Please enter a chargeable weight greater than 0');
        return;
      }
    } else {
      // Validation for detailed entry mode
      if (rows.length === 0) {
        alert('Please add at least one row with item details');
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
        alert('Please fix the following issues:\n\n' + invalidRows.join('\n'));
        return;
      }
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

    // Both modes navigate to the same results page, just with different data structures
    if (entryMode === 'detailed') {
      navigate('/results', { 
        state: { 
          rows: rowsWithCalculations,
          calculationType: 'detailed'
        } 
      })
    } else {
      navigate('/results', { 
        state: { 
          chargeableWeight: parseFloat(chargeableWeight) || 0,
          calculationType: 'quick'
        } 
      })
    }
  }

  const handleAddRow = () => {
    const newRow = {
      id: rows.length + 1,
      pieces: '',
      weight: '',
      length: '',
      width: '',
      height: '',
      stackable: false,
    }
    setRows([...rows, newRow])
  }

  const handleSaveRow = (id, data) => {
    setRows(rows.map(row => (row.id === id ? { ...row, ...data } : row)))
  }

  const handleUpdateRow = (id, field, value) => {
    // For numeric fields, prevent zero values but allow empty strings for typing
    if (['pieces', 'weight', 'length', 'width', 'height'].includes(field)) {
      if (value !== '' && parseFloat(value) <= 0) {
        return; // Don't update if value is zero or negative
      }
    }
    
    setRows(rows.map(row => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const handleRemoveRow = (id) => {
    setRows(rows.filter(row => row.id !== id))
  }

  const toggleEntryMode = (mode) => {
    setEntryMode(mode)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <style jsx>{`
        /* Remove number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Shipping Calculator</h2>
          
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
          
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Input Units</h3>
                <div className="mt-1 text-sm text-blue-700">
                  Please enter all measurements in the specified units:
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li><strong>Weight:</strong> Kilograms (kg)</li>
                    <li><strong>Dimensions:</strong> Centimeters (cm)</li>
                    <li><strong>Pieces:</strong> Number of items</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          <form ref={formRef}>
            {entryMode === 'detailed' ? (
              <DynamicTable
                rows={rows}
                onAddRow={handleAddRow}
                onSaveRow={handleSaveRow}
                onUpdateRow={handleUpdateRow}
                onRemoveRow={handleRemoveRow}
              />
            ) : (
              <div className="flex justify-center mb-6">
                <div className="max-w-md w-1/2">
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
                    placeholder="Enter weight > 0"
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                onClick={handleCalculate}
              >
                Calculate
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const DynamicTable = ({ rows, onAddRow, onSaveRow, onUpdateRow, onRemoveRow }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Pieces
            </th>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Weight (kg)
            </th>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Length (cm)
            </th>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Width (cm)
            </th>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Height (cm)
            </th>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Stackable
            </th>
            <th className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              onSave={onSaveRow}
              onUpdate={onUpdateRow}
              onRemove={onRemoveRow}
              showRemoveButton={rows.length > 1}
            />
          ))}
          <tr>
            <td colSpan="7" className="px-4 py-2 border-b border-gray-200 text-center">
              <button
                type="button"
                className="text-primary hover:text-primary-dark font-semibold"
                onClick={onAddRow}
              >
                + Add Row
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const TableRow = ({ row, onSave, onUpdate, onRemove, showRemoveButton }) => {
  return (
    <tr>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="1"
          step="1"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.pieces}
          onChange={(e) => onUpdate(row.id, 'pieces', e.target.value)}
          placeholder="Number > 0"
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0.01"
          step="0.01"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.weight}
          onChange={(e) => onUpdate(row.id, 'weight', e.target.value)}
          placeholder="Weight > 0 kg"
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0.1"
          step="0.1"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.length}
          onChange={(e) => onUpdate(row.id, 'length', e.target.value)}
          placeholder="Length > 0 cm"
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0.1"
          step="0.1"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.width}
          onChange={(e) => onUpdate(row.id, 'width', e.target.value)}
          placeholder="Width > 0 cm"
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0.1"
          step="0.1"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.height}
          onChange={(e) => onUpdate(row.id, 'height', e.target.value)}
          placeholder="Height > 0 cm"
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <div className="flex items-center">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            checked={row.stackable}
            onChange={(e) => onUpdate(row.id, 'stackable', e.target.checked)}
          />
          <label className="ml-2 text-sm text-gray-700">
            {row.stackable ? 'Yes' : 'No'}
          </label>
        </div>
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        {showRemoveButton && (
          <button
            type="button"
            className="text-red-500 hover:text-red-700"
            onClick={() => onRemove(row.id)}
          >
            Remove
          </button>
        )}
      </td>
    </tr>
  )
}

export default CalculatePage 