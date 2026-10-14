export interface WindowSize {
  width: number;
  height: number;
}

export const DEFAULT_WINDOW_SIZE: WindowSize = { width: 1440, height: 780 };
export const MIN_WINDOW_SIZE: WindowSize = { width: 900, height: 620 };

// Shrink the preferred launch size to fit the display's work area (which already excludes the
// macOS menu bar/Dock and the Windows taskbar) so a smaller laptop screen never opens the window
// partly off-screen. The min size still wins on displays smaller than it, matching what
// BrowserWindow itself would enforce.
export function resolveDefaultWindowSize(workArea: WindowSize): WindowSize {
  return {
    width: Math.max(MIN_WINDOW_SIZE.width, Math.min(DEFAULT_WINDOW_SIZE.width, workArea.width)),
    height: Math.max(MIN_WINDOW_SIZE.height, Math.min(DEFAULT_WINDOW_SIZE.height, workArea.height)),
  };
}
