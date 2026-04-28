# Chat Memory Protocol

Use this protocol to make new chats in `mybroworld` reconstruct prior methodology from repository artifacts instead of relying on hidden session memory.

## Core Principle

- A new chat does not inherit prior conversation history.
- Project memory exists only when a reusable decision is written into the repository.
- Store each learning in the narrowest durable artifact that matches its scope.

## New Chat Bootstrap

Run these steps before making assumptions or edits:

1. Read `AGENTS.md`.
2. Read this file.
3. Load any task-specific rule or skill triggered by the request.
4. Read the most relevant canonical docs and status artifacts for the active workstream.
5. Inspect the current code, tests, and workspace diff before changing anything.
6. Summarize the applicable rules, assumptions, and sources of truth before acting.

## Source Priority

Use repository artifacts in this order when reconstructing context:

1. `AGENTS.md`
2. Task-specific rules under `.agents/rules/`
3. Task-specific skills under `.agents/skills/`
4. Canonical operational docs under `thoughts/shared/docs/`
5. Current status docs such as `PROJECT_STATUS.md`
6. Active plan artifacts under `thoughts/shared/plans/`
7. Code, tests, configuration, and the current workspace diff

## Writeback Rules

Before finishing a task, persist reusable knowledge in the correct place:

- Cross-project working method or chat bootstrap rule: update `AGENTS.md` or this file.
- Spreadsheet review criteria or judgment model: update `.agents/rules/mybroworld-sheet-reviewer-evolution.md`, `.agents/skills/mybroworld-sheet-reviewer/SKILL.md`, and `.agents/skills/mybroworld-sheet-reviewer/references/project-criteria.md` when the change is reusable.
- User-facing or operator-facing behavior: update the relevant document under `thoughts/shared/docs/`.
- Stable implementation behavior: encode it in code and tests, then document only what operators need.
- Ongoing execution state, milestones, or next steps: update `PROJECT_STATUS.md` or the relevant file under `thoughts/shared/plans/`.

Do not promote a one-off anecdote into project policy unless the user states it as a recurring rule or the same pattern is evidenced multiple times.

## Decision Record Template

When a task creates a reusable rule, capture it in this shape:

- `Decision`: the conclusion that should survive the chat
- `Scope`: where the rule applies
- `Rule`: the operational instruction
- `Example`: one concrete case
- `Artifact updated`: the file that now carries the memory
- `Verification`: test, check, or evidence used

## Sheets-Specific Reminder

For Google Sheets, catalog review, normalization, completeness, blocker, readiness, or inference work:

1. Load `.agents/rules/mybroworld-sheet-reviewer-evolution.md`.
2. Use `.agents/skills/mybroworld-sheet-reviewer/SKILL.md`.
3. Read `.agents/skills/mybroworld-sheet-reviewer/references/project-criteria.md` before final judgments.
4. If a new reusable review rule is learned, update the reviewer artifacts before finishing.

## Completion Checklist

Before closing the task, confirm:

1. Reusable decisions were persisted in repository artifacts.
2. The artifact chosen matches the scope of the learning.
3. Examples or tests were added when they improve future judgment.
4. The final response points to the updated artifact paths so the next chat can reload them quickly.
