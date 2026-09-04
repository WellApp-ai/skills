---
name: confirm-accounting-settings
description: Confirm the workspace carries the accounting settings a figure needs, and stop on the ones it does not. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to convert every amount into one currency"
  needs: "base_currency"
---

The workspace is already pinned — pass its `workspace_id` on the call below.

An earlier step may already have handed one of these fields forward. Take what the hand-off carries, and query only for what it does not — a value already in hand does not earn a second round-trip.

For anything still missing: read `well_get_schema({ root: "workspaces" })` once per session, then one `well_query_records` on `workspaces` for this workspace's accounting settings.

Ask for exactly what the figure consumes and nothing else: {{#if needs}}`{{needs}}`{{else}}the fields named by the caller{{/if}}. A field the computation never reads is not a gate — demanding a fiscal year start for a figure measured in calendar months blocks a workspace on a value that would change nothing.

Present → hand the values back and carry on. Absent → stop. Say which field is missing and what it decides ({{#if purpose}}"{{purpose}}"{{/if}}), and point the user at `<well-app-base-url>/workspaces/<workspace_id>` to set it. A settings row that does not exist at all reads the same as one whose field is null: both are unset, and neither is guessed.

Hand off: each requested field with its value or `null`, and `resolution: complete | incomplete`.

Verify before moving on: only the fields the computation reads were required; a missing field stopped the run rather than being defaulted; no value was inferred from the workspace's name, country, or any other field.
