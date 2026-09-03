import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('codyDevTools', {
  platform: process.platform,
  isElectron: true,
});
