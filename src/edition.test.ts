import { describe, expect, it } from 'vitest';
import { APP_EDITION, IS_ENTERPRISE, resolveEdition } from './edition';

describe('resolveEdition', () => {
  it('recognizes the enterprise edition', () => {
    expect(resolveEdition('enterprise')).toBe('enterprise');
  });

  it('falls back to the consumer edition for anything else', () => {
    expect(resolveEdition(undefined)).toBe('consumer');
    expect(resolveEdition('production')).toBe('consumer');
    expect(resolveEdition('')).toBe('consumer');
  });
});

describe('APP_EDITION', () => {
  it('is the consumer edition when no edition is baked in', () => {
    expect(APP_EDITION).toBe('consumer');
    expect(IS_ENTERPRISE).toBe(false);
  });
});
