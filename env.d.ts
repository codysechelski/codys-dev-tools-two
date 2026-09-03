/// <reference types="vite/client" />

interface Window {
  codyDevTools?: {
    platform: NodeJS.Platform;
    isElectron: true;
  };
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: Array<{
    description?: string;
    accept: Record<string, string[]>;
  }>;
}

interface FileSystemFileHandle {
  createWritable: () => Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

declare module 'unicode-name' {
  export function unicodeName(char: string | number): string | undefined;
}

declare module 'unicode-properties' {
  export function getCategory(codePoint: number): string;
}
