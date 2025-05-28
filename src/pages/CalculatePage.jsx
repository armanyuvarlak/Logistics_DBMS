import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const CalculatePage = () => {
  const [rows, setRows] = useState([
    { id: 1, pieces: '', weight: '', length: '', width: '', height: '', stackable: false }
  ])
  const [entryMode, setEntryMode] = useState('detailed') // 'detailed' or 'quick'
  const [chargeableWeight, setChargeableWeight] = useState('')
  const formRef = useRef(null)
  const navigate = useNavigate()

  const handleCalculate = () => {
    // Calculate volume for each row based on dimensions before navigating
    const rowsWithVolume = rows.map(row => {
      // Only calculate volume if all dimensions are present
      let volume = '';
      if (row.length && row.width && row.height) {
        // Convert dimensions from cm to m and calculate volume in m³
        const lengthM = parseFloat(row.length) / 100;
        const widthM = parseFloat(row.width) / 100;
        const heightM = parseFloat(row.height) / 100;
        volume = (lengthM * widthM * heightM).toFixed(2);
      }
      return { ...row, volume };
    });

    // Both modes navigate to the same results page, just with different data structures
    if (entryMode === 'detailed') {
      navigate('/results', { 
        state: { 
          rows: rowsWithVolume,
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
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.pieces}
          onChange={(e) => onUpdate(row.id, 'pieces', e.target.value)}
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.weight}
          onChange={(e) => onUpdate(row.id, 'weight', e.target.value)}
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.length}
          onChange={(e) => onUpdate(row.id, 'length', e.target.value)}
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.width}
          onChange={(e) => onUpdate(row.id, 'width', e.target.value)}
        />
      </td>
      <td className="px-4 py-2 border-b border-gray-200">
        <input
          type="number"
          min="0"
          className="w-full px-2 py-1 border border-gray-300 rounded"
          value={row.height}
          onChange={(e) => onUpdate(row.id, 'height', e.target.value)}
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