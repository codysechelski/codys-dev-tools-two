# Store Releases

Cody's Dev Tools can ship to the **Mac App Store** and the **Microsoft Store** alongside the GitHub Release installers. Store packages are separate builds of the consumer edition, made with their own electron-builder configs (`electron-builder.mas.cjs`, `electron-builder.msstore.cjs`), which extend the base `build` block in `package.json`.

Store builds aren't produced by CI or the Release workflow. Build one from a release tag when you're ready to submit that version.

| Store           | Command                                    | Output                                                            | Where it builds                  |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| Mac App Store   | `npm run dist:mas`                         | `release/mas/mas-universal/codys-dev-tools-mas-<version>-universal.pkg` | A Mac with the signing identities |
| Mac App Store (test) | `npm run dist:mas-dev`                | `release/mas/mas-dev-arm64/Cody’s Dev Tools.app`                  | Same                             |
| Microsoft Store | `npm run dist:msstore`                     | `release/msstore/codys-dev-tools-msstore-<version>-{x64,arm64}.appx` | Windows only (`makeappx`)       |

## What's different in store builds

The store `dist:*` scripts build with `electron-vite build --mode mas` or `--mode msstore`, which bakes the distribution into the app (`APP_DISTRIBUTION` in `src/edition.ts`). Gate store differences on the flags there, never on runtime detection:

- **No update checks** (`CHECKS_FOR_UPDATES`): the stores deliver updates, so there's no Check for Updates menu item, no background check, and no Updates section in Settings. The configs set `publish: null`, so no `latest*.yml` manifest is ever produced.
- **Donation link** (`SHOWS_DONATION_LINK`): kept in both store builds. Microsoft lets non-game apps take payments their own way. Apple allows external links on the US storefront; App Review in other countries may ask for tips to go through In-App Purchase instead. If it does, add `&& APP_DISTRIBUTION !== 'mas'` to `SHOWS_DONATION_LINK` (the store test in `src/storeEdition.test.ts` will need its `mas` case updated).
- **Version** matches the GitHub Release the build was made from.

## Mac App Store

The app runs in the **App Sandbox** (`build/entitlements.mas.plist`):

| Entitlement | Why |
| --- | --- |
| `app-sandbox` | Required for the Mac App Store |
| `cs.allow-jit` | Electron's V8 JIT |
| `files.user-selected.read-write` | Load file / Save file in the text tools; choosing a custom settings folder |
| `files.bookmarks.app-scope` | Keeps access to the custom settings folder across launches (`accessSettingsDirBookmark` in `electron/main.ts`) |
| `application-groups` = `4PJJ6QZ34K.com.codysdevtools.app` | Electron's helper processes talk to the main app through it. Must match the team ID in the provisioning profile |

There's no `network.client`: the app makes no network requests of its own once update checks are off. External links (GitHub, Ko-fi) open in the default browser, which the sandbox allows. Add the entitlement only if a feature starts fetching anything.

The app's settings and tool state live in the sandbox container (`~/Library/Containers/com.codysdevtools.app/`), separate from a direct-download copy's.

**App name:** the `.app` is named `Cody’s Dev Tools` with a typographic apostrophe, because electron-builder refuses shell-special characters (including `'`) in Mac App Store app names. The App Store listing name is set separately in App Store Connect.

Requirements:

| Requirement | Status |
| --- | --- |
| Apple Distribution and 3rd Party Mac Developer Installer identities in the login keychain | Present (shared with the other Cody's Tools apps) |
| App ID `com.codysdevtools.app` registered on developer.apple.com | To do |
| Mac App Store Connect profile → `build/embedded.provisionprofile`; macOS App Development profile → `build/development.provisionprofile` (profiles aren't secret) | To do. Without them `dist:mas` still builds and signs, but the `.pkg` can't be submitted and `mas-dev` builds won't launch |
| App Store Connect app record, listing, privacy answers | To do |

Test a `mas-dev` build before every submission that touches files, dialogs, or settings: open and save a file, pick a custom settings folder, quit, relaunch, and confirm the custom folder is still used.

Upload the `.pkg` with Transporter.

## Microsoft Store

| Requirement | Status |
| --- | --- |
| Reserve the name in Partner Center | To do |
| Package identity in `electron-builder.msstore.cjs` | Publisher (`CN=1254F903-…`, shared by Cody's Tools apps) and display name are filled in; `identityName` is a guess (`CodysTools.CodysDevTools`) until the name is reserved. `MS_STORE_*` environment variables override them |
| Tile and logo images (`build/appx/`) | Done. Rendered from `build/icons/1024x1024.png` by `npm run store-assets` (needs ImageMagick); rerun after the icon changes |
| Code signing | Not needed: the Store signs the package on submission. `azureSignOptions` is removed in this config so the manifest keeps the Store publisher |

Sideload a package to test it before submitting: turn on Developer Mode, copy the `.appx` to a `.zip`, `Expand-Archive` it, and `Add-AppxPackage -Register .\<folder>\AppxManifest.xml`. Launch it from Start. Check that settings persist (MSIX redirects AppData) and that Load file, Save file, and a custom settings folder work.
