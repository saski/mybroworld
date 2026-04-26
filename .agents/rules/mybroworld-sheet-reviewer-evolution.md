# MyBroworld Sheet Reviewer Evolution Rule

Use this rule when working on Google Sheets or spreadsheet-derived catalog/admin data in this repository.

## Trigger

Apply this rule whenever the task involves one or more of:

- reviewing a Google Sheet
- filling missing values
- inferring normalized values
- marking blockers or readiness
- checking catalog quality
- cleaning up project spreadsheet data

## Required Behavior

1. Use the skill at `.agents/skills/mybroworld-sheet-reviewer/` for these tasks.
2. Treat every new explicit user indication as potential project review criteria, especially rules about:
   - what counts as inferable
   - what must stay unresolved
   - what is a blocker
   - what is optional
   - how to normalize fields
   - how to mark review states visually
   - how project-specific catalog decisions should be applied
3. Before finishing the task, update the reviewer skill when the new indication is reusable across future spreadsheet work.
4. Add or refine concrete examples in `.agents/skills/mybroworld-sheet-reviewer/references/project-criteria.md` when they clarify the project standard.
5. Do not overgeneralize a one-off instruction into the skill unless the user framed it as a recurring project rule or the same pattern is evidenced in multiple rows/tasks.
6. When a new rule changes how review judgments should be made, update both:
   - `.agents/skills/mybroworld-sheet-reviewer/SKILL.md`
   - `.agents/skills/mybroworld-sheet-reviewer/references/project-criteria.md`
7. In Codex sessions, use the file edit tool to update `.agents/**` files. Do not rely on shell redirection, shell temp files, or shell in-place edits there, because shell writes under `.agents/` may be sandbox-blocked even when direct file edits are allowed.

## Reviewer Scope

The reviewer is not only a gap finder. It should evolve into the project reviewer for spreadsheet quality, including:

- deterministic fills
- ambiguity detection
- normalization checks
- blocker detection
- readiness checks
- consistency review
- fast visual review cues

## Output Expectation

When the task introduced new reusable criteria, state that the reviewer skill was updated as part of the work.
