// Which edition this build is. Baked in at build time: electron.vite.config.ts defines
// __APP_EDITION__ from the build mode (`electron-vite build --mode enterprise`). Anything else —
// the web build, `npm run dev`, tests — has no define and is the consumer edition.
//
// The enterprise edition is for managed (IT-deployed) installs: it ships as the Windows .msi and
// macOS .pkg/.dmg, drops the "Buy Me a Coffee" link, and turns off update checks entirely since
// IT controls which version is installed. Shared by the Electron main process and the renderer.
export type AppEdition = 'consumer' | 'enterprise';

declare const __APP_EDITION__: string | undefined;

export function resolveEdition(value: string | undefined): AppEdition {
  return value === 'enterprise' ? 'enterprise' : 'consumer';
}

export const APP_EDITION: AppEdition = resolveEdition(typeof __APP_EDITION__ === 'string' ? __APP_EDITION__ : undefined);
export const IS_ENTERPRISE = APP_EDITION === 'enterprise';
