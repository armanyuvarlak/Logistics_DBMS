import React, { useState, useEffect } from 'react';
import { 
  saveZipCode, 
  getZipCodeData, 
  updateZipCode, 
  deleteZipCode,
  saveLanePair,
  getLanePairData,
  updateLanePair,
  deleteLanePair
} from '../firebase/firebaseUtils';
import { signInAnonymousUser } from '../firebase/firebaseConfig';

const DatabasePage = () => {
  // State for which data type is active
  const [activeDataType, setActiveDataType] = useState('zipCodes');
  const [activeView, setActiveView] = useState('view');
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  
  // Zip Code states
  const [zipCode, setZipCode] = useState('');
  const [zone, setZone] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isBranch, setIsBranch] = useState(false);
  const [extraFee, setExtraFee] = useState('');
  const [savedZipCodes, setSavedZipCodes] = useState([]);
  
  // Lane Pair states
  const [originBranch, setOriginBranch] = useState('');
  const [destinationBranch, setDestinationBranch] = useState('');
  const [fee, setFee] = useState('');
  const [ftlFee, setFtlFee] = useState('');
  const [savedLanePairs, setSavedLanePairs] = useState([]);

  useEffect(() => {
    // Initialize anonymous auth when component mounts
    const initAuth = async () => {
      try {
        await signInAnonymousUser();
        // Always fetch zip codes first to have branch data available
        await fetchAllZipCodes();
        
        // Then fetch data based on active data type
        if (activeDataType === 'lanePairs') {
          fetchAllLanePairs();
        }
      } catch (err) {
        console.error('Error initializing authentication:', err);
        setError('Failed to initialize authentication. Please try again.');
      }
    };
    
    initAuth();
  }, [activeDataType]);

  // ================= ZIP CODE FUNCTIONS =================

  const fetchAllZipCodes = async () => {
    try {
      setLoading(true);
      const result = await getZipCodeData();
      if (result.success && result.data) {
        setSavedZipCodes(Array.isArray(result.data) ? result.data : [result.data]);
      } else if (!result.success) {
        setError(result.error || "Failed to fetch zip codes");
      }
    } catch (err) {
      console.error('Error fetching zip codes:', err);
      setError("Failed to fetch zip codes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleZipCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate branch name format (3 letters)
    if (!/^[A-Za-z]{3}$/.test(branchName)) {
      setError('Branch name must be exactly 3 letters (e.g., NYC, LAX, CHI)');
      setLoading(false);
      return;
    }

    try {
      let result;
      const zipCodeData = {
        zipCode,
        branchName: branchName.toUpperCase(), // Always store in uppercase
        isBranch,
        zone: isBranch ? 'A' : zone, // Auto-set to A for branches
        extraFee: isBranch ? 0 : (extraFee ? parseFloat(extraFee) : 0) // Auto-set to 0 for branches
      };

      if (editingRecord) {
        result = await updateZipCode(editingRecord.id, zipCodeData);
        if (result.success) {
          setMessage('Zip code updated successfully!');
          setEditingRecord(null);
        }
      } else {
        result = await saveZipCode(zipCodeData);
        if (result.success) {
          setMessage('Zip code saved successfully!');
        }
      }

      if (result.success) {
        clearZipCodeForm();
        fetchAllZipCodes();
      } else {
        throw new Error(`Failed to ${editingRecord ? 'update' : 'save'} zip code`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearZipCodeForm = () => {
    setZipCode('');
    setZone('');
    setBranchName('');
    setIsBranch(false);
    setExtraFee('');
  };

  // ================= LANE PAIR FUNCTIONS =================
  
  const fetchAllLanePairs = async () => {
    try {
      setLoading(true);
      const result = await getLanePairData();
      if (result.success && result.data) {
        setSavedLanePairs(Array.isArray(result.data) ? result.data : [result.data]);
      } else if (!result.success) {
        setError(result.error || "Failed to fetch lane pairs");
      }
    } catch (err) {
      console.error('Error fetching lane pairs:', err);
      setError("Failed to fetch lane pairs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get available branches from zip codes
  const getAvailableBranches = () => {
    return savedZipCodes
      .filter(zipCode => zipCode.isBranch === true)
      .map(zipCode => zipCode.branchName)
      .filter((branchName, index, arr) => arr.indexOf(branchName) === index) // Remove duplicates
      .sort(); // Sort alphabetically
  };

  const handleLanePairSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate that both branches are selected and different
    if (originBranch === destinationBranch) {
      setError('Origin and destination branches must be different');
      setLoading(false);
      return;
    }

    try {
      let result;
      const lanePairData = {
        originBranch,
        destinationBranch,
        fee: parseFloat(fee),
        ftlFee: parseFloat(ftlFee)
      };

      if (editingRecord) {
        result = await updateLanePair(editingRecord.id, lanePairData);
        if (result.success) {
          setMessage('Lane pair updated successfully!');
          setEditingRecord(null);
        }
      } else {
        result = await saveLanePair(lanePairData);
        if (result.success) {
          setMessage('Lane pair saved successfully!');
        }
      }

      if (result.success) {
        clearLanePairForm();
        fetchAllLanePairs();
      } else {
        throw new Error(`Failed to ${editingRecord ? 'update' : 'save'} lane pair`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearLanePairForm = () => {
    setOriginBranch('');
    setDestinationBranch('');
    setFee('');
    setFtlFee('');
  };

  // ================= COMMON FUNCTIONS =================
  
  const handleEdit = (record) => {
    setEditingRecord(record);
    setError(null);
    setMessage(null);
    setActiveView('add');
    
    if (activeDataType === 'zipCodes') {
      setZipCode(record.zipCode || '');
      setBranchName(record.branchName || '');
      setIsBranch(record.isBranch || false);
      setZone(record.zone || '');
      setExtraFee(record.extraFee ? record.extraFee.toString() : '');
      } else {
      setOriginBranch(record.originBranch || '');
      setDestinationBranch(record.destinationBranch || '');
      setFee(record.fee ? record.fee.toString() : '');
      setFtlFee(record.ftlFee ? record.ftlFee.toString() : '');
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    if (activeDataType === 'zipCodes') {
      clearZipCodeForm();
    } else {
      clearLanePairForm();
    }
    setActiveView('view');
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let result;
      if (activeDataType === 'zipCodes') {
        result = await deleteZipCode(id);
        if (result.success) {
          setMessage('Zip code deleted successfully!');
        fetchAllZipCodes();
        }
      } else {
        result = await deleteLanePair(id);
        if (result.success) {
          setMessage('Lane pair deleted successfully!');
          fetchAllLanePairs();
        }
      }
      
      if (!result.success) {
        throw new Error(`Failed to delete ${activeDataType === 'zipCodes' ? 'zip code' : 'lane pair'}`);
      }
      
      setConfirmingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDataTypeChange = (dataType) => {
    setActiveDataType(dataType);
    setActiveView('view');
    setEditingRecord(null);
    setError(null);
    setMessage(null);
    setConfirmingDelete(null);
    clearZipCodeForm();
    clearLanePairForm();
  };

  // ================= RENDER FUNCTIONS =================
  
  const renderZipCodeForm = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        {editingRecord ? 'Edit Zip Code Record' : 'Add New Zip Code Record'}
      </h2>
      {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleZipCodeSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zipCode">
              Zip Code *
          </label>
          <input
            type="text"
            id="zipCode"
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branchName">
              Branch Name * <span className="text-gray-500 text-xs">(3 letters, e.g., NYC)</span>
            </label>
            <input
              type="text"
              id="branchName"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value.toUpperCase())}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              maxLength="3"
              placeholder="NYC"
              pattern="[A-Za-z]{3}"
              title="Must be exactly 3 letters"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isBranch}
              onChange={(e) => setIsBranch(e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-gray-700 text-sm font-bold">
              This zip code is a branch location
            </span>
          </label>
          {isBranch && (
            <p className="text-sm text-blue-600 mt-1">
              Zone will be automatically set to "A" and extra fee to 0%
            </p>
          )}
        </div>

        {!isBranch && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zone">
                Zone * <span className="text-gray-500 text-xs">(distance from branch)</span>
          </label>
          <input
            type="text"
            id="zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required={!isBranch}
                placeholder="A, B, C, etc."
          />
        </div>
        
        <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="extraFee">
                Extra Fee Percentage <span className="text-gray-500 text-xs">(% of chargeable weight)</span>
          </label>
              <div className="relative">
          <input
                  type="number"
                  id="extraFee"
                  value={extraFee}
                  onChange={(e) => setExtraFee(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 pr-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.001"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This percentage will be applied to the chargeable weight
              </p>
            </div>
        </div>
        )}
        
        <div className="flex items-center justify-between mt-6">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Saving...' : (editingRecord ? 'Update Zip Code' : 'Save Zip Code')}
          </button>
          {editingRecord && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );

  const renderLanePairForm = () => {
    const availableBranches = getAvailableBranches();
    const hasBranches = availableBranches.length > 0;

    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingRecord ? 'Edit Lane Pair Record' : 'Add New Lane Pair Record'}
        </h2>
        {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        
        {!hasBranches && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p className="font-medium">No branch locations available!</p>
            <p className="text-sm mt-1">
              You need to add branch locations in the Zip Codes section first. 
              Make sure to check "This zip code is a branch location" when adding branches.
            </p>
          </div>
        )}
        
        <form onSubmit={handleLanePairSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="originBranch">
                Origin Branch *
              </label>
              <select
                id="originBranch"
                value={originBranch}
                onChange={(e) => setOriginBranch(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={!hasBranches}
              >
                <option value="">
                  {hasBranches ? 'Select origin branch' : 'No branches available'}
                </option>
                {availableBranches.map((branchName) => (
                  <option key={branchName} value={branchName}>
                    {branchName}
                  </option>
                ))}
              </select>
              {hasBranches && (
                <p className="text-xs text-gray-500 mt-1">
                  {availableBranches.length} branch{availableBranches.length !== 1 ? 'es' : ''} available
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destinationBranch">
                Destination Branch *
              </label>
              <select
                id="destinationBranch"
                value={destinationBranch}
                onChange={(e) => setDestinationBranch(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
                disabled={!hasBranches}
              >
                <option value="">
                  {hasBranches ? 'Select destination branch' : 'No branches available'}
                </option>
                {availableBranches.map((branchName) => (
                  <option key={branchName} value={branchName}>
                    {branchName}
                  </option>
                ))}
              </select>
              {hasBranches && (
                <p className="text-xs text-gray-500 mt-1">
                  Must be different from origin branch
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fee">
                Fee Percentage * <span className="text-gray-500 text-xs">(% of chargeable weight)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="fee"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 pr-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="0"
                  max="100"
                  step="0.001"
                  disabled={!hasBranches}
                  placeholder="0"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This percentage will be applied to the chargeable weight
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ftlFee">
                Full Truck Load Fee (FTL) * <span className="text-gray-500 text-xs">(fixed amount in €)</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">€</span>
                <input
                  type="number"
                  id="ftlFee"
                  value={ftlFee}
                  onChange={(e) => setFtlFee(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 pl-8 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                  min="0"
                  step="0.01"
                  disabled={!hasBranches}
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Fixed amount for full truck load shipments
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <button
              type="submit"
              disabled={loading || !hasBranches}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Saving...' : (editingRecord ? 'Update Lane Pair' : 'Save Lane Pair')}
            </button>
            {editingRecord && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Cancel
              </button>
            )}
          </div>
          
          {!hasBranches && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleDataTypeChange('zipCodes')}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Go to Zip Codes to Add Branches
              </button>
            </div>
          )}
        </form>
      </div>
    );
  };

  const renderZipCodeTable = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Zip Code Records</h2>
        <button
          onClick={() => {
            setActiveView('add');
            setEditingRecord(null);
            clearZipCodeForm();
          }}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add New Zip Code
        </button>
      </div>
      
      {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : savedZipCodes.length === 0 ? (
        <div className="text-center py-4 text-gray-500">No zip code records found.</div>
      ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Zip Code
                  </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Branch Name
                </th>
                <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Zone
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                  Extra Fee %
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {savedZipCodes.map((record) => (
                  <tr key={record.id}>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">{record.zipCode}</td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm font-medium">
                    {record.branchName || record.branch || 'N/A'}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {record.isBranch ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Branch
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Connected
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    <span className={`font-medium ${record.zone === 'A' ? 'text-green-600' : 'text-blue-600'}`}>
                      {record.zone}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b border-gray-200 text-sm">
                    {record.extraFee ? `${record.extraFee}%` : '0%'}
                  </td>
                    <td className="py-2 px-4 border-b border-gray-200 text-sm">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      {confirmingDelete === record.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="text-red-600 hover:text-red-900 mr-1"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmingDelete(record.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      )}
    </div>
  );

  const renderLanePairTable = () => {
    const availableBranches = getAvailableBranches();
    
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Lane Pair Records</h2>
            {savedLanePairs.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {savedLanePairs.length} lane pair{savedLanePairs.length !== 1 ? 's' : ''} configured
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setActiveView('add');
              setEditingRecord(null);
              clearLanePairForm();
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={availableBranches.length < 2}
            title={availableBranches.length < 2 ? 'Need at least 2 branches to create lane pairs' : ''}
          >
            Add New Lane Pair
          </button>
        </div>
        
        {availableBranches.length < 2 && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
            <p className="font-medium">Need more branches!</p>
            <p className="text-sm mt-1">
              You need at least 2 branch locations to create lane pairs. 
              Currently you have {availableBranches.length} branch{availableBranches.length !== 1 ? 'es' : ''}.
            </p>
          </div>
        )}
        
        {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
        {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
        
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : savedLanePairs.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No lane pair records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Origin Branch
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Destination Branch
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Fee %
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    FTL Fee €
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {savedLanePairs.map((record) => {
                  const originExists = availableBranches.includes(record.originBranch);
                  const destinationExists = availableBranches.includes(record.destinationBranch);
                  const hasInvalidBranches = !originExists || !destinationExists;
                  
                  return (
                    <tr key={record.id} className={hasInvalidBranches ? 'bg-red-50' : ''}>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        <span className={!originExists ? 'text-red-600 font-medium' : ''}>
                          {record.originBranch}
                          {!originExists && ' ⚠️'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        <span className={!destinationExists ? 'text-red-600 font-medium' : ''}>
                          {record.destinationBranch}
                          {!destinationExists && ' ⚠️'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        {record.fee ? `${record.fee}%` : '0%'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        €{record.ftlFee ? record.ftlFee.toFixed(2) : '0.00'}
                      </td>
                      <td className="py-2 px-4 border-b border-gray-200 text-sm">
                        <button
                          onClick={() => handleEdit(record)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                          disabled={hasInvalidBranches}
                          title={hasInvalidBranches ? 'Cannot edit - referenced branches no longer exist' : ''}
                        >
                          Edit
                        </button>
                        {confirmingDelete === record.id ? (
                          <>
                  <button
                              onClick={() => handleDelete(record.id)}
                              className="text-red-600 hover:text-red-900 mr-1"
                  >
                              Confirm
                  </button>
                  <button
                    onClick={() => setConfirmingDelete(null)}
                              className="text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                          </>
              ) : (
                <button
                            onClick={() => setConfirmingDelete(record.id)}
                            className="text-red-600 hover:text-red-900"
                            title={hasInvalidBranches ? 'Delete this invalid lane pair' : ''}
                >
                            Delete
                </button>
              )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Show legend for invalid entries */}
            {savedLanePairs.some(record => 
              !availableBranches.includes(record.originBranch) || 
              !availableBranches.includes(record.destinationBranch)
            ) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm">
                <p className="text-red-700 font-medium">⚠️ Warning: Some lane pairs reference branches that no longer exist</p>
                <p className="text-red-600 text-xs mt-1">
                  These entries are highlighted in red. You can delete them or recreate the missing branches in the Zip Codes section.
                </p>
            </div>
          )}
          </div>
      )}
    </div>
  );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>
      
      {/* Data Type Selection */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => handleDataTypeChange('zipCodes')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeDataType === 'zipCodes'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Zip Codes
        </button>
        <button
          onClick={() => handleDataTypeChange('lanePairs')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeDataType === 'lanePairs'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Lane Pairs
        </button>
      </div>

      {/* View/Add Toggle */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveView('view')}
          className={`mr-2 py-2 px-4 rounded-t-lg ${
            activeView === 'view'
              ? 'bg-white text-blue-500 border-t border-l border-r'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          View Records
        </button>
        <button
          onClick={() => {
            setActiveView('add');
            setEditingRecord(null);
            if (activeDataType === 'zipCodes') {
              clearZipCodeForm();
            } else {
              clearLanePairForm();
            }
          }}
          className={`py-2 px-4 rounded-t-lg ${
            activeView === 'add'
              ? 'bg-white text-blue-500 border-t border-l border-r'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Add Record
        </button>
      </div>
      
      {/* Content Area */}
      {activeView === 'add' ? (
        activeDataType === 'zipCodes' ? renderZipCodeForm() : renderLanePairForm()
      ) : (
        activeDataType === 'zipCodes' ? renderZipCodeTable() : renderLanePairTable()
      )}
    </div>
  );
};

export default DatabasePage; 