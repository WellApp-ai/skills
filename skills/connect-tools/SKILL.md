---
name: connect-tools
requires: [define-workspace]
description: Check which data sources a Well workspace has connected — bank accounts, accounting software, invoicing and payment portals — get the missing ones connected with Well's one-click install links, and hand off a typed coverage result to the flow that follows. Use when the user asks to connect a bank, connect their finance tools, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asks "which tools are connected", "what can I connect to Well", or when a Well skill needs bank / accounting / invoicing data present before it continues. Do not use to compute figures, to trigger a sync, to disconnect a tool, or to run a connector's own actions.
---

# Connect Tools with Well

## Purpose

Answer "does this workspace have the connections this job needs?" and close the gap. One tool does the whole job: `well_list_connectors` returns Well's connector catalog with every one of the workspace's connections represented on its own catalog row, and in an MCP-Apps host that result renders as the connect picker card. Read the state per kind — bank, accounting, invoicing — from those rows, let the card carry the connect links, and hand a typed coverage result to the calling flow. As a flow step this is **always a user stop**: the card renders — green or not — with a per-row **Connect** button on each tile and one **Continue** button. The Continue click writes an acknowledgment server-side (`well_switch_workspace` with `ack: "connectors"`) and prefills "Continue" in the user's composer; the user sends it, and that message is how the flow moves on. Step two of Well's fetch-missing-invoices flow, ahead of the dedicated `connect-bank` step where that skill is installed.

## When to use this skill

Use this skill when:

- The user asks to connect an accounting tool or an invoicing / payment portal to Well ("link Pennylane", "add Stripe so you can pull invoices"), or to connect their tools in general.
- The user asks what is connected, what is still syncing, or why a source shows an error.
- A calling skill (fetch missing invoices, close the books, a data skill) needs bank, accounting, or invoicing data in the workspace before it can continue.
- A data skill found the workspace empty or thin and needs the user to connect a source.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The ask is only about the bank ("connect my Qonto", "is my bank connected?") **and** the `connect-bank` skill is installed — it scopes the catalog to banks and returns one state instead of three. When it is not installed, answer here instead: scope this run to `kinds: [bank]` rather than sending the user to a skill they do not have.
- The user wants a figure (cash, runway, spend) — the data skills run this check internally.
- The user wants to disconnect a tool, force a re-sync, or run an action on a connected provider (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants Well to fetch invoices from a portal — that is the deploy-agents step of the flow, after this one.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here. Reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace`.
- `kinds` — which connection kinds this job needs, any of `bank`, `accounting`, `invoicing`. Default: all three. When the user's own question names one kind ("is my accounting connected?"), treat that as the scope even with no calling skill involved.
- `required` — the subset of `kinds` the calling flow cannot continue without. A missing required kind at the acknowledgment stops the flow instead of continuing. Default: none.
- Provider hints — names the user mentioned ("Qonto", "Pennylane", "Shopify"). Optional; used to search the catalog.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for March"), used in the ask. Optional.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes; each pass gets its own coverage read and its own acknowledgment, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here carries.

It ships with the `well-skills` plugin. This skill is also installable on its own, so step 2 carries an inline fallback for when `define-workspace` is absent. Outside that fallback this skill does not resolve the workspace itself: when no `workspace_id` was passed and this conversation established no pin, run `define-workspace` first (step 2) rather than asking for a workspace here.

**`well_list_connectors` is the only connector-listing tool this skill calls**, and the one read that decides coverage. The `well_list_workspaces` session read below is the sole exemption. `well_list_connectors` returns the connectable catalog with a live overlay: every connection the workspace already holds is represented on its own catalog row, so one call answers both "what can I connect?" and "what is connected?". Each row carries:

- `service_id` — the connector's stable catalog id. `name`, `category_id`, `logo_url` — what it is.
- `status` — `available` is connectable now; anything else (`coming_soon`, `unavailable`, `maintenance`) is not.
- `direction` — `input` is a data source Well reads from; `output` is a push-back destination (an accounting tool can appear as both).
- `data_domains` — the kinds this connector feeds, a list such as `["bank"]` or `["accounting"]`. Sometimes delivered as a JSON string; parse it.
- `is_connected` and `connection_status` — the live connection's state, `connection_status` being one of `enabled`, `processing`, `error`, `need_reconnect`, `to_configure`, `degraded`, `suspended`, `disabled`, or null when nothing is connected.
- `last_successful_sync_at` — when data last landed, or null if it never has. `sync_in_progress` — a sync is running right now.
- `workspace_connector_id` — the connected instance's id, or null. `is_preselected` — Well recommends connecting this one now, and the picker card pre-checks exactly these rows.
- `install_url` — a one-click link that starts the connection in Well from any state: it signs the user in, opens the bank login or the provider's OAuth, and covers a reconnect as well as a first install. Null only when the row is not `available`.

Inputs: `kind` — one of `bank`, `accounting`, `invoicing` — filters the catalog to that kind server-side. When the job covers exactly one kind, pass `kind`; when it covers two or three, make **one unscoped call** grouped by `data_domains` — one call renders one card, and a turn never renders two. `q` name-searches the full catalog (a specific bank, a specific portal). `limit` and `offset` page it.

The click-chain tools:

- `well_wait_for_selection({ kind: "connect_ack", timeout_s? })` — reads the Continue click (the card calls `well_switch_workspace` with `ack: "connectors"` itself), for when a later message is not the card's "Continue" prefill. Call it only after this conversation has rendered the connect card: reading a click on that card is its one job. Never call it at step start, never before the card exists, and never to probe for an ack — an ack exists only once this conversation's card has been clicked, so the card always comes first, with no tool call before its own read. An already-made ack returns instantly as `{ status: "selected", selection: { acknowledged: true }, already_set: true }`; when nothing is set yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an error. Never call it in the turn that renders the card, and never use it as a long wait. If the tool is absent, treat the user's next continue-message as the acknowledgment.
- `well_list_workspaces` — the one exemption from the connector-listing rule above, with two narrow uses: resyncing this conversation's own state after a stop (its `session` block carries the pinned workspace and the `workspace_queue` a multi-workspace run walks), and resolving the workspace in step 2's inline fallback when `define-workspace` is not installed. It never contributes to the coverage decision, and outside that fallback it never resolves a workspace this conversation did not pin.

**Never call `well_query_records` on `workspace_connectors` in this skill.** That root is for record-level reads — timestamps, filters, joins — and querying it here renders a records table where the connect picker belongs, which is the wrong surface for a connect step and does not carry an install link. Everything this skill needs is on the catalog row. Never call `well_invoke_connector_tool` or any provider-specific tool either: this skill reads connection state, never provider data.

**How a kind is decided — exact-match on structured fields, never on a name or a category label.** A row counts toward a kind only when its `direction` is `input` and its `data_domains` contains that kind's value: `bank`, `accounting`, or `invoicing`. `category_id` is not a reliable kind (native banks such as Qonto sit under `finance`; only Plaid institutions carry `banks`), and a display name is never a kind. When you pass `kind`, the server has already applied this filter — still drop any `direction: output` row from the coverage decision.

**How a row's state is read**, in this order — the first line that matches wins:

1. `to_configure` or `disabled` → **missing.** Never authorized, or turned off. Offer the install link.
2. `need_reconnect`, `error`, `degraded`, or `suspended` → **error.** Authenticated but not delivering data; offer `install_url` as a reconnect. A row that once synced and now needs a reconnect is an error, not coverage — a stale feed is exactly what this skill exists to surface.
3. `enabled` with `last_successful_sync_at` set → **connected.** Data has landed.
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting.** The grant is in and the first sync is running.

`sync_in_progress: true` on a **connected** row keeps it connected — say data may be partial until the pass finishes.

**Degrade gracefully on an older server.** If `data_domains` is absent, fall back to one `kind`-scoped call per requested kind — those calls then span turns, one card each — and treat each call's rows as that kind. If `kind` is rejected as an unknown input too, read the catalog unscoped and fall back to `q` on the providers the user named. If `last_successful_sync_at` is absent, read `enabled` as **connected** rather than reporting `connecting` forever. If `connection_status` carries a value outside the vocabulary above, treat the row as **error** and say the state is unrecognized — never read an unknown value as connected.

## Workflow

Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. The Continue click executes server-side and prefills "Continue" in the user's composer — rendering the card therefore ends the turn, and the sent message is how the flow moves on.

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, use the session pin silently when this conversation established it; otherwise run `define-workspace` (its picker renders at the point of need — never ask "which workspace?" in text, and never reuse or mention a pin left by another conversation). Pass `workspace_id` explicitly on every call below, even under a session pin.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

3. **Read the current coverage in one call.** `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind, `well_list_connectors({ workspace_id })` otherwise. The result renders the connect picker card. Keep the `direction: input` rows, group them by `data_domains`, and read each row's state with the precedence in Tooling. Per requested kind:
   - At least one **connected** row → **connected**. Add "data may still be partial" when that row has `sync_in_progress: true`. Name any **error** row for the same kind alongside it and carry that row's `install_url` — one live connector does not cancel a dead one, and only the user knows whether the dead account matters.
   - Only **connecting** rows → **connecting**. Treat as connected for the flow; tell the user data may be partial for a few minutes.
   - Only **error** rows → **error**. Name the connector and offer its `install_url` as a reconnect, not a first install.
   - No qualifying row → **missing**, including a `to_configure` row the user started but never finished authorizing.

4. **State the coverage once, then end the turn on the card.** Say one line per requested kind — what is connected, what is missing or in error, and why it matters for the job (`purpose`) — then one closing line: connect what is missing with the card's Connect buttons if you want, then click Continue. Do not restate the rows or re-render them as a list or table: the card carries the tiles and the install links. Even when every kind is green, the card stays on screen for the user to see and confirm the state, and the turn still ends here. Nothing else in the turn.
   - When the user asked about connections standalone (nothing follows), the coverage line ends the turn — the card is on screen, and there is nothing to chain.
   - In a text-only host, name at most three connectors per missing kind — `is_preselected` rows first, then the user's provider hints via `q` — each with its `install_url`, and treat the user's next message as the answer.
   - If the user names a provider that is not in the default view, search it with `q` before saying Well does not support it. A row whose `status` is not `available` is not connectable today — say so and offer the nearest available alternative from the catalog rather than a dead link.

5. **Resolve the next message after the card.** In this order, and never by re-asking.

   **The `required` gate applies to every path below that moves the flow on.** When a kind in `required` was **missing** or **error** on the read that rendered the card, re-read the coverage once in that turn (that turn's one card) before continuing — the user may have connected it during the stop. When the kind is still neither `connected` nor `connecting`, say plainly that the flow cannot continue without it and stop, keeping the hand-off so the caller reads `coverage` and decides. With no `required` kind outstanding, no such read is needed.

   - The message is the card's "Continue" prefill, or says continue / done / connected in its own words → that is the acknowledgment; move on in one short sentence, subject to the gate above. No verification call is needed on this path — the next step's own read is the verification, and anything the user connected during the stop lands in the later steps' own reads while the hand-off's coverage describes the read that rendered the card.
   - The user says in text they connected a tool → re-read the coverage once in that turn (that turn's one card) and hand off the fresh state.
   - Any other message → call `well_wait_for_selection({ kind: "connect_ack", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → the ack is in; move on, subject to the same gate. `no_selection_yet` → one line asking to click Continue on the card, end the turn.
   - The user declines a kind ("later", "skip invoicing") → record it under `skipped_by_user` and continue — unless the kind is in `required`, in which case say plainly that the flow cannot continue without it and stop, keeping the hand-off so the caller reads `coverage` and decides.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` → retry once. A second failure → do not invent connection state and hand off no coverage at all: every value would be a claim you cannot make, and `coverage: none` would read as "nothing is connected" rather than "nothing could be read". Say the coverage is unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, tell them the connections page in Well shows and fixes the same thing, and hand the failure back to the caller. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** Keep the hand-off facts below for the caller — never printed as a block.

## Output requirements

Return:

- One line per requested kind: `bank`, `accounting`, `invoicing` — its state and the connector name(s) behind it (e.g. "Bank: connected — Qonto. Accounting: error — Pennylane needs a reconnect. Invoicing: missing.").
- The hand-off, kept for the calling flow and never printed: `workspace_id`; per requested kind its `state` (`connected`, `connecting`, `error`, or `missing`), the connectors behind it, and the `install_url` to act on; `coverage`; `ack` — `true` once the Continue click (or a typed continue) arrived, `false` while the step still waits; `skipped_by_user`; and `required` echoed from the caller. `coverage` is `complete` when every requested kind is `connected` or `connecting`, `none` when NO requested kind is `connected` or `connecting` — a workspace whose every kind is in `error` is delivering no data, so it is `none`, not `partial` — and `partial` otherwise. Only the requested kinds count. The connectors behind a kind include any errored connector named alongside a connected one. `install_url` belongs to the row that kind's line names: the errored row on `error` — or on `connected` when an errored connector sits beside the live one — the first `available` `is_preselected` row on `missing`, and null when the kind is cleanly `connected` or `connecting`. These keys are reasoning vocabulary for you and the calling flow; the next skill re-reads what it needs from its own tool calls, and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: this skill's coverage line IS the disclosure — say which of bank / accounting / invoicing are connected versus still missing so the calling flow and the user know whether what follows rests on a full picture.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `connect-bank` skill is installed: "Next: the bank feed gets its own check — that is what the missing-invoice list is measured against." Otherwise, when `define-period` is installed: "Which month or period should we work on?". Otherwise hand control back to the skill that called this one, or, when the user asked about connections on their own, stop after the coverage line.
- The whole answer stays a few plain sentences a non-technical user understands: what is connected, what is missing, and the next step. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of connectors, or a table of them, when the picker card is already on screen.
- Any figure computed from connector data.
- Connection state guessed from a connector's display name, or read from a `workspace_connectors` records query.
- A flow continuation that skipped the Continue click — as a flow step, the acknowledgment (clicked or typed) is the gate, green coverage included.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one. Do
not compose a second rendering of figures the tool already returned; where a visual the
tool does not draw genuinely reads better and the `well-design-system` skill is available,
use it.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `well_list_connectors` was the only connector read called — no `well_query_records` on `workspace_connectors`, no `well_invoke_connector_tool`, no provider-specific tool. A `well_list_workspaces` call, if any, only resynced this conversation's pin and queue — or resolved the workspace in step 2's inline fallback — and fed nothing into the coverage decision.
- One kind meant one scoped call; two or three kinds meant one unscoped call — one card per turn, never two.
- `workspace_id` came from `define-workspace`, the caller, a session pin this conversation established, or step 2's inline fallback when `define-workspace` was absent — outside that fallback the workspace was not resolved or asked for in text here, and no leftover pin from another conversation was reused or mentioned.
- Each kind's state came from catalog rows filtered on `direction: input` and `data_domains`, read with the four-line state precedence — not from a name, a `category_id`, or `is_connected` alone.
- A `need_reconnect` / `degraded` / `suspended` row was reported as `error` even when it had synced before, and an errored connector was named even when another connector covered the same kind.
- An absent `last_successful_sync_at` was degraded to `connected` on `enabled`, an absent `data_domains` fell back to `kind`-scoped calls, a rejected `kind` fell back to an unscoped read plus `q`, and an unrecognized `connection_status` was reported as `error`, never as connected.
- `coverage` is `none` when no requested kind is `connected` or `connecting` — an all-`error` workspace was not labelled `partial`.
- As a flow step, the turn ended on the card — green coverage included — and the flow moved on only on the acknowledgment: the "Continue" prefill or a typed continue taken at its word with no extra call, or one `well_wait_for_selection({ kind: "connect_ack", timeout_s: 10 })` call on any other message. The wait tool was never called before this conversation rendered the card.
- A `required` kind that was **missing** or **error** when the card rendered got one fresh coverage read before the flow moved on — whichever path delivered the acknowledgment, the prefill or `well_wait_for_selection`'s `selected` — and the flow stopped, with the hand-off kept, when that kind was still neither `connected` nor `connecting`. No `required` kind was continued past on the card's own read alone.
- A typed "I connected it" got one fresh coverage read in that turn, and nothing was re-asked in text.
- The gap was stated once; the rows were not narrated or re-tabulated when the card was on screen.
- On a transient failure the call was retried once; a second failure returned no hand-off and no coverage claim, only the workspace link.
- The hand-off facts cover every requested kind, `coverage`, `ack`, `skipped_by_user`, and `required` — and no yaml, JSON, or fenced code block appears anywhere in the answer.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`connect-bank` or `define-period` when installed, otherwise the caller or the coverage line).

## Examples

### Example request

The fetch-missing-invoices flow calls connect-tools with `workspace_id` of Acme SAS, `kinds: [bank, accounting, invoicing]`, `purpose: "to fetch the invoices missing for March"`. The catalog comes back with a Qonto row — `direction: input`, `data_domains: ["bank"]`, `connection_status: enabled`, `last_successful_sync_at` set — and no other connected row.

### Expected behavior

One unscoped `well_list_connectors` call renders the card. Say: "Bank: connected — Qonto. Accounting and invoicing: not connected yet; I need them to know which March invoices are missing. Connect them from the card if you like, then click Continue." and end the turn. The user connects Pennylane from the card, clicks Continue, and sends the prefilled "Continue": that is the acknowledgment — move on to the bank step in one sentence, with no verification call. The hand-off keeps the coverage the card was read with; Pennylane's fresh connection shows up in the later steps' own reads.

### Example request

Everything is already connected — bank, accounting, and invoicing all green.

### Expected behavior

The card still renders and the step still stops. Say "Bank, accounting, and invoicing are all connected — that's everything this job needs. Click Continue when you're ready." and end the turn. Move on only when the "Continue" prefill (or a typed continue) arrives. Do not skip ahead because the coverage is green.

### Example request

"Is my accounting tool connected?"

### Expected behavior

The question names one kind, so scope to it: `well_list_connectors({ workspace_id, kind: "accounting" })` — one scoped call, not a full catalog read. "Accounting: error — Pennylane is authenticated but its last sync failed; reconnect it from the card." Standalone ask, nothing follows: stop after the coverage line, no acknowledgment needed. Hand off with `coverage: none` (no requested kind is delivering data) and the reconnect link; do not touch bank or invoicing.

### Example request

"Is Pennylane connected?" — the catalog holds a Pennylane row with `connection_status: enabled` but `direction: output` and `data_domains: null`.

### Expected behavior

That row is a push-back destination, not the accounting data source. Report "Accounting: missing — Pennylane is set up for exporting entries, but its accounting sync is not connected", find the `input` row for Pennylane in the same result (or with `q: "pennylane"`), and let the card carry its install link. Do not report accounting as connected.

### Example request

The card ends the turn, and the user's next message is "skip invoicing, keep going" while the caller passed `required: []`.

### Expected behavior

Record invoicing under `skipped_by_user`, treat the message as the acknowledgment, and continue in one sentence. Had `required` contained `invoicing`, say the flow cannot continue without it and stop, keeping the hand-off for the caller.
