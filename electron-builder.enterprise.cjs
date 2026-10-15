// electron-builder config for the enterprise edition (see src/edition.ts): the managed-deployment
// installers IT departments push out — a Windows .msi and a macOS .pkg (plus a .dmg for hand
// installs). Builds on package.json's "build" block and overrides only what differs.
//
// Package it after building the app in enterprise mode, so the edition is baked in:
//   electron-vite build --mode enterprise && electron-builder --config electron-builder.enterprise.cjs --mac
// (or `npm run dist:enterprise:mac` / `dist:enterprise:win`).
const { build } = require('./package.json');

module.exports = {
  ...build,
  artifactName: '${name}-enterprise-${version}-${arch}.${ext}',
  directories: { ...build.directories, output: 'release/enterprise' },
  mac: { ...build.mac, target: ['pkg', 'dmg'] },
  win: { ...build.win, target: ['msi'] },
  // Always install system-wide into /Applications, which is what MDM tools (Jamf, Intune, Kandji)
  // expect — not wherever an existing copy of the app happens to be, or the user's home folder.
  pkg: {
    isRelocatable: false,
    allowCurrentUserHome: false,
    license: 'LICENSE',
  },
  msi: {
    oneClick: false,
    perMachine: true,
    runAfterFinish: false,
  },
  // Never publish from this config: the enterprise edition doesn't auto-update, and publishing
  // would overwrite the latest*.yml update manifests consumer installs read. CI uploads these
  // installers to the GitHub Release separately (see .github/workflows/build-desktop.yml).
  publish: null,
};
