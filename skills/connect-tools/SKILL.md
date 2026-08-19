---
name: connect-tools
requires: [define-workspace]
description: Check which data sources a Well workspace has connected — bank accounts, accounting software, invoicing and payment portals — get the missing ones connected with Well's one-click install links, and hand off a typed coverage result to the flow that follows. Use when the user asks to connect a bank, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asks "which tools are connected", "what can I connect to Well", or when a Well skill needs bank / accounting / invoicing data present before it continues. Do not use to compute figures, to trigger a sync, to disconnect a tool, or to run a connector's own actions.
---

# Connect Tools with Well

## Purpose

Answer "does this workspace have the connections this job needs?" and close the gap. Read the live connection state per kind — bank, accounting, invoicing — from Well's connector catalog, surface the connect links for whatever is missing or broken, wait for the connection to land, and return a typed coverage result the calling flow reads before it fetches invoices, categorizes transactions, or closes a period. Steps two and three of Well's fetch-missing-invoices flow. Well's data skills (`expense-breakdown`, `cash-position`, …) still run their own inline connector check today and can adopt this hand-off.

## When to use this skill

Use this skill when:

- The user asks to connect a bank account, an accounting tool, or an invoicing / payment portal to Well ("connect my Qonto", "link Pennylane", "add Stripe so you can pull invoices").
- The user asks what is connected, what is still syncing, or why a source shows an error.
- A calling skill (fetch missing invoices, close the books, a data skill) needs bank, accounting, or invoicing data in the workspace before it can continue.
- A data skill found the workspace empty or thin and needs the user to connect a source.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- The user wants a figure (cash, runway, spend) — the data skills run this check internally.
- The user wants to disconnect a tool, force a re-sync, or run an action on a connected provider (`well_invoke_connector_tool`) — out of scope; point them to the Well app.
- The user wants Well to fetch invoices from a portal — that is the deploy-agents step of the flow, after this one.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here.
- `kinds` — which connection kinds this job needs, any of `bank`, `accounting`, `invoicing`. Default: all three.
- `required` — the subset of `kinds` the calling flow cannot continue without. A skip on one of these stops the flow instead of continuing. Default: none (every kind may be skipped).
- Provider hints — names the user mentioned ("Qonto", "Pennylane", "Shopify"). Optional; used to search the catalog.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for March"), used in the ask. Optional.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_connectors` — the catalog with the live overlay. Each row carries `service_id`, `name`, `category_id`, `status` (`available` is connectable now), `is_connected`, `connection_status` (`enabled` = connected and syncing · `processing` = connected, first sync still running · `error` = authenticated but the last sync failed), `is_preselected` (Well recommends it now), and `install_url` — a one-click link that starts the connection in Well from any state (signs the user in, opens the bank login or the provider's OAuth). Pass `q` to name-search the full catalog (a specific bank, a specific portal). In MCP-Apps hosts (Claude Desktop, ChatGPT) the result renders as a connect picker card that opens the install link and refreshes its own state.
- `well_query_records` on root `workspace_connectors` — the workspace's own connections. Call `well_get_schema({ root: "workspace_connectors" })` first in a session and read the fields from it; today they are `status`, `last_successful_sync_at`, `connector.service_id`, `connector.direction`, and `connector.data_domains` (a JSON array such as `["bank"]`, sometimes delivered as a JSON string — parse it). This root is the source of truth for whether a connection is established; the catalog overlay below is the source of install links.
- Well's OAuth / DCR flow — only if the connection itself is missing (auth error on the first call).

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here carries.

It ships with the `well-skills` plugin. This skill is also installable on its own, so step 2 carries the inline fallback to use when it's absent.

Never call `well_invoke_connector_tool` or any provider-specific tool here: this skill reads connection state, it never reads provider data.

**How a kind is decided — exact-match on structured fields, never on a name or a category label.** A `workspace_connectors` row counts toward a kind only when its `connector.direction` is `input` (an `output` row is a push-back destination, not a data source — an accounting tool can hold both rows) and its `connector.data_domains` contains that kind's value: `bank`, `accounting`, or `invoicing`. In the `well_list_connectors` catalog, `category_id` is not a reliable kind (native banks such as Qonto sit under `finance`; only Plaid institutions carry `banks`): accounting tools are the rows whose `service_id` is one of Well's accounting connectors (`pennylane`, `pennylane-token`, `quickbooks`, `xero`, `freshbooks`, `evoliz`, `digits`, `sellsy`, `teamleader`, `factur-x`, `fatturapa`, and the CHIFT ids `7003`, `7010` — mirrored from `ACCOUNTING_SERVICE_IDS` in the Well platform's `packages/shared/src/constants/accounting.ts`; update this list when a new accounting connector ships, and treat a row with `category_id: "accounting"` as accounting even when its id is not listed here); banks and invoicing / payment portals are found by `is_preselected` or by name search (`q`) on what the user uses. Do not classify a connector from its display name. This list only decides what to *offer* from the catalog; whether accounting is *connected* comes from `connector.data_domains` on `workspace_connectors`, which the server derives and which needs no list.

**How a row's state is read** (the same precedence Well's app applies): `status: to_configure` or `disabled` → not established (never authorized); `last_successful_sync_at` set → **connected** (data has landed, whatever the current `status`); otherwise `status: error`, `need_reconnect`, or `suspended` → **error** (reconnect); otherwise `status: degraded` → **error** (never delivered data; may self-recover, reconnect if it stays); otherwise (`enabled` with no success yet) → **connecting**.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_connectors` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because connections are made and tracked in Well. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, run `define-workspace` and take its hand-off; never pick a workspace here. Pass `workspace_id` explicitly on every call below.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the current coverage.** `well_get_schema({ root: "workspace_connectors" })` once per session, then `well_query_records({ root: "workspace_connectors", workspace_id, fields: [status, last_successful_sync_at, connector.service_id, connector.direction, connector.data_domains] })`. Keep only `direction: input` rows and group them by `data_domains` for each requested kind; read each row's state with the precedence in Tooling. In parallel call `well_list_connectors({ workspace_id })` for the recommendations and install links (`is_preselected`, `install_url`, `connection_status`).
   - A kind with at least one **connected** row → **connected**. For each connected connector, read its latest row in `workspace_connector_sync_logs` (`well_query_records`, ordered by `started_at` desc, limit 1 per connector); a `status: in_progress` means a sync is running now — keep the kind **connected** but tell the user data may be partial until it finishes.
   - Only **connecting** rows → **connecting** (the grant is in, the first sync is running). Treat as connected for the flow; tell the user data may be partial for a few minutes.
   - Only **error** rows → **error**: authenticated but not delivering data. Offer that connector's `install_url` (search it with `q` if it is not in the default view) as a reconnect, not a first install.
   - No qualifying row → **missing**. A `to_configure` row is missing — the user started but never finished authorizing; offer the same install link.
   - The catalog overlay may show `is_connected: false` for a row that exists in `workspace_connectors` (a broken or half-configured connection); trust `workspace_connectors` for the state and use the overlay for the link.

4. **Present the gap, once, on the card.** If every requested kind is connected, skip to step 6. Otherwise:
   - In an MCP-Apps host the `well_list_connectors` result already shows the connect picker with Well's recommendations pre-checked and each row's install link. Do not restate the rows. Say in one line which kinds are missing or in error and why they matter for the job (`purpose`), then stop and let the user connect from the card.
   - In a text-only host, name at most three connectors per missing kind — Well's `is_preselected` rows first, then the user's provider hints via `q` — each with its `install_url`. Banks and accounting tools first, portals after.
   - If the user names a provider that is not in the default view, search it with `q` before saying Well does not support it. A row with `status` other than `available` is not connectable today — say so and offer the nearest available alternative from the catalog rather than a dead link.

5. **Re-check the moment a connection lands.** When the user says they connected a tool, or the card reports it, re-run step 3 yourself in the same turn and continue — do not wait to be re-prompted or ask the user to restate the request. If the user declines ("later", "skip the bank"), record that kind under `skipped_by_user` and continue; do not block the flow on a kind the user chose to skip. The exception is a kind listed in the caller's `required` input: say plainly that the flow cannot continue without it and stop, hand-off block included, so the caller reads `coverage` and `skipped_by_user` and decides.

6. **On failure, redirect instead of guessing.** A transient error on `well_list_connectors` or `well_query_records` → retry once. A second failure → do not invent connection state; give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them the connections page in Well shows and fixes the same thing. Do not append query parameters you have not confirmed the app reads.

7. **Hand off.** State the coverage in one line per requested kind and emit the hand-off block below.

## Output requirements

Return:

- One line per requested kind: `bank`, `accounting`, `invoicing` — its state and the connector name(s) behind it (e.g. "Bank: connected — Qonto. Accounting: error — Pennylane needs a reconnect. Invoicing: missing.").
- The hand-off block, exactly these keys, so a calling skill can read it:

  ```yaml
  workspace_id: <uuid>
  kinds:
    bank:       { state: connected | connecting | error | missing, connectors: [<name>, …], install_url: <url or null> }
    accounting: { state: …, connectors: […], install_url: … }
    invoicing:  { state: …, connectors: […], install_url: … }
  coverage: complete | partial | none
  skipped_by_user: [<kind>, …]
  ```

  `coverage` is `complete` when every requested kind is `connected` or `connecting`, `none` when every requested kind is `missing`, `partial` otherwise. Only the requested kinds appear.
- Connector coverage in plain words: this skill's coverage line IS the disclosure — say which of bank / accounting / invoicing are connected versus still missing so the calling flow and the user know whether what follows rests on a full picture.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `define-period` skill is installed: "Which month or period should we work on?". Otherwise hand control back to the skill that called this one, or, when the user asked about connections on their own, stop after the coverage line.

Do not return:

- A restated list of connectors when the picker card is already on screen.
- Any figure computed from connector data.
- Connection state guessed from a connector's display name.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `workspace_id` came from `define-workspace` (or the caller) and was passed on every call — the workspace was not resolved here.
- Each kind's state came from `workspace_connectors` rows filtered on `connector.direction: input` and `connector.data_domains`, read with the status / `last_successful_sync_at` precedence — not from a name, a `category_id`, or the catalog overlay alone.
- `connecting` was treated as connected-with-partial-data, `error` as a reconnect, `missing` (including `to_configure`) as a first install.
- The gap was stated once; the rows were not narrated when the card was on screen.
- After a connection landed, coverage was re-read in the same turn and the flow continued.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the call was retried once before the fallback link.
- The hand-off block carries every requested kind, `coverage`, and `skipped_by_user`.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`define-period` when installed, otherwise the caller or the coverage line).

## Examples

### Example request

The fetch-missing-invoices flow calls connect-tools with `workspace_id` of Acme SAS, `kinds: [bank, accounting, invoicing]`, `purpose: "to fetch the invoices missing for March"`. Acme has one Qonto row — `direction: input`, `data_domains: ["bank"]`, `status: enabled`, `last_successful_sync_at` set — and nothing else.

### Expected behavior

Read `workspace_connectors` and `well_list_connectors`. Say: "Bank: connected — Qonto. Accounting and invoicing: not connected yet; I need them to know which March invoices are missing." The picker card is on screen with Pennylane and Stripe pre-checked — stop. When the user connects Pennylane and says so, re-read in the same turn, report accounting as `connecting`, invoicing still `missing`, `coverage: partial`, and hand off with the `define-period` pointer.

### Example request

"Is my accounting tool connected?"

### Expected behavior

`define-workspace` first if no workspace is pinned. Then read coverage for `kinds: [accounting]` only: "Accounting: error — Pennylane is authenticated but its last sync failed; reconnect it here: <install_url>." Hand off with `coverage: partial` and the reconnect link; do not touch bank or invoicing.

### Example request

"Is Pennylane connected?" — `workspace_connectors` holds one Pennylane row, `status: enabled`, but `connector.direction: output` and `connector.data_domains: null`.

### Expected behavior

That row is a push-back destination, not the accounting data source. Report "Accounting: missing — Pennylane is set up for exporting entries, but its accounting sync is not connected", search the catalog with `q: "pennylane"` for the `input` connector, and hand its `install_url` (or let the card do it). Do not report accounting as connected.

### Example request

"Connect Shopify so you can pull my invoices."

### Expected behavior

Search the catalog with `q: "Shopify"`. If the row is `available`, show it (the card does, or give its `install_url` in text) and stop until the user connects; then re-check and report invoicing as `connecting`. If the row is not `available`, say Shopify cannot be connected today and offer the nearest available invoicing connector from the catalog instead of a dead link.
