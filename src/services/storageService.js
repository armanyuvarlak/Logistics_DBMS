/**
 * Storage service that handles data storage either using Electron's store or localStorage
 * depending on the environment
 */

// Check if we're running in Electron
const isElectron = () => {
  return window && window.electronAPI;
};

/**
 * Save data to storage
 * @param {string} key - The key to store the data under
 * @param {any} data - The data to store
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveData = async (key, data) => {
  try {
    if (isElectron()) {
      // Use Electron store
      return await window.electronAPI.setData(key, data);
    } else {
      // Use localStorage
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    }
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

/**
 * Load data from storage
 * @param {string} key - The key to load data from
 * @returns {Promise<any>} - The loaded data
 */
export const loadData = async (key) => {
  try {
    if (isElectron()) {
      // Use Electron store
      return await window.electronAPI.getData(key);
    } else {
      // Use localStorage
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('Error loading data:', error);
    return null;
  }
};

/**
 * Remove data from storage
 * @param {string} key - The key to remove data from
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const removeData = async (key) => {
  try {
    if (isElectron()) {
      // Use Electron store - set to null to delete
      return await window.electronAPI.setData(key, null);
    } else {
      // Use localStorage
      localStorage.removeItem(key);
      return true;
    }
  } catch (error) {
    console.error('Error removing data:', error);
    return false;
  }
}; 