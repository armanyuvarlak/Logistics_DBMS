const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script is running!');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcRenderer.invoke('get-data', key),
    set: (key, value) => ipcRenderer.invoke('set-data', key, value),
  },
  systemInfo: {
    version: process.versions.electron,
    platform: process.platform,
  }
}); 