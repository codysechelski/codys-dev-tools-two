import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface AutoInstallCheck {
  platform: NodeJS.Platform;
  execPath: string;
  productName: string;
  fileExists?: (path: string) => boolean;
}

// Whether electron-updater can download and install updates for this copy of the app.
// macOS can't (the app isn't code-signed, so Squirrel.Mac rejects updates). On Windows, only the
// NSIS installer supports auto-update — electron-updater's Windows updater always downloads and
// runs the NSIS .exe, so for a portable .zip (or MSI) copy it would put a second, separate copy of
// the app on the machine instead of updating this one. NSIS installs are recognized by the
// uninstaller electron-builder places next to the app's executable; other copies have none.
// (The MSI is the enterprise edition, which never checks for updates in the first place.)
export function supportsAutoInstall({ platform, execPath, productName, fileExists = existsSync }: AutoInstallCheck): boolean {
  if (platform === 'darwin') return false;
  if (platform === 'win32') return fileExists(join(dirname(execPath), `Uninstall ${productName}.exe`));
  return true;
}
