// electron-builder config for the Microsoft Store package (MSIX, which electron-builder calls
// appx). Builds on package.json's "build" block and overrides only what differs. Package it after
// building the app in `msstore` mode, so the distribution is baked in (see src/edition.ts):
//
//   npm run dist:msstore   x64 and arm64 .appx (Windows only; the Store signs them on submission)
//
// Tile and logo images come from build/appx/ (`npm run store-assets`). See docs/store-releases.md.
const { build } = require('./package.json');

module.exports = {
  ...build,
  artifactName: '${name}-msstore-${version}-${arch}.${ext}',
  directories: { ...build.directories, output: 'release/msstore' },
  // Unsigned on purpose: Microsoft signs Store packages on submission, and Azure signing would write
  // its own publisher (Cody Sechelski) into the manifest instead of the Store identity below.
  win: { ...build.win, azureSignOptions: null },
  appx: {
    // Partner Center → Product management → Product identity. These must match exactly or the
    // upload is rejected. The publisher is shared with the other Cody's Tools apps; the identity
    // name is a guess until the name is reserved (docs/store-releases.md). The MS_STORE_*
    // environment variables override them.
    identityName: process.env.MS_STORE_IDENTITY_NAME ?? 'CodysTools.CodysDevTools',
    publisher: process.env.MS_STORE_PUBLISHER ?? 'CN=1254F903-5472-495A-867A-91E6C78CA4A3',
    publisherDisplayName: process.env.MS_STORE_PUBLISHER_DISPLAY_NAME ?? "Cody's Tools",
    displayName: "Cody's Dev Tools",
    applicationId: 'CodysDevTools',
    backgroundColor: 'transparent',
    languages: ['en-US'],
  },
  // The Store delivers updates: never publish these builds or a latest.yml manifest.
  publish: null,
};
