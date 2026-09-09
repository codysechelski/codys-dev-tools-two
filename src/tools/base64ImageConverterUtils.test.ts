import { describe, expect, it } from 'vitest';
import { buildCssSnippet, buildDataUrl, buildHtmlSnippet, estimateDecodedByteLength, extensionForMime, formatBytes, parseDataUrl } from './base64ImageConverter';

describe('base64ImageConverter utilities', () => {
  it('parses a well-formed data URL', () => {
    expect(parseDataUrl('data:image/png;base64,AAAA')).toEqual({ mime: 'image/png', base64: 'AAAA' });
  });

  it('parses a data URL with a charset parameter', () => {
    expect(parseDataUrl('data:image/svg+xml;charset=utf-8;base64,AAAA')).toEqual({ mime: 'image/svg+xml', base64: 'AAAA' });
  });

  it('strips whitespace from the base64 payload', () => {
    expect(parseDataUrl('data:image/png;base64,AA\nAA BB')).toEqual({ mime: 'image/png', base64: 'AAAABB' });
  });

  it('returns null for text that is not a data URL', () => {
    expect(parseDataUrl('AAAA')).toBeNull();
    expect(parseDataUrl('not a data url at all')).toBeNull();
  });

  it('builds a data URL from a mime type and base64 payload', () => {
    expect(buildDataUrl('image/png', 'AAAA')).toBe('data:image/png;base64,AAAA');
  });

  it('builds a CSS background-image snippet', () => {
    expect(buildCssSnippet('data:image/png;base64,AAAA')).toBe('background-image: url("data:image/png;base64,AAAA");');
  });

  it('builds an HTML img snippet', () => {
    expect(buildHtmlSnippet('data:image/png;base64,AAAA')).toBe('<img src="data:image/png;base64,AAAA" alt="" />');
  });

  it('maps mime types to file extensions, falling back to bin', () => {
    expect(extensionForMime('image/png')).toBe('png');
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(extensionForMime('image/svg+xml')).toBe('svg');
    expect(extensionForMime('application/octet-stream')).toBe('bin');
  });

  it('estimates decoded byte length from base64 padding', () => {
    expect(estimateDecodedByteLength('YWJjZGVm')).toBe(6);
    expect(estimateDecodedByteLength('YWI=')).toBe(2);
    expect(estimateDecodedByteLength('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')).toBe(68);
  });

  it('formats byte counts into human-readable sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
