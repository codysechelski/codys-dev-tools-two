import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('codyDevTools', {
  platform: process.platform,
  isElectron: true,
  loadTextFile: () => ipcRenderer.invoke('load-text-file'),
});
