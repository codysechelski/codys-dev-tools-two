import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('codyDevTools', {
  platform: process.platform,
  isElectron: true,
  loadTextFile: () => ipcRenderer.invoke('load-text-file'),
  onSetTheme: (callback: (mode: 'light' | 'dark' | 'system') => void) => {
    ipcRenderer.on('set-theme', (_event, mode: 'light' | 'dark' | 'system') => callback(mode));
  },
  notifyThemeChanged: (mode: 'light' | 'dark' | 'system') => {
    ipcRenderer.send('theme-mode-changed', mode);
  },
});
