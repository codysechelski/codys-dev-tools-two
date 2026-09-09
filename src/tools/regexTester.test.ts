import { describe, expect, it } from 'vitest';
import { commonPatterns, flagsToString, testRegex, type RegexFlagsState } from './regexTester';

const noFlags: RegexFlagsState = {
  global: false,
  ignoreCase: false,
  multiline: false,
  dotAll: false,
  unicode: false,
  sticky: false,
};

describe('flagsToString', () => {
  it('builds a flag string in gimsuy order', () => {
    expect(flagsToString({ global: true, ignoreCase: true, multiline: true, dotAll: true, unicode: true, sticky: true })).toBe('gimsuy');
  });

  it('returns an empty string when no flags are set', () => {
    expect(flagsToString(noFlags)).toBe('');
  });

  it('includes only the enabled flags', () => {
    expect(flagsToString({ ...noFlags, ignoreCase: true, sticky: true })).toBe('iy');
  });
});

describe('testRegex', () => {
  it('returns no matches for an empty pattern or empty test text', () => {
    expect(testRegex('', noFlags, 'hello')).toEqual({ error: null, matches: [] });
    expect(testRegex('hello', noFlags, '')).toEqual({ error: null, matches: [] });
  });

  it('finds every match when the global flag is set', () => {
    const result = testRegex('a.', { ...noFlags, global: true }, 'ab ac ad');

    expect(result.error).toBeNull();
    expect(result.matches.map((match) => match.text)).toEqual(['ab', 'ac', 'ad']);
    expect(result.matches[0]).toMatchObject({ index: 0, endIndex: 2 });
  });

  it('stops after the first match when the global flag is not set', () => {
    const result = testRegex('a.', noFlags, 'ab ac ad');

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].text).toBe('ab');
  });

  it('reports a parse error for an invalid pattern instead of throwing', () => {
    const result = testRegex('(unterminated', { ...noFlags, global: true }, 'anything');

    expect(result.error).toBeTruthy();
    expect(result.matches).toEqual([]);
  });

  it('is case-insensitive when the ignoreCase flag is set', () => {
    const result = testRegex('hello', { ...noFlags, global: true, ignoreCase: true }, 'HELLO world');

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].text).toBe('HELLO');
  });

  it('captures numbered and named groups', () => {
    const result = testRegex('(?<year>\\d{4})-(\\d{2})', { ...noFlags, global: true }, '2026-09');

    expect(result.matches[0].groups).toEqual(['2026', '09']);
    expect(result.matches[0].namedGroups).toEqual({ year: '2026' });
  });

  it('caps the number of matches for pathological zero-width patterns', () => {
    const result = testRegex('a*', { ...noFlags, global: true }, 'b'.repeat(20000));

    expect(result.error).toBeNull();
    expect(result.matches.length).toBeLessThanOrEqual(5000);
  });
});

describe('commonPatterns', () => {
  it('exposes presets that compile and match a representative sample', () => {
    const samples: Record<string, string> = {
      email: 'contact me at hello@example.com',
      url: 'visit https://example.com/path?q=1 today',
      ipv4: 'server is at 192.168.1.1',
      'hex-color': 'brand color is #ff8800',
      'iso-date': 'due on 2026-09-09',
      'us-phone': 'call (555) 123-4567',
      integer: 'there are 42 items',
      decimal: 'total is 42.5 dollars',
    };

    for (const preset of commonPatterns) {
      const flags: RegexFlagsState = { ...noFlags, global: true, ...preset.flags };
      const result = testRegex(preset.pattern, flags, samples[preset.id]);

      expect(result.error).toBeNull();
      expect(result.matches.length).toBeGreaterThan(0);
    }
  });
});
