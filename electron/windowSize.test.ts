import { describe, expect, it } from 'vitest';
import { DEFAULT_WINDOW_SIZE, MIN_WINDOW_SIZE, resolveDefaultWindowSize } from './windowSize';

describe('resolveDefaultWindowSize', () => {
  it('opens wider than the previous 1200px default', () => {
    expect(DEFAULT_WINDOW_SIZE.width).toBeGreaterThan(1200);
  });

  it('uses the preferred size when the work area has room', () => {
    expect(resolveDefaultWindowSize({ width: 1728, height: 1079 })).toEqual(DEFAULT_WINDOW_SIZE);
  });

  it('shrinks to fit a smaller laptop work area', () => {
    expect(resolveDefaultWindowSize({ width: 1366, height: 728 })).toEqual({ width: 1366, height: 728 });
  });

  it('never drops below the minimum window size', () => {
    expect(resolveDefaultWindowSize({ width: 800, height: 600 })).toEqual(MIN_WINDOW_SIZE);
  });
});
