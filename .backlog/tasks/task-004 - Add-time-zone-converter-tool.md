---
id: TASK-004
title: Add time zone converter tool
status: In Progress
assignee:
  - '@opencode'
created_date: '2026-10-29 15:48'
updated_date: '2026-10-29 17:17'
labels:
  - re-work
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
- [x] #11 The primary time input has no visible label, is centered inline with both arrows, and does not overlap subsequent content
- [x] #12 Compact time zone rows use Gantt-like day bars, country-flag chips, and removal controls for all non-current zones
- [x] #13 Add time zone is in the top toolbar and opens a correctly themed modal containing the searchable zone select
- [x] #14 Clock formatting defaults to the user's locale, with a toolbar toggle switching the input and row times between 12 and 24 hours without changing the selected instant
- [x] #15 Each row has an accessible live business-hours dot: green 08:00–17:00, yellow 07:00–08:00 and 17:00–18:00, red otherwise
- [x] #16 Both zone pickers show flags and searchable country names, with UTC first then alphabetized country groups and alphabetical zone names within each group
- [x] #17 Zone rows show DST-aware hours/minutes ahead of or behind the selected local zone, including fractional offsets and date-line crossings
- [x] #18 All zone-row text is larger and remains readable in both themes and compact layouts
- [x] #19 Local zone, 12/24-hour preference, and added/removed zones honor Remember tool input in session/forever/never modes; date and time always initialize to now in the restored local zone on entry, including delayed state loading
- [x] #20 The Date field uses the existing themed calendar/date picker with direct date entry, preserves selected wall dates across zones and DST, and still resets to now instead of persisting
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add dependency-free Intl-based wall-clock parsing, zone resolution, stepping, row composition, and timeline helpers with focused tests.
2. Build the converter using shared controls and themed tokens; register it under Date Utilities and document it.
3. Verify component interactions, DST/day boundaries, types, builds, and formatting; record evidence and hand off for testing.

Revise per review: unlabeled/aligned primary time; compact Gantt-style day bars and flag chips; toolbar add-zone modal and row removal; locale-default 12/24-hour formatting toggle. Extend tests and rerun browser/theme/build checks.

Add accessible red/yellow/green business-hours dots based on each row's wall time: 08:00–17:00 business, 07:00–08:00 and 17:00–18:00 near, otherwise outside (daily, no weekday restriction requested).

Extend shared AppSelect with optional country groups/leading flags and searchable country names; use for both zone pickers with UTC first and alphabetical countries/zone names. Add DST-aware row offsets relative to the selected local zone, with hours/minutes ahead or behind. Cover shared select compatibility, country search/sorting, offset logic, and browser/themes.

Increase all zone-row typography (names/times 16px, secondary text 14px, bar ticks ~13px) and adjust widths/bar height and 12-hour tick density for readability.

Persist local zone, 12/24-hour format, and added/removed zones using shared Remember tool input session/forever/off lifecycle. Do not persist date/time; initialize now in restored local zone on tool entry. Test remounts/restoration and modes.

Replace plain date input with the existing themed VueDatePicker pattern used by Timestamp Converter; preserve local-zone wall-date semantics, fresh-now initialization, and non-persistence of date/time. Update focused tests and verify picker interaction/themes.

Move each business-hours status dot from the zone-name area to immediately left of the right-side time, preserving accessibility and status logic; verify component placement and responsive/theme alignment.

Remove day-bar/center-line legend intro and arrow-step hint beneath time; right-align remaining business-hours dot legend. Verify text and layout.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
25 focused helper/component tests pass; vue-tsc passes. Covers current local defaults, wall-time preservation, invalid inputs, stepping/year rollover, zone aliases/deduplication, adding/removing rows, DST gaps/overlaps, non-DST and fractional offsets, and midnight placement. Verification profiles invoke nonexistent npm run test:unit, so using focused npm test plus explicit typecheck/build instead; Playwright is not installed in the project. Theme/browser review and registry smoke coverage remain.

Browser verification passed using temporary Playwright installation outside the repository: sidebar searches time zone/world clock/UTC, navigation/heading, own-zone deduplication, midnight stepping, real searchable add/remove controls, light/dark theme switching, focus/hover colors, and no page errors. Screenshots reviewed at 1280px and 900px. 53 tests pass via npm test -- src/tools/timeZoneConverter.test.ts src/tools/timeZoneConverterComponent.test.ts src/App.test.ts src/components/AppSidebar.test.ts. npm run build passes (typecheck + web + Electron; only existing bundle-size warning). Prettier check passes for all new source/test files; git diff --check passes. No lint script/config exists. README updated; AGENTS.md reviewed and needs no change. Version bumped to 0.44.0. No runtime dependencies or reusable components added.

Implementation committed as Cody in c6a7900 (feat: add DST-aware time zone converter). No architecture changes or new reusable UI, so no approval/style-guide additions needed. Documentation is covered by README; no standalone docs needed. Ready for Cody's review.

Rework: 41 focused tests now pass, including locale format round-trips (US/GB/German/Arabic/Korean/Finnish), all business-hour boundaries, flags/aliases, bar segments, modal add/remove and restoring default rows. Chromium smoke passes for en-US and en-GB defaults, format switching, field/button alignment, modal add/remove, flags, day bars, and desktop/compact layouts. Screenshot review caught missing light-theme select styling in Teleported modal; shared light selectors extended, final theme rerun pending.

Final rework verification: npm test passes all 83 files / 628 tests, including 41 focused converter/toggle tests. npm run build passes typecheck, web and Electron builds (existing bundle-size advisory only). Temporary Playwright smoke passes en-US/en-GB locale defaults, 12/24-hour toggle instant preservation, exact field/arrow vertical-center assertions, modal searchable picker and clipping checks, adding/removing zones and defaults, flag chips, day bars, and light/dark + compact layouts; light modal menu/selected colors asserted and screenshots reviewed. Prettier check for new/rewritten converter files and git diff --check pass. Verification profiles still reference nonexistent test:unit; explicit commands used instead. README updated with clock modes, removal, bars and daily business-hour thresholds; AGENTS reviewed, no update needed. Version 0.45.0. Country/territory mapping is bundled public-domain IANA zone.tab data; no runtime dependencies added.

Rework committed as Cody in cd3add3 (feat: refine time zone comparison bars and locale clocks). Returning to Ready for Testing for review; re-work label retained until Done per workflow.

Country grouping / readability follow-up complete. Both pickers now show flag chips, country descriptions and accessible country headings; UTC first, then localized country names and zone labels alphabetically. Searches include country names/codes and USA alias; exact country metadata beats incidental city substrings. Rows compare actual wall-clock offsets with selected local zone, including minutes, DST and date-line crossings. Larger typography: row names/times 16px, secondary text 14px, ticks ~13px; wider columns/taller bars and fewer 12-hour ticks. Additive shared AppSelect support documented in docs/style-guide.md (no existing design-system page in this repository), linked from README; AGENTS records reusable option fields. Final verification: npm test passes 83 files / 633 tests; npm run build passes types/web/Electron (existing chunk-size warning). Two temporary Chromium smoke scripts pass US/GB locale/format/alignment/add-remove regression plus UTC ordering, alphabetical groups/zone names, country/USA search, flags, fractional row offsets, font-size assertions, both themes and compact layouts. Screenshots reviewed at 1440/1280/900px. Prettier checks and git diff --check pass. Existing verify-task profiles still invoke missing test:unit script, so direct commands used. Version 0.46.0.

Country-grouping/offset/readability follow-up committed as Cody in c178c14. Integrated the automated 0.45.0 changelog update without overwriting it; returning to Ready for Testing. Re-work label retained until Done.

Remember-input follow-up verified: uses existing usePersistedToolState with only localZone/use24Hour/addedZones/removedZones. Date/time initialize after synchronous restoration and recompute after delayed hydration; ordinary local-zone edits still preserve entered wall time. Current-zone row remains protected if machine zone changes between sessions. 55 targeted tests pass: npm test -- src/tools/timeZoneConverterPersistence.test.ts src/tools/timeZoneConverterComponent.test.ts src/tools/timeZoneConverter.test.ts src/toolState.test.ts. Includes session remount, forever disk/restart, delayed state load, never mode, disabling remembering, year/day rollover in restored zone, and snapshot field exclusions. Actual Chromium smoke passes Settings-driven Session/Forever/Never navigation and reload policies, saved zone/format/add-remove choices, and fresh date/time in restored zone. npm run build passes types/web/Electron (existing chunk warning only); Prettier and git diff --check pass. Small converter-only change uses targeted scope; configured verify-task profiles still reference missing test:unit, so documented direct commands used. README updated; AGENTS reviewed and no additional change needed. Version 0.46.1.

Persistence follow-up committed as Cody in cd54b8a. Integrated the automated 0.46.0 changelog update and returning to Ready for Testing; re-work label retained until Done.

Date-picker follow-up: reused existing VueDatePicker and Timestamp Converter theme classes in the toolbar. Uses v14-supported formats.input and model-type yyyy-MM-dd, keeping a date-only string without browser-zone conversions; direct entry and calendar selection both work. Date remains excluded from persisted state. 57 targeted tests pass via npm test -- src/tools/timeZoneConverterComponent.test.ts src/tools/timeZoneConverterPersistence.test.ts src/tools/timeZoneConverter.test.ts src/tools/timestampConverterComponent.test.ts; persistence assertions now allow the picker mount tick. Chromium smoke passes calendar selection, direct date typing, New York DST conversion while browser is in Los Angeles, midnight-step synchronization, light/dark selection/hover screenshot review, and Session/Forever/Never persistence regression. npm run build passes typecheck/web/Electron (existing chunk-size advisory only). Prettier and git diff --check pass. README updated; AGENTS reviewed and no change needed. Existing third-party picker reused, no new reusable component/variant requiring style-guide additions. Scope remains converter-only; used documented manual commands because verify-task profiles reference missing test:unit. Version 0.46.2.

Date-picker change committed as Cody in 9e25728. Integrated automated 0.46.1 changelog update and returning to Ready for Testing; re-work label retained until Done.

Moved row business-hours dots from beside the zone name to immediately left of the right-aligned time. Added structural regression assertions to all rows. Verification: npm test -- src/tools/timeZoneConverterComponent.test.ts passes 9 tests; npm run build:web passes typecheck/build (existing chunk warning). Chromium geometry checks pass for dots left of time and vertically centered at 1440px/900px in both themes; accessible status labels preserved. Prettier and git diff --check pass. Targeted manual scope used because verify-task profiles reference missing test:unit; no full suite needed for markup/layout-only change. README/AGENTS reviewed: no updates needed for a position-only change; no new reusable component. No version bump for this small layout adjustment.

Dot-placement adjustment committed as Cody in 8520599; returning to Ready for Testing.

Removed day-bar/center-line intro from the dot legend, right-aligned the remaining business-hours legend, and removed the arrow-step hint beneath the main time (zone name retained). Added copy regression assertions. Verification: all 9 converter component tests pass; npm run build:web passes typecheck/build; Chromium checks confirm flex-end legend alignment and removed text in light/dark at 1440px/900px. Prettier and git diff --check pass. Markup/style-only targeted scope; manual commands used because configured profiles reference missing test:unit. README/AGENTS reviewed: no changes needed for copy/alignment-only adjustment.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Time Zone Converter and review refinements complete, including the existing themed calendar picker for Date. Picker selection/direct typing preserve date-only zone/DST behavior and midnight stepping; dates/times still reset to now rather than being saved. All 20 acceptance criteria verified. Latest change passes 57 focused tests, real Chromium calendar/theme/DST and remember-mode smoke, typecheck/web/Electron builds, formatting and diff checks.
<!-- SECTION:FINAL_SUMMARY:END -->
