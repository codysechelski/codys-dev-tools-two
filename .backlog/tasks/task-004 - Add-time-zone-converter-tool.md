---
id: TASK-004
title: Add time zone converter tool
status: Ready for Testing
assignee:
  - '@cody'
created_date: '2026-10-29 15:48'
updated_date: '2026-10-29 15:59'
labels: []
dependencies: []
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Comparing a meeting time across regions currently means opening the Timestamp Converter and checking one zone at a time. everytimezone.com is a good model for seeing several zones at once, but its drag-to-scrub interaction is more effort than this workflow needs.

The tool should center on one large, editable time field so a developer can set the time once and read it against their own zone plus a set of other zones. The zone rows should make day boundaries and date changes visible at a glance, like everytimezone.com's timeline, without any drag interaction.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new Time Zone Converter tool appears in the Date Utilities section of the tools list with a compact heading, body-copy instructions, and sidebar search keywords covering time zone, world clock, and UTC
- [x] #2 On open, the primary time field shows the current time in the user's own time zone and the local zone select defaults to the user's current time zone
- [x] #3 The primary time field accepts typed input and has left and right arrow buttons that step the time by 15 minutes; invalid typed input is rejected or clearly indicated instead of silently changing the time
- [x] #4 Changing the local zone select keeps the entered wall-clock time (9:00 stays 9:00) and relabels it for the new zone, and any change to the time or zone updates every zone row immediately
- [x] #5 Zone rows are ordered with the user's own zone first and clearly marked as the current zone, then UTC, then the US zones (Eastern, Central, Mountain, Pacific, Alaska, Hawaii) excluding any that duplicate the user's zone
- [x] #6 A plus control adds further time zones to the rows, and zones added that way can be removed again
- [x] #7 Displayed times honor daylight saving for the selected date, including zones that do not observe DST and added zones with non-hour offsets
- [x] #8 Each row indicates its date and where day boundaries fall, so a selected time that lands on a different day in another zone is obvious without dragging or reading raw offsets
- [x] #9 The tool is correct in both light and dark themes, with hover, focus, and selected states styled from shared tokens rather than hardcoded colors
- [x] #10 Unit tests cover time parsing and formatting, 15-minute stepping, zone list composition, and day-boundary/DST handling
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
- [ ] #17 Commits are pushed to the remote repo
- [x] #18 The task is moved to "Ready for Testing"
- [x] #19 The task is assigned to Cody (the project owner) so he can review the changes.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add dependency-free Intl-based wall-clock parsing, zone resolution, stepping, row composition, and timeline helpers with focused tests.
2. Build the converter using shared controls and themed tokens; register it under Date Utilities and document it.
3. Verify component interactions, DST/day boundaries, types, builds, and formatting; record evidence and hand off for testing.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
25 focused helper/component tests pass; vue-tsc passes. Covers current local defaults, wall-time preservation, invalid inputs, stepping/year rollover, zone aliases/deduplication, adding/removing rows, DST gaps/overlaps, non-DST and fractional offsets, and midnight placement. Verification profiles invoke nonexistent npm run test:unit, so using focused npm test plus explicit typecheck/build instead; Playwright is not installed in the project. Theme/browser review and registry smoke coverage remain.

Browser verification passed using temporary Playwright installation outside the repository: sidebar searches time zone/world clock/UTC, navigation/heading, own-zone deduplication, midnight stepping, real searchable add/remove controls, light/dark theme switching, focus/hover colors, and no page errors. Screenshots reviewed at 1280px and 900px. 53 tests pass via npm test -- src/tools/timeZoneConverter.test.ts src/tools/timeZoneConverterComponent.test.ts src/App.test.ts src/components/AppSidebar.test.ts. npm run build passes (typecheck + web + Electron; only existing bundle-size warning). Prettier check passes for all new source/test files; git diff --check passes. No lint script/config exists. README updated; AGENTS.md reviewed and needs no change. Version bumped to 0.44.0. No runtime dependencies or reusable components added.

Implementation committed as Cody in c6a7900 (feat: add DST-aware time zone converter). No architecture changes or new reusable UI, so no approval/style-guide additions needed. Documentation is covered by README; no standalone docs needed. Ready for Cody's review.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added offline Time Zone Converter under Date Utilities with editable wall time/date, 15-minute arrows, own-zone/UTC/US defaults, searchable add/remove zones, and aligned midnight timelines. DST gaps are rejected and overlaps explicitly use the earlier occurrence. All 10 acceptance criteria verified: 53 focused/related tests, Chromium interaction/theme/compact-layout smoke, typecheck, web/Electron builds, Prettier, and diff checks passed. README and app version updated to 0.44.0.
<!-- SECTION:FINAL_SUMMARY:END -->
