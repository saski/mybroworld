# MyBroworld Local Rules

- For any new chat, load `.agents/docs/chat-memory-protocol.md` after this file so the session reconstructs project memory from repository artifacts before acting.
- For any task involving Google Sheets, catalog review, data normalization, completeness, blockers, readiness, or inference on spreadsheet fields, load and follow `.agents/rules/mybroworld-sheet-reviewer-evolution.md`.
- Treat new explicit user instructions, clarified decisions, and resolved edge cases in sheet-review work as candidate project criteria. If the rule is reusable beyond the current row or one-off task, update the reviewer skill before finishing the task.
- Persist reusable decisions, methodologies, and operator guidance in repository artifacts before finishing the task, following `.agents/docs/chat-memory-protocol.md`.
- Keep technical artifacts in English.
