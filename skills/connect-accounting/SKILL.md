---
name: connect-accounting
requires: [define-workspace]
description: Get an accounting tool connected to a Well workspace and confirm the feed is live — read whether an accounting system (Pennylane, QuickBooks, Xero, Sage…) is already connected, still running its first sync, or in error, hand the user Well's one-click install link, and return a typed accounting-coverage result to the flow that follows. Use when the user asks to connect their accounting software, link Pennylane/QuickBooks/Xero/Sage, asks "is my accounting connected", or when a Well skill (like closing the books) needs posted-ledger data in the workspace before it continues. Do not use to connect a bank (that is connect-bank), to connect invoicing or payment portals or several kinds at once (that is connect-tools), to compute a figure, to force a re-sync, or to disconnect a tool.
---

# Connect Accounting with Well

## Purpose

Get the accounting tool connected, and say plainly whether it is live. One tool does the whole job: `well_list_connectors` scoped to `kind` `accounting` returns Well's accounting catalog — Pennylane, QuickBooks, Xero, Sage and the rest — with the workspace's own accounting connection represented on its catalog row, and in an MCP-Apps host that result renders as the connect picker card showing accounting tools only. **The accounting card is pick-one:** it is a single-select step, so it asks the user to choose their one accounting system, not to tick several. It runs as its own step in Well's close-the-books flow, after the bank, because posted-ledger data makes a close richer — but the close is never blocked on it, so this step is always skippable. As a flow step this is a user stop, a connected tool included: the card renders with a per-row **Connect** button and one **Continue** button. The Continue click writes an acknowledgment server-side (`well_switch_workspace` with `ack: "connectors"`) and prefills "Continue" in the user's composer; the user sends it, and that message is how the flow moves on.

**The accounting card shares the `connectors` acknowledgment slot** — there is no accounting-specific ack. Its Continue writes `ack: "connectors"` and is read back with `well_wait_for_selection({ kind: "connect_ack" })`, exactly like an unscoped `connect-tools` card. Only the bank scope has its own slot. This matters when two connectors-family cards render in one conversation for one workspace — see step 5.

## When to use this skill

Use this skill when:

- The user asks to connect or link their accounting software ("connect Pennylane", "link QuickBooks", "add Xero so you can see my ledger").
- The user asks whether the accounting tool is connected, why the ledger looks empty, or why the accounting source shows an error or needs a reconnect.
- A calling skill or flow (close the books, a data skill) wants posted-ledger / accounting data in the workspace before it continues.
- The close-the-books flow reaches its accounting step.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The user wants a bank connected — that is the `connect-bank` skill.
- The user wants an invoicing / payment portal connected, or all kinds checked at once — that is the `connect-tools` skill. This skill covers accounting only.
- A data skill needs accounting coverage inline on its way to a figure — that is `connect-tools` in `mode: internal_check`, which reads coverage and returns in the same turn. This skill is a user stop, not an inline read; it has no `internal_check` mode.
- The user wants to disconnect a tool, force a re-sync, or run an action on a connected provider (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants the ledger read, entries listed, or the books reconciled — this skill establishes the connection, it never reads provider data.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here. Reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace`.
- An accounting hint — the tool the user named ("Pennylane", "QuickBooks", "Sage"). Optional; used to search the catalog with `q` when the tool is not in the default view.
- `purpose` — one line from the calling skill (e.g. "to close this workspace's books"), used in the ask. Optional.
- `title` / `subtitle` — copy for the connect card, so a calling flow can adapt the wording to its own step (e.g. a close: `title: "Connect your accounting tool for the close"`, `subtitle: "Optional — it makes the close richer, but the books close without it."`). Optional; pass straight through to `well_list_connectors` when it accepts them, and fall back to the scope-derived wording otherwise. Never restate them in your own line.

**No `required` input, and no blocking.** Accounting is never a prerequisite: a missing accounting tool never stops the calling flow. The user can always skip this step, and the caller continues with the accounting state recorded. If a caller genuinely cannot proceed without accounting, it makes that decision from the hand-off `state`; this skill never converts the read into a hard stop.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes; each pass gets its own accounting read and its own acknowledgment, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here carries.

It ships with the `well-skills` plugin. This skill does not resolve the workspace itself: when no `workspace_id` was passed and this conversation established no pin, run `define-workspace` first (step 2) rather than asking for a workspace here.

**`well_list_connectors` is the only tool this skill reads a connector row from** — always with `kind` set to `accounting`, so the catalog comes back scoped to accounting tools server-side. No other tool contributes an accounting row or an accounting state. The rule covers connector listing only: `well_list_workspaces` lists workspaces, carries no connector row, and stays available for the session resync below. Each row carries `service_id`, `name`, `category_id`, `logo_url`, `status` (`available` is connectable now), `direction` (`input` is a data source Well reads from; `output` is a push-back destination), `data_domains` (contains `accounting` for an accounting row), `is_connected`, `connection_status`, `last_successful_sync_at`, `sync_in_progress`, `workspace_connector_id`, `is_preselected` (Well recommends it now, and the single-select picker pre-checks at most this one), and `install_url` — a one-click link that starts the connection in Well from any state, signing the user in and opening the provider's OAuth, and covering a reconnect as well as a first install. `install_url` is null only when the row is not `available`.

The default view is curated and matched-first, so a tool outside it needs `q` — pass the tool's name before concluding Well cannot connect it. The server curates the accounting preselection from its own accounting service list, not from the raw data domain, so at most one row arrives pre-checked.

**An accounting tool is often BOTH an input and an output — read direction before you read state.** The same provider (Pennylane above all) commonly appears twice: a `direction: input` row that is the accounting data source Well reads from, and a `direction: output` row that is a push-back destination Well posts entries to. **An `output` row is never accounting coverage**, even when its `connection_status` is `enabled` — a workspace can push entries out while reading nothing in. Count only the `direction: input` row whose `data_domains` contains `accounting`, and drop every `direction: output` row from the coverage decision. Do not classify a row by `category_id` or by its display name, either — accounting tools sit under mixed categories, and a name is never a kind. `data_domains` is a list such as `["accounting"]`, sometimes delivered as a JSON string — parse it before you read it, so the whole accounting decision rests on an exact list member rather than on text found inside a string.

The click-chain tools:

- `well_wait_for_selection({ kind: "connect_ack", timeout_s? })` — reads the Continue click (the card calls `well_switch_workspace` with `ack: "connectors"` itself), for when a later message is not the card's "Continue" prefill. **The accounting card writes `ack: "connectors"`, so it is read back with `kind: "connect_ack"` — never `bank_ack`, and there is no `accounting_ack`.** Call it only after this conversation has rendered the accounting card: reading a click on that card is its one job. Never call it at step start, never before the card exists, and never to probe for an ack — an ack exists only once this conversation's card has been clicked, so the card always comes first, with no tool call before its own read. An already-made ack returns instantly as `{ status: "selected", selection: { acknowledged: true }, already_set: true }`; when nothing is set yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an error. Never call it in the turn that renders the card, and never use it as a long wait. If the tool is absent, treat the user's next continue-message as the acknowledgment. **A session holds ONE ack per step per workspace, and accounting shares the `connectors` step with unscoped `connect-tools`**: so if a `connect-tools` card (or another accounting card) already rendered for this workspace in this conversation, `connect_ack` still carries that earlier click and answers `already_set` for a card nobody has clicked. On such a run, take the "Continue" prefill or a typed continue and let the next step's own read verify — never a wait-read. See step 5.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace and queue. Read the `session` block alone. This call is the workspace exemption named above, so a multi-workspace pass is executable without breaking the connector-listing rule.

**Never call `well_query_records` on `workspace_connectors` in this skill.** That root is for record-level reads — timestamps, filters, joins — and querying it here renders a records table where the connect picker belongs, which is the wrong surface for a connect step and carries no install link. Everything this skill needs is on the catalog row. Never call `well_invoke_connector_tool` or any provider-specific tool either.

**How a row's state is read**, in this order — the first line that matches wins:

1. `to_configure` or `disabled` → **missing.** Never authorized, or turned off. Offer the install link.
2. `need_reconnect`, `error`, `degraded`, or `suspended` → **error.** Authenticated but not delivering data; offer `install_url` as a reconnect. An accounting tool that once synced and now needs a reconnect is an error, not coverage — a stale feed is exactly what this skill exists to surface.
3. `enabled` with `last_successful_sync_at` set → **connected.** Ledger data has landed.
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting.** The grant is in and the first sync is running; a first accounting sync can take a few minutes.

`sync_in_progress: true` on a **connected** row keeps it connected — say the ledger may be partial until the pass finishes.

**Degrade gracefully on an older server.** If `kind` is rejected as an unknown input, call `well_list_connectors` unscoped and keep the rows whose `data_domains` contains `accounting`; when that unscoped read carries no `data_domains` either, search with `q` on the tool the user named rather than guessing a kind from a name. If `kind` is accepted but the rows carry no `data_domains`, trust the server's own scoping and read every returned `input` row as an accounting row. If `last_successful_sync_at` is absent, read `enabled` as **connected** rather than reporting `connecting` forever. If `connection_status` carries a value outside the vocabulary above, treat the row as **error** and say the state is unrecognized — never read an unknown value as connected.

## Workflow

Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. The Continue click executes server-side and prefills "Continue" in the user's composer — rendering the card therefore ends the turn, and the sent message is how the flow moves on.

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because accounting connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, use the session pin silently when this conversation established it; otherwise run `define-workspace` (its picker renders at the point of need — never ask "which workspace?" in text, and never reuse or mention a pin left by another conversation). Pass `workspace_id` explicitly on every call below, even under a session pin.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the accounting state — one scoped call, accounting only.** The accounting state comes from exactly one call, and it is literally `well_list_connectors({ workspace_id, kind: "accounting" })`. Calling it without `kind` is an error in this skill — the one exception is the older-server degrade path in Tooling, after the server has rejected `kind`. The rendered card must show accounting tools only: if the card visibly carries banks or invoicing tools, the call was made unscoped — redo it with `kind: "accounting"` before saying anything about the accounting side. Keep the `direction: input` rows whose `data_domains` contains `accounting` — dropping every `direction: output` push-back row — read each one's state with the precedence in Tooling, then reduce them to one accounting state:
   - At least one **connected** row → **connected**. Name the tool. Add "the ledger may still be partial" when a connected row has `sync_in_progress: true`. Name any **error** row alongside it and offer that row's `install_url` — a live tool does not cancel a dead one, and the user is the only one who knows whether the old account matters (e.g. a QuickBooks feed left behind after a move to Pennylane).
   - Only **connecting** rows → **connecting**. Treat as connected for the flow, and say the first sync usually finishes in a few minutes.
   - Only **error** rows → **error**. Name the tool and offer its `install_url` as a reconnect, not a first install.
   - No qualifying `input` row → **missing**, including a `to_configure` row the user started but never finished authorizing, and including a workspace whose only accounting row is `direction: output` (a push-back destination is not the accounting data source — say so rather than reporting it connected).

4. **State the accounting side once, then end the turn on the card.** One line: the accounting state and why it matters for the job (`purpose`) — for a close, that a connected ledger makes the close richer, though the books close without it. Then one closing line: pick and connect your accounting tool from the card if you want it, then click Continue; it is optional. Do not restate the tools or re-render them as a list or table: the card carries the tiles and the install links. Even a cleanly connected tool shows its card and stops here, so the user sees and confirms the feed. Nothing else in the turn.
   - When the user asked about accounting standalone (nothing follows), the accounting line ends the turn — the card is on screen, and there is nothing to chain.
   - In a text-only host, give the `install_url` for at most three tools — the user's hint first (found with `q` when it is outside the default view), then the `is_preselected` row — and treat the user's next message as the answer.
   - If the user names a tool that is not in the default view, search it with `q` before saying Well cannot connect it. A row whose `status` is not `available` is not connectable today — say so and offer the nearest available accounting connector rather than a dead link.

5. **Resolve the next message after the card.** In this order, and never by re-asking:

   **The shared-slot rule.** Accounting writes `ack: "connectors"`. If a `connect-tools` card, or another accounting card, already rendered for this workspace earlier in this conversation, `connect_ack` still carries that earlier click and would answer `already_set` for this card before anyone clicks it — so a wait-read here cannot verify this card. On such a run, the acknowledgment comes only from the user's own message (the "Continue" prefill or a typed continue), and the next step's own read is what verifies it. Make no `well_wait_for_selection` call at all: ask in one line for the Continue click on the card now on screen, and end the turn. (When this is the first and only connectors-family card in the conversation — the usual case inside a close — the wait-read below is safe.)

   - The message is the card's "Continue" prefill, or says continue / done / skip it / go ahead in its own words and claims no fresh connection → that is the acknowledgment; move on in one short sentence. No verification call is needed here — the next step's own read is the verification, and a tool connected during the stop lands in the later steps' own reads while the hand-off's `state` describes the read that rendered the card.
   - The user says in text they connected the tool, even alongside a continue word ("done, I connected Pennylane") → re-read the state once in that turn (that turn's one card) — a freshly connected tool usually reads **connecting**, which is enough to move the flow on, `resolution: connected_now`. A claim of a fresh connection takes this line, not the one above.
   - Any other message → **only when this is the first connectors-family card in the conversation** (see the shared-slot rule), call `well_wait_for_selection({ kind: "connect_ack", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → the ack is in; move on. `no_selection_yet` → one line asking to click Continue on the card, end the turn.
   - The user declines ("later", "skip accounting", "no accounting tool") → set `skipped_by_user: true`, `resolution: skipped`, and continue. Accounting is never required, so a decline never stops the flow.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` → retry once. A second failure → do not invent an accounting state; hand off `resolution: unavailable` with `state: null`, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and tell them the connections page in Well shows and fixes the same thing. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** State the accounting side in one line and keep the hand-off facts below for the caller — never printed as a block.

## Output requirements

Return:

- One line on the accounting tool and the connector(s) behind it (e.g. "Accounting: connected — Pennylane." or "Accounting: not connected yet — it is optional for the close, but it makes the posted ledger richer.").
- The hand-off, kept for the calling flow and never printed: `workspace_id`; `state` — `connected`, `connecting`, `error`, `missing`, or null; `connectors` — the accounting tools behind the state, plus any errored tool named alongside a connected one; `install_url`; `skipped_by_user`; and `resolution` — `already_connected` (the read said connected or connecting and the user clicked Continue, or the ask was standalone), `connected_now` (the user connected it during this step and a fresh read confirmed it), `acknowledged` (the user clicked Continue over a `missing` or `error` read — the flow continues), `awaiting_user` (the card is on screen and neither a click nor an answer has arrived), `skipped` (the user declined), or `unavailable` (the catalog could not be read twice — `state` and `connectors` are null, no accounting claim can be made). `install_url` is the link to act on — a reconnect on `error`, a first install on `missing` — and null when the tool is connected with no errored account beside it, or when nothing connectable was found. `skipped_by_user` mirrors the key `connect-bank` and `connect-tools` use, so a caller reading several hand-offs reads one name. These keys are reasoning vocabulary for you and the calling flow; the next skill re-reads what it needs from its own tool calls, and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: this skill covers the accounting kind only — say so, so a caller and the user can tell an accounting-only answer from the whole connection picture (the bank has its own `connect-bank` check, and invoicing plus the multi-kind view live in `connect-tools`).
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if it feels off — skip it rather than force it in.
- **No next-step pointer.** Unlike the other connect bricks, this skill does not point the user onward: accounting is an optional, non-blocking side step, and its callers own the order of what follows. When the user asked about accounting on their own, stop after the accounting line; when a flow called this skill, hand control back to it silently.
- The whole answer stays a few plain sentences a non-technical user understands: the accounting state, the one fact that matters (live, syncing, expired, or missing), and that it is optional. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of accounting tools, or a table of them, when the picker card is already on screen.
- Any figure computed from accounting data — no ledger total, no entry count.
- An accounting state guessed from a connector's display name, read from a `workspace_connectors` records query, taken from a `direction: output` push-back row, or invented after a failed read.
- A claim that a sync was triggered. This skill establishes the connection; Well syncs on its own.
- A flow continuation that skipped the acknowledgment — the acknowledgment (clicked or typed) is the gate, a connected tool included. (A decline is itself an acknowledgment: accounting is never required.)

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the accounting card from one that
did not. Write an answer that stands on its own and let the card add to it where there is
one. State the connection in text regardless — you cannot know whether anything drew it.
What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `well_list_connectors` with `kind` `accounting` was the only source of a connector row — no `well_query_records` on `workspace_connectors`, no `well_invoke_connector_tool` — and the catalog was read unscoped and filtered by hand only when the server rejected `kind`. A `well_list_workspaces` call for the session resync does not break this rule.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this conversation established — the workspace was not resolved or asked for in text here, and no leftover pin from another conversation was reused or mentioned.
- The state came from `direction: input` rows whose `data_domains` contains `accounting`, read with the four-line state precedence — not from a name, a `category_id`, `is_connected` alone, or a `direction: output` push-back row.
- An accounting tool whose only row was `direction: output` was reported **missing** (a push-back destination is not the data source), and the `input` row was searched for before any connected claim.
- A `need_reconnect` / `degraded` / `suspended` tool was reported as `error` even when it had synced before, and an errored tool was named even when another tool was connected.
- An absent `last_successful_sync_at` was degraded to `connected` on `enabled`, a rejected `kind` fell back to an unscoped read filtered on `data_domains`, and an unrecognized `connection_status` was reported as `error`, never as connected.
- As a flow step, the turn ended on the card — a connected tool included — and the flow moved on only on the acknowledgment: the "Continue" prefill or a typed continue taken at its word with no extra call, or one `well_wait_for_selection({ kind: "connect_ack", timeout_s: 10 })` call on any other message. The wait tool was never called before this conversation rendered the card.
- On a run where a `connect-tools` card or another accounting card had already rendered for this workspace this conversation, no `connect_ack` wait-read was made — the acknowledgment came from the "Continue" prefill or a typed continue, and any other message got one line asking for the click. No user was told a card was already confirmed because the shared slot carried an earlier card's click.
- The ack was read back with `kind: "connect_ack"` — never `bank_ack`, and no `accounting_ack` was invented.
- A typed "I connected it" got one fresh read in that turn, and nothing was re-asked in text.
- The accounting state was stated once; the tools were not narrated or re-tabulated when the card was on screen.
- A tool the user named was searched with `q` before any "Well cannot connect it" claim.
- On a transient failure the call was retried once; a second failure returned `resolution: unavailable` with `state: null` and the workspace link, not a guess.
- The hand-off facts cover `state`, `connectors`, `install_url`, `skipped_by_user`, and `resolution`, the accounting-only coverage was said in plain words, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The listing call carried `kind: "accounting"`, and a card that visibly showed non-accounting tools was treated as an unscoped call and redone scoped.
- Accounting was never treated as required: a decline or a skip continued the flow, and no hard stop was raised for a missing accounting tool.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- No next-step pointer was appended — the answer stopped after the accounting line (standalone) or handed back to the caller (flow).

## Examples

### Example request

The close-the-books flow calls connect-accounting with `workspace_id` of Acme SAS, `purpose: "to close this workspace's books"`, `title: "Connect your accounting tool for the close"`, `subtitle: "Optional — it makes the close richer, but the books close without it."`. The scoped catalog returns a Pennylane row — `direction: input`, `data_domains: ["accounting"]`, `connection_status: enabled`, `last_successful_sync_at` set, `sync_in_progress: false`.

### Expected behavior

One `well_list_connectors({ workspace_id, kind: "accounting" })` call renders the accounting card with the close-context wording passed straight through. Say "Accounting: connected — Pennylane. That gives the close your posted ledger. Click Continue when you're ready — it's optional." and end the turn. The user clicks Continue and sends the prefilled "Continue": hand back to the close with `state: connected`, `resolution: already_connected`, `install_url: null`, and no verification call. No next-step pointer — the close owns what follows.

### Example request

"Connect my accounting so you can see my ledger." — the scoped call returns no `input` accounting row.

### Expected behavior

The picker card is on screen with Well's recommended accounting tool pre-checked (single-select). Say one line — "No accounting tool connected yet. Pick yours from the card and connect it, then click Continue — it's optional." — and end the turn. The user connects Pennylane from the card, then types "done, I connected Pennylane": re-read the state once in that turn — it reads `connecting` — say the first sync usually finishes in a few minutes, and move on with `resolution: connected_now`.

### Example request

"Is Pennylane connected?" — the catalog holds a Pennylane row with `connection_status: enabled` but `direction: output` and `data_domains: null`, and no `input` accounting row.

### Expected behavior

That row is a push-back destination, not the accounting data source. Report `state: missing`: "Accounting: not connected — Pennylane is set up for exporting entries, but its accounting sync isn't connected." Search the `input` row for Pennylane in the same result (or with `q: "pennylane"`) and let the card carry its install link. Standalone ask: stop after the accounting line with `resolution: awaiting_user`. Do not report accounting as connected off the `output` row.

### Example request

The card shows accounting missing, the turn ends, and the user's next message is "skip it, no accounting tool".

### Expected behavior

Record `skipped_by_user: true`, `resolution: skipped`, treat the message as the acknowledgment, and continue in one short sentence — accounting is never required, so the flow moves on with the accounting state recorded as missing. No wait-read, no re-ask.

### Example request

A close conversation already rendered an unscoped `connect-tools` card earlier (its Continue wrote `ack: "connectors"`), and now the accounting card renders for the same workspace. The user's next message is "keep going".

### Expected behavior

"keep going" is a typed continue → take it as the acknowledgment and move on, no verification call. Had the message been ambiguous, make **no** `connect_ack` wait-read — the earlier card's click still sits in the shared `connectors` slot and would falsely answer `already_set`. Ask in one line for the Continue click on the accounting card now on screen, and let the close's next read verify what landed.

## Voice

<!-- voice:begin -->
Write like a brilliant, understated operations colleague. Hold the tone professional and casual at the same time, confident but never arrogant, credible but easy to follow, warm but never cute. This governs every message of the run, whichever step produced it. Precedence is fixed: when a step hands you an exact string to write, write it exactly as given, dashes and capitals included; these rules govern the prose you compose yourself.

Lead with the outcome, then the detail behind it. Write short active sentences a non-technical reader understands. Use sentence case for the headings and labels you write yourself. Name a real button or card label exactly as the app renders it, such as Use, Validate, Continue, or Deploy, so the user reads the same word on screen. Prefer a concrete number or a real example over an abstract claim.

Never write an em dash or an en dash. Use a period, a comma, or a colon instead. Never write an exclamation mark or an emoji. Keep an acknowledgement brief and specific, such as "Got it, pulling those invoices now." Skip preamble, superlatives, and self-praise.

Drop the habits that make an answer sound generic:

- Hedging transitions, such as "Furthermore", "Moreover", "Additionally", or "In today's fast-paced landscape".
- Buzzwords, such as leverage, delve, harness, foster, revolutionize, revolutionise, streamline, optimize, optimise, seamless, game-changer, cutting-edge, best-in-class, world-class, unparalleled, disruptive, synergy, blockchain, and crypto.
- Hollow contrast, such as "not just X, but Y".
- Vague praise, such as powerful, robust, intelligent, frictionless, elegant, or advanced.

Reach for these verbs first: ask, drop, connect, get, surface, compose, share, route, enrich, learn, reconcile, match, flag.

Keep to the house words in what you write to the user. Write "connect", never "integrate". Write "sessions", never "chat". Write "business data", never "financial data". Write "tokens", never "credits". Name every object by its own name, the workspace, the connector, the company, or the invoice, and never show the user a raw id on its own. A Well app address is a link, not an id, so keep it whole even when it carries a workspace id.
<!-- voice:end -->
