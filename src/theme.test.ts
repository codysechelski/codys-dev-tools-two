import { describe, expect, it } from 'vitest';
import { resolveTheme } from './theme';

describe('resolveTheme', () => {
  it('uses explicit light and dark modes', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  it('resolves system mode from the OS preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });
});
