# Contributing to Cody's Dev Tools

Thanks for your interest in contributing! This is a small, mostly solo-maintained project, so this guide leans on standard open-source conventions rather than anything bespoke — if you've contributed to other projects before, none of this should surprise you.

By participating, you're expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs and small fixes:** feel free to open a pull request directly.
- **New tools or larger changes:** please open an issue first to discuss the idea before writing code. This avoids spending time on a PR that doesn't end up merged because of a direction disagreement.
- Check open issues and pull requests first so you don't duplicate someone else's work.

## Development setup

See the [README](README.md#development) for cloning, installing dependencies, and running the app locally. In short:

```bash
npm install
npm run dev:web    # or: npm run dev (Electron)
```

## Making a change

1. Fork the repo and create a branch off `main` (e.g. `fix/json-formatter-crash` or `feat/add-base64-tool`).
2. Make your change, following the conventions below.
3. Add or update tests for anything behavioral.
4. Run the checks locally before opening a PR:
   ```bash
   npm run typecheck
   npm test
   ```
5. Open a pull request against `main` with a clear description of what changed and why. Link the related issue if there is one.

A CI workflow runs typecheck, tests, and a production build against every pull request. It needs to pass before a PR can be merged.

## Commit messages

This repo uses [Conventional Commits](https://www.conventionalcommits.org/), and releases are generated automatically from commit history (see [Releases](README.md#releases) in the README) — so the commit message format actually matters here, not just for style.

Format: `type(scope): short description`

Common types:

| Type | Use for | Triggers a release? |
| --- | --- | --- |
| `feat` | a new feature or tool | yes (minor) |
| `fix` | a bug fix | yes (patch) |
| `perf` | a performance improvement | yes (patch) |
| `refactor` | code change that's neither a fix nor a feature | no |
| `docs` | documentation only | no |
| `style` | formatting, whitespace, etc. | no |
| `test` | adding or fixing tests | no |
| `chore` | tooling, dependencies, build config | no |

Add `BREAKING CHANGE:` in the commit body (or a `!` after the type/scope, e.g. `feat!:`) for a change that breaks existing behavior — this triggers a major version bump.

Examples:

```
feat(tools): add Base64 encoder/decoder
fix(json-formatter): don't crash on trailing commas
docs(readme): clarify build steps for Linux
```

If you're not sure which type fits, don't let it block your PR — a maintainer can help fix it up before merge.

## Adding a new tool

Tools live under `src/tools/`. To add one:

1. Create a Vue component under `src/tools/` for the tool's UI.
2. Register it with a `ToolDefinition` entry in `src/tools/registry.ts` (name, description, icon, section, and the component).
3. Reuse shared building blocks where you can:
   - `src/components/forms/` for inputs, selects, toggles, etc.
   - `src/components/TextEditor.vue` (CodeMirror-backed) for anything code/text editing.
   - `AppButton` for buttons and `AppModal` for dialogs, so styling stays consistent.
   - Colors, spacing, radii, and shadows are CSS custom properties defined in `src/styles/_tokens.scss` — use those rather than hardcoding values.
4. Follow the existing tool layout convention: heading, instructions, optional tool options, then the working area.
5. Add tests for the tool's logic (see any existing `*.test.ts` file under `src/tools/` for the pattern).

## Code style

- TypeScript, Vue 3 `<script setup>`, and Sass throughout — match the style of the surrounding code.
- Keep components focused; prefer composing small pieces over one large file.
- Don't add dependencies for something a few lines of code can do.

## Reporting bugs

Open an issue with:

- What you expected to happen vs. what actually happened.
- Steps to reproduce.
- Whether you're using the web build, or the desktop app (and which OS).

## Questions

Not sure about something? Open an issue and ask — that's what they're for.
