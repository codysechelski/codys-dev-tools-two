import { describe, expect, it } from 'vitest';
import { APP_DISTRIBUTION, APP_EDITION, CHECKS_FOR_UPDATES, IS_ENTERPRISE, IS_STORE_BUILD, SHOWS_DONATION_LINK, resolveDistribution, resolveEdition } from './edition';

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

describe('resolveDistribution', () => {
  it('recognizes the store distributions', () => {
    expect(resolveDistribution('mas')).toBe('mas');
    expect(resolveDistribution('msstore')).toBe('msstore');
  });

  it('falls back to direct distribution for anything else', () => {
    expect(resolveDistribution(undefined)).toBe('direct');
    expect(resolveDistribution('enterprise')).toBe('direct');
    expect(resolveDistribution('')).toBe('direct');
  });
});

describe('APP_EDITION', () => {
  it('is the consumer edition when no edition is baked in', () => {
    expect(APP_EDITION).toBe('consumer');
    expect(IS_ENTERPRISE).toBe(false);
  });
});

describe('APP_DISTRIBUTION', () => {
  it('is distributed directly, with update checks and the donation link, when nothing is baked in', () => {
    expect(APP_DISTRIBUTION).toBe('direct');
    expect(IS_STORE_BUILD).toBe(false);
    expect(CHECKS_FOR_UPDATES).toBe(true);
    expect(SHOWS_DONATION_LINK).toBe(true);
  });
});
