import React, { useState, useEffect } from 'react';
import { saveZipCode, getZipCodeData, updateZipCode, deleteZipCode } from '../firebase/firebaseUtils';
import { signInAnonymousUser } from '../firebase/config';

const DatabasePage = () => {
  const [zipCode, setZipCode] = useState('');
  const [zone, setZone] = useState('');
  const [branch, setBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [savedZipCodes, setSavedZipCodes] = useState([]);
  const [activeView, setActiveView] = useState('view');
  const [editingRecord, setEditingRecord] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  useEffect(() => {
    // Initialize anonymous auth when component mounts
    const initAuth = async () => {
      try {
        await signInAnonymousUser();
        // Then fetch data
        fetchAllZipCodes();
      } catch (err) {
        console.error('Error initializing authentication:', err);
        setError('Failed to initialize authentication. Please try again.');
      }
    };
    
    initAuth();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let result;
      if (editingRecord) {
        // Update existing record
        result = await updateZipCode(editingRecord.id, {
          zipCode,
          zone,
          branch
        });
        if (result.success) {
          setMessage('Zip code updated successfully!');
          setEditingRecord(null);
        }
      } else {
        // Create new record
        result = await saveZipCode({
          zipCode,
          zone,
          branch
        });
        if (result.success) {
          setMessage('Zip code saved successfully!');
        }
      }

      if (result.success) {
        setZipCode('');
        setZone('');
        setBranch('');
        // Refresh all data
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

  const handleEdit = (record) => {
    setEditingRecord(record);
    setZipCode(record.zipCode);
    setZone(record.zone);
    setBranch(record.branch);
    setActiveView('add'); // Reuse the add form for editing
    setError(null);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setZipCode('');
    setZone('');
    setBranch('');
    setActiveView('view'); // Change view back to 'view' instead of staying in 'add'
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await deleteZipCode(id);
      if (result.success) {
        setMessage('Zip code deleted successfully!');
        setConfirmingDelete(null);
        // Refresh all data
        fetchAllZipCodes();
      } else {
        throw new Error('Failed to delete zip code');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkZipCode = async (zip) => {
    if (!zip) return;
    
    try {
      const result = await getZipCodeData(zip);
      if (result.success && result.data) {
        setSavedZipCodes([result.data]);
      } else {
        setSavedZipCodes([]);
      }
    } catch (err) {
      console.error('Error checking zip code:', err);
    }
  };

  // Handle delete all zip codes
  const handleDeleteAllZipCodes = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Delete each zip code one by one
      const deletePromises = savedZipCodes.map(record => deleteZipCode(record.id));
      const results = await Promise.all(deletePromises);
      
      // Check if any deletions failed
      const failedDeletions = results.filter(result => !result.success);
      
      if (failedDeletions.length === 0) {
        setMessage('All zip code records deleted successfully!');
        // Refresh zip codes data
        fetchAllZipCodes();
      } else {
        throw new Error('Failed to delete some zip code records');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setConfirmingDelete(null);
    }
  };

  // Render add/edit record form
  const renderAddRecordForm = () => (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">
        {editingRecord ? 'Edit Zip Code Record' : 'Add New Zip Code Record'}
      </h2>
      {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zipCode">
            Zip Code
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
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="zone">
            Zone
          </label>
          <input
            type="text"
            id="zone"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="branch">
            Branch
          </label>
          <input
            type="text"
            id="branch"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        
        <div className="flex items-center justify-end">
          <button
            type="button"
            className="mr-3 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={handleCancelEdit}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={loading}
          >
            {loading ? 'Saving...' : editingRecord ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render records table
  const renderRecordsTable = () => (
    <div className="bg-white shadow-md rounded-lg p-6 mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Zip Code Records</h2>
        <div className="flex space-x-3">
          <button
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
            onClick={() => {
              setActiveView('add');
              setEditingRecord(null);
              setZipCode('');
              setZone('');
              setBranch('');
              setError(null);
              setMessage(null);
            }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add New Record
          </button>
          {savedZipCodes.length > 0 && (
            <button
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
              onClick={() => setConfirmingDelete('all_zipcodes')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete All Records
            </button>
          )}
        </div>
      </div>
      
      {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      
      {/* Confirmation dialog for deleting all zip codes */}
      {confirmingDelete === 'all_zipcodes' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete All</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete all zip code records? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmingDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllZipCodes}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
      
      {savedZipCodes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Zip Code</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {savedZipCodes.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{record.zipCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{record.zone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">{record.branch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(record.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Confirmation dialog */}
                    {confirmingDelete === record.id && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
                          <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to delete this zip code record? This action cannot be undone.
                          </p>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => setConfirmingDelete(null)}
                              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No zip code records found.</p>
      )}
    </div>
  );

  // Main return 
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Database Management</h1>
        </div>

        {activeView === 'add' && renderAddRecordForm()}
        {activeView === 'view' && renderRecordsTable()}
      </div>
    </div>
  );
};

export default DatabasePage; 