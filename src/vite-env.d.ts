/// <reference types="vite/client" />

import type { AppSettings } from '@/settings';

declare global {
  interface SettingsLocationResult {
    settingsPath: string;
    isCustomLocation: boolean;
    warning?: string;
  }

  interface Window {
    codyDevTools?: {
      platform: NodeJS.Platform;
      isElectron: true;
      loadTextFile: () => Promise<{ name: string; content?: string; error?: string } | null>;
      onSetTheme: (callback: (mode: 'light' | 'dark' | 'system') => void) => void;
      notifyThemeChanged: (mode: 'light' | 'dark' | 'system') => void;
      onNavigateHome: (callback: () => void) => void;
      onNavigateSettings: (callback: () => void) => void;
      loadSettings: () => Promise<{ settings: AppSettings } & SettingsLocationResult>;
      saveSettings: (settings: AppSettings) => Promise<{ settingsPath: string }>;
      chooseSettingsDirectory: () => Promise<SettingsLocationResult | null>;
      resetSettingsDirectory: () => Promise<SettingsLocationResult>;
      loadToolState: () => Promise<Record<string, Record<string, unknown>>>;
      saveToolState: (state: Record<string, Record<string, unknown>>) => Promise<void>;
      clearToolState: () => Promise<void>;
      onUpdateDownloaded: (callback: (version: string) => void) => void;
      quitAndInstallUpdate: () => void;
    };
  }
}

export {};
