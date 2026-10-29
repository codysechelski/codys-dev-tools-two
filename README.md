# Cody's Dev Tools

<p align="center">
  <a href="https://github.com/codysechelski/codys-dev-tools-two/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/codysechelski/codys-dev-tools-two?label=release&color=8b5cf6"></a>
  <a href="https://github.com/codysechelski/codys-dev-tools-two/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/codysechelski/codys-dev-tools-two/total?color=22d3ee"></a>
  <a href="#download"><img alt="Platforms" src="https://img.shields.io/badge/platforms-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20Web-informational"></a>
  <a href="https://vuejs.org/"><img alt="Built with Vue" src="https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white"></a>
  <a href="https://www.electronjs.org/"><img alt="Electron" src="https://img.shields.io/badge/Electron-47848f?logo=electron&logoColor=white"></a>
</p>

A collection of everyday developer tools — formatters, converters, encoders, generators — in one app. Runs as a website or as a native desktop app for macOS, Windows, and Linux. Everything runs locally: nothing you type is sent anywhere.

See features, screenshots, and download links on the **[project website](https://devtools.codystools.online/)**.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/regex-tester-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/regex-tester-light.png">
  <img src="docs/screenshots/regex-tester-dark.png" alt="Cody's Dev Tools — Regex Tester">
</picture>

<br>
<br>
<br>

<p align="center">
  <a href="https://ko-fi.com/X2B128UDFL"><img alt="Support me on Ko-fi" src="https://ko-fi.com/img/githubbutton_sm.svg"></a>
</p>

## Screenshots

<table>
  <tr>
    <td width="50%"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/diff-tool-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/diff-tool-light.png">
  <img src="docs/screenshots/diff-tool-dark.png" alt="Diff Tool">
</picture><br><sub><b>Diff Tool</b> — added and removed lines highlighted side by side</sub></td>
    <td width="50%"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/sql-formatter-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/sql-formatter-light.png">
  <img src="docs/screenshots/sql-formatter-dark.png" alt="SQL Formatter">
</picture><br><sub><b>SQL Formatter</b> — SQL and SOQL, with configurable output</sub></td>
  </tr>
  <tr>
    <td width="50%"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/qr-code-generator-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/qr-code-generator-light.png">
  <img src="docs/screenshots/qr-code-generator-dark.png" alt="QR Code Generator">
</picture><br><sub><b>QR Code Generator</b> — URLs, Wi-Fi, contacts, calendar events, and more</sub></td>
    <td width="50%"><picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/screenshots/unicode-character-map-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="docs/screenshots/unicode-character-map-light.png">
  <img src="docs/screenshots/unicode-character-map-dark.png" alt="Unicode Character Map">
</picture><br><sub><b>Unicode Character Map</b> — browse, search, and copy any encoding</sub></td>
  </tr>
</table>

Light and dark themes are both built in — the screenshots above follow your GitHub theme.

## Download

If you just want to use the app, grab the latest build from the **[project website](https://devtools.codystools.online/)** or the **[Releases page](https://github.com/codysechelski/codys-dev-tools-two/releases/latest)**:

| Platform | File |
| --- | --- |
| macOS | `.dmg` |
| Windows | `.exe` installer |
| Linux (any distro) | `.AppImage` |
| Linux (Debian/Ubuntu) | `.deb` |
| Linux (Fedora/RHEL/openSUSE) | `.rpm` |
| Linux (Arch/Manjaro) | `.pacman` |

On macOS you can also install it with [Homebrew](https://brew.sh):

```sh
brew install --cask codysechelski/tap/codys-dev-tools
```

`brew upgrade` picks up new releases (the [tap](https://github.com/codysechelski/homebrew-tap) checks for them daily).

### Enterprise edition

For IT departments deploying to managed machines, each release also includes an **Enterprise** edition (files named `codys-dev-tools-enterprise-…`):

| Platform | File |
| --- | --- |
| macOS | `.pkg` (for MDM tools like Jamf, Intune, or Kandji; always installs to `/Applications`) or `.dmg` |
| Windows | `.msi` (for Group Policy, Intune, SCCM, etc.; installs for all users) |

It's the same app with the same tools. The differences:

- **No automatic updates.** The Enterprise edition never checks for updates or contacts GitHub. IT controls which version is installed by deploying a newer installer. There's no Check for Updates menu item or Updates section in Settings.
- **No "Buy Me a Coffee" link** on the home screen.
- The version in the sidebar and home screen reads "Enterprise".

> **Note:** macOS builds are signed and notarized by Apple, so they open normally. Windows builds aren't code-signed yet, so SmartScreen will warn that the app is from an "unknown publisher" — click "More info" → "Run anyway".

Prefer the browser? The app also runs as a static website — see [Building the web app](#building-the-web-app) below if you want to self-host it.

## Tools

**Formatters**

- JSON Formatter validates, formats, minifies, and sorts JSON.
- CSS Formatter outputs expanded, nested, compact, or compressed CSS and can sort declarations or preserve comments.
- JavaScript Formatter formats and compacts JavaScript with syntax-highlighted editors.
- HTML Formatter formats and minifies HTML with syntax-highlighted editors.
- XML Formatter formats and minifies XML.
- Python Formatter formats Python with syntax-highlighted editors.
- Lua Formatter formats Lua scripts with syntax-highlighted editors.
- SQL Formatter formats and validates SQL and SOQL (Salesforce) queries — expanded, compact, or minified output, configurable keyword case, and SOQL child relationship subqueries indented as nested blocks.

**Converters**

- JSON/YAML Converter converts between JSON and YAML.
- JSON/XML Converter converts between JSON and XML.
- Base Converter converts numbers between binary, octal, decimal, hexadecimal, and any base from 2 to 36.

**Encoders/Decoders**

- HTML Encoder/Decoder encodes and decodes HTML entities.
- URL Encoder/Decoder encodes and decodes URLs and URL components.
- Base64 Encoder/Decoder encodes and decodes base64 text.
- Base64 Image Converter converts images to base64 (and back), with CSS/HTML snippet output.

**String Utilities**

- String Template Formatter formats delimited rows using template placeholders.
- Text Analyzer counts paragraphs, words, characters, readability-style stats, and ranked word frequency.
- Line Sorter/Deduplicator sorts and de-duplicates lines of text.
- Regex Tester builds and tests regular expressions, with syntax highlighting, token-insert helpers, and every match highlighted and listed against your test text.
- Diff Tool compares two texts and highlights added/removed lines directly in each editor.
- Lorem Ipsum Generator creates words, paragraphs, lists, and definition lists with optional punctuation and inline HTML variation.

**Date Utilities**

- Timestamp Converter builds dates from parts, picks dates with a custom themed picker, parses timestamps, and converts common timestamp formats.
- Time Zone Converter compares times across regions with DST-aware day bars, relative offsets, and business-hour indicators.
- Cron Builder/Parser builds and explains cron schedules with upcoming local run times.

**Miscellaneous**

- UUID Generator creates UUID v4 identifiers.
- Markdown Table Generator builds Markdown tables from a simple grid editor.
- QR Code Generator creates PNG and SVG QR codes for text, URLs, Wi-Fi, contacts, email, SMS, phone, and calendar events.
- SVG Viewer previews SVG markup live as you edit it, next to an XML-highlighted source editor.
- Unicode Character Map browses Unicode blocks, filters by character name, and copies character encodings.

## Development

Want to run it from source, or contribute a change? Here's what you need.

See the [form control style guide](docs/style-guide.md) for reusable select examples, including grouped country/flag options.

### Prerequisites

- [Node.js](https://nodejs.org/) 22.22.2 or newer (see the `engines` field in `package.json`)
- npm (ships with Node)

### Setup

```bash
git clone https://github.com/codysechelski/codys-dev-tools-two.git
cd codys-dev-tools-two
npm install
```

### Running it locally

```bash
npm run dev        # Electron app, with hot reload
npm run dev:web    # browser version, at http://localhost:5173 (use --host to expose it on your network)
```

### Testing

```bash
npm run typecheck  # TypeScript / Vue type checking
npm test           # unit tests (Vitest)
npm run test:watch # unit tests in watch mode
```

### Building the web app

```bash
npm run build:web
```

Outputs static files to `dist/` — deploy that folder to any static host (nginx, Caddy, GitHub Pages, S3, etc.). Preview the production build locally with `npm run preview`.

### Building the desktop apps

```bash
npm run dist:mac     # macOS .dmg + .zip (universal binary)
npm run dist:win     # Windows .exe installer + .zip
npm run dist:linux   # Linux .deb, .rpm, .pacman, and .AppImage (x64 + arm64)
npm run dist:all     # all three

npm run dist:enterprise:mac   # Enterprise edition: macOS .pkg + .dmg
npm run dist:enterprise:win   # Enterprise edition: Windows .msi
```

Output lands in `release/` (`release/enterprise/` for the Enterprise edition, which is built with `electron-vite build --mode enterprise` and packaged with `electron-builder.enterprise.cjs`; see `src/edition.ts`). These are the same commands the [release pipeline](#releases) runs — you can build them locally without needing CI, with a few host requirements: the `.msi` can only be built on Windows, `.rpm` needs `rpmbuild` and `.pacman` needs `bsdtar` (on Ubuntu: `sudo apt-get install rpm libarchive-tools`), and the `.AppImage` tooling needs Linux or an Intel/Rosetta Mac.

## Releases

Releases are fully automated with [semantic-release](https://semantic-release.gitbook.io/): every push to `main` is analyzed for [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.), and when one warrants a release, CI bumps the version, tags it, publishes a GitHub Release with generated notes, and builds + attaches the macOS/Windows/Linux installers automatically. See [CONTRIBUTING.md](CONTRIBUTING.md#commit-messages) for the commit message format this relies on.

macOS builds are code-signed with a Developer ID certificate and notarized by Apple when these repository secrets are set (without them, CI still builds but the app is unsigned):

| Secret | Value |
| --- | --- |
| `MAC_CERT_P12_BASE64` | Base64 of the exported "Developer ID Application" certificate + private key (`.p12`) |
| `MAC_CERT_PASSWORD` | The password the `.p12` was exported with |
| `MAC_INSTALLER_CERT_P12_BASE64` | Base64 of the "Developer ID Installer" `.p12`, which signs the Enterprise `.pkg` |
| `MAC_INSTALLER_CERT_PASSWORD` | Its export password |
| `APPLE_API_KEY_P8` | Contents of the App Store Connect API key (`AuthKey_XXXXXXXXXX.p8`) used for notarization |
| `APPLE_API_KEY_ID` | That key's Key ID |
| `APPLE_API_ISSUER` | The Issuer ID shown on the App Store Connect API keys page |

The [Homebrew cask](https://github.com/codysechelski/homebrew-tap/blob/main/Casks/codys-dev-tools.rb) lives in a separate tap repo, whose daily `brew bump` workflow opens a pull request when a new release appears; merge it to ship the update to Homebrew users. The cask downloads `codys-dev-tools-<version>-universal.dmg` from the release, so renaming that artifact (`artifactName` in `package.json`) means updating the cask too.

## Philosophy

This project isn't trying to be the biggest Swiss Army knife of developer tools. The goal is a **focused collection of practical tools** that lots of developers reach for regularly, each one done well.

That means new tools are added deliberately. If there's a tool that would be genuinely useful to a broad set of developers, and enough people want it, I'm happy to build it, or to work with you on contributing it. What I'd rather avoid is a long tail of niche tools that only a handful of people would use, since every tool added is one more to maintain and one more item to scroll past in the sidebar.

If you have an idea, [open a feature request](https://github.com/codysechelski/codys-dev-tools-two/issues/new?template=feature_request.md) and explain who'd use it and how often. A thumbs-up on an existing request is the best way to show there's demand for it.

## Contributing

Contributions are welcome! Bug fixes and improvements to existing tools are always appreciated; for new tools, please read the [Philosophy](#philosophy) above first. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up your dev environment, the commit message convention, and how to add a new tool. Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Architecture notes

- **Add a tool:** see [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-new-tool).
- **App version:** read from `package.json` via `src/appInfo.ts`, shown in the sidebar footer.
- **Theme:** Settings supports light/dark/system (system follows `prefers-color-scheme`). The Electron View > Theme menu mirrors the Settings page in both directions. Theme choice isn't persisted between launches yet.
- **Updates (Electron):** the app checks for updates shortly after launch and every 4 hours, then shows a banner (one-click install on macOS, Windows, and Linux; a Releases link for copies electron-updater can't update in place — a Mac app run from outside `/Applications` or a portable Windows `.zip` — see `electron/installKind.ts`). The Enterprise edition skips all of this. Settings > Updates can turn background checks off; Check for Updates… in the app menu always works. The flag is plumbed through `src/settings.ts`, `electron/main.ts`, and `electron/preload.ts`, and scheduling lives in `electron/updateChecks.ts`.
- **Editions:** `src/edition.ts` exposes the build's edition (`consumer` or `enterprise`), baked in by `electron-vite build --mode enterprise` via a `__APP_EDITION__` define in `electron.vite.config.ts`. Both the main process and the renderer read it; anything else (web build, dev, tests) is the consumer edition. Enterprise-only differences should check `IS_ENTERPRISE` rather than detecting the installer type.
- **Design tokens:** colors, spacing, radii, and shadows live in `src/styles/_tokens.scss` as CSS custom properties.
- **Offline fonts:** Ubuntu and Ubuntu Mono are vendored under `src/assets/fonts/ubuntu` so the app doesn't depend on Google Fonts at runtime.
- **Text editor:** the shared `src/components/TextEditor.vue` wraps CodeMirror. Editable instances have a Load File button — native OS picker in Electron, a drag-and-drop modal in the browser.
- **Attributions:** open-source notices are available from the Attributions item in the sidebar.

## License

[Polyform Noncommercial License 1.0.0](LICENSE) — free to use, modify, and contribute to for any noncommercial purpose. Selling this software, or a modified version of it, is not permitted.
