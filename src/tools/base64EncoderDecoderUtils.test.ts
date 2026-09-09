import { describe, expect, it } from 'vitest';
import { decodeBase64, encodeBase64, transformBase64 } from './base64EncoderDecoder';

describe('base64EncoderDecoder utilities', () => {
  it('encodes text to standard base64', () => {
    expect(encodeBase64("Cody's Dev Tools", false)).toBe('Q29keSdzIERldiBUb29scw==');
  });

  it('encodes unicode text correctly', () => {
    expect(encodeBase64('A😀', false)).toBe('QfCfmIA=');
  });

  it('encodes with a URL-safe alphabet and no padding', () => {
    expect(encodeBase64('subjects?', false)).toBe('c3ViamVjdHM/');
    expect(encodeBase64('subjects?', true)).toBe('c3ViamVjdHM_');
  });

  it('decodes standard base64 back to text', () => {
    expect(decodeBase64('Q29keSdzIERldiBUb29scw==', false)).toBe("Cody's Dev Tools");
  });

  it('decodes URL-safe base64 missing padding', () => {
    expect(decodeBase64('c3ViamVjdHM_', true)).toBe('subjects?');
  });

  it('tolerates whitespace and missing padding when decoding', () => {
    expect(decodeBase64('Q29 keSdz\nIERldiBUb29scw', false)).toBe("Cody's Dev Tools");
  });

  it('throws a friendly error for invalid base64 characters', () => {
    expect(() => decodeBase64('not valid base64!!!', false)).toThrow(/not valid base64/i);
  });

  it('throws a friendly error when decoded bytes are not valid UTF-8', () => {
    expect(() => decodeBase64('/w==', false)).toThrow(/base64 image converter/i);
  });

  it('uses mode to transform values and reports errors', () => {
    expect(transformBase64('hi', 'encode', false)).toEqual({ output: 'aGk=', error: '' });
    expect(transformBase64('aGk=', 'decode', false)).toEqual({ output: 'hi', error: '' });

    const failure = transformBase64('!!!', 'decode', false);
    expect(failure.output).toBe('');
    expect(failure.error).toBeTruthy();
  });
});
