export type Base64Mode = 'encode' | 'decode';

export interface Base64TransformResult {
  output: string;
  error: string;
}

export function transformBase64(input: string, mode: Base64Mode, urlSafe: boolean): Base64TransformResult {
  try {
    return {
      output: mode === 'encode' ? encodeBase64(input, urlSafe) : decodeBase64(input, urlSafe),
      error: '',
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unable to transform text',
    };
  }
}

export function encodeBase64(input: string, urlSafe: boolean): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  const base64 = btoa(binary);
  return urlSafe ? toUrlSafe(base64) : base64;
}

export function decodeBase64(input: string, urlSafe: boolean): string {
  const trimmed = input.trim().replace(/\s+/g, '');
  const normalized = urlSafe ? fromUrlSafe(trimmed) : padBase64(trimmed);

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('Input contains characters that are not valid base64.');
  }

  let binary: string;
  try {
    binary = atob(normalized);
  } catch {
    throw new Error('Input is not valid base64 (check the length and padding).');
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Decoded bytes aren't valid UTF-8 text. If this is an image, use the Base64 Image Converter instead.");
  }
}

function padBase64(base64: string): string {
  const paddingNeeded = (4 - (base64.length % 4)) % 4;
  return base64 + '='.repeat(paddingNeeded);
}

function toUrlSafe(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromUrlSafe(base64: string): string {
  return padBase64(base64.replace(/-/g, '+').replace(/_/g, '/'));
}
