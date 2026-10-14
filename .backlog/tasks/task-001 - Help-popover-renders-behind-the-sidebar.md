---
id: TASK-001
title: Help popover renders behind the sidebar
status: In Progress
assignee:
  - '@claude'
created_date: '2026-10-14 01:52'
updated_date: '2026-10-14 03:27'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The shared help popover (the question-mark icon next to field labels) paints underneath the sidebar, so part of its content is hidden when the trigger sits near the left edge of a tool.

Repro: open the Markdown Table Generator and hover the help icon next to the Delimiter field. The popover appears below the sidebar in the stacking order and its left side is clipped/hidden.

Context: The popover markup is rendered inline in tool content via `src/components/HelpPopover.vue` (`.help-popover__content` uses `position: absolute` with `z-index: 1000`). The sidebar is a grid sibling in `.app-shell` that establishes its own stacking context. Because the popover is centered on its trigger and can extend left across the sidebar boundary, it loses the layering fight against sibling UI chrome even though its local z-index is high.

Expected: help popovers should paint above all other UI chrome, including the sidebar, regardless of where the trigger is located in a tool.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Hovering or focusing the Delimiter field's help icon in the Markdown Table Generator shows the full popover with no part hidden by the sidebar
- [ ] #2 Help popovers render above all other UI chrome (sidebar, banners, surrounding tool surfaces) regardless of which tool or field triggers them
- [ ] #3 The fix is applied to the shared help popover component so every tool using it is corrected, not just Markdown Table Generator
- [ ] #4 Existing popover behavior is preserved: reveal on hover/focus-within, anchored to its trigger, and correct appearance in both dark and light themes
- [ ] #5 Relevant tests or documented manual verification cover the corrected layering
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
