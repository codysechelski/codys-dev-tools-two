// Which edition this build is, and how it's distributed. Both are baked in at build time:
// electron.vite.config.ts defines __APP_EDITION__ and __APP_DISTRIBUTION__ from the build mode
// (`electron-vite build --mode enterprise|mas|msstore`). Anything else — the web build,
// `npm run dev`, tests — has no define and is the consumer edition, distributed directly.
//
// The enterprise edition is for managed (IT-deployed) installs: it ships as the Windows .msi and
// macOS .pkg/.dmg, drops the "Buy Me a Coffee" link, and turns off update checks entirely since
// IT controls which version is installed. Shared by the Electron main process and the renderer.
//
// The store distributions are the consumer edition packaged for the Mac App Store (`mas`) and the
// Microsoft Store (`msstore`). Stores deliver updates themselves, so neither checks for updates.
// See docs/store-releases.md.
export type AppEdition = 'consumer' | 'enterprise';
export type AppDistribution = 'direct' | 'mas' | 'msstore';

declare const __APP_EDITION__: string | undefined;
declare const __APP_DISTRIBUTION__: string | undefined;

export function resolveEdition(value: string | undefined): AppEdition {
  return value === 'enterprise' ? 'enterprise' : 'consumer';
}

export function resolveDistribution(value: string | undefined): AppDistribution {
  return value === 'mas' || value === 'msstore' ? value : 'direct';
}

export const APP_EDITION: AppEdition = resolveEdition(typeof __APP_EDITION__ === 'string' ? __APP_EDITION__ : undefined);
export const IS_ENTERPRISE = APP_EDITION === 'enterprise';

export const APP_DISTRIBUTION: AppDistribution = resolveDistribution(typeof __APP_DISTRIBUTION__ === 'string' ? __APP_DISTRIBUTION__ : undefined);
export const IS_STORE_BUILD = APP_DISTRIBUTION !== 'direct';

// "Check for Updates…", background checks, and the Updates settings section.
export const CHECKS_FOR_UPDATES = !IS_ENTERPRISE && !IS_STORE_BUILD;
// The "Buy Me a Coffee" link on the home panel. Kept in both store builds: Microsoft lets non-game
// apps take payments their own way, and Apple allows external links on the US storefront, but App
// Review elsewhere may ask for tips to go through In-App Purchase. If it does, add
// `&& APP_DISTRIBUTION !== 'mas'` here (docs/store-releases.md → Donation link).
export const SHOWS_DONATION_LINK = !IS_ENTERPRISE;
