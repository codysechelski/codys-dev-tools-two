export const SUPPORTED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon'] as const;

const MIME_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'image/bmp': 'bmp',
  'image/x-icon': 'ico',
};

export function extensionForMime(mime: string): string {
  return MIME_EXTENSIONS[mime] ?? 'bin';
}

export interface ParsedDataUrl {
  mime: string;
  base64: string;
}

const DATA_URL_PATTERN = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([\s\S]*)$/i;

export function parseDataUrl(input: string): ParsedDataUrl | null {
  const match = DATA_URL_PATTERN.exec(input.trim());
  if (!match) return null;

  return { mime: match[1].toLowerCase(), base64: match[2].replace(/\s+/g, '') };
}

export function buildDataUrl(mime: string, base64: string): string {
  return `data:${mime};base64,${base64}`;
}

export function buildCssSnippet(dataUrl: string): string {
  return `background-image: url("${dataUrl}");`;
}

export function buildHtmlSnippet(dataUrl: string): string {
  return `<img src="${dataUrl}" alt="" />`;
}

export function estimateDecodedByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
