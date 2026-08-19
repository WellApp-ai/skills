---
name: connect-bank
description: Get a bank account connected to a Well workspace and confirm the feed is live — read which banks are already connected, still running their first sync, or in error, hand the user Well's one-click bank install link, and return a typed bank-coverage result to the flow that follows. Use when the user asks to connect a bank, link a bank account, add Qonto or a Plaid-supported bank, asks "is my bank connected", "why are my transactions missing", or when a Well skill needs settled bank spend in the workspace before it continues. Do not use to connect accounting or invoicing tools (that is connect-tools), to compute a figure, to force a re-sync, or to disconnect an account.
---

# Connect Bank with Well

## Purpose

Get the bank feed in, and say plainly whether it is live. One tool does the whole job: `well_list_connectors` scoped to `kind` `bank` returns Well's bank catalog — Plaid institutions and Well's native bank connectors — with the workspace's own bank connections represented on their catalog rows, and in an MCP-Apps host that result renders as the connect picker card showing banks only. It runs as its own step in Well's fetch-missing-invoices flow, right after `connect-tools`, because settled bank spend is what every missing invoice is measured against, and because a bank connection is the slowest one a user makes — so it earns a turn of its own rather than competing with accounting and invoicing on one card.

## When to use this skill

Use this skill when:

- The user asks to connect or link a bank account ("connect my Qonto", "link my business account", "add my bank so you can see my spend").
- The user asks whether the bank is connected, why transactions are missing, or why the bank shows an error or needs a reconnect.
- A calling skill or flow (fetch missing invoices, close the books, a cash skill) needs settled bank spend in the workspace before it can continue.
- `connect-tools` reported `bank` as `missing` or `error` and the gap has to be closed before the flow moves on.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The user wants an accounting tool or an invoicing / payment portal connected, or all three kinds checked at once — that is the `connect-tools` skill.
- The user wants a figure computed from bank data (cash, runway, burn, spend) — `cash-position`, `runway-calculator`, and `expense-breakdown` run their own connector check internally.
- The user wants to disconnect an account, force a re-sync, or run an action on a connected bank (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants the bank's transactions listed or reconciled — this skill establishes the connection, it never reads provider data.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here.
- `required` — whether the calling flow can continue without a bank. `true` means a skip stops the flow; `false` means a skip is recorded and the flow continues. Default: `false`.
- A bank hint — the bank the user named ("Qonto", "BNP", "my Revolut account"). Optional; used to search the catalog with `q` when the bank is not in the default view.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for March"), used in the ask. Optional.

**Several workspaces.** When the `define-workspace` hand-off carries `workspaces` with more than one entry, run this skill once per workspace in that order — announce the sequence ("Acme SAS, then Acme Inc."), call `well_switch_workspace({ workspace_id })` at the start of every pass after the first (the first entry is already pinned), and pass that pass's `workspace_id` explicitly on every call, which is what decides the entity when the pin is absent or fails. Emit one hand-off block per workspace, and never merge one workspace's rows, states, or figures into another's. A caller that loops for you passes one `workspace_id` per pass and no list — then this rule is already satisfied and must not fire again.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**`well_list_connectors` is the only tool this skill calls for bank state** — a multi-workspace run also calls `well_switch_workspace` to re-point the session at the next entity, and nothing else — always with `kind` set to `bank` so the catalog comes back scoped to banks server-side. Each row carries `service_id`, `name`, `category_id`, `logo_url`, `status` (`available` is connectable now), `direction` (`input` is a data source), `data_domains` (contains `bank` for a bank row), `is_connected`, `connection_status`, `last_successful_sync_at`, `sync_in_progress`, `workspace_connector_id`, `is_preselected` (Well recommends it now, and the picker pre-checks exactly these), and `install_url` — a one-click link that starts the connection in Well from any state, signing the user in and opening the bank's own login flow with the institution pre-selected. `install_url` is null only when the row is not `available`.

The default view is curated and matched-first, so a bank outside it needs `q` — pass the bank's name before concluding Well cannot connect it. Do not classify a row by `category_id`: Plaid institutions sit under `banks` while native banks such as Qonto sit under `finance`, and a display name is never a kind. A bank row is a `direction: input` row whose `data_domains` contains `bank`; drop any `direction: output` row from the coverage decision.

**Never call `well_query_records` on `workspace_connectors` in this skill.** That root is for record-level reads — timestamps, filters, joins — and querying it here renders a records table where the connect picker belongs, which is the wrong surface for a connect step and carries no install link. Everything this skill needs is on the catalog row. Never call `well_invoke_connector_tool` or any provider-specific tool either.

**How a row's state is read**, in this order — the first line that matches wins:

1. `to_configure` or `disabled` → **missing.** Never authorized, or turned off. Offer the install link.
2. `need_reconnect`, `error`, `degraded`, or `suspended` → **error.** Authenticated but not delivering data; offer `install_url` as a reconnect. A bank that once synced and now needs a reconnect is an error, not coverage — a stale feed is exactly what this skill exists to surface, and bank grants expire routinely.
3. `enabled` with `last_successful_sync_at` set → **connected.** Transactions have landed.
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting.** The grant is in and the first sync is running; a first bank sync can take a few minutes.

`sync_in_progress: true` on a **connected** row keeps it connected — say the spend may be partial until the pass finishes.

**Degrade gracefully on an older server.** These fields are the current contract; a Well server may predate part of it. If `kind` is rejected as an unknown input, call `well_list_connectors` unscoped and keep the rows whose `data_domains` contains `bank`. If `data_domains` is absent too, keep the rows the `kind`-scoped call returned, or fall back to `q` on the bank the user named. If `last_successful_sync_at` is absent, read `enabled` as **connected** rather than reporting `connecting` forever. If `connection_status` carries a value outside the vocabulary above, treat the row as **error** and say the state is unrecognized — never read an unknown value as connected.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because bank connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, run `define-workspace` and take its hand-off; never pick a workspace here. Pass `workspace_id` explicitly on every call below, even under a session pin.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the bank state.** Call `well_list_connectors({ workspace_id, kind: "bank" })`. Keep the `direction: input` rows whose `data_domains` contains `bank`, read each one's state with the precedence in Tooling, then reduce them to one bank state:
   - At least one **connected** row → **connected**. Name the bank(s). Add "spend may still be partial" when a connected row has `sync_in_progress: true`. Name any **error** row alongside it and offer that row's `install_url` — a live bank does not cancel a dead one, and the user is the only one who knows whether the dead account matters.
   - Only **connecting** rows → **connecting**. Treat as connected for the flow, and say the first sync usually finishes in a few minutes.
   - Only **error** rows → **error**. Name the bank and offer its `install_url` as a reconnect, not a first install.
   - No qualifying row → **missing**, including a `to_configure` row the user started but never finished authorizing.

4. **Present the gap, once, on the card.** If the bank is connected, skip to step 7 and hand off. Otherwise:
   - In an MCP-Apps host the `well_list_connectors` result already IS the connect picker card, scoped to banks, with Well's recommendations pre-checked and each row's install link. Do not restate the banks and do not re-render them as a list or a table. Say in one line that the bank is missing or in error and why it matters for the job (`purpose`) — for a missing-invoice or close job, that settled bank spend is what the gaps are measured against — then stop and let the user connect from the card.
   - In a text-only host, give the `install_url` for at most three banks: the user's hint first (found with `q` when it is outside the default view), then the `is_preselected` rows.
   - If the user names a bank that is not in the default view, search it with `q` before saying Well cannot connect it. A row whose `status` is not `available` is not connectable today — say so and offer the nearest available bank connector rather than a dead link.

5. **Re-check the moment the bank lands.** When the user says they connected it, or the card reports it, re-run step 3 yourself in the same turn and continue — do not wait to be re-prompted or ask the user to restate the request. A freshly connected bank usually reads **connecting**; that is enough to move the flow on.
   - If the user declines ("later", "skip the bank"), set `skipped_by_user: true` and continue when `required` is `false`. When `required` is `true`, say plainly that the flow cannot continue without the bank feed and stop — hand-off block included, so the caller reads `state` and decides.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` → retry once. A second failure → do not invent a bank state; return `resolution: unavailable` with `state: null`, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and tell them the connections page in Well shows and fixes the same thing. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** State the bank in one line and emit the hand-off block below.

## Output requirements

Return:

- One line on the bank and the connector(s) behind it (e.g. "Bank: connected — Qonto, first sync still running, so March spend may be partial for a few minutes." or "Bank: not connected yet — I need the feed to know which March invoices are missing.").
- The hand-off block, exactly these keys, so a calling skill can read it:

  ```yaml
  workspace_id: <uuid>
  state: connected | connecting | error | missing | null
  connectors: [<bank name>, …] | null
  install_url: <url or null>
  skipped_by_user: <true|false>
  resolution: already_connected | connected_now | awaiting_user | skipped | unavailable
  ```

  `connectors` lists the banks behind the state, plus any errored account named alongside a connected one. `state` and `connectors` are null only on `resolution: unavailable`, where no bank claim can be made. `install_url` is the link to act on — a reconnect on `error`, a first install on `missing` — and null when the bank is connected with no errored account beside it, or when nothing connectable was found. `resolution` says how the step ended: `already_connected` (connected before this step ran, nothing asked), `connected_now` (the user connected it during this step and the re-check confirmed it), `awaiting_user` (the card or the link is on screen and nothing has landed yet), `skipped` (the user declined), `unavailable` (the catalog could not be read twice — `state` and `connectors` are null and no bank claim is made). `skipped_by_user` mirrors the key `connect-tools` uses, so a caller reading both blocks reads one name.
- Connector coverage in plain words: this skill covers the bank kind only — say so, and when the bank is connected say how many bank connections are live, so a user with several accounts can tell a full picture from one bank's worth of spend. Offer to connect another; do not stop the flow on it.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `define-period` skill is installed: "Which month or period should we work on?". Otherwise hand control back to the skill that called this one, or, when the user asked about the bank on their own, stop after the bank line.

Do not return:

- A restated list of banks, or a table of them, when the picker card is already on screen.
- Any figure computed from bank data — no balance, no spend total, no transaction count.
- A bank state guessed from a connector's display name, read from a `workspace_connectors` records query, or invented after a failed read.
- A claim that a sync was triggered. This skill establishes the connection; Well syncs on its own.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `well_list_connectors` with `kind` `bank` was the only tool called, apart from the `well_switch_workspace` re-pin on a multi-workspace run — no `well_query_records` on `workspace_connectors`, no `well_invoke_connector_tool` — and the catalog was read unscoped and filtered by hand only when the server rejected `kind`.
- `workspace_id` came from `define-workspace` (or the caller) and was passed on every call — the workspace was not resolved here.
- The state came from `direction: input` rows whose `data_domains` contains `bank`, read with the four-line state precedence — not from a name, a `category_id`, or `is_connected` alone.
- A `need_reconnect` / `degraded` / `suspended` bank was reported as `error` even when it had synced before, and an errored account was named even when another bank was connected.
- An absent `last_successful_sync_at` was degraded to `connected` on `enabled`, a rejected `kind` fell back to an unscoped read filtered on `data_domains`, and an unrecognized `connection_status` was reported as `error`, never as connected.
- The gap was stated once; the banks were not narrated or re-tabulated when the card was on screen.
- A bank the user named was searched with `q` before any "Well cannot connect it" claim.
- After the bank landed, the state was re-read in the same turn and the flow continued.
- On a transient failure the call was retried once; a second failure returned `resolution: unavailable` with `state: null` and the workspace link, not a guess.
- The hand-off block carries `state`, `connectors`, `install_url`, `skipped_by_user`, and `resolution`, and the bank-only coverage was said in plain words.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`define-period` when installed, otherwise the caller or the bank line).

## Examples

### Example request

The fetch-missing-invoices flow calls connect-bank with `workspace_id` of Acme SAS, `required: false`, `purpose: "to fetch the invoices missing for March"`. The scoped catalog returns a Qonto row — `direction: input`, `data_domains: ["bank"]`, `connection_status: enabled`, `last_successful_sync_at` set, `sync_in_progress: false`.

### Expected behavior

One `well_list_connectors({ workspace_id, kind: "bank" })` call. Say "Bank: connected — Qonto." and hand off with `state: connected`, `resolution: already_connected`, `install_url: null`, and one line noting that one bank connection is live, in case another account is missing. Then point at the period step.

### Example request

"Connect my bank so you can see what I spent in March."

### Expected behavior

`define-workspace` first if no workspace is pinned. Then the scoped call returns no connected bank. The picker card is on screen with Well's recommended banks pre-checked — say one line ("No bank connected yet, and March spend is what the missing invoices are measured against."), then stop. When the user connects and says so, re-read in the same turn, report `state: connecting` with "the first sync usually finishes in a few minutes", and hand off with `resolution: connected_now`.

### Example request

"Why don't you see my transactions?" — the scoped catalog holds one bank row with `connection_status: need_reconnect` and `last_successful_sync_at` set to three weeks ago.

### Expected behavior

Report `state: error`, not connected: "Bank: Qonto is connected but its access expired three weeks ago, so nothing has come in since — reconnect it here: <install_url>." Hand off with `install_url` set and `resolution: awaiting_user`. Do not report the old successful sync as coverage.

### Example request

"Add my Shine account." — Shine is not in the curated default view.

### Expected behavior

Search with `q: "Shine"` before concluding anything. If the row is `available`, let the card show it (or give its `install_url` in a text-only host) and stop until the user connects. If the row's `status` is not `available`, say Shine cannot be connected today and offer the nearest available bank connector from the catalog instead of a dead link.

### Example request

The user answers "skip the bank for now" and the caller passed `required: true`.

### Expected behavior

Set `skipped_by_user: true`, `state: missing`, `resolution: skipped`, and stop with the hand-off block — saying plainly that the flow needs settled bank spend to measure anything against, and that it can resume the moment the bank is connected. Do not continue past this step and do not connect anything on the user's behalf.
