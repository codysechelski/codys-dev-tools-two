import { describe, expect, it } from 'vitest';
import { digitValue, formatInBase, isValidBase, parseInBase } from './baseConverter';

describe('digitValue', () => {
  it('maps digits and letters case-insensitively', () => {
    expect(digitValue('0')).toBe(0);
    expect(digitValue('9')).toBe(9);
    expect(digitValue('a')).toBe(10);
    expect(digitValue('A')).toBe(10);
    expect(digitValue('z')).toBe(35);
  });

  it('returns null for non-alphanumeric characters', () => {
    expect(digitValue('-')).toBeNull();
    expect(digitValue(' ')).toBeNull();
    expect(digitValue('!')).toBeNull();
  });
});

describe('isValidBase', () => {
  it('accepts whole numbers from 2 to 36', () => {
    expect(isValidBase(2)).toBe(true);
    expect(isValidBase(36)).toBe(true);
    expect(isValidBase(16)).toBe(true);
  });

  it('rejects out-of-range or non-integer bases', () => {
    expect(isValidBase(1)).toBe(false);
    expect(isValidBase(37)).toBe(false);
    expect(isValidBase(2.5)).toBe(false);
    expect(isValidBase(Number.NaN)).toBe(false);
  });
});

describe('parseInBase', () => {
  it('parses binary, octal, decimal, and hexadecimal representations of 255', () => {
    expect(parseInBase('11111111', 2)).toBe(255n);
    expect(parseInBase('377', 8)).toBe(255n);
    expect(parseInBase('255', 10)).toBe(255n);
    expect(parseInBase('ff', 16)).toBe(255n);
    expect(parseInBase('FF', 16)).toBe(255n);
  });

  it('parses base 36', () => {
    expect(parseInBase('73', 36)).toBe(255n);
    expect(parseInBase('z', 36)).toBe(35n);
  });

  it('handles a leading sign', () => {
    expect(parseInBase('-ff', 16)).toBe(-255n);
    expect(parseInBase('+ff', 16)).toBe(255n);
  });

  it('handles arbitrarily large values via BigInt', () => {
    expect(parseInBase('ffffffffffffffffff', 16)).toBe(BigInt('0xffffffffffffffffff'));
  });

  it('returns null for digits outside the given base', () => {
    expect(parseInBase('102', 2)).toBeNull();
    expect(parseInBase('89', 8)).toBeNull();
    expect(parseInBase('fg', 16)).toBeNull();
  });

  it('returns null for empty, whitespace-only, or sign-only input', () => {
    expect(parseInBase('', 10)).toBeNull();
    expect(parseInBase('   ', 10)).toBeNull();
    expect(parseInBase('-', 10)).toBeNull();
  });

  it('returns null for an invalid base', () => {
    expect(parseInBase('10', 1)).toBeNull();
    expect(parseInBase('10', 37)).toBeNull();
  });
});

describe('formatInBase', () => {
  it('formats 255 in common bases', () => {
    expect(formatInBase(255n, 2)).toBe('11111111');
    expect(formatInBase(255n, 8)).toBe('377');
    expect(formatInBase(255n, 10)).toBe('255');
    expect(formatInBase(255n, 16)).toBe('ff');
    expect(formatInBase(255n, 36)).toBe('73');
  });

  it('formats negative values and zero', () => {
    expect(formatInBase(-255n, 16)).toBe('-ff');
    expect(formatInBase(0n, 2)).toBe('0');
  });

  it('round-trips large values', () => {
    const value = 123456789012345678901234567890n;
    expect(parseInBase(formatInBase(value, 16), 16)).toBe(value);
  });

  it('returns an empty string for an invalid base', () => {
    expect(formatInBase(10n, 1)).toBe('');
    expect(formatInBase(10n, 37)).toBe('');
  });
});
