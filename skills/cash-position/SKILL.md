---
name: cash-position
description: Answer "how much cash do we have right now?" using Well's MCP financial graph — a fast, point-in-time snapshot of current bank/cash balances across all connected accounts, per currency, backed by real synced balances rather than guesswork. Use when the user asks "what's our cash position", "how much cash do we have right now", "current bank balance", "how much money is in the bank", or "what's our total cash on hand today". Requires a connected Well workspace with a banking connector; if none is connected, this skill walks the user through connecting one first.
---

# Check Your Cash Position with Well

## Purpose

Use Well's MCP tools to answer "how much cash do we have, right now?" — a snapshot of current bank/cash balances across every connected account, grouped or converted by currency, as of the latest synced moment. This is deliberately a single point-in-time number: no burn rate, no forecasting, no runway math — just what's in the bank today.

## When to use this skill

Use this skill when the user asks things like:

- "What's our cash position?"
- "How much cash do we have right now?"
- "What's our current bank balance?"
- "How much money is in the bank?"
- "What's our total cash on hand today?"

## When not to use this skill

Do not use this skill when:

- The user wants to know **how long** the cash will last, or asks about burn rate — use `runway-calculator` instead. That skill already computes cash on hand plus burn plus runway; don't duplicate its math here, and don't let this skill drift into estimating runway.
- The user wants a **historical trend** — "is our cash going up or down over time?" — use the sibling `cash-balance-trend` skill instead. This skill answers only "right now," not a series over time.
- The user wants a spend breakdown or where money is going — use `expense-breakdown` instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- A target currency to convert everything into — default to reporting per-currency (no forced conversion) unless the user asks for one number.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_get_cash_position` — the authoritative total cash on hand plus the per-account breakdown behind it (native amount/currency, converted amount, FX rate applied) — the exact same computation the Well app's canvas KPI card shows. Call this directly; do not re-derive the total yourself from raw `accounts`/`account_balances`/`exchange_rates` reads.
- `well_query_records` — used by `connect-tools` for the connection check; called here only for the 1-row `accounts` spot-check in step 3.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to total the cash you have on hand right now"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is nothing to total without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank]`, `required: [bank]`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to total yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (bank connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `accounts`, before calling `well_get_cash_position` at all. Zero rows means no bank account has landed yet — say so and stop instead of reporting a zero balance as a real cash position.

4. **Get the cash position.** Call `well_get_cash_position()`. It returns `amount`/`currency` (the converted total, in the workspace base currency), `accounts` (per-account contributions: name, native amount/currency, converted amount, FX rate applied), and `as_of` (the FX-rate anchor date).
   - `partial: true` means one or more accounts were excluded (e.g. missing FX rate) — surface the `excluded` count and any `hints` as a caveat rather than presenting the total as unconditionally complete.
   - If the user wants an unconverted per-currency breakdown rather than one converted total, group the returned `accounts` by `native_currency` and sum their `native_amount` — no separate query needed, the tool already carries every account's native figure.

5. **If the tool call itself errors, or the workspace has no accounts to report**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or stays empty, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What's our cash position?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Total cash position: the converted total (amount + currency), and/or a per-currency breakdown derived from `accounts` if the user wants amounts kept separate.
- A per-account breakdown: account name, native amount/currency, converted amount, as-of timestamp — straight from `well_get_cash_position`'s `accounts` field.
- An explicit one-line statement that this is a **snapshot** — no burn rate or runway is implied by this number.
- A freshness/caveat line: any `partial`/`excluded`/`hints` the tool surfaced.
- Whether the picture is complete: which banking connectors are connected versus still missing, so the user knows whether this total covers every account they hold or a partial view gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `runway-calculator` for how long this cash will last — burn rate and runway.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 5's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connector "enabled" status was checked before calling `well_get_cash_position`, not just assumed.
- The total and per-account breakdown came straight from `well_get_cash_position`'s response, not re-derived from raw `accounts`/`account_balances`/`exchange_rates` reads.
- If `partial: true`, the `excluded` count and any `hints` were disclosed rather than silently absorbed into the total.
- Every number carries a currency and an as-of timestamp.
- Which banking connectors are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- The answer never computes or implies a burn rate or runway figure.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's our cash position right now?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; call `well_get_cash_position()`, and present a per-account breakdown plus the converted total (e.g. "$412,300 USD across 3 accounts, €18,500 EUR in 1 account" — grouping the returned accounts by native currency), each with an as-of timestamp, and a one-line note that this is a snapshot with no runway implied.

### Example request

"How much money is in the bank? We just connected our bank account."

### Expected behavior

Check `workspace_connector_sync_logs`; if the sync is still `in_progress`, tell the user the balance may be partial or incomplete rather than presenting a confident total, and offer to re-check once the sync finishes.
