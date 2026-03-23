const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Add any APIs you want to expose to the React app here
  // For example, to check if we're in Electron:
  isElectron: true
});
