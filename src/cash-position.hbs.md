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

- The user wants to know **how long** the cash will last — use `runway`. The burn rate on its own is `avg-burn`. Don't duplicate either one's math here, and don't let this skill drift into estimating runway.
- The user wants cash **projected forward** — use `cash-forecast`, which returns the settled month-end series plus the projection the app charts. For a trailing series alone, this skill's own `balance_history` covers it (step 4); do not assemble a series from raw `account_balances` reads.
- The user wants a spend breakdown or where money is going — use `cost-structure` instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A target currency to convert everything into — default to reporting per-currency (no forced conversion) unless the user asks for one number.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_get_cash_position` — the authoritative total cash on hand plus the per-account breakdown behind it (native amount/currency, converted amount, FX rate applied) — the exact same computation the Well app's canvas KPI card shows. Call this directly; do not re-derive the total yourself from raw `accounts`/`account_balances`/`exchange_rates` reads.
- `well_query_records` — used for the 1-row `accounts` spot-check in step 3.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- Well's OAuth / Dynamic Client Registration (DCR) flow — most hosts trigger it automatically when the Well MCP server is added.

## Workflow

1. **Pin the workspace.** {{> define-workspace purpose="to total the cash you have on hand right now"}}

2. **Confirm the connections this answer needs.** {{> connect-tools purpose="to total the cash you have on hand right now" kinds="bank" required="bank" internalCheck=true}}
   - `coverage: none` → stop; there is nothing to total yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `accounts`, before calling `well_get_cash_position` at all. Zero rows means no bank account has landed yet — say so and stop instead of reporting a zero balance as a real cash position.

4. **Get the cash position.** Call `well_get_cash_position()`. It returns `amount`/`currency` (the converted total, in the workspace base currency), `accounts` (per-account contributions: name, native amount/currency, converted amount, FX rate applied), and `as_of` (the FX-rate anchor date).
   - **This is the only analytics tool this skill calls for its own answer.** `well_get_cash_position`'s own response carries every figure this answer states — the converted total, the per-account contributions, and `balance_history` when the user asks about direction over time. Do not call `well_get_runway`, `well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast` or `well_get_cash_flow_bridge` to source anything this answer states — not for a comparison, not for a series, not for one number in a sentence. Each of them draws its own card, so an uninvited second call renders a second block beside the one the user asked for, answering a question they did not ask. `well_get_cash_position`'s own description points at `well_get_runway` for a forward-looking figure; inside this skill that is a skill to name, not a tool to call. If the answer you want needs a figure this payload does not carry — a burn rate, months of cash left, where the money went — that figure belongs to another skill: name it, as the Output requirements already say, rather than fetching it here. What this forbids is enriching THIS answer, not answering a second question the user actually asked: when they ask one, hand it to the skill that owns it and let it answer as its own block.
   - `partial: true` means one or more accounts were excluded (e.g. missing FX rate) — surface the `excluded` count and any `hints` as a caveat rather than presenting the total as unconditionally complete.
   - If the user wants an unconverted per-currency breakdown rather than one converted total, group the returned `accounts` by `native_currency` and sum their `native_amount` — no separate query needed, the tool already carries every account's native figure.
   - `balance_history` carries the trailing closed month-ends plus today, oldest first, built by the same helper the app's forecast uses for its actuals. Use it when the user asks whether cash is rising or falling, rather than assembling a series from raw `account_balances` reads. A `null` amount is a month the history does not cover — say so rather than plotting it as zero, and never interpolate between two real points or extend the series past its last one. It is absent entirely when a reporting period was requested: a historical reading has no live final point to anchor a trailing series on.

5. **If the tool call itself errors, or the workspace has no accounts to report**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or stays empty, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What's our cash position?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Total cash position: the converted total (amount + currency), and/or a per-currency breakdown derived from `accounts` if the user wants amounts kept separate.
- A per-account breakdown: account name, native amount/currency, converted amount, as-of timestamp — straight from `well_get_cash_position`'s `accounts` field.
- An explicit one-line statement that this is a **snapshot** — no burn rate or runway is implied by this number.
- When the user asked about direction over time, the trailing series from `balance_history` with its uncovered months named as gaps — and an explicit note that it is history, not a projection.
- A freshness/caveat line: any `partial`/`excluded`/`hints` the tool surfaced.
- Whether the picture is complete: which banking connectors are connected versus still missing, so the user knows whether this total covers every account they hold or a partial view gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `runway` for how long this cash will last, and to `cash-forecast` for the month-by-month projection.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 5's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the figures in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- Connector "enabled" status was checked before calling `well_get_cash_position`, not just assumed.
- The total and per-account breakdown came straight from `well_get_cash_position`'s response, not re-derived from raw `accounts`/`account_balances`/`exchange_rates` reads.
- If `partial: true`, the `excluded` count and any `hints` were disclosed rather than silently absorbed into the total.
- Every number carries a currency and an as-of timestamp.
- Only this block's analytics tool was called — `well_get_cash_position`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_runway`, `well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge`) was called to source any figure in this answer, including one number in a sentence.
- Which banking connectors are connected versus missing was stated from the coverage hand-off, so the user knows whether the picture is complete or partial.
- The answer never computes or implies a burn rate or runway figure.
- Any trailing series came from `balance_history`, with `null` months reported as gaps rather than zeros, and was never interpolated or extended past its last real point.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's our cash position right now?"

### Expected behavior

Pin the workspace, confirm connections, and spot-check that rows have landed; call `well_get_cash_position()`, and present a per-account breakdown plus the converted total (e.g. "$412,300 USD across 3 accounts, €18,500 EUR in 1 account" — grouping the returned accounts by native currency), each with an as-of timestamp, and a one-line note that this is a snapshot with no runway implied.

### Example request

"How much money is in the bank? We just connected our bank account."

### Expected behavior

Confirm the connections; the hand-off reports the connector as connected but its latest sync still running, so carry on and tell the user the balance may be partial or incomplete rather than presenting a confident total, offering to re-check once the sync finishes.

## Voice
{{> voice}}
</content>
