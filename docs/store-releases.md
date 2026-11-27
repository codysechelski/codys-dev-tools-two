# Store Releases

Cody's Dev Tools can ship to the **Mac App Store** and the **Microsoft Store** alongside the GitHub Release installers. Store packages are separate builds of the consumer edition, made with their own electron-builder configs (`electron-builder.mas.cjs`, `electron-builder.msstore.cjs`), which extend the base `build` block in `package.json`.

Store builds aren't produced automatically. Build one from a release tag when you're ready to submit that version: the Mac App Store package locally, the Microsoft Store package with the manual **Store Builds** workflow (`.github/workflows/store-builds.yml`), which takes the tag as its only input.

| Store           | Command                                    | Output                                                            | Where it builds                  |
| --------------- | ------------------------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| Mac App Store   | `npm run dist:mas`                         | `release/mas/mas-universal/codys-dev-tools-mas-<version>-universal.pkg` | A Mac with the signing identities |
| Mac App Store (test) | `npm run dist:mas-dev`                | `release/mas/mas-dev-arm64/Cody’s Dev Tools.app`                  | Same                             |
| Microsoft Store | **Actions → Store Builds** (or `npm run dist:msstore` on Windows) | `codys-dev-tools-msstore-<version>-{x64,arm64}.appx`, as the run's `microsoft-store-<tag>` artifact (kept 3 days) | GitHub's Windows runner (2x minutes, manual only) |

## What's different in store builds

The store `dist:*` scripts build with `electron-vite build --mode mas` or `--mode msstore`, which bakes the distribution into the app (`APP_DISTRIBUTION` in `src/edition.ts`). Gate store differences on the flags there, never on runtime detection:

- **No update checks** (`CHECKS_FOR_UPDATES`): the stores deliver updates, so there's no Check for Updates menu item, no background check, and no Updates section in Settings. The configs set `publish: null`, so no `latest*.yml` manifest is ever produced.
- **Donation link** (`SHOWS_DONATION_LINK`): hidden in the Mac App Store build, since Apple wants tips to the developer to go through In-App Purchase, and an In-App Purchase tip jar isn't worth the extra review surface for this app. The Microsoft Store build keeps it (Microsoft lets non-game apps take payments their own way).
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
| App ID `com.codysdevtools.app` registered on developer.apple.com | Done 2026-11-27 |
| Mac App Store Connect profile → `build/embedded.provisionprofile`; macOS App Development profile → `build/development.provisionprofile` (profiles aren't secret) | Done 2026-11-27 (`cdt mas appstore`, `cdt mas development`; also in pass under `certs/apple/profiles/cdt-mas-*`). Regenerate both when the Apple certificates are renewed (yearly) |
| App Store Connect app record, listing, privacy answers | To do |

Test a `mas-dev` build before every submission that touches files, dialogs, or settings: open and save a file, pick a custom settings folder, quit, relaunch, and confirm the custom folder is still used.

Upload the `.pkg` with Transporter.

**Listing:** the copy (name, subtitle, description, keywords, review notes) is in `store/app-store-listing.md`, and the screenshots in `store/screenshots/mac/`. `npm run store-screenshots` reshoots them from the real app at 2880 × 1800 (`scripts/capture-store-screenshots.mjs`: macOS only, needs ImageMagick; windows take focus while it runs, so don't type until it finishes). Reshoot after visible UI changes.

## Microsoft Store

| Requirement | Status |
| --- | --- |
| Reserve the name in Partner Center | Done 2026-11-27. Store ID `9NH4Z3MB3VFG` |
| Package identity in `electron-builder.msstore.cjs` | Done 2026-11-27: `CodysTools.CodysDevTools`, publisher `CN=1254F903-5472-495A-867A-91E6C78CA4A3` (shared by Cody's Tools apps), display name `Cody's Tools`. `MS_STORE_*` environment variables override them |
| Tile and logo images (`build/appx/`) | Done. Rendered from `build/icons/1024x1024.png` by `npm run store-assets` (needs ImageMagick); rerun after the icon changes |
| Code signing | Not needed: the Store signs the package on submission. `azureSignOptions` is removed in this config so the manifest keeps the Store publisher |

Sideload a package to test it before submitting: turn on Developer Mode, copy the `.appx` to a `.zip`, `Expand-Archive` it, and `Add-AppxPackage -Register .\<folder>\AppxManifest.xml`. Launch it from Start. Check that settings persist (MSIX redirects AppData) and that Load file, Save file, and a custom settings folder work.
