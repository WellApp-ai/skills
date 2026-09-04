---
name: connect-bank
description: Get a bank account connected to a Well workspace, confirm the feed is live, and hand off a typed bank-coverage result. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to know which March invoices are missing"
  required: true
  bankHint: "Qonto"
---

Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. The Continue click executes server-side and prefills "Continue" in the user's composer — rendering the card therefore ends the turn, and the sent message is how the flow moves on.

The workspace is already pinned — pass its `workspace_id` explicitly on every call below; do not re-resolve it here and never ask for a workspace in text.

Read the bank state in exactly one call, and it is literally `well_list_connectors({ workspace_id, kind: "bank" })`{{#if bankHint}} — add `q: "{{bankHint}}"` when that bank sits outside the curated default view, and search it that way before saying Well cannot connect it{{/if}}. An unscoped call is an error here; the one exception is an older server that rejects `kind`, and then you read unscoped and keep the rows whose `data_domains` contains `bank`. A card visibly carrying accounting or invoicing tools means the call went out unscoped — redo it scoped before saying anything about the bank.

Qualify a row before reading its state: keep only `direction: input` rows whose `data_domains` contains `bank` — a list, sometimes delivered as a JSON string, so parse it and match an exact member, never a `category_id` (Plaid institutions sit under `banks`, Qonto under `finance`) and never a display name. Drop every `direction: output` row. Read each qualifying row in this order, first match wins:
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, `degraded`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install. A bank that synced before and now needs a reconnect is an error, not coverage.
3. `enabled` with `last_successful_sync_at` set → **connected** (note spend may be partial when `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — the grant is in and the first sync is running, which takes a few minutes.

An absent `last_successful_sync_at` degrades to **connected** on `enabled` rather than reporting `connecting` forever; a `connection_status` outside that vocabulary is **error**, never connected.

Reduce the qualifying rows to one bank state: at least one **connected** row → connected, name the bank(s), and name any **error** row alongside it with that row's own `install_url` (a live bank does not cancel a dead one). Only **connecting** rows → connecting, treated as connected for the flow. Only **error** rows → error. No qualifying row → missing, including a `to_configure` row the user started but never finished.

State the bank once, then end the turn on the card: one line giving the state and why it matters{{#if purpose}} — "{{purpose}}", and settled bank spend is what the gaps are measured against{{/if}} — then one closing line inviting the user to connect the bank from the card if it's missing and click Continue, and stop. Even a cleanly connected bank shows its card and stops here. Don't restate the banks or re-render them as a list or table. In a text-only host, give the `install_url` for at most three banks — the user's hint first, then the `is_preselected` rows — and treat the next message as the answer. A named bank carrying no `install_url` (an `available` institution held without a slug) is still installable, but this step's read carries no `install_all_url`: call again with a `q` narrow enough that the whole result fits one link, and hand over that call's `install_all_url`. Never build a link by hand. A row whose `status` is not `available` is not connectable today — offer the nearest available bank rather than a dead link.

Resolve the next message after the card, in this order, never by re-asking:
- The card's "Continue" prefill, or continue / done / go ahead in the user's own words claiming no fresh connection → that is the acknowledgment; move on in one short sentence with no verification call — the next step's own read is the verification, and the hand-off's `state` describes the read that rendered the card.
- The user says in text they connected the bank, even alongside a continue word ("done, I connected Qonto") → re-read the state once in that turn (that turn's one card). A freshly connected bank usually reads **connecting**, which is enough to move on: `resolution: connected_now`. A fresh-connection claim takes this line, never the one above.
- Any other message → call `well_wait_for_selection({ kind: "bank_ack", timeout_s: 10 })` once, and only after this conversation rendered the card. `selected` (fresh or `already_set`) → move on. `no_selection_yet` → one line asking for the Continue click, end the turn.
- The user declines ("later", "skip the bank") → `skipped_by_user: true`, `resolution: skipped`{{#if required}}. The bank feed is **required** on this run, so say plainly that the flow cannot continue without it and stop, keeping the hand-off so the caller reads `state` and decides{{else}}, and continue — the bank is not required on this run{{/if}}.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent a bank state — hand off `resolution: unavailable` with `state: null` and give the user `<well-app-base-url>/workspaces/<workspace_id>`, where the connections page shows and fixes the same thing. Never claim a sync was triggered: this step establishes the connection, Well syncs on its own.

Emit the hand-off, kept for the caller and never printed as a block:

```yaml
workspace_id: <uuid>
state: connected | connecting | error | missing | null
connectors: [{ name, connection_status, install_url }, …]  # an errored account named beside a connected one belongs here
install_url: <the link to act on, or null>
skipped_by_user: <true|false>
required: <true|false>
resolution: already_connected | connected_now | acknowledged | awaiting_user | skipped | unavailable
```

`already_connected` is an acknowledged connected/connecting read or a standalone ask; `acknowledged` is a Continue click over a `missing` or `error` read, so the caller's recap stays labelled as narrowed until later data shows the feed landed; `awaiting_user` is a card on screen with neither a click nor an answer. `install_url` is a reconnect on `error`, a first install on `missing`, the narrowed call's `install_all_url` for a slug-less institution, null on a clean connect. `skipped_by_user` mirrors `connect-tools`' key, so a caller reading both hand-offs reads one name. Say in plain words that this step covers the bank kind only, and on a connected bank how many bank connections are live — one bank's spend is not a full picture.

Verify before moving on: the listing call carried `kind: "bank"`, and a card showing non-bank tools was redone scoped; `well_list_connectors` was the only source of a connector row — no `well_query_records` on `workspace_connectors`, no `well_invoke_connector_tool`, no provider-specific tool; the state came from `direction: input` rows whose parsed `data_domains` contains `bank`, read with the four-line precedence and not from a name, a `category_id`, or `is_connected` alone; a `need_reconnect` / `degraded` / `suspended` bank was reported as `error` even though it had synced before; the turn ended on the card, a connected bank included, and the flow moved on only on the acknowledgment — the prefill or a typed continue taken at its word, or one `well_wait_for_selection({ kind: "bank_ack" })` call never made before the card existed; every bank offered carried a real link; a second failure returned `resolution: unavailable` with `state: null` and the workspace link.
