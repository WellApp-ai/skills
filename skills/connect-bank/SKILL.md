---
name: connect-bank
requires: [define-workspace]
description: Get a bank account connected to a Well workspace and confirm the feed is live — read which banks are already connected, still running their first sync, or in error, hand the user Well's one-click bank install link, and return a typed bank-coverage result to the flow that follows. Use when the user asks to connect a bank, link a bank account, add Qonto or a Plaid-supported bank, asks "is my bank connected", "why are my transactions missing", or when a Well skill needs settled bank spend in the workspace before it continues. Do not use to connect accounting or invoicing tools (that is connect-tools), to compute a figure, to force a re-sync, or to disconnect an account.
---

# Connect Bank with Well

## Purpose

Get the bank feed in, and say plainly whether it is live. One tool does the whole job: `well_list_connectors` scoped to `kind` `bank` returns Well's bank catalog — Plaid institutions and Well's native bank connectors — with the workspace's own bank connections represented on their catalog rows, and in an MCP-Apps host that result renders as the connect picker card showing banks only. It runs as its own step in Well's fetch-missing-invoices flow, right after `connect-tools`, because settled bank spend is what every missing invoice is measured against, and because a bank connection is the slowest one a user makes. As a flow step this is **always a user stop, connected banks included**: the card renders with a per-row **Connect** button on each bank tile and one **Continue** button. The Continue click writes an acknowledgment server-side (`well_switch_workspace` with `ack: "bank"`) and prefills "Continue" in the user's composer; the user sends it, and that message is how the flow moves on.

## When to use this skill

Use this skill when:

- The user asks to connect or link a bank account ("connect my Qonto", "link my business account", "add my bank so you can see my spend").
- The user asks whether the bank is connected, why transactions are missing, or why the bank shows an error or needs a reconnect.
- A calling skill or flow (fetch missing invoices, close the books, a cash skill) needs settled bank spend in the workspace before it can continue.
- The fetch-missing-invoices flow reaches its bank step — it always does, whatever `connect-tools` reported.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The user wants an accounting tool or an invoicing / payment portal connected, or all three kinds checked at once — that is the `connect-tools` skill.
- The user wants a figure computed from bank data (cash, runway, burn, spend) — `cash-position`, `runway-calculator`, and `expense-breakdown` run their own connector check internally.
- The user wants to disconnect an account, force a re-sync, or run an action on a connected bank (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants the bank's transactions listed or reconciled — this skill establishes the connection, it never reads provider data.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here. Reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace`.
- `required` — whether the calling flow can continue without a bank. `true` means a still-missing bank at the acknowledgment stops the flow; `false` means it continues with the caveat recorded. Default: `false`.
- A bank hint — the bank the user named ("Qonto", "BNP", "my Revolut account"). Optional; used to search the catalog with `q` when the bank is not in the default view.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for March"), used in the ask. Optional.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes; each pass gets its own bank read and its own acknowledgment, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here carries.

It ships with the `well-skills` plugin. This skill does not resolve the workspace itself: when no `workspace_id` was passed and this conversation established no pin, run `define-workspace` first (step 2) rather than asking for a workspace here.

**`well_list_connectors` is the only tool this skill reads a connector row from** — always with `kind` set to `bank`, so the catalog comes back scoped to banks server-side. No other tool contributes a bank row or a bank state. The rule covers connector listing only: `well_list_workspaces` lists workspaces, carries no connector row, and stays available for the session resync below. Each row carries `service_id`, `name`, `category_id`, `logo_url`, `status` (`available` is connectable now), `direction` (`input` is a data source), `data_domains` (contains `bank` for a bank row), `is_connected`, `connection_status`, `last_successful_sync_at`, `sync_in_progress`, `workspace_connector_id`, `is_preselected` (Well recommends it now, and the picker pre-checks exactly these), and `install_url` — a one-click link that starts the connection in Well from any state, signing the user in and opening the bank's own login flow with the institution pre-selected. `install_url` is null only when the row is not `available`.

The default view is curated and matched-first, so a bank outside it needs `q` — pass the bank's name before concluding Well cannot connect it. Do not classify a row by `category_id`: Plaid institutions sit under `banks` while native banks such as Qonto sit under `finance`, and a display name is never a kind. A bank row is a `direction: input` row whose `data_domains` contains `bank`; drop any `direction: output` row from the coverage decision. `data_domains` is a list such as `["bank"]`, sometimes delivered as a JSON string — parse it before you read it, so the whole bank decision rests on an exact list member rather than on text found inside a string.

The click-chain tools:

- `well_wait_for_selection({ kind: "bank_ack", timeout_s? })` — reads the Continue click (the card calls `well_switch_workspace` with `ack: "bank"` itself), for when a later message is not the card's "Continue" prefill. Call it only after this conversation has rendered the bank card: reading a click on that card is its one job. Never call it at step start, never before the card exists, and never to probe for an ack — an ack exists only once this conversation's card has been clicked, so the card always comes first, with no tool call before its own read. An already-made ack returns instantly as `{ status: "selected", selection: { acknowledged: true }, already_set: true }`; when nothing is set yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an error. Never call it in the turn that renders the card, and never use it as a long wait. If the tool is absent, treat the user's next continue-message as the acknowledgment.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace and queue. Read the `session` block alone. This call is the workspace exemption named above, so a multi-workspace pass is executable without breaking the connector-listing rule.

**Never call `well_query_records` on `workspace_connectors` in this skill.** That root is for record-level reads — timestamps, filters, joins — and querying it here renders a records table where the connect picker belongs, which is the wrong surface for a connect step and carries no install link. Everything this skill needs is on the catalog row. Never call `well_invoke_connector_tool` or any provider-specific tool either.

**How a row's state is read**, in this order — the first line that matches wins:

1. `to_configure` or `disabled` → **missing.** Never authorized, or turned off. Offer the install link.
2. `need_reconnect`, `error`, `degraded`, or `suspended` → **error.** Authenticated but not delivering data; offer `install_url` as a reconnect. A bank that once synced and now needs a reconnect is an error, not coverage — a stale feed is exactly what this skill exists to surface, and bank grants expire routinely.
3. `enabled` with `last_successful_sync_at` set → **connected.** Transactions have landed.
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting.** The grant is in and the first sync is running; a first bank sync can take a few minutes.

`sync_in_progress: true` on a **connected** row keeps it connected — say the spend may be partial until the pass finishes.

**Degrade gracefully on an older server.** The two scoping degrades are independent. If `kind` is rejected as an unknown input, call `well_list_connectors` unscoped and keep the rows whose `data_domains` contains `bank`; when that unscoped read carries no `data_domains` either, search with `q` on the bank the user named rather than guessing a kind from a name. If `kind` is accepted but the rows carry no `data_domains`, trust the server's own scoping and read every returned row as a bank row. If `last_successful_sync_at` is absent, read `enabled` as **connected** rather than reporting `connecting` forever. If `connection_status` carries a value outside the vocabulary above, treat the row as **error** and say the state is unrecognized — never read an unknown value as connected.

## Workflow

Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. The Continue click executes server-side and prefills "Continue" in the user's composer — rendering the card therefore ends the turn, and the sent message is how the flow moves on.

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because bank connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, use the session pin silently when this conversation established it; otherwise run `define-workspace` (its picker renders at the point of need — never ask "which workspace?" in text, and never reuse or mention a pin left by another conversation). Pass `workspace_id` explicitly on every call below, even under a session pin.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the bank state — one scoped call, banks only.** The bank state comes from exactly one call, and it is literally `well_list_connectors({ workspace_id, kind: "bank" })`. Calling it without `kind` is an error in this skill — the one exception is the older-server degrade path in Tooling, after the server has rejected `kind`. The rendered card must show banks only: if the card visibly carries accounting or invoicing tools, the call was made unscoped — redo it with `kind: "bank"` before saying anything about the bank. Keep the `direction: input` rows whose `data_domains` contains `bank`, read each one's state with the precedence in Tooling, then reduce them to one bank state:
   - At least one **connected** row → **connected**. Name the bank(s). Add "spend may still be partial" when a connected row has `sync_in_progress: true`. Name any **error** row alongside it and offer that row's `install_url` — a live bank does not cancel a dead one, and the user is the only one who knows whether the dead account matters.
   - Only **connecting** rows → **connecting**. Treat as connected for the flow, and say the first sync usually finishes in a few minutes.
   - Only **error** rows → **error**. Name the bank and offer its `install_url` as a reconnect, not a first install.
   - No qualifying row → **missing**, including a `to_configure` row the user started but never finished authorizing.

4. **State the bank once, then end the turn on the card.** One line: the bank's state and why it matters for the job (`purpose`) — for a missing-invoice or close job, that settled bank spend is what the gaps are measured against — then one closing line: connect the bank from the card if it is missing, then click Continue. Do not restate the banks or re-render them as a list or table: the card carries the tiles and the install links. Even a cleanly connected bank shows its card and stops here, so the user sees and confirms the feed the flow is about to measure against. Nothing else in the turn.
   - When the user asked about the bank standalone (nothing follows), the bank line ends the turn — the card is on screen, and there is nothing to chain.
   - In a text-only host, give the `install_url` for at most three banks — the user's hint first (found with `q` when it is outside the default view), then the `is_preselected` rows — and treat the user's next message as the answer.
   - If the user names a bank that is not in the default view, search it with `q` before saying Well cannot connect it. A row whose `status` is not `available` is not connectable today — say so and offer the nearest available bank connector rather than a dead link.

5. **Resolve the next message after the card.** In this order, and never by re-asking:
   - The message is the card's "Continue" prefill, or says continue / done / go ahead in its own words and claims no fresh connection → that is the acknowledgment; move on in one short sentence. No verification call is needed here — the next step's own read is the verification, and a bank connected during the stop lands in the later steps' own reads while the hand-off's `state` describes the read that rendered the card.
   - The user says in text they connected the bank, even alongside a continue word ("done, I connected Qonto") → re-read the state once in that turn (that turn's one card) — a freshly connected bank usually reads **connecting**, which is enough to move the flow on, `resolution: connected_now`. A claim of a fresh connection takes this line, not the one above.
   - Any other message → call `well_wait_for_selection({ kind: "bank_ack", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → the ack is in; move on. `no_selection_yet` → one line asking to click Continue on the card, end the turn.
   - The user declines ("later", "skip the bank") → set `skipped_by_user: true`, `resolution: skipped`, and continue when `required` is `false`; when `required` is `true`, say plainly that the flow cannot continue without the bank feed and stop, keeping the hand-off so the caller reads `state` and decides.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` → retry once. A second failure → do not invent a bank state; hand off `resolution: unavailable` with `state: null`, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and tell them the connections page in Well shows and fixes the same thing. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** State the bank in one line and keep the hand-off facts below for the caller — never printed as a block.

## Output requirements

Return:

- One line on the bank and the connector(s) behind it (e.g. "Bank: connected — Qonto, first sync still running, so March spend may be partial for a few minutes." or "Bank: not connected yet — I need the feed to know which March invoices are missing.").
- The hand-off, kept for the calling flow and never printed: `workspace_id`; `state` — `connected`, `connecting`, `error`, `missing`, or null; `connectors` — the banks behind the state, plus any errored account named alongside a connected one; `install_url`; `skipped_by_user`; and `resolution` — `already_connected` (the read said connected or connecting and the user clicked Continue, or the ask was standalone), `connected_now` (the user connected it during this step and a fresh read confirmed it), `acknowledged` (the user clicked Continue over a `missing` or `error` read — the flow continues, and the recap is labelled as narrowed unless later data shows the feed landed), `awaiting_user` (the card is on screen and neither a click nor an answer has arrived), `skipped` (the user declined), or `unavailable` (the catalog could not be read twice — `state` and `connectors` are null, no bank claim can be made). `install_url` is the link to act on — a reconnect on `error`, a first install on `missing` — and null when the bank is connected with no errored account beside it, or when nothing connectable was found. `skipped_by_user` mirrors the key `connect-tools` uses, so a caller reading both hand-offs reads one name. These keys are reasoning vocabulary for you and the calling flow; the next skill re-reads what it needs from its own tool calls, and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: this skill covers the bank kind only — say so, and when the bank is connected say how many bank connections are live, so a user with several accounts can tell a full picture from one bank's worth of spend. Offer to connect another; do not stop the flow on it.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `define-period` skill is installed: "Which month or period should we work on?". Otherwise hand control back to the skill that called this one, or, when the user asked about the bank on their own, stop after the bank line.
- The whole answer stays a few plain sentences a non-technical user understands: the bank's state, the one fact that matters (live, syncing, expired, or missing), and the next step. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of banks, or a table of them, when the picker card is already on screen.
- Any figure computed from bank data — no balance, no spend total, no transaction count.
- A bank state guessed from a connector's display name, read from a `workspace_connectors` records query, or invented after a failed read.
- A claim that a sync was triggered. This skill establishes the connection; Well syncs on its own.
- A flow continuation that skipped the Continue click — as a flow step, the acknowledgment (clicked or typed) is the gate, a connected bank included.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the bank card from one that did
not. Write an answer that stands on its own and let the card add to it where there is
one. State the connections in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `well_list_connectors` with `kind` `bank` was the only source of a connector row — no `well_query_records` on `workspace_connectors`, no `well_invoke_connector_tool` — and the catalog was read unscoped and filtered by hand only when the server rejected `kind`. A `well_list_workspaces` call for the session resync does not break this rule.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this conversation established — the workspace was not resolved or asked for in text here, and no leftover pin from another conversation was reused or mentioned.
- The state came from `direction: input` rows whose `data_domains` contains `bank`, read with the four-line state precedence — not from a name, a `category_id`, or `is_connected` alone.
- A `need_reconnect` / `degraded` / `suspended` bank was reported as `error` even when it had synced before, and an errored account was named even when another bank was connected.
- An absent `last_successful_sync_at` was degraded to `connected` on `enabled`, a rejected `kind` fell back to an unscoped read filtered on `data_domains`, and an unrecognized `connection_status` was reported as `error`, never as connected.
- As a flow step, the turn ended on the card — a connected bank included — and the flow moved on only on the acknowledgment: the "Continue" prefill or a typed continue taken at its word with no extra call, or one `well_wait_for_selection({ kind: "bank_ack", timeout_s: 10 })` call on any other message. The wait tool was never called before this conversation rendered the card.
- A typed "I connected it" got one fresh read in that turn, and nothing was re-asked in text.
- The bank state was stated once; the banks were not narrated or re-tabulated when the card was on screen.
- A bank the user named was searched with `q` before any "Well cannot connect it" claim.
- On a transient failure the call was retried once; a second failure returned `resolution: unavailable` with `state: null` and the workspace link, not a guess.
- The hand-off facts cover `state`, `connectors`, `install_url`, `skipped_by_user`, and `resolution`, the bank-only coverage was said in plain words, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The listing call carried `kind: "bank"`, and a card that visibly showed non-bank tools was treated as an unscoped call and redone scoped.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`define-period` when installed, otherwise the caller or the bank line).

## Examples

### Example request

The fetch-missing-invoices flow calls connect-bank with `workspace_id` of Acme SAS, `required: false`, `purpose: "to fetch the invoices missing for March"`. The scoped catalog returns a Qonto row — `direction: input`, `data_domains: ["bank"]`, `connection_status: enabled`, `last_successful_sync_at` set, `sync_in_progress: false`.

### Expected behavior

One `well_list_connectors({ workspace_id, kind: "bank" })` call renders the bank card. Say "Bank: connected — Qonto. That's the feed the March gaps are measured against — click Continue when you're ready." and end the turn. The user clicks Continue and sends the prefilled "Continue": move on to the period step with `state: connected`, `resolution: already_connected`, `install_url: null`, and no verification call. The connected bank still showed its card and stopped — the flow never skips this stop.

### Example request

"Connect my bank so you can see what I spent in March."

### Expected behavior

The scoped call returns no connected bank; the picker card is on screen with Well's recommended banks pre-checked. Say one line — "No bank connected yet, and March spend is what the missing invoices are measured against. Connect yours from the card, then click Continue." — and end the turn. The user connects Qonto from the card, then types "done, I connected Qonto": re-read the state once in that turn — it reads `connecting` — say the first sync usually finishes in a few minutes, and move on with `resolution: connected_now`.

### Example request

"Why don't you see my transactions?" — the scoped catalog holds one bank row with `connection_status: need_reconnect` and `last_successful_sync_at` set to three weeks ago.

### Expected behavior

Report `state: error`, not connected: "Bank: Qonto is connected but its access expired three weeks ago, so nothing has come in since — reconnect it from the card." Standalone ask: stop after the bank line with `resolution: awaiting_user` and `install_url` set. Do not report the old successful sync as coverage.

### Example request

The card shows the bank missing, the turn ends, and the user's next message is "continue anyway" with `required: false`.

### Expected behavior

The message is a typed continue: treat it as the acknowledgment over a missing bank — `resolution: acknowledged`, `state: missing` — and continue, saying the recap will be labelled as narrowed by the missing bank feed. Had the caller passed `required: true`, say the flow needs settled bank spend to measure anything against and stop.

### Example request

"Add my Shine account." — Shine is not in the curated default view.

### Expected behavior

Search with `q: "Shine"` before concluding anything. If the row is `available`, let the card show it and stop until the user connects. If the row's `status` is not `available`, say Shine cannot be connected today and offer the nearest available bank connector from the catalog instead of a dead link.
