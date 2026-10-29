---
id: TASK-004
title: Add time zone converter tool
status: To Do
assignee: []
created_date: '2026-10-29 15:48'
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
- [ ] #1 A new Time Zone Converter tool appears in the Date Utilities section of the tools list with a compact heading, body-copy instructions, and sidebar search keywords covering time zone, world clock, and UTC
- [ ] #2 On open, the primary time field shows the current time in the user's own time zone and the local zone select defaults to the user's current time zone
- [ ] #3 The primary time field accepts typed input and has left and right arrow buttons that step the time by 15 minutes; invalid typed input is rejected or clearly indicated instead of silently changing the time
- [ ] #4 Changing the local zone select keeps the entered wall-clock time (9:00 stays 9:00) and relabels it for the new zone, and any change to the time or zone updates every zone row immediately
- [ ] #5 Zone rows are ordered with the user's own zone first and clearly marked as the current zone, then UTC, then the US zones (Eastern, Central, Mountain, Pacific, Alaska, Hawaii) excluding any that duplicate the user's zone
- [ ] #6 A plus control adds further time zones to the rows, and zones added that way can be removed again
- [ ] #7 Displayed times honor daylight saving for the selected date, including zones that do not observe DST and added zones with non-hour offsets
- [ ] #8 Each row indicates its date and where day boundaries fall, so a selected time that lands on a different day in another zone is obvious without dragging or reading raw offsets
- [ ] #9 The tool is correct in both light and dark themes, with hover, focus, and selected states styled from shared tokens rather than hardcoded colors
- [ ] #10 Unit tests cover time parsing and formatting, 15-minute stepping, zone list composition, and day-boundary/DST handling
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 When you are asked to work on a task, first move it to `In Progress` if it is not already there
- [ ] #2 After you have ensured the task has the proper status, you must assign the work to yourself (@claude, @codex, @opencode, etc.)
- [ ] #3 Completed the development work outlined in the task. Ask questions if things are unclear
- [ ] #4 Before making changes, be sure that you understand the codebase. Look for existing patterns, components, tooling, etc., before forging your own path
- [ ] #5 Before making sweeping architecture decisions, or making changes with a high likelihood of breaking other parts of the app, stop and ask first
- [ ] #6 Unit tests are written for new code
- [ ] #7 If creating a new reusable component with a UI, or adding a variant to an existing component, add an example in the design system (style-guide) page
- [ ] #8 Choose a verification scope based on the files changed, risk, and user-visible behavior. Full test suites are required only for cross-cutting, infrastructure, auth/session, router/app-shell, editor-core, migration, build/dependency, or release-baseline work.
- [ ] #9 Run the selected verification for real and record the commands/results. Acceptable scopes include no tests for docs/backlog/comment-only work, static checks, targeted unit/API/web tests, targeted browser/E2E checks, smoke/visual E2E, or full suites when warranted.
- [ ] #10 If automated verification is configured, use the project's verification workflow with the smallest sufficient profile, or document why verification was intentionally skipped.
- [ ] #11 Linting and formatting pass when code or style files changed
- [ ] #12 If the task has multiple Acceptance Criteria, check them off as they are completed. Do not wait for the end to check them all because I will not be able to gauge your progress
- [ ] #13 The README is up to date, with changes made if required
- [ ] #14 AGENTS.md/CLAUDE.md is up to date, and any new memories with lasting value have been added
- [ ] #15 If there is a need to document anything, create docs in the docs folder using Markdown files. Link those doc files into the README, where it makes sense
- [ ] #16 All work is committed using Conventional Commits, authored as Cody (the project owner), never as the agent itself
- [ ] #17 Commits are pushed to the remote repo
- [ ] #18 The task is moved to "Ready for Testing"
- [ ] #19 The task is assigned to Cody (the project owner) so he can review the changes.
<!-- DOD:END -->
