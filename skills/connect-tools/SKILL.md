---
name: connect-tools
description: Check which data sources a Well workspace has connected — bank accounts, accounting software, invoicing and payment portals — get the missing ones connected with Well's one-click install links, and hand off a typed coverage result to the flow that follows. Use when the user asks to connect their finance tools, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asks "which tools are connected", "what can I connect to Well", or when a Well skill needs bank / accounting / invoicing data present before it continues. Use connect-bank instead for a bank-only ask. Do not use to compute figures, to trigger a sync, to disconnect a tool, or to run a connector's own actions.
---

# Connect Tools with Well

## Purpose

Answer "does this workspace have the connections this job needs?" and close the gap. One tool does the whole job: `well_list_connectors` returns Well's connector catalog with every one of the workspace's connections represented on its own catalog row, and in an MCP-Apps host that result renders as the connect picker card. Read the state per kind — bank, accounting, invoicing — from those rows, let the card carry the connect links, re-check the moment a connection lands, and return a typed coverage result the calling flow reads before it fetches invoices, categorizes counterparties, or closes a period. Step two of Well's fetch-missing-invoices flow, ahead of the dedicated `connect-bank` step. Well's data skills (`expense-breakdown`, `cash-position`, …) still run their own inline connector check today and can adopt this hand-off.

## When to use this skill

Use this skill when:

- The user asks to connect an accounting tool or an invoicing / payment portal to Well ("link Pennylane", "add Stripe so you can pull invoices"), or to connect their tools in general.
- The user asks what is connected, what is still syncing, or why a source shows an error.
- A calling skill (fetch missing invoices, close the books, a data skill) needs bank, accounting, or invoicing data in the workspace before it can continue.
- A data skill found the workspace empty or thin and needs the user to connect a source.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The ask is only about the bank ("connect my Qonto", "is my bank connected?") — that is the `connect-bank` skill, which scopes the catalog to banks and returns one state instead of three.
- The user wants a figure (cash, runway, spend) — the data skills run this check internally.
- The user wants to disconnect a tool, force a re-sync, or run an action on a connected provider (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants Well to fetch invoices from a portal — that is the deploy-agents step of the flow, after this one.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here.
- `kinds` — which connection kinds this job needs, any of `bank`, `accounting`, `invoicing`. Default: all three. When the user's own question names one kind ("is my accounting connected?"), treat that as the scope even with no calling skill involved.
- `required` — the subset of `kinds` the calling flow cannot continue without. A skip on one of these stops the flow instead of continuing. Default: none (every kind may be skipped).
- Provider hints — names the user mentioned ("Qonto", "Pennylane", "Shopify"). Optional; used to search the catalog.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for March"), used in the ask. Optional.

**Several workspaces.** When the `define-workspace` hand-off carries `workspaces` with more than one entry, run this skill once per workspace in that order — announce the sequence ("Acme SAS, then Acme Inc."), call `well_switch_workspace({ workspace_id })` at the start of every pass after the first (the first entry is already pinned), and pass that pass's `workspace_id` explicitly on every call, which is what decides the entity when the pin is absent or fails. Keep one hand-off per workspace, and never merge one workspace's rows, states, or figures into another's. A caller that loops for you passes one `workspace_id` per pass and no list — then this rule is already satisfied and must not fire again.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**`well_list_connectors` is the only tool this skill calls for connection state** — a multi-workspace run also calls `well_switch_workspace` to re-point the session at the next entity, and nothing else. It returns the connectable catalog with a live overlay: every connection the workspace already holds is represented on its own catalog row, so one call answers both "what can I connect?" and "what is connected?". Each row carries:

- `service_id` — the connector's stable catalog id. `name`, `category_id`, `logo_url` — what it is.
- `status` — `available` is connectable now; anything else (`coming_soon`, `unavailable`, `maintenance`) is not.
- `direction` — `input` is a data source Well reads from; `output` is a push-back destination (an accounting tool can appear as both).
- `data_domains` — the kinds this connector feeds, a list such as `["bank"]` or `["accounting"]`. Sometimes delivered as a JSON string; parse it.
- `is_connected` and `connection_status` — the live connection's state, `connection_status` being one of `enabled`, `processing`, `error`, `need_reconnect`, `to_configure`, `degraded`, `suspended`, `disabled`, or null when nothing is connected.
- `last_successful_sync_at` — when data last landed, or null if it never has. `sync_in_progress` — a sync is running right now.
- `workspace_connector_id` — the connected instance's id, or null. `is_preselected` — Well recommends connecting this one now, and the picker card pre-checks exactly these rows.
- `install_url` — a one-click link that starts the connection in Well from any state: it signs the user in, opens the bank login or the provider's OAuth, and covers a reconnect as well as a first install. Null only when the row is not `available`.

Inputs: `kind` — one of `bank`, `accounting`, `invoicing` — filters the catalog to that kind server-side. When the job covers one or two kinds, pass `kind` and call once per kind rather than reading the whole catalog and filtering it by hand; when it covers all three, one unscoped call grouped by `data_domains` is the right read. `q` name-searches the full catalog (a specific bank, a specific portal). `limit` and `offset` page it.

**Never call `well_query_records` on `workspace_connectors` in this skill.** That root is for record-level reads — timestamps, filters, joins — and querying it here renders a records table where the connect picker belongs, which is the wrong surface for a connect step and does not carry an install link. Everything this skill needs is on the catalog row. Never call `well_invoke_connector_tool` or any provider-specific tool either: this skill reads connection state, never provider data.

**How a kind is decided — exact-match on structured fields, never on a name or a category label.** A row counts toward a kind only when its `direction` is `input` and its `data_domains` contains that kind's value: `bank`, `accounting`, or `invoicing`. `category_id` is not a reliable kind (native banks such as Qonto sit under `finance`; only Plaid institutions carry `banks`), and a display name is never a kind. When you pass `kind`, the server has already applied this filter — still drop any `direction: output` row from the coverage decision.

**How a row's state is read**, in this order — the first line that matches wins:

1. `to_configure` or `disabled` → **missing.** Never authorized, or turned off. Offer the install link.
2. `need_reconnect`, `error`, `degraded`, or `suspended` → **error.** Authenticated but not delivering data; offer `install_url` as a reconnect. A row that once synced and now needs a reconnect is an error, not coverage — a stale feed is exactly what this skill exists to surface.
3. `enabled` with `last_successful_sync_at` set → **connected.** Data has landed.
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting.** The grant is in and the first sync is running.

`sync_in_progress: true` on a **connected** row keeps it connected — say data may be partial until the pass finishes.

**Degrade gracefully on an older server.** These fields are the current contract; a Well server may predate part of it. If `data_domains` is absent, fall back to one `kind`-scoped call per requested kind and treat each call's rows as that kind. If `kind` is rejected as an unknown input too, read the catalog unscoped and fall back to `q` on the providers the user named. If `last_successful_sync_at` is absent, read `enabled` as **connected** rather than reporting `connecting` forever. If `connection_status` carries a value outside the vocabulary above, treat the row as **error** and say the state is unrecognized — never read an unknown value as connected.

## Workflow

Call each list or read tool once per step. The widget cards refresh themselves — never re-call a tool just to check progress.

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, run `define-workspace` and take its hand-off; never pick a workspace here. Pass `workspace_id` explicitly on every call below, even under a session pin.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the current coverage in one pass.** Call `well_list_connectors({ workspace_id })` once when the job covers all three kinds, or `well_list_connectors({ workspace_id, kind })` once per kind when it covers one or two. Keep the `direction: input` rows, group them by `data_domains`, and read each row's state with the precedence in Tooling. Per requested kind:
   - At least one **connected** row → **connected**. Add "data may still be partial" when that row has `sync_in_progress: true`. Name any **error** row for the same kind alongside it and carry that row's `install_url` — one live connector does not cancel a dead one, and only the user knows whether the dead account matters.
   - Only **connecting** rows → **connecting**. Treat as connected for the flow; tell the user data may be partial for a few minutes.
   - Only **error** rows → **error**. Name the connector and offer its `install_url` as a reconnect, not a first install.
   - No qualifying row → **missing**, including a `to_configure` row the user started but never finished authorizing.

4. **Present the gap, once, on the card.** If every requested kind is connected, skip to step 7 and hand off. Otherwise:
   - In an MCP-Apps host the `well_list_connectors` result already IS the connect picker card, with Well's recommendations pre-checked and each row's install link. Do not restate the rows and do not re-render them as a list or a table. Say in one line which kinds are missing or in error and why they matter for the job (`purpose`), then stop and let the user connect from the card.
   - In a text-only host, name at most three connectors per missing kind — `is_preselected` rows first, then the user's provider hints via `q` — each with its `install_url`. Banks and accounting tools first, portals after.
   - If the user names a provider that is not in the default view, search it with `q` before saying Well does not support it. A row whose `status` is not `available` is not connectable today — say so and offer the nearest available alternative from the catalog rather than a dead link.

5. **Re-check the moment a connection lands.** When the user says they connected a tool, re-run step 3 yourself in the same turn and continue — do not wait to be re-prompted or ask the user to restate the request, and do not re-call the tool before the user has answered. If the user declines ("later", "skip the bank"), record that kind under `skipped_by_user` and continue; do not block the flow on a kind the user chose to skip. The exception is a kind listed in the caller's `required` input: say plainly that the flow cannot continue without it and stop, keeping the hand-off facts so the caller reads `coverage` and `skipped_by_user` and decides.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` → retry once. A second failure → do not invent connection state and hand off no coverage at all: every value would be a claim you cannot make, and `coverage: none` would read as "nothing is connected" rather than "nothing could be read". Say the coverage is unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, tell them the connections page in Well shows and fixes the same thing, and hand the failure back to the caller. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** State the coverage in one line per requested kind and keep the hand-off facts below for the caller — never printed as a block.

## Output requirements

Return:

- One line per requested kind: `bank`, `accounting`, `invoicing` — its state and the connector name(s) behind it (e.g. "Bank: connected — Qonto. Accounting: error — Pennylane needs a reconnect. Invoicing: missing.").
- The hand-off, kept for the calling flow and never printed: `workspace_id`; per requested kind its `state` (`connected`, `connecting`, `error`, or `missing`), the connectors behind it, and the `install_url` to act on; `coverage`; `skipped_by_user`; and `required` echoed from the caller. `coverage` is `complete` when every requested kind is `connected` or `connecting`, `none` when NO requested kind is `connected` or `connecting` — a workspace whose every kind is in `error` is delivering no data, so it is `none`, not `partial` — and `partial` otherwise. Only the requested kinds count. The connectors behind a kind include any errored connector named alongside a connected one. `install_url` belongs to the row that kind's line names: the errored row on `error` — or on `connected` when an errored connector sits beside the live one — the first `available` `is_preselected` row on `missing`, and null when the kind is cleanly `connected` or `connecting`. `required` lets the caller tell a skip it can live with from one it cannot. These keys are reasoning vocabulary for you and the calling flow; the next skill re-reads what it needs from its own tool calls, and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: this skill's coverage line IS the disclosure — say which of bank / accounting / invoicing are connected versus still missing so the calling flow and the user know whether what follows rests on a full picture.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `connect-bank` skill is installed and the bank is not connected yet: "Let's get the bank feed in — that is what the missing-invoice list is measured against." Otherwise, when `define-period` is installed: "Which month or period should we work on?". Otherwise hand control back to the skill that called this one, or, when the user asked about connections on their own, stop after the coverage line.
- The whole answer stays a few plain sentences a non-technical user understands: what is connected, what is missing, and the next step. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of connectors, or a table of them, when the picker card is already on screen.
- Any figure computed from connector data.
- Connection state guessed from a connector's display name, or read from a `workspace_connectors` records query.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `well_list_connectors` was the only tool called, apart from the `well_switch_workspace` re-pin on a multi-workspace run — no `well_query_records` on `workspace_connectors`, no `well_invoke_connector_tool`, no provider-specific tool.
- `kind` was passed when the job covered one or two kinds, rather than reading the whole catalog and filtering it by hand; an all-three job read it unscoped once.
- `workspace_id` came from `define-workspace` (or the caller) and was passed on every call — the workspace was not resolved here.
- Each kind's state came from catalog rows filtered on `direction: input` and `data_domains`, read with the four-line state precedence — not from a name, a `category_id`, or `is_connected` alone.
- A `need_reconnect` / `degraded` / `suspended` row was reported as `error` even when it had synced before, and an errored connector was named even when another connector covered the same kind.
- An absent `last_successful_sync_at` was degraded to `connected` on `enabled`, an absent `data_domains` fell back to one `kind`-scoped call per kind, a rejected `kind` fell back to an unscoped read plus `q`, and an unrecognized `connection_status` was reported as `error`, never as connected.
- `coverage` is `none` when no requested kind is `connected` or `connecting` — an all-`error` workspace was not labelled `partial`.
- The gap was stated once; the rows were not narrated or re-tabulated when the card was on screen.
- After a connection landed, coverage was re-read in the same turn and the flow continued.
- On a transient failure the call was retried once; a second failure returned no hand-off and no coverage claim, only the workspace link.
- The hand-off facts cover every requested kind, `coverage`, `skipped_by_user`, and `required` — and no yaml, JSON, or fenced code block appears anywhere in the answer.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`connect-bank` or `define-period` when installed, otherwise the caller or the coverage line).

## Examples

### Example request

The fetch-missing-invoices flow calls connect-tools with `workspace_id` of Acme SAS, `kinds: [bank, accounting, invoicing]`, `purpose: "to fetch the invoices missing for March"`. The catalog comes back with a Qonto row — `direction: input`, `data_domains: ["bank"]`, `connection_status: enabled`, `last_successful_sync_at` set — and no other connected row.

### Expected behavior

One `well_list_connectors` call. Say: "Bank: connected — Qonto. Accounting and invoicing: not connected yet; I need them to know which March invoices are missing." The picker card is on screen with Pennylane and Stripe pre-checked — stop there, and do not restate the rows. When the user connects Pennylane and says so, re-read in the same turn, report accounting as `connecting`, invoicing still `missing`, `coverage: partial`, and hand off.

### Example request

"Is my accounting tool connected?"

### Expected behavior

`define-workspace` first if no workspace is pinned. The question names one kind, so scope to it: `well_list_connectors({ workspace_id, kind: "accounting" })` — one scoped call, not a full catalog read. "Accounting: error — Pennylane is authenticated but its last sync failed; reconnect it here: <install_url>." Hand off with `coverage: none` (no requested kind is delivering data) and the reconnect link; do not touch bank or invoicing.

### Example request

"Is Pennylane connected?" — the catalog holds a Pennylane row with `connection_status: enabled` but `direction: output` and `data_domains: null`.

### Expected behavior

That row is a push-back destination, not the accounting data source. Report "Accounting: missing — Pennylane is set up for exporting entries, but its accounting sync is not connected", find the `input` row for Pennylane in the same result (or with `q: "pennylane"`), and hand its `install_url` — or let the card do it. Do not report accounting as connected.

### Example request

"Connect Shopify so you can pull my invoices."

### Expected behavior

Search the catalog with `q: "Shopify"`. If the row is `available`, let the card show it (or give its `install_url` in a text-only host) and stop until the user connects; then re-check and report invoicing as `connecting`. If the row is not `available`, say Shopify cannot be connected today and offer the nearest available invoicing connector from the catalog instead of a dead link.
