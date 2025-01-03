const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executeQuery: (query) => ipcRenderer.invoke('get-cds', query),
  addCD: (cd) => ipcRenderer.invoke('add-cd', cd),
  updateCD: (cd) => ipcRenderer.invoke('update-cd', cd),
  deleteCD: (id) => ipcRenderer.invoke('delete-cd', id),
  getEnv: (key) => ipcRenderer.invoke('get-env', key),
});
