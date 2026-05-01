# MyBroworld Local Rules

- For any new chat, load `.agents/docs/chat-memory-protocol.md` after this file so the session reconstructs project memory from repository artifacts before acting.
- For any task involving Google Sheets, catalog review, data normalization, completeness, blockers, readiness, or inference on spreadsheet fields, load and follow `.agents/rules/mybroworld-sheet-reviewer-evolution.md`.
- Treat new explicit user instructions, clarified decisions, and resolved edge cases in sheet-review work as candidate project criteria. If the rule is reusable beyond the current row or one-off task, update the reviewer skill before finishing the task.
- Persist reusable decisions, methodologies, and operator guidance in repository artifacts before finishing the task, following `.agents/docs/chat-memory-protocol.md`.
- When an `RTK.md` reference is requested but the expected contextual file is missing, fall back to the repository-root `RTK.md` if it exists. If the root `RTK.md` is also absent, load `/Users/ignacio.viejo/saski/augmentedcode-configuration/.agents/rules/RTK.md`; only note RTK as missing if that shared fallback is also unavailable.
- For WordPress/WooCommerce development, avoid commercial paid plugins, including freemium plugins. Prefer lean owned code, WordPress core, WooCommerce core, and the smallest unavoidable third-party dependency surface. Open-source plugins or add-ons may be considered only when they meet a clear quality bar and preserve the lean simplicity principle.
- Keep technical artifacts in English.
