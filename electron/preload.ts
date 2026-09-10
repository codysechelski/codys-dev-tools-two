import { contextBridge, ipcRenderer } from 'electron';

interface AppSettings {
  themeMode: 'light' | 'dark' | 'system';
  rememberToolInput: 'never' | 'session' | 'forever';
  defaultIndentStyle: '2-spaces' | '4-spaces' | 'tabs';
  defaultPreserveComments: boolean;
  defaultPreserveBlankLines: boolean;
  defaultCaseSensitive: boolean;
  defaultSortKeys: boolean;
  pinnedToolIds: string[];
  sidebarDensity: 'comfortable' | 'compact';
}

interface UpdateNotice {
  version: string;
  // 'install': downloaded and ready — quitAndInstallUpdate() applies it.
  // 'manual': found but this platform can't auto-install (unsigned macOS build) — send the user
  // to releasesUrl to download and reinstall by hand.
  action: 'install' | 'manual';
  releasesUrl: string;
}

contextBridge.exposeInMainWorld('codyDevTools', {
  platform: process.platform,
  isElectron: true,
  loadTextFile: () => ipcRenderer.invoke('load-text-file'),
  saveTextFile: (defaultFilename: string, content: string) => ipcRenderer.invoke('save-text-file', defaultFilename, content),
  onSetTheme: (callback: (mode: 'light' | 'dark' | 'system') => void) => {
    ipcRenderer.on('set-theme', (_event, mode: 'light' | 'dark' | 'system') => callback(mode));
  },
  notifyThemeChanged: (mode: 'light' | 'dark' | 'system') => {
    ipcRenderer.send('theme-mode-changed', mode);
  },
  onNavigateHome: (callback: () => void) => {
    ipcRenderer.on('navigate-home', () => callback());
  },
  onNavigateSettings: (callback: () => void) => {
    ipcRenderer.on('navigate-settings', () => callback());
  },
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('save-settings', settings),
  chooseSettingsDirectory: () => ipcRenderer.invoke('choose-settings-directory'),
  resetSettingsDirectory: () => ipcRenderer.invoke('reset-settings-directory'),
  loadToolState: () => ipcRenderer.invoke('load-tool-state'),
  saveToolState: (state: Record<string, Record<string, unknown>>) => ipcRenderer.invoke('save-tool-state', state),
  clearToolState: () => ipcRenderer.invoke('clear-tool-state'),
  onUpdateNotice: (callback: (notice: UpdateNotice) => void) => {
    ipcRenderer.on('update-notice', (_event, notice: UpdateNotice) => callback(notice));
  },
  quitAndInstallUpdate: () => {
    ipcRenderer.send('quit-and-install-update');
  },
  triggerMenuAction: (id: string) => {
    ipcRenderer.send('trigger-menu-action', id);
  },
});
