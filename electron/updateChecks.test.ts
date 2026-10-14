import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runBackgroundUpdateCheck, scheduleBackgroundUpdateChecks } from './updateChecks';

describe('runBackgroundUpdateCheck', () => {
  it('checks for updates when automatic checks are enabled', async () => {
    const check = vi.fn();

    await expect(runBackgroundUpdateCheck(async () => true, check)).resolves.toBe(true);
    expect(check).toHaveBeenCalledOnce();
  });

  it('skips the check when automatic checks are disabled', async () => {
    const check = vi.fn();

    await expect(runBackgroundUpdateCheck(async () => false, check)).resolves.toBe(false);
    expect(check).not.toHaveBeenCalled();
  });

  it('falls back to checking when the setting cannot be read', async () => {
    const check = vi.fn();

    await runBackgroundUpdateCheck(async () => {
      throw new Error('unreadable');
    }, check);
    expect(check).toHaveBeenCalledOnce();
  });
});

describe('scheduleBackgroundUpdateChecks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('checks after the delay and on every interval, re-reading the setting each time', async () => {
    const check = vi.fn();
    let enabled = true;
    const stop = scheduleBackgroundUpdateChecks({ isEnabled: async () => enabled, check, delayMs: 10, intervalMs: 100 });

    await vi.advanceTimersByTimeAsync(10);
    expect(check).toHaveBeenCalledTimes(1);

    enabled = false;
    await vi.advanceTimersByTimeAsync(100);
    expect(check).toHaveBeenCalledTimes(1);

    enabled = true;
    await vi.advanceTimersByTimeAsync(100);
    expect(check).toHaveBeenCalledTimes(2);

    stop();
    await vi.advanceTimersByTimeAsync(1000);
    expect(check).toHaveBeenCalledTimes(2);
  });
});
