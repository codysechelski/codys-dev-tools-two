import { describe, expect, it } from 'vitest';
import { decodeUrl, encodeUrl, transformUrl } from './urlEncoderDecoder';

describe('urlEncoderDecoder utilities', () => {
  it('encodes full URLs by default', () => {
    expect(encodeUrl('https://example.com/search?q=Cody & tools#top', { component: false, formSpaces: false, rfc3986: false })).toBe(
      'https://example.com/search?q=Cody%20&%20tools#top',
    );
  });

  it('encodes URL components when enabled', () => {
    expect(encodeUrl('Cody & tools', { component: true, formSpaces: false, rfc3986: false })).toBe('Cody%20%26%20tools');
  });

  it('encodes spaces as plus for form-style output', () => {
    expect(encodeUrl('Cody tools', { component: true, formSpaces: true, rfc3986: false })).toBe('Cody+tools');
  });

  it('applies RFC 3986 strict encoding while preserving IPv6 brackets in full URLs', () => {
    expect(encodeUrl("http://[::1]/a!*'()", { component: false, formSpaces: false, rfc3986: true })).toBe(
      'http://[::1]/a%21%2A%27%28%29',
    );
  });

  it('decodes plus as spaces when form spaces are enabled', () => {
    expect(decodeUrl('Cody+%26+tools', { component: true, formSpaces: true })).toBe('Cody & tools');
  });

  it('returns transform errors for malformed input', () => {
    const result = transformUrl('%E0%A4%A', { mode: 'decode', component: true, formSpaces: false, rfc3986: false });

    expect(result.output).toBe('');
    expect(result.error).toBeTruthy();
  });
});
