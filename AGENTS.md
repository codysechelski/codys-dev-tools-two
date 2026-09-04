# Project Rules

## Product Direction

- This app is a developer tools application, not a marketing website.
- Display the app/tool version subtly in the sidebar footer and update it as notable functionality ships.
- The UI should feel like a native desktop app where practical, especially in Electron.
- The same Vue/TypeScript/Sass codebase should support web, macOS Electron, and Windows Electron builds.
- The app should work offline. Do not add runtime dependencies on external CDNs, Google Fonts, or hosted assets.

## Design System

- Shared design values belong in `src/styles/_tokens.scss`.
- Sizing, spacing, colors, border widths, radii, and similar primitives should be centralized as tokens.
- The dark theme should be nearly black with subtle purple and blue atmosphere.
- Theme controls belong on the Settings page, accessible from the sidebar footer gear.
- Scrollbars should be styled for dark mode throughout the app and scrollable components.
- Fonts are vendored locally. Use Ubuntu for UI text and Ubuntu Mono for code/editor text.

## Tool Layout

- Tool pages should have a compact heading using the tool name.
- Tool pages should include normal body-copy instructions under the heading.
- Tool-specific options belong in a toolbar-like options area below the instructions.
- Hide the options area when a tool has no options.
- The tool body belongs below the options area.
- Keep secondary surfaces, such as Attributions, out of the main tools list unless they are active developer tools.
- Avoid repeated global chrome such as a generic eyebrow on each tool screen.

## Components

- Use reusable wrapper components for form controls such as text inputs, selects, radio buttons, checkboxes, and toggles.
- Use the shared `AppButton` component for buttons and extend its variants instead of creating one-off button styles.
- For a square, icon-only button (e.g. a toolbar regenerate/swap action), use `AppButton`'s `icon-only` prop rather than a tool-specific CSS class.
- For a toolbar action button that should match the toolbar's select/text-input styling rather than the default purple secondary look, use `AppButton`'s `field` variant (combine with `icon-only` for icon-only buttons, or use alone for a normal-width button like "Now").
- Use the shared `AppModal` component for modal dialogs.
- Use the shared `AppCopyButton` component for any "copy to clipboard" action instead of wiring up `navigator.clipboard` and a copied-state ref by hand. It shows a success state (green, checkmark icon) briefly after copying, an error state if the copy fails, and animates its own width change. Pass `value` for a plain string copy, or a `copy` async callback for anything more custom (e.g. copying an image blob); pass `reset-key` to force it back to idle when unrelated state changes (e.g. switching to a different item in a list/modal).
- If behavior is needed for a form control, add it to the shared wrapper component rather than one-off native controls.
- Toolbar form controls should place labels above controls, align label rows horizontally, and use consistent control heights.
- Form-control hints or descriptive text should use the shared popover help pattern instead of inline helper text in toolbars.
- Do not add help popovers to every control by default; use them only when the control's purpose may be unclear.
- Use the shared `TextEditor` component for editor-like text areas.
- The shared `TextEditor` is built on CodeMirror. Prefer configuring that wrapper rather than implementing one-off editors.
- The text editor should support Tab indentation without moving focus.
- The text editor should show line numbers.
- The text editor should provide syntax highlighting where practical and a mini-toolbar that can grow over time.

## Dependencies And Licenses

- Keep runtime dependencies local and bundled.
- If an open-source package has attribution or notice requirements, add it to the Attributions tool/page in `src/tools/Attributions.vue`.
- Font Awesome Pro is available locally at `/Users/codysechelski/Developer/Projects/font-awesome-pro`; only vendor the icons needed by the app and do not add Font Awesome Pro to Attributions.

## Testing

- Code changes should include unit tests where appropriate.
- Add, remove, or update tests when behavior changes.
- Run tests and builds after implementation when feasible.

## Documentation

- After each prompt that changes code, check whether `README.md` or `AGENTS.md` should be updated.
