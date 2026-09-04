/// <reference types="vite/client" />

interface Window {
  codyDevTools?: {
    platform: NodeJS.Platform;
    isElectron: true;
    loadTextFile: () => Promise<{ name: string; content?: string; error?: string } | null>;
    onSetTheme: (callback: (mode: 'light' | 'dark' | 'system') => void) => void;
    notifyThemeChanged: (mode: 'light' | 'dark' | 'system') => void;
  };
}
