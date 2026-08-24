---
name: cash-balance-trend
requires: [define-workspace, connect-tools, normalize-currency]
description: Show how a company's cash balance has changed over time — a historical trend built from Well's MCP financial graph's real balance snapshots, never a forecast. Use when the user asks "cash balance trend", "chart our cash over time", "is our cash going up or down", "cash trajectory", "how has our cash changed", or "cash history". Requires a connected Well workspace with bank data covering more than one historical balance period; if none is connected or history is too thin, this skill walks the user through connecting one or says plainly there's not enough history yet.
---

# See Your Cash Balance Trend with Well

## Purpose

Use Well's MCP tools to answer "is our cash going up or down over time?" with a historical, point-by-point trend of real cash balance snapshots — never a projection. This skill only describes what has already happened; it does not estimate or predict a future balance.

## When to use this skill

Use this skill when the user asks things like:

- "What's our cash balance trend?" / "Chart our cash over time."
- "Is our cash going up or down?" / "What's our cash trajectory?"
- "How has our cash changed?" / "Show me our cash history."

## When not to use this skill

Do not use this skill when:

- The user wants a single point-in-time "how much cash do we have right now" answer — use the `cash-position` skill instead; this skill is for a series over a window, not one number.
- The user wants a forward-looking projection — "will we run out of cash," "how long will this last," burn rate — use `runway-calculator` instead. This skill never extrapolates or predicts a future balance; it only reports what has already happened.
- The user wants a spend/category breakdown — use `expense-breakdown` instead.
- No Well MCP connection is available and the user does not want to set one up — say so instead of guessing at numbers.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- The time window to trend over — default to the trailing 3 full months if unspecified.
- A target currency — default to reporting per-account currency. If the user asks for one total, invoke `normalize-currency` with the balance points tagged by date and account rather than converting here, build the series from its `converted` entries, and report its rates and rate dates alongside the total.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_query_records` — read `accounts`, `account_balances`, `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Three atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.
- `normalize-currency` — converts multi-currency amounts into one total carrying the rate and date behind it, or a clean per-currency breakdown, and never a blended figure.

All three ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to chart how your cash balance has moved over time"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is nothing to trend without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank]`, `required: [bank]`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to trend yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (bank connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a `well_query_records` read on `accounts`, and on `account_balances` for the workspace's own accounts. Zero rows means no balance history has landed yet — say so and stop. And where an account has only one `account_balances` row, that is one snapshot, not a trend: say so plainly for that account rather than fabricating a direction from a single data point.

4. **Resolve the requested time window.** Default to the trailing 3 full months if the user didn't specify one; state whatever window is used.

5. **Pull the accounts and their balance history.** Call `well_get_schema({ root: "accounts" })` and `well_get_schema({ root: "account_balances" })`. Query `accounts` for the workspace's own accounts (`ownership` indicating workspace-owned, not counterparty), then query `account_balances` for each account across the requested window, ordered by `balance_at_from` ascending. Pull `balance_at_from`, `balance_at_to`, `accounting_balance` (`closing_booked`, `closing_value`, `currency`), and `account.account_name`.

6. **Build the trend series.** Assemble a time-ordered series of `{ date, balance, currency }` points per account, using `balance_at_to` as the point date and `closing_booked` (or `closing_value` if that's what the connector populates) as the balance. If summing across multiple accounts into one line, sum only same-currency accounts per period; report other currencies as separate series, or hand the points to `normalize-currency` tagged by date and account and build the line from its `converted` entries, stating the rates and rate dates it used — never blend currencies silently. If accounts report on different cadences or period boundaries, flag the misalignment in the answer rather than silently interpolating between mismatched dates.

7. **Describe the trend, using only real rows.** If the series being described has only one real data point (e.g. a single connected account with only one balance snapshot), report "not enough history for a trend" instead — a lone point has no first-to-last change to compute, and a computed "flat, 0% change" would fabricate a direction step 3 already flagged as unavailable. Otherwise state the direction (up, down, or flat) and the magnitude of change from the first to the last real data point in the window. Never interpolate between snapshots and never extrapolate past the last real `account_balances` row — this skill reports history only.

8. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Is our cash going up or down?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The window covered (start date to end date).
- The time-series data points: date, balance, currency — as a simple table by default. `well_query_records` ships its own card, and that card renders these rows — so do not restate them in prose. It draws no chart, so the form is yours to judge on its merits: a line or area chart is the natural fit for a trend over time, so reach for it when the host supports it and prose alone would read worse. Do not stop to ask table-or-chart first.
- The overall direction (up/down/flat) and the magnitude of change over the window.
- An explicit one-line statement that no future projection was made — this is historical fact only.
- A one-line note on which account(s) fed the series and any currency handling applied.
- Whether the picture is complete: which banking connectors are connected versus still missing, and whether every connected account has more than one synced balance period, so the user knows whether this trend covers their full cash position or a partial one gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `runway-calculator` for the forward-looking question — burn rate and how long the cash lasts.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 8's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one. Do
not compose a second rendering of figures the tool already returned; where a visual the tool does not draw genuinely reads better, compose one and style it
with the tokens under **Styling a composed view** below.

## Styling a composed view

<!-- generated: well tokens — edit design-system/well-tokens.css, then `make refresh` -->

Well renders dark. A view you compose should read as the same product, not as a page
that happens to hold the same numbers.

| Role | Value |
| --- | --- |
| Page background | `#161616` |
| Card surface | `#1c1c1c` |
| Border | `#2e2e2e` |
| Primary text | `#ededed` |
| Secondary text | `#a0a0a0` |
| Accent | `#00bfff` |
| Positive | `#4cc38a` |
| Negative | `#ff6369` |
| Series, in order | `#52a9ff`, `#4cc38a`, `#e9a23b`, `#a78bfa`, `#4ec9b0`, `#e36a8a` |

Corners `12px`, gap `12px`, body text 14px, numbers tabular.
A card is a header, then the body, then an action row — the counter first and the
primary action last. State every figure in text as well as in the drawing: a chart the
host cannot render must not take the answer with it.

<!-- /generated -->

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- `well_get_schema` was called before querying `accounts` or `account_balances` for the first time.
- Every point in the trend comes from a real `account_balances` row — never fabricated or interpolated.
- An account with only one `account_balances` row was flagged as "not enough history for a trend" rather than faked into a direction.
- Multi-currency results went through `normalize-currency` when a single total was required — carrying its rates and rate dates — or were kept clearly separate per account. Never blended.
- Every number carries a currency and a date.
- Which banking connectors are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- The answer never states or implies a future balance — the "no projection made" line is present.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"How has our cash changed over the last few months?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; pull the trailing 3-month window of balances ordered by date, present the series as a short table (date, balance, currency) plus a one-line summary like "Cash rose from $412,000 to $498,000 over the last 3 months, up about 21%," and close with an explicit note that this is historical only, no projection made.

### Example request

"We just connected our bank yesterday — what's our cash trend?"

### Expected behavior

Query `account_balances` for the newly connected account and find only one row (the initial sync snapshot). Report that there isn't enough history yet to show a trend — one balance point, not a series — and offer to check back once a second period has synced, rather than guessing a direction.
