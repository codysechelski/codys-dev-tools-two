/// <reference types="vite/client" />

import type { AppSettings } from '@/settings';

declare global {
  interface SettingsLocationResult {
    settingsPath: string;
    isCustomLocation: boolean;
    warning?: string;
  }

  interface UpdateNotice {
    version: string;
    // 'install': downloaded and ready — quitAndInstallUpdate() applies it.
    // 'manual': found but this platform can't auto-install (unsigned macOS build) — send the
    // user to releasesUrl to download and reinstall by hand.
    action: 'install' | 'manual';
    releasesUrl: string;
  }

  interface Window {
    // The File System Access API's types (FileSystemFileHandle etc.) are in lib.dom.d.ts, but
    // this entry point isn't — it's still Chromium-desktop-only. Used by TextEditor.vue's web
    // "Save" fallback to get a real native save dialog when available, instead of always
    // dropping straight into Downloads.
    showSaveFilePicker?: (options?: { suggestedName?: string }) => Promise<FileSystemFileHandle>;
    codyDevTools?: {
      platform: NodeJS.Platform;
      isElectron: true;
      loadTextFile: () => Promise<{ name: string; content?: string; error?: string } | null>;
      saveTextFile: (defaultFilename: string, content: string) => Promise<{ canceled: boolean; filePath?: string }>;
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
      onUpdateNotice: (callback: (notice: UpdateNotice) => void) => void;
      quitAndInstallUpdate: () => void;
      triggerMenuAction: (id: string) => void;
    };
  }
}

export {};
