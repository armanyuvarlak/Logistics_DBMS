import React, { useState } from 'react'

const DynamicTable = ({ rows, onRowUpdate, onRemoveRow, onAddRow, onSave }) => {
  const [saveStatus, setSaveStatus] = useState('idle') // idle, saving, success

  const handleToggleAction = (index) => {
    const currentState = rows[index]?.action || 'add'
    onRowUpdate(index, 'action', currentState === 'add' ? 'delete' : 'add')
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    await onSave()
    setSaveStatus('success')
    
    setTimeout(() => {
      setSaveStatus('idle')
    }, 2000)
  }

  const handleStackableClick = (index, value) => {
    onRowUpdate(index, 'stackable', value)
  }

  return (
    <div className="flex-1 min-w-[300px]">
      <div className="overflow-hidden rounded shadow-sm">
        <table className="w-full border-collapse separate border-spacing-0">
          <thead>
            <tr>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Pieces</th>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Length</th>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Width</th>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Height</th>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Gross Weight</th>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Stackable</th>
              <th className="bg-evenRowBg text-textSecondary font-semibold text-left py-3.5 px-3 border-b border-borderColor text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-black/[0.02] transition-colors duration-200">
                <td className="py-3 px-3 border-b border-borderColor">
                  <input
                    type="text"
                    value={row.pieces}
                    onChange={(e) => onRowUpdate(index, 'pieces', e.target.value)}
                    placeholder="Pieces"
                    className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </td>
                <td className="py-3 px-3 border-b border-borderColor">
                  <input
                    type="text"
                    value={row.length}
                    onChange={(e) => onRowUpdate(index, 'length', e.target.value)}
                    placeholder="Length"
                    className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </td>
                <td className="py-3 px-3 border-b border-borderColor">
                  <input
                    type="text"
                    value={row.width}
                    onChange={(e) => onRowUpdate(index, 'width', e.target.value)}
                    placeholder="Width"
                    className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </td>
                <td className="py-3 px-3 border-b border-borderColor">
                  <input
                    type="text"
                    value={row.height}
                    onChange={(e) => onRowUpdate(index, 'height', e.target.value)}
                    placeholder="Height"
                    className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </td>
                <td className="py-3 px-3 border-b border-borderColor">
                  <input
                    type="text"
                    value={row.grossWeight}
                    onChange={(e) => onRowUpdate(index, 'grossWeight', e.target.value)}
                    placeholder="Gross Weight"
                    className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </td>
                <td className="py-3 px-3 border-b border-borderColor">
                  <div className="flex justify-center gap-1.5">
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center px-2.5 py-1.5 border rounded text-xs font-medium transition-all
                        ${row.stackable === 'Yes' 
                          ? 'bg-accent border-accent text-white' 
                          : 'bg-contentBg border-borderColor text-textSecondary hover:bg-evenRowBg'}`}
                      onClick={() => handleStackableClick(index, 'Yes')}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center px-2.5 py-1.5 border rounded text-xs font-medium transition-all
                        ${row.stackable === 'No' 
                          ? 'bg-danger border-danger text-white' 
                          : 'bg-contentBg border-borderColor text-textSecondary hover:bg-evenRowBg'}`}
                      onClick={() => handleStackableClick(index, 'No')}
                    >
                      No
                    </button>
                  </div>
                </td>
                <td className="py-3 px-3 border-b border-borderColor">
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleAction(index)}
                      className={`${row.action === 'delete' ? 'bg-danger hover:bg-danger-hover' : 'bg-accent hover:bg-accent-hover'} text-white px-2.5 py-1 rounded text-sm transition-all duration-200`}
                    >
                      {row.action === 'delete' ? 'Delete' : 'Add'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveRow(index)}
                      title="Remove row"
                      className="bg-danger text-white w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-200 hover:bg-danger-hover hover:scale-105"
                    >
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex gap-3 mt-standard px-2">
        <button 
          type="button" 
          onClick={onAddRow}
          className="btn btn-primary"
        >
          Add Row
        </button>
        <button 
          type="button" 
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`btn ${saveStatus === 'success' ? 'btn-success' : 'btn-success'}`}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? '✓ Saved' : 'Save'}
        </button>
      </div>
    </div>
  )
}

export default DynamicTable 