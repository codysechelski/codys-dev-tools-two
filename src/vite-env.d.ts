/// <reference types="vite/client" />

interface Window {
  codyDevTools?: {
    platform: NodeJS.Platform;
    isElectron: true;
    loadTextFile: () => Promise<{ name: string; content?: string; error?: string } | null>;
  };
}
