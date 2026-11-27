// electron-builder config for the Mac App Store: a sandboxed, universal build signed with the Apple
// Distribution certificate and packed into a .pkg (Mac Installer Distribution) for Transporter.
// Builds on package.json's "build" block and overrides only what differs. Package it after building
// the app in `mas` mode, so the distribution is baked in (see src/edition.ts):
//
//   npm run dist:mas       Submission .pkg (build/embedded.provisionprofile)
//   npm run dist:mas-dev   The same sandboxed app signed for this Mac, to test before submitting
//                          (build/development.provisionprofile)
//
// See docs/store-releases.md.
const { existsSync } = require('node:fs');
const { build } = require('./package.json');

// Provisioning profiles aren't secret (one ships inside every App Store app), so they live in
// build/ once they exist. Without them builds still package, but can't be submitted or launched.
// Signing also writes ElectronTeamID (from the profile) into Info.plist; Electron derives the
// sandbox's application group from it, so it has to match the one in the entitlements.
const provisioningProfile = 'build/embedded.provisionprofile';
const developmentProfile = 'build/development.provisionprofile';

module.exports = {
  ...build,
  // electron-builder refuses shell-special characters, including a straight apostrophe, in the
  // .app name of Mac App Store builds; the typographic apostrophe reads the same in Finder.
  productName: 'Cody’s Dev Tools',
  artifactName: '${name}-mas-${version}-${arch}.${ext}',
  directories: { ...build.directories, output: 'release/mas' },
  mac: {
    ...build.mac,
    // Read from here by the mas targets too (electron-builder ignores mas.extendInfo). The app uses
    // only the encryption built into macOS, so App Store Connect skips the export-compliance
    // question on each upload.
    extendInfo: { ...build.mac.extendInfo, ITSAppUsesNonExemptEncryption: false },
  },
  mas: {
    hardenedRuntime: false,
    entitlements: 'build/entitlements.mas.plist',
    entitlementsInherit: 'build/entitlements.mas.inherit.plist',
    ...(existsSync(provisioningProfile) ? { provisioningProfile } : {}),
  },
  masDev: {
    hardenedRuntime: false,
    entitlements: 'build/entitlements.mas.plist',
    entitlementsInherit: 'build/entitlements.mas.inherit.plist',
    ...(existsSync(developmentProfile) ? { provisioningProfile: developmentProfile } : {}),
  },
  // The App Store delivers updates: never publish these builds or a latest-mac.yml manifest.
  publish: null,
};
