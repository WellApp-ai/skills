---
name: connect-tools
description: Check which data sources a Well workspace has connected and hand off a typed coverage result. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to fetch the missing March invoices"
  kinds: "bank, invoicing, accounting"
  internalCheck: true
  onNone: "the missing invoices cannot be listed yet"
---

The workspace is already pinned — pass its `workspace_id` on the call below; do not re-resolve it here.

Read the current coverage in one call: `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick; `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind; `well_list_connectors({ workspace_id })` otherwise (one unscoped call for two or three kinds — one call renders one card, and a turn never renders two).

For each of the requested kinds —
{{#each (list kinds)}}
- `{{this}}`
{{/each}}
— keep only rows whose `direction` is `input` and whose `data_domains` contains that kind (never a display name or `category_id`), and read each qualifying row's state in this order, first match wins:
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install.
3. `enabled` with `last_successful_sync_at` set → **connected** (note "data may be partial" if `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — treat as connected for the run.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

{{#if internalCheck}}
This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn and keep going. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. The read itself never stops the run — it reports, and the disposition below decides.

Apply that disposition once the states are in hand:

- `coverage: none` → stop; {{onNone}}. The install links are already on screen, so don't add a second set.
- Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
- `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
- A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
{{else}}
Render the card and end the turn on it (`flow_step` mode): say one line per requested kind — connected, missing, or in error, and why it matters{{#if purpose}} for "{{purpose}}"{{/if}} — then add a closing line inviting the user to connect what's missing and click Continue, and stop. Even with every kind green, the card stays on screen and the turn still ends here.

Resolve the next message after the card, in this order: (1) the user says in text they connected something → re-read coverage once in that turn and hand off the fresh state; (2) the card's "Continue" prefill, or "continue"/"done" in the user's own words with no new connection claim → that is the acknowledgment, move on with no verification call; (3) any other message → call `well_wait_for_selection({ kind: "connect_ack", timeout_s: 10 })` (or `"bank_ack"` when this call was scoped to `kind: "bank"`) — `selected` moves on, `no_selection_yet` asks once more for the Continue click and stops. **A session holds one ack per step** — on a second connect card in the same conversation, `connect_ack`/`bank_ack` still carries the first card's click, so make no wait call at all; take the user's next message as the acknowledgment instead. A `required` kind still missing or in error when the card rendered gets one fresh coverage read before the flow moves on, from whichever path delivered the acknowledgment; if it's still not connected or connecting, say the flow cannot continue without it and stop. A kind the user declines ("skip invoicing") is recorded under `skipped_by_user` and the run continues, unless that kind is `required`.
{{/if}}

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.
