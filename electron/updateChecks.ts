export interface BackgroundUpdateCheckOptions {
  // Re-read on every tick so toggling the setting takes effect without a restart.
  isEnabled: () => Promise<boolean>;
  check: () => void;
  delayMs: number;
  intervalMs: number;
}

export async function runBackgroundUpdateCheck(isEnabled: () => Promise<boolean>, check: () => void): Promise<boolean> {
  let enabled = true;
  try {
    enabled = await isEnabled();
  } catch {
    // Unreadable settings fall back to the default (enabled), matching mergeSettings.
  }
  if (enabled) check();
  return enabled;
}

export function scheduleBackgroundUpdateChecks({ isEnabled, check, delayMs, intervalMs }: BackgroundUpdateCheckOptions): () => void {
  const tick = (): void => {
    void runBackgroundUpdateCheck(isEnabled, check);
  };
  const timeout = setTimeout(tick, delayMs);
  const interval = setInterval(tick, intervalMs);

  return () => {
    clearTimeout(timeout);
    clearInterval(interval);
  };
}
