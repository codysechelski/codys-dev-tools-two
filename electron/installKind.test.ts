import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { supportsAutoInstall } from './installKind';

const productName = "Cody's Dev Tools";
const installDir = join('C:', 'Program Files', productName);
const execPath = join(installDir, `${productName}.exe`);

describe('supportsAutoInstall', () => {
  it('never auto-installs on macOS', () => {
    expect(supportsAutoInstall({ platform: 'darwin', execPath: '/Applications/App.app', productName, fileExists: () => true })).toBe(false);
  });

  it('auto-installs on Windows when the NSIS uninstaller is next to the executable', () => {
    const uninstaller = join(installDir, `Uninstall ${productName}.exe`);

    expect(supportsAutoInstall({ platform: 'win32', execPath, productName, fileExists: (path) => path === uninstaller })).toBe(true);
  });

  it('does not auto-install on Windows for MSI or portable installs without the NSIS uninstaller', () => {
    expect(supportsAutoInstall({ platform: 'win32', execPath, productName, fileExists: () => false })).toBe(false);
  });

  it('auto-installs on Linux', () => {
    expect(supportsAutoInstall({ platform: 'linux', execPath: '/opt/app/app', productName, fileExists: () => false })).toBe(true);
  });
});
