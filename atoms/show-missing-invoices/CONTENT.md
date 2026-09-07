---
name: show-missing-invoices
description: List the transactions a Well workspace has no invoice for over the selected period, take the user's vendor pick on the card, and hand off a typed gap list. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "so Well can go and fetch them"
---

Call each list or read tool once per step. The cards refresh themselves — never re-call one to check progress. A card click executes server-side and prefills a message in the user's composer, so rendering the card ends the turn, and the sent message is how the flow resumes.

The workspace is already pinned — pass its `workspace_id` explicitly on every call; do not re-resolve it here. `well_list_missing_invoices` absent from your toolset → say this Well server does not expose it yet, hand off `resolution: unavailable`, stop. Never build a gap list by hand from raw transactions.

Read the gap list in one call: `well_list_missing_invoices({ workspace_id })` — `workspace_id` and nothing else. **No periods argument**: the server reads the period selection the user clicked. A one-month selection puts the label to quote in `period_label`; a multi-month one carries no `period_label` at all, so name every month from `periods_covered`, take each month's totals from `months`, and compose no range label the result does not carry.
- No period selection exists yet → run `define-period` (its picker renders and waits for the click), then re-call. Never guess a month to fill the argument.
- `success: false` naming a period that has not ended → the read refused the whole call, so no month returned rows. Not transient: never retry it, never fall through to the workspace-link fallback, send the flow back to `define-period` for a completed month.
- Any other `success: false`, or a transient failure → retry once; a second failure takes the fallback below.
- `row_count: 0` → read `dropped_groups` before calling the period complete. `unknown` plus `unnamed_company` at 0 → no supplier invoice is missing; say so plainly, and name a non-zero `bank_internal` in the same line WITHOUT its number, as bank operations with no counterparty that no supplier can invoice. Above 0 → say Well could not attribute that many groups of the period's categorized spend to a named counterparty, that this list shows and chases none of them, and never call the period complete. Either way add the coverage line and hand off `resolution: empty` with an empty selection.

Report it once and let the card take the pick. The result renders the missing-invoices card — counterparty rows, each with one collection-method badge per entry of its `available_modes` (Deploy agent, Connect tools, Upload), a checkbox and its own transaction table. Give the summary line (the period, how many counterparties per mode, the total), the coverage line, then one line asking the user to tick the vendors to chase{{#if purpose}} "{{purpose}}"{{/if}} and click Continue. Nothing else: no per-row commentary, no restated rows, no re-grouping or re-counting of what the card draws. In a text-only host, list the counterparties by mode — `agent`, then `connect`, then `upload` — largest amount first in each group, each with its name, `tx_count`, amount and how the gap can be closed in plain words, capped at fifteen rows with the remainder counted, then ask which vendors to chase.

The only total is the sum of the non-null `base_total_amount` values, in `base_currency`. A `null` amount has no FX rate for its currency — print **amount unavailable**, never convert it, never add native amounts of different currencies. With some rows null, say the total covers the rows that have an amount and how many do not; with every row null, report no total.

State the coverage in one line, every time, even on an empty list: these gaps cover the period's **categorized** expense transactions only, so spend not categorized yet cannot appear here. The result carries no count of the transactions Well examined — state that bound in words and quantify it with nothing, since `transaction_count` counts the transactions missing their invoice, never the transactions read. Add each non-zero `dropped_groups` counter, kept apart as the result keeps them, and any `hints`. Name which of bank, accounting or invoicing data is behind the answer, and — where `connect` rows exist — that connecting those providers turns manual uploads into gaps Well can close itself.

A list with rows always ends its turn on the card. Resolve the next message in this order, never re-asking what the user already clicked:
- One of the card's two Continue prefills → the click already wrote the selection server-side. Acknowledge in half a sentence and hand off, with no verification call. The prefill names the order the next steps run in too: asking for the connect step first sends the flow to `connect-tools` and to `deploy-agents` after it; asking for the deploy step sends it straight to `deploy-agents`. Follow the order the message asks for.
- The message names vendors, or accepts every row → write the pick yourself: `well_switch_workspace({ workspace_id, counterparties })`, copying `company_id` and `matched_connector_service_id` off each row you listed. **One entry per COMPANY, never one per row** — a counterparty with a gap in two selected months holds two rows, and a repeated `company_id` makes the write refuse the whole call, so deduplicate on `company_id` and keep the `matched_connector_service_id` of the first row carrying one. Pass no display name, drop a row whose `company_id` is null, cap "all of them" at 200 distinct companies.
- Any other message → call `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` once, never before this conversation rendered the card. `selected` (fresh or `already_set`) → compare `selection.workspace_id` with the workspace this list was read for. Match → take its `counterparties` as the pick and hand off. Differ → a pick read for another workspace is not this pass's pick: treat it as no pick, ask for the tick on the card now on screen, end the turn again, hand off `selection_state: pending`. `no_selection_yet` → one line asking for the tick and the Continue click, end the turn again.
- **Keep for later** dismisses the card and writes nothing: nothing is picked, so the flow does not go on to fetching. Say the list stays available and stop.
- An empty list has nothing to pick — skip this step and hand off `resolution: empty`.

On a second read failure, build no gap list by hand: give the user `<well-app-base-url>/workspaces/<workspace_id>`, where Well shows the same list. Never call `well_invoke_connector_tool` or any provider-specific tool.

Emit the hand-off, kept for the caller and never printed as a block:

```yaml
workspace_id: <uuid>              # always the workspace this list was read for
period: <the single-month fields when the result carried them, else periods_covered + periods_requested + months>
base_currency: <ISO code>
transaction_count: <int>
rows: [ … exactly as returned … ]
counts: { agent: <int>, upload: <int>, connect: <int> }
total_base_amount: <sum of the non-null base_total_amount values, or null>
agent_candidates: [{ matched_provider_name, matched_connector_service_id, tx_count, base_total_amount,
                     counterparties: [{ company_id, name, tx_count, base_total_amount }] }, …]
selection: [{ company_id, matched_connector_service_id or null }, …]   # in the order the pick came in
selection_state: written | pending | none
coverage_note: <the categorized-only line, plus dropped_groups when non-zero>
resolution: listed | empty | unavailable
```

`agent_candidates` groups the `mode: agent` rows by `matched_provider_name`, rows with no matched provider under `"unknown"`. `selection_state` is `written` on a Continue click, a workspace-matched wait-read, or your own text-only write; `pending` while the card waits, or when the only pick read belonged to another workspace; `none` on an empty or unavailable list. On `empty`, `rows` is empty, every count 0, `total_base_amount` null, `selection` empty; on `unavailable`, only `workspace_id`, the period and `coverage_note` are kept.

Verify before moving on: the tool was called once with no periods argument, and the server-held selection decided the period; a multi-month result named every month from `periods_covered` and invented no range label; a refusal naming a period that has not ended went back to `define-period`, never retried and never resolved with the workspace link; the turn ended on the card with the tick request, the Continue prefill was taken at its word and its order followed, and the wait-read was called once, never before the card existed, its `selected` answer becoming the pick only when `selection.workspace_id` matched the pinned workspace; the pick travelled as identifiers, one entry per company, no null `company_id`, at most 200; every `null` amount read as "amount unavailable" and the total summed only non-null base-currency amounts; the categorized-only line was stated even on an empty list, quantified no examined-transaction figure, and an empty row list was called complete only when `unknown` plus `unnamed_company` was 0.
