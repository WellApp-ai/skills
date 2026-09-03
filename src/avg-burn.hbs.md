---
name: avg-burn
description: Answer "what is our burn rate?" using Well's MCP financial graph — the trailing average of real monthly outflows, computed here from the workspace's own transactions, with every check it rests on visible and repairable. Use when the user asks "what's our burn rate", "how much are we spending per month", "what's our monthly burn", or "how much goes out each month". Requires a connected Well workspace with bank data; if none is connected, this skill guides the user to connect one first.
---

# Check Your Average Monthly Burn with Well

## Purpose

Report one figure: the average monthly outflow.

This skill computes it, rather than reading it off a tool that computed it elsewhere. That is the point. A burn is a policy — which months, which movements count, which categories the business does not treat as spend — and a policy the reader cannot see is one they cannot check. Every rule below is stated here and applied here; `well_sum_transactions` does the arithmetic over exactly the filter this skill names, and holds no opinion of its own.

The window matters as much as the number. The average divides by the whole window, so a window containing months with no recorded spend reports a LOWER figure than the months that did — honest, but it reads as "the typical month" unless you say otherwise.

## When to use this skill

Use this skill when the user asks:

- "What's our burn rate?"
- "How much are we spending per month?"
- "What's our monthly burn?"
- "How much goes out each month?"

**What the figure is, arithmetically.** This is not a description of something else's behaviour. It is what the steps below do:

- **Sum of outflow magnitudes over the window, divided by every month IN the window.** The divisor is the window length, never the count of months that carried spend.
- **Outflow is elected from the window's own rows, not read off the sign.** Which sign means money leaving is a property of the feed. Step 11 measures it; two windows over the same workspace can differ and both be right.
- **Internal transfers are excluded structurally, not by category.** A movement whose two payment-means legs both resolve to accounts the workspace owns is not spend leaving the business. No category, label, or transaction type decides this, so recategorizing a row does not change the burn.
- **A fixed category list could not replace that rule.** Internal or external is a fact about the counterparty account, not about the transaction. A transfer between two accounts you own is internal; the same transfer to a sister company at a bank you have not connected is external, and counts. Category, label and amount are identical in both cases. Close one of your own accounts and yesterday's internal transfer reads as external today, its category unchanged.
- **Card and loan legs are excluded.** Card spend counts on the date its repayment leaves the bank account, so a window can look low simply because the repayment falls outside it.
- **FX is applied per row before summing**, into the workspace's base currency.
- **The window's anchor is the month step 4 asked for, never today's date.** `define-period` refuses a month that has not ended, so a mid-month run cannot report a partial month as a full one.

## When not to use this skill

Do not use this skill when:

- The user wants **how long the cash lasts** — use `runway`. It composes this burn with the cash position; do not divide the two yourself here.
- The user wants **what the spend is made of** — use `cost-structure`. That covers a single closed month by category and will not sum to a trailing average, so the two are not a decomposition of one another.
- The user wants **cash projected forward** — use `cash-forecast`.
- The user wants **inflows as well as outflows**, reconciled — use `cash-flow-waterfall`. This skill reports outflow only.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. This skill never picks a workspace itself.
- A reporting period — a calendar year and month — to anchor a past window rather than the live one. This skill never infers a month from today's date; when the user has not named one, step 4 asks on a card.
- A window length in months (default 3). Widen it to smooth a lumpy month, narrow it to react faster.
- Categories or transaction types that are not spend for their business. Step 10 asks; nothing is exempt by default.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_sum_transactions` — the arithmetic. Takes the window, the grouping, whether to drop internal transfers, and the exempted category keys; returns per group `sum_negative`, `sum_positive` and both counts. It defines no burn: this skill states the policy and that tool applies it.
- `well_list_workspaces` — how step 1 resolves the workspace.
- `well_query_records` — the sync-log, account, transaction-count and uncategorized reads in steps 5 to 9. Step 3 reads connector state through `well_list_connectors` alone; a `well_query_records` call on `workspace_connectors` bypasses that logic.
- `well_get_schema` — read once per session before the first `well_query_records` on a root.
- `well_list_connectors` — how step 3 surfaces install links.
- `well_list_periods` — how step 4 renders the anchor-month picker. Reads `purpose: "analysis"` so the card offers only months this skill can report on.
- `well_switch_workspace` — writes the picked month server-side; also how step 1 resolves a named workspace hint.
- `well_wait_for_selection` — how a card step resumes when the next message needs its answer but is not itself the pick.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by step 1.

## Workflow

**Every step is a gate, and a gate that fails stops the run.** It puts the repair on screen and says what is at stake; it does not report a figure anyway with a caveat attached. A number nobody can trust is worse than a stop that says why.

**A repaired gate resumes where it stopped.** Each card's Continue names its own step, so the run re-runs that step alone and carries on. It never re-enters at step 1: a picker the reader already answered must not appear twice.

The bracketed numbers are the product recommendation's own, so the two can be read side by side.

### Stage A — scope

1. **Pin the workspace.** `[1]` {{> define-workspace purpose="to measure your average monthly burn"}}

2. **Confirm the accounting settings this figure reads.** `[2]` {{> confirm-accounting-settings purpose="so every amount can be converted into one currency" needs="base_currency"}}
   - Only `base_currency`. This figure is measured in calendar months and never reads a fiscal year start, so requiring one would block a workspace on a value that would change nothing.

3. **Confirm the bank connection.** `[3]` {{> connect-tools purpose="to measure your average monthly burn" kinds="bank" internalCheck=true}}
   - `coverage: none` → stop; burn cannot be measured. The install links are already on screen, so do not add a second set.

4. **Ask which month anchors the window.** `[4]` {{> define-period purpose="to measure your average monthly burn" toolPurpose="analysis" bankState=true}}

### Stage B — has the data landed

5. **Confirm every sync has finished, and recently.** `[5, 12, 13]` {{> verify-sync-freshness purpose="before the burn is measured" maxAgeHours=24}}
   - The product recommendation loops here until every sync finalizes. This skill does not poll: it stops, and Re-check is how the reader drives it forward. A loop that waits on its own gives a reader nothing to do and no way to tell a slow sync from a stuck one.

6. **Confirm the window holds transactions.** `[11]` {{> verify-window-has-activity purpose="to measure your average monthly burn"}}

### Stage C — whose accounts

7. **Attach every account to a company you own.** `[9, 10]` {{> link-accounts-to-companies purpose="so a movement between two of your own accounts can be told from money leaving"}}

**What stage C does not gate, and why it matters to the answer.** The recommendation also asks that every transaction resolve to an account `[6]`, carry a payment type `[7]`, and that transfers resolve both legs `[8]`. Those are extraction and reconciliation gaps, not decisions a reader can make: the rows that fail them are the ones the connector could not resolve, and a picker asking someone to hand-enter what a sync should have delivered is not a repair. They do not stop the run. Instead, count them and disclose them — a transaction with no leg on a known account cannot be placed inside or outside the transfer rule, so it bounds how much of the figure is certain.

### Stage D — classification

8. **Categorize the window.** `[14]` {{> categorize-window-transactions purpose="so the categories you exempt can actually be applied" scope="the window"}}

9. **Settle the currency.** `[15]` Group the sum by currency and convert per row. {{> normalize-currency targetCurrency="the workspace base currency" mode="convert"}}
   - A currency value that is not an ISO code is not a currency. Some rows carry free text in that field; they cannot be converted, so exclude them, count them, and say so rather than letting a rate lookup fail on a line of payslip text.

10. **Confirm the exemptions.** `[16]` {{> confirm-burn-exemptions figure="burn"}}

### Stage E — compute

11. **Elect the sign convention.** {{> elect-sign-convention purpose="before any outflow is totalled"}}

12. **Anchor the window, then divide.** The window is the `trailing_months` months ending with the month step 4 pinned. Sum the elected outflow across it with `well_sum_transactions({ from, to, axes: ["month", "currency"], exclude_internal_transfers: true, exempt_categories: [...] })`, then divide by the number of months IN the window — not by the number that carried spend.
    - Keep the per-month series: it is what lets you say whether burn is rising or falling, and a month with no outflow belongs in it as a zero rather than being dropped.
    - `meta.partial: true` means the aggregate was cut short. Every figure is then a floor, and saying so is not optional.

**Not in this skill.** Grouping the answer by company `[17]` or by category `[18]` is `cost-structure`'s job — name it rather than answering it here. The burn card `[19]` is a rendering concern, not a step.

## Output requirements

Return:

- The burn figure: amount, currency, and the window it covers.
- The window's coverage when some months carried no spend — both numbers, and the fact that the average divides by the whole window.
- **Which sign convention you elected, and the counts behind it.** A reader cannot check a figure whose direction was decided silently.
- **What you excluded, in three named groups**: internal transfers (structural), the categories and types the reader exempted, and the rows dropped for an unreadable amount or currency. A single "some rows were excluded" hides the difference between a rule and a defect.
- A confidence line from stage C's disclosure: how many rows could not be placed inside or outside the transfer rule.
- A freshness line: the oldest sync behind the figure, from step 5.
- A one-line pointer to `runway` for how long the cash lasts, and to `cost-structure` for what the spend is made of. Name them; do not answer them here.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.

**How this reaches the user.** A Well MCP tool that ships a widget attaches `_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never reaches you, so you cannot tell a host that drew the card from one that did not. Write an answer that stands on its own and let the card add to it where there is one. Do not compose a second rendering of figures a tool already returned.

**One number, once.** `well_get_runway` carries its own `avg_burn`, and the app's KPI tile has its own. Do not quote either beside this figure: they answer the same question over a different window, and two burns in one reply reads as a contradiction rather than as detail.

## Quality checks

Before finishing, verify:

- Every gate that failed stopped the run and put a repair on screen; none was reported as a caveat under a figure.
- A resumed run re-ran the gate that stopped it and no earlier one — no picker was shown twice.
- The workspace came from step 1, and its `workspace_id` rode every `well_*` call rather than being left off.
- Step 2 required only `base_currency`, never a fiscal year start.
- Connection state came from step 3 and freshness from step 5; a connected connector was never assumed to mean data had landed.
- The sign convention was elected from the window's counts, stated in the answer, and elected once over the whole window rather than per month.
- The divisor was the window length. When some months were dark, both numbers were stated and the figure was never presented as the typical month.
- Internal transfers were excluded structurally, and described that way — never as something a recategorization would change.
- Exclusions were reported in their three named groups, not merged into one count.
- The unresolvable rows from stage C were disclosed as a bound on confidence, not silently absorbed.
- No runway figure, spend breakdown, or forecast was composed here — each was pointed at by name.
- No second burn figure appeared beside this one.

## Examples

### Example request

"What's our burn rate?"

### Expected behavior

Walk the gates. On a clean workspace, the answer is one figure with its window, the elected convention and its counts, what was excluded, and how fresh the data is — then a pointer to `runway` and `cost-structure`.

On a real workspace, the first run usually stops. Say which gate, how many rows, and how much value sits behind it, and put the repair on screen: "136 transactions in this window have no category, covering about €18,400. Categorize them and I'll pick up here." The second run goes straight through.

### Example request

"Our burn looks low — we had a quiet month in there. Can you average over six?"

### Expected behavior

Widen the window to six months and re-run. Report the wider average and, if some of the six carried no spend, say how many did and that the average divides by all six. The user's instinct is the thing the window metadata exists to confirm or correct, so answer it directly rather than only restating the new figure.

## Voice
{{> voice}}
