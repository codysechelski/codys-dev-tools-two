import { describe, expect, it } from 'vitest';
import { buildSvgPreviewUrl, formatDimension, validateSvg } from './svgViewer';

const VALID_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><circle cx="10" cy="10" r="5" /></svg>';

describe('validateSvg', () => {
  it('treats an empty or whitespace-only string as empty, not an error', () => {
    expect(validateSvg('')).toEqual({ valid: false, error: null, width: null, height: null });
    expect(validateSvg('   \n  ')).toEqual({ valid: false, error: null, width: null, height: null });
  });

  it('accepts a well-formed svg and reads its width/height attributes', () => {
    const result = validateSvg(VALID_SVG);

    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
  });

  it('falls back to the viewBox dimensions when width/height are missing', () => {
    const result = validateSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80"><rect /></svg>');

    expect(result.valid).toBe(true);
    expect(result.width).toBe(200);
    expect(result.height).toBe(80);
  });

  it('prefers explicit width/height over viewBox when both are present', () => {
    const result = validateSvg('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20" viewBox="0 0 999 999"><rect /></svg>');

    expect(result.width).toBe(10);
    expect(result.height).toBe(20);
  });

  it('reports no dimensions when neither width/height nor viewBox are present', () => {
    const result = validateSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect /></svg>');

    expect(result.valid).toBe(true);
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
  });

  it('rejects malformed XML with an error and no dimensions', () => {
    const result = validateSvg('<svg><rect></svg>');

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.width).toBeNull();
    expect(result.height).toBeNull();
  });

  it('rejects a document whose root element is not <svg>', () => {
    const result = validateSvg('<div>not an svg</div>');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Expected the root element to be <svg>.');
  });

  it('rejects an unclosed tag', () => {
    const result = validateSvg('<svg xmlns="http://www.w3.org/2000/svg">');

    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('buildSvgPreviewUrl', () => {
  it('encodes the source as a data: URL usable in an <img> src', () => {
    const url = buildSvgPreviewUrl(VALID_SVG);

    expect(url.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(url.slice('data:image/svg+xml,'.length))).toBe(VALID_SVG);
  });
});

describe('formatDimension', () => {
  it('renders whole numbers without a decimal point', () => {
    expect(formatDimension(100)).toBe('100');
  });

  it('trims trailing zeros from fractional values', () => {
    expect(formatDimension(12.5)).toBe('12.5');
    expect(formatDimension(12.10)).toBe('12.1');
  });
});
