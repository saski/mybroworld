# Manual Review Mode

Use this reference when the sheet reviewer needs to collaborate with a human on non-deterministic sheet issues.

## Goal

Turn unresolved spreadsheet problems into a guided, low-friction review conversation that moves through the sheet with clear focus and small decisions.

## Build the Queue

Include issues such as:

- required blanks
- ambiguous source values
- inconsistent normalized values
- blocker and readiness mismatches
- undocumented manual formatting
- suspicious validation values
- public-facing text that needs human judgment

For each issue, capture:

- sheet name
- A1 cell reference
- header name
- issue type
- current value
- why it needs review
- source evidence
- safe suggestion if one exists

## Prioritization Order

1. blocker or readiness issues
2. missing required values
3. inconsistent normalized outputs
4. ambiguous cells that block publication or review completion
5. formatting anomalies and lower-risk cleanup

## Conversation Protocol

For each active issue:

1. State the focus item first.
2. Give the shortest explanation of the problem.
3. Provide the relevant evidence.
4. Offer a safe suggestion only if one exists.
5. Ask for one decision.
6. Apply only the approved edit.
7. Confirm what changed.
8. Move to the next issue.

## Voice-Friendly Style

- Keep turns short.
- Say the cell reference explicitly, for example `Sheet1 X9`.
- Avoid dumping large lists unless the user asks.
- Repeat back the chosen value before writing it.
- If the user says "next", "skip", or "apply that", interpret it against the current focus item.

## Suggested Turn Shape

Use a compact structure like:

- Focus: `Sheet1!X9` `medium_clean`
- Problem: undocumented manual green fill in a normalized column
- Evidence: no conditional rule exists for this column
- Suggestion: reset background to neutral white
- Decision needed: apply or skip

## State Tracking

Keep track of:

- current focus item
- resolved items
- skipped items
- remaining count

When the user returns later in the same thread, resume from the current focus item if the context is still valid.
