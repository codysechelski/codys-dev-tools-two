# Cody's Dev Tools

Vue, TypeScript, Sass, and Electron scaffolding for a cross-platform developer tools app.

## Commands

- `npm run dev` starts the Electron app in development.
- `npm run dev:web` starts the web app in development.
- `npm run test` runs unit tests.
- `npm run test:watch` runs unit tests in watch mode.
- `npm run build:web` builds the deployable web app to `dist`.
- `npm run dist:mac` builds a macOS desktop package to `release`.
- `npm run dist:win` builds a Windows desktop package to `release`.
- `npm run dist:all` attempts both desktop targets from the same codebase.

## Version

The displayed app version is defined in `src/appInfo.ts` and currently matches package version `0.11.1`.

## Tools

- JSON Formatter validates, formats, minifies, and sorts JSON.
- CSS Formatter outputs expanded, nested, compact, or compressed CSS and can sort declarations or preserve comments.
- JavaScript Formatter formats and compacts JavaScript with syntax-highlighted editors.
- HTML Formatter formats and minifies HTML with syntax-highlighted editors.
- Python Formatter formats Python with syntax-highlighted editors.
- Lua Formatter formats Lua scripts with syntax-highlighted editors.
- UUID Generator creates UUID v4 identifiers.
- JSON/YAML Converter converts between JSON and YAML.
- HTML Encoder/Decoder encodes and decodes HTML entities.
- URL Encoder/Decoder encodes and decodes URLs and URL components.
- String Template Formatter formats delimited rows using template placeholders.
- Lorem Ipsum Generator creates words, paragraphs, lists, and definition lists with optional punctuation and inline HTML variation.
- QR Code Generator creates PNG and SVG QR codes for text, URLs, Wi-Fi, contacts, email, SMS, phone, and calendar events.
- Unicode Character Map browses Unicode blocks, filters by character name, and copies character encodings.
- Timestamp Converter builds dates from parts, picks dates with a custom themed picker, parses timestamps, and converts common timestamp formats.
- Text Analyzer counts paragraphs, words, characters, readability-style stats, and ranked word frequency.
- Cron Builder/Parser builds and explains cron schedules with upcoming local run times.

## Theme

The Settings page supports light, dark, and system modes. System mode follows `prefers-color-scheme`.

## Add A Tool

Create a Vue component under `src/tools`, then add a `ToolDefinition` entry in `src/tools/registry.ts`.

## Design System

Core colors, spacing, radii, border widths, and shadows live in `src/styles/_tokens.scss` and are exposed as CSS custom properties.

## Offline Assets

Ubuntu and Ubuntu Mono fonts are stored locally in `src/assets/fonts/ubuntu` so the web and Electron apps do not depend on Google Fonts at runtime.

## Tool Layout

Tool screens use a compact app-style layout: heading, instructions, optional tool options, then the working area. Reusable form controls live under `src/components/forms`.

Toolbar controls place labels above the control and keep label rows aligned. Use `HelpPopover` only when a control needs extra explanation.

Use `AppButton` for buttons and `AppModal` for modal dialogs so variants and dialog structure stay consistent.

## Text Editor

The shared editor component is `src/components/TextEditor.vue`. It uses CodeMirror for cursor handling, line numbers, indentation, and syntax highlighting.

## Attributions

Open-source notices are available from the Attributions item in the tool sidebar.
