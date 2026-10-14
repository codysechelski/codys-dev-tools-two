---
id: TASK-002
title: Add a setting to disable automatic update checks
status: Ready for Testing
assignee:
  - '@codysechelski'
created_date: '2026-10-14 05:47'
updated_date: '2026-10-14 05:56'
labels: []
dependencies: []
priority: medium
type: enhancement
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Today the app automatically checks for updates shortly after launch and periodically afterward, then notifies the user: on macOS the banner links to the Releases page to download and reinstall manually, and on Windows/Linux it offers a one-click install. There is currently no way to turn this off.

Add a Settings control that lets the user disable automatic update checking, while keeping the current automatic check-and-notify behavior on by default so existing users see no change unless they opt out.

Context:
- Settings live in `AppSettings` (`src/settings.ts`) and are duplicated in `electron/main.ts` and `electron/preload.ts`, so a new flag must be plumbed through all three plus the Settings UI (`src/tools/Settings.vue`).
- The background check runs in `electron/main.ts` (`checkForUpdatesInBackground`, on a delay + interval).
- The banner is `UpdateBanner.vue`, driven by `updateNotice` in `App.vue` via the main-process `update-notice` IPC event.
- Update checking only exists in the Electron build; the web build has no updater.

Open question: should the manual "Check for Updates…" menu item stay available when automatic checks are disabled? The acceptance criteria below assume it remains available — confirm if that is not desired.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Settings (Electron build) shows a clearly labeled control to disable automatic update checks
- [x] #2 The setting defaults to enabled, so existing users keep the current automatic update notification and install behavior unless they change it
- [x] #3 When disabled, the app does not run background update checks and does not proactively show the update banner from an automatic check
- [x] #4 The preference persists across restarts and is stored alongside the other app settings (settings file in Electron)
- [x] #5 The manual "Check for Updates…" menu action continues to function regardless of the setting (pending confirmation)
- [x] #6 Tests cover the new setting's default, its merge/persistence behavior, and the disabled path
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 When you are asked to work on a task, first move it to `In Progress` if it is not already there
- [x] #2 After you have ensured the task has the proper status, you must assign the work to yourself (@claude, @codex, @opencode, etc.)
- [x] #3 Completed the development work outlined in the task. Ask questions if things are unclear
- [x] #4 Before making changes, be sure that you understand the codebase. Look for existing patterns, components, tooling, etc., before forging your own path
- [x] #5 Before making sweeping architecture decisions, or making changes with a high likelihood of breaking other parts of the app, stop and ask first
- [x] #6 Unit tests are written for new code
- [x] #7 If creating a new reusable component with a UI, or adding a variant to an existing component, add an example in the design system (style-guide) page
- [x] #8 Choose a verification scope based on the files changed, risk, and user-visible behavior. Full test suites are required only for cross-cutting, infrastructure, auth/session, router/app-shell, editor-core, migration, build/dependency, or release-baseline work.
- [x] #9 Run the selected verification for real and record the commands/results. Acceptable scopes include no tests for docs/backlog/comment-only work, static checks, targeted unit/API/web tests, targeted browser/E2E checks, smoke/visual E2E, or full suites when warranted.
- [x] #10 If automated verification is configured, use the project's verification workflow with the smallest sufficient profile, or document why verification was intentionally skipped.
- [x] #11 Linting and formatting pass when code or style files changed
- [x] #12 If the task has multiple Acceptance Criteria, check them off as they are completed. Do not wait for the end to check them all because I will not be able to gauge your progress
- [x] #13 The README is up to date, with changes made if required
- [x] #14 AGENTS.md/CLAUDE.md is up to date, and any new memories with lasting value have been added
- [x] #15 If there is a need to document anything, create docs in the docs folder using Markdown files. Link those doc files into the README, where it makes sense
- [x] #16 All work is committed using Conventional Commits, authored as Cody (the project owner), never as the agent itself
- [x] #17 Commits are pushed to the remote repo
- [x] #18 The task is moved to "Ready for Testing"
- [x] #19 The task is assigned to Cody (the project owner) so he can review the changes.
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added automaticUpdateChecks (default true) to AppSettings in src/settings.ts, electron/main.ts, electron/preload.ts, with mergeWithDefaults/mergeSettings validation. Settings page gets an Electron-only Updates section with an "Automatically check for updates" toggle. Background checks now go through scheduleBackgroundUpdateChecks (electron/updateChecks.ts), which re-reads settings.json from disk on every tick, so turning it off takes effect without a restart and isn't racing the renderer's settings load. Unreadable settings fall back to enabled. The manual Check for Updates… menu action is unchanged and always works (resolved the open question in favor of the AC's assumption).

Verification:
- npx vitest run -> 77 files, 573 tests passed (new electron/updateChecks.test.ts; added default/merge/round-trip tests in settings.test.ts; Settings.test.ts covers toggle visibility, default state, and emit)
- npm run typecheck -> pass; npx tsc -p tsconfig.node.json --noEmit -> pass (electron code)
- npx electron-vite build -> pass
- Not verified against a packaged build (background checks are skipped when not packaged).
<!-- SECTION:NOTES:END -->
