import { vi } from 'vitest';

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});
