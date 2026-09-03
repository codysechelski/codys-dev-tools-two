/// <reference types="vite/client" />

interface Window {
  codyDevTools?: {
    platform: NodeJS.Platform;
    isElectron: true;
  };
}
