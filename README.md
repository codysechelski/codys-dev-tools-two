# Cody's Dev Tools

A collection of everyday developer tools — formatters, converters, encoders, generators — in one app. Runs as a website or as a native desktop app for macOS, Windows, and Linux. Everything runs locally: nothing you type is sent anywhere.

Built with Vue, TypeScript, Sass, and Electron.

## Screenshots

<!-- TODO: add screenshots here, e.g.
![Home screen](docs/screenshots/home.png)
![JSON Formatter](docs/screenshots/json-formatter.png)
-->

## Download

If you just want to use the app, grab the latest build from the **[Releases page](https://github.com/codysechelski/codys-dev-tools-two/releases/latest)**:

| Platform | File |
| --- | --- |
| macOS | `.dmg` |
| Windows | `.exe` installer |
| Linux (Debian/Ubuntu) | `.deb` |

> **Note:** these builds aren't code-signed (that requires a paid Apple/Microsoft developer certificate). macOS Gatekeeper and Windows SmartScreen will warn that the app is from an "unidentified developer" — you'll need to explicitly allow it to run (macOS: right-click → Open; Windows: "More info" → "Run anyway").

Prefer the browser? The app also runs as a static website — see [Building the web app](#building-the-web-app) below if you want to self-host it.

## Tools

- JSON Formatter validates, formats, minifies, and sorts JSON.
- CSS Formatter outputs expanded, nested, compact, or compressed CSS and can sort declarations or preserve comments.
- JavaScript Formatter formats and compacts JavaScript with syntax-highlighted editors.
- HTML Formatter formats and minifies HTML with syntax-highlighted editors.
- Python Formatter formats Python with syntax-highlighted editors.
- Lua Formatter formats Lua scripts with syntax-highlighted editors.
- UUID Generator creates UUID v4 identifiers.
- JSON/YAML Converter converts between JSON and YAML.
- JSON/XML Converter converts between JSON and XML.
- XML Formatter formats and minifies XML.
- HTML Encoder/Decoder encodes and decodes HTML entities.
- URL Encoder/Decoder encodes and decodes URLs and URL components.
- String Template Formatter formats delimited rows using template placeholders.
- Lorem Ipsum Generator creates words, paragraphs, lists, and definition lists with optional punctuation and inline HTML variation.
- QR Code Generator creates PNG and SVG QR codes for text, URLs, Wi-Fi, contacts, email, SMS, phone, and calendar events.
- Unicode Character Map browses Unicode blocks, filters by character name, and copies character encodings.
- Timestamp Converter builds dates from parts, picks dates with a custom themed picker, parses timestamps, and converts common timestamp formats.
- Cron Builder/Parser builds and explains cron schedules with upcoming local run times.
- Text Analyzer counts paragraphs, words, characters, readability-style stats, and ranked word frequency.
- Base Converter converts numbers between binary, octal, decimal, and hexadecimal.
- Line Sorter/Deduplicator sorts and de-duplicates lines of text.
- Markdown Table Generator builds Markdown tables from a simple grid editor.

## Development

Want to run it from source, or contribute a change? Here's what you need.

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
npm run dist:linux   # Debian .deb
npm run dist:all     # all three
```

Output lands in `release/`. These are the same commands the [release pipeline](#releases) runs — you can build any of them locally without needing CI.

## Releases

Releases are fully automated with [semantic-release](https://semantic-release.gitbook.io/): every push to `main` is analyzed for [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, etc.), and when one warrants a release, CI bumps the version, tags it, publishes a GitHub Release with generated notes, and builds + attaches the macOS/Windows/Linux installers automatically. See [CONTRIBUTING.md](CONTRIBUTING.md#commit-messages) for the commit message format this relies on.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for how to set up your dev environment, the commit message convention, and how to add a new tool. Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## Architecture notes

- **Add a tool:** see [CONTRIBUTING.md](CONTRIBUTING.md#adding-a-new-tool).
- **App version:** read from `package.json` via `src/appInfo.ts`, shown in the sidebar footer.
- **Theme:** Settings supports light/dark/system (system follows `prefers-color-scheme`). The Electron View > Theme menu mirrors the Settings page in both directions. Theme choice isn't persisted between launches yet.
- **Design tokens:** colors, spacing, radii, and shadows live in `src/styles/_tokens.scss` as CSS custom properties.
- **Offline fonts:** Ubuntu and Ubuntu Mono are vendored under `src/assets/fonts/ubuntu` so the app doesn't depend on Google Fonts at runtime.
- **Text editor:** the shared `src/components/TextEditor.vue` wraps CodeMirror. Editable instances have a Load File button — native OS picker in Electron, a drag-and-drop modal in the browser.
- **Attributions:** open-source notices are available from the Attributions item in the sidebar.

## License

[MIT](LICENSE)
