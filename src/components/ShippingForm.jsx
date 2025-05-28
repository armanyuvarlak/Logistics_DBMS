import React from 'react'

const ShippingForm = ({ originZip, destinationZip, setOriginZip, setDestinationZip, handleCalculate }) => {
  return (
    <div className="flex-none">
      <table className="w-auto">
        <tbody>
          <tr>
            <td className="py-3 font-medium text-textSecondary">
              <label htmlFor="origin-zip">
                Origin Zip Code:
              </label>
            </td>
            <td>
              <input 
                type="text" 
                id="origin-zip"
                name="origin-zip" 
                required
                value={originZip}
                onChange={(e) => setOriginZip(e.target.value)}
                className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </td>
          </tr>
          <tr>
            <td className="py-3 font-medium text-textSecondary">
              <label htmlFor="destination-zip">
                Destination Zip Code:
              </label>
            </td>
            <td>
              <input 
                type="text" 
                id="destination-zip"
                name="destination-zip" 
                required
                value={destinationZip}
                onChange={(e) => setDestinationZip(e.target.value)}
                className="w-full px-3 py-2.5 border border-borderColor rounded font-sans text-sm transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <button 
        type="button" 
        onClick={handleCalculate}
        className="btn btn-primary mt-standard"
      >
        Calculate
      </button>
    </div>
  )
}

export default ShippingForm 