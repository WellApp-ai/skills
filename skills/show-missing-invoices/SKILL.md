---
name: show-missing-invoices
requires: [define-workspace, define-period]
description: List the settled spend in one Well workspace that still has no supplier invoice for a given month or fiscal period, one row per counterparty, each row carrying how the gap can be closed — Well's agent fetches it, connect the provider, or upload it by hand — and hand the list off as a typed result. The card carries a checkbox per vendor, and its Continue click writes the picked vendors into the session as identifiers so the fetch step acts on the user's pick. Use when the user asks which invoices or receipts are missing, "what am I missing for March", "which vendor invoices do I still owe my accountant", "show me the gaps before I close the books", or when a close-books or fetch-missing-invoices flow needs the period's gap list before it collects anything. Needs a workspace pinned by define-workspace and a period resolved by define-period. Do not use to fetch, download, or collect the documents themselves, to compute a spend total, or to list unpaid customer invoices.
---

# Show Missing Invoices with Well

## Purpose

Answer "what supplier invoices am I still missing for this period?" for exactly one workspace and the period selection the user picked. Read Well's gap list, report it once — one row per counterparty, with how each gap can be closed — take the user's pick of the vendors to chase, and emit a typed hand-off the next step reads to decide what to collect. The gap-list step of Well's fetch-missing-invoices flow, after `define-period`: it takes `workspace_id` from `define-workspace`, and the period comes from the **server-held selection** the user's click on the period card (or `define-period`) already wrote — so the gap-list call carries no periods argument at all. It lists gaps only; it never fetches, downloads, or collects a document.

**This step ends on a click, like the workspace, period and connect steps.** The card groups the rows, carries a checkbox per vendor, lists each row's own transactions, and closes on **Keep for later** and **Continue**. The Continue click writes the picked vendors into the session context — each vendor as its `company_id` plus its `matched_connector_service_id`, never a display name — and prefills "Continue" in the user's composer. The user sends that message, and it is what moves the flow on. Render the card, say your summary, and end the turn.

## When to use this skill

Use this skill when:

- The user asks which invoices or receipts are missing for a month, a quarter, or a fiscal period ("what am I missing for March?", "which vendor invoices are still outstanding for Q1?").
- The user wants the gaps before closing the books, or the list their accountant is waiting on.
- A calling flow (fetch missing invoices, close the books) needs the period's gap list before it decides what to collect.
- The user asks which suppliers Well can chase automatically and which ones need a manual upload.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first and pass its `workspace_id` in.
- No period selection exists yet and the user is picking one — that is `define-period`, whose card writes the selection this skill's tool reads.
- The user wants Well to actually fetch the documents from the suppliers' portals — that is the `deploy-agents` step of the flow, after this one, and it reads this skill's hand-off.
- The user wants invoices already in the ledger that have no source document attached — that is the `missing-receipts` skill; this skill starts from settled bank spend, not from ledger rows.
- The user wants bills still to be paid (`bills-due`) or unpaid customer invoices (`accounts-receivable-aging`) — those are money owed, not documents missing.
- The user wants how much was spent or on what (`expense-breakdown`) — this skill counts gaps, it is not a spend report.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace` first — its picker renders at the point of need, and no "which workspace?" question is asked in text.
- A period selection written server-side — required, but **not passed to the tool**: the user's click on the period card, or `define-period` on a typed month, already wrote it, and the tool reads it on its own. The `define-period` hand-off (its `periods`, `period_label`, `is_complete`) is narration context only — except on the older-server degrade path in Tooling, where its `periods` entries are the months the call carries. If no selection exists yet, the tool says so — run `define-period` then; never guess a period from today's date.
- `purpose` — one line from the calling skill (e.g. "to decide which suppliers Well should chase"), used when a question is needed. Optional.

A still-running month in the selection means the list is still moving — report the gaps anyway and say so.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes; each pass gets its own gap list, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_missing_invoices` — the only tool this skill calls for the gap list. Input: `workspace_id` explicitly, as on every `well_*` call, and **no periods argument** — omitted, the server uses the period selection the user's click (or `define-period`) already wrote. An error comes back only when no selection exists yet: run `define-period`, then re-call. Pass the months explicitly only on an older server that holds no session selection, and then take them from `define-period`'s hand-off (`periods`), never from today's date — the degrade path, never the default. Output: `workspace_id`, `calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period`, `period_label`, `base_currency`, `transaction_count`, `rows`, `row_count`, `group_count`, `dropped_groups`, `hints`, `success`, and `error` on failure.
- `well_switch_workspace` — the selection write, and the only write this skill is part of. The card calls it on its **Continue** click with `workspace_id` and `counterparties` — an array of `{ company_id, matched_connector_service_id }`, at most 200 entries, copied off the rows. Call it yourself only on the text-only path of step 4, where the user names the vendors in prose. A counterparties call scopes the selection to the workspace it is dispatched to and leaves the pin alone, so it never re-pins; re-pinning between workspaces belongs to the caller, and a switch to another workspace clears the selection.
- `well_wait_for_selection({ kind: "counterparties", timeout_s? })` — the click read, legal only after THIS conversation rendered the missing-invoices card. Its one job is reading the pick when the user's next message is not the card's "Continue" prefill. Never before the card exists, and never as a probe. An already-made pick returns instantly as `{ status: "selected", selection: { workspace_id, counterparties }, already_set: true }`; with nothing picked yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an error.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace, the queue a multi-workspace caller walks, and `selected_counterparties` once a pick is written. This skill never re-pins; re-pinning belongs to the caller.

Each entry in `rows` is **one counterparty**, already grouped by the server — never re-aggregate it:

- `id`, `company_id`, `name` — the counterparty; `tx_count` — how many settled transactions of theirs have no invoice; `base_total_amount` — their total in `base_currency`, or `null`. `company_id` is the identifier the selection travels on; a row whose `company_id` is `null` cannot be picked, so it is reported and left out of the selection.
- `transactions` — the row's own lines, in ledger order, capped by the server, each with `date`, `description`, `category`, `amount` and `currency`. The card lists them under the counterparty. Those amounts are signed and stay in their own currency: never add them to `base_total_amount`. `transactions_omitted` says how many the cap left out — quote that number instead of implying the list is complete.
- `mode` — how the gap can be closed: `agent` (Well can collect it from the provider), `connect` (connect the named provider first), `upload` (the user supplies the document).
- `suggested_action` — the next step for that row. Surface it as written; do not compose your own.
- `matched_provider_name`, `matched_provider_has_blueprint`, `matched_connector_service_id` — the provider behind an `agent` or `connect` row; `matched_provider_name` is `null` when Well could not match one.
- `proof_task_id` — a collection task Well already holds for that row. When it is set, say the work is already under way and do not ask for the same document again.
- `acquisition_status`, `refusal_reason` — where the row stands, and why Well will not act on it. Report both verbatim when they explain an inactionable row; never reword them into a cause you inferred.

`dropped_groups` (`bank_internal`, `unknown`, `unnamed_company`) counts what the server excluded from `rows` — internal transfers and counterparties it could not name. Those are not gaps; disclose the total when it is non-zero.

**If `well_list_missing_invoices` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not approximate the answer from raw transactions with `well_query_records` — a hand-built gap list is not the same computation and would be presented as one.

Never call `well_invoke_connector_tool` or any provider-specific tool. This skill reads Well's own gap list; it never touches a provider.

**Composed skills.** Two atomic Well skills own the setup this skill must not inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every call here carries.
- `define-period` — resolves the month or fiscal period and writes the selection server-side, which is what makes the periods argument unnecessary on the gap-list call.

Both ship with the `well-skills` plugin. Neither has an inline fallback here: this skill resolves no workspace of its own and guesses no month, so when one is absent the workflow runs that skill instead of working around it.

## Workflow

Call each list or read tool once per step. The widget cards refresh themselves — never re-call a tool just to check progress.

1. **Confirm the MCP server is configured.** If `well_*` tools are not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the gap list is computed in Well from their bank and accounting data. Stop until it is there.

2. **Confirm the tool and the workspace.** Require `well_list_missing_invoices` in the toolset (see Tooling — if it is absent, hand off `resolution: unavailable` and stop) and `workspace_id` from the caller, or a session pin used silently when this conversation established it. Missing workspace, or a pin left by another conversation → run `define-workspace` and never reuse or mention that leftover pin; do not resolve the workspace here and do not ask for it in text. Pass `workspace_id` explicitly on every call, even under a session pin.
   - Auth error on the call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the gap list.** Call `well_list_missing_invoices` once, with `workspace_id` and nothing else — the server reads the period selection the user clicked. `period_label` in the result is the period name to quote.
   - An error saying no period selection exists yet → run `define-period` (its picker renders and waits for the click), then re-call once the selection is written. Do not guess a month to fill the argument.
   - `success: false` or a transient failure → retry once. A second failure → step 8.
   - `row_count: 0` → no gaps for the period. Say so plainly with the coverage caveat below, and hand off `resolution: empty` with an empty selection.

4. **Report it once, and let the card take the pick.**
   - In an MCP-Apps host the result already renders the missing-invoices card — the counterparty rows with their Agent / Connect *provider* / Upload badges, grouped by the person the spend is attributed to when that data is there and flat when it is not, each row carrying a checkbox and its own transaction table. Do not restate the rows in text under it, and do not re-group them yourself. Give the summary line — how many counterparties in each mode, and the total — then the coverage line from step 6 and one line telling the user to tick the vendors to chase and click Continue. Nothing else: no per-row commentary and no restated rows.
   - In a text-only host, list the counterparties grouped by mode — `agent` first (Well can close these itself), then `connect`, then `upload` — largest amount first inside each group. Give each row's name, `tx_count`, amount, and its `suggested_action`. Cap the list at fifteen rows and say how many remain. Then ask which vendors to chase. When the user names them, resolve each name against the rows you listed and write the pick yourself — `well_switch_workspace({ workspace_id, counterparties })`, copying `company_id` and `matched_connector_service_id` off each matched row. Pass no display name, and leave out a row whose `company_id` is null. When the user answers "all of them", write every row that carries a `company_id`.
   - A row whose `base_total_amount` is `null` has no FX rate for its currency: print **amount unavailable** for it. Never convert it yourself, and never add native amounts of different currencies together.

5. **Total honestly.** The only total is the sum of the non-null `base_total_amount` values, stated in `base_currency`. When some rows are null, say the total covers the rows that have an amount and name how many do not. When every row is null, report no total at all.

6. **State the coverage.** Say it in one line, every time, even when the list is empty: these gaps cover the period's **categorized** expense transactions only (`transaction_count` is how many were examined), so spend that is not categorized yet cannot appear here. Add the `dropped_groups` total when it is non-zero, and any `hints` the tool returned. When the selection holds a month that is still running (`is_complete: false` in the `define-period` hand-off), say in the same line that the list is still moving.

7. **End the turn on the card, then read the pick.** A list with rows always ends its turn here — the card is on screen and the choice is the user's. Resolve their next message in this order, and never re-ask what they already clicked.
   - The message is the card's "Continue" prefill → the click already wrote the selection server-side. Acknowledge it in half a sentence and hand off; run no verification call.
   - The message names vendors, or accepts every row → treat it as the text-only pick of step 4 and write it yourself.
   - Any other message → call `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → take its `counterparties` as the pick and hand off. `no_selection_yet` → one line asking the user to tick the vendors and click Continue, and end the turn again.
   - **Keep for later** dismisses the card and writes nothing. Nothing is picked, so the flow does not go on to fetching: say the list stays available and stop.
   - An empty list has nothing to pick: skip this step and hand off `resolution: empty`.

8. **On failure, redirect instead of guessing.** After a second failure, do not build a gap list by hand. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same list there. Do not append a query parameter you have not confirmed the app reads.

9. **Hand off.** Keep the hand-off facts below so the next step can act on the list, and on the user's pick, without re-reading either — never printed as a block.

## Output requirements

Return:

- One line summarising the period: the `period_label`, how many counterparties fall in each mode, and the total (e.g. "**March 2026** — 12 suppliers with no invoice: 7 Well can fetch, 3 need a connection, 2 need an upload. €18,430 of settled spend."). When the card is on screen this line replaces the rows, not the coverage and next-step lines below.
- The coverage line from workflow step 6.
- One line telling the user to tick the vendors to chase and click Continue, whenever the list has rows. In a text-only host, the question of step 4 takes its place.
- The hand-off, kept for the calling flow and never printed: `workspace_id` — always the workspace this list was read for, from the tool response or from the `define-workspace` hand-off when no call was made; the period (`calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period`, `period_label`); `base_currency`; `transaction_count`; the `rows` exactly as returned; the `counts` per mode (`agent`, `upload`, `connect`); `total_base_amount` — the sum of the non-null `base_total_amount` values, or null; `agent_candidates` — the `mode: agent` rows grouped by `matched_provider_name`, rows with no matched provider under `"unknown"`, each group carrying its counterparties (`company_id`, name, `tx_count`, `base_total_amount`), its summed `tx_count`, its summed non-null amount, and the `matched_connector_service_id` its rows share; `selection` — the vendors the user picked, each as its `company_id` plus its `matched_connector_service_id` or null, in the order the pick came in; `selection_state` — `written` (the Continue click, a wait-read, or your own text-only write recorded it), `pending` (the card is on screen and nothing is picked yet), or `none` (an empty or unavailable list has nothing to pick); the `coverage_note` — one line, categorized expense transactions only, plus `dropped_groups` when non-zero; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `rows` is empty, every count is 0, `total_base_amount` is null, and `selection` is empty. On `unavailable`, only `workspace_id`, the period, and the `coverage_note` are kept. `selection` carries identifiers only — a later step routes on `company_id` and `matched_connector_service_id`, never on a vendor's display name. These keys are reasoning vocabulary for you and the calling flow — `deploy-agents` previews the picked vendors from `selection` and `agent_candidates` — and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: this list is only as complete as what feeds it — bank data is what makes a settled transaction visible, and accounting or invoicing connections are what let Well match an invoice to it. Say which of those are behind the answer, and if `connect` rows exist, that connecting those providers turns manual uploads into gaps Well can close itself.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `categorize-counterparties` skill is installed and uncategorized spend could be hiding gaps: "Want me to categorize the period's counterparties first, so nothing is hidden from this list?" — then, once a pick is written and `deploy-agents` is installed, that pick is what the next step previews: "Shall I show you what Well would fetch for the vendors you picked?". Otherwise hand control back to the skill that called this one, or, when the user asked for the list on its own, ask which gap they want to close first.
- The whole answer stays a few plain sentences a non-technical user understands: what is missing, the one total that matters, and the next step. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- The rows restated in text when the card is already on screen.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A gap list built from raw transactions when `well_list_missing_invoices` was unavailable.
- A selection written from vendor names, or a vendor the user did not pick.
- Rows from a second workspace or a second period.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the missing-invoices card from one
that did not. Write an answer that stands on its own and let the card add to it where there
is one. Do not compose a second rendering of rows the tool already returned; where a visual
the tool does not draw genuinely reads better and the `well-design-system` skill is
available, use it.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_missing_invoices` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and computed nothing.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this conversation established — no leftover pin from another conversation was reused or mentioned, and no workspace question was asked in text.
- The tool was called once, with no periods argument — the server-held selection decided the period — and `period_label` was quoted from the result. A no-selection error sent the flow to `define-period`, not to a guessed month.
- The counterparty rows were used as returned and not re-grouped or re-counted; the card's own grouping and transaction tables were left to the card.
- A list with rows ended its turn on the card with one line asking for the tick and the Continue click. The "Continue" prefill was taken at its word with no verification call; any other message got one `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` call, and the wait tool was never called before the card existed.
- The pick travels as identifiers — `company_id` plus `matched_connector_service_id` — and no display name was written into the selection. A text-only pick was resolved against the rows that were listed, and a row with a null `company_id` was left out of it.
- Every `null` `base_total_amount` was reported as "amount unavailable"; the total summed only non-null base-currency amounts and disclosed how many rows it excluded.
- The categorized-only coverage line was stated, even on an empty list, with `dropped_groups` and `hints` when present, and with the still-moving caveat when the selection holds a month that is still running.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the call was retried once before the workspace-link fallback.
- The connector-coverage line was stated: which of bank, accounting, or invoicing data is behind the answer, and — when `connect` rows exist — that connecting those providers turns manual uploads into gaps Well can close itself.
- The hand-off facts were kept — `workspace_id`, the period, `counts`, `agent_candidates`, `selection`, `selection_state`, `coverage_note`, and `resolution` — and no yaml, JSON, or fenced code block appears anywhere in the answer.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`categorize-counterparties` then, once a pick is written, `deploy-agents` when installed, otherwise the caller or a question).

## Examples

### Example request

The fetch-missing-invoices flow calls this skill with the `workspace_id` of Acme SAS, after the user clicked March 2026 on the period card, `purpose: "to decide which suppliers Well should chase"`. The host is Claude Desktop.

### Expected behavior

Call `well_list_missing_invoices({ workspace_id })` — no periods argument; the server reads the clicked selection. The card renders the twelve counterparty rows with their badges, their checkboxes and their transaction tables. Answer in one line — "**March 2026** — 12 suppliers with no invoice: 7 Well can fetch, 3 need a connection, 2 need an upload. €18,430 of settled spend." — add the coverage line, ask the user to tick the vendors to chase and click Continue, and end the turn. Do not list the twelve rows again. The next message is the "Continue" prefill: the click already wrote the picked vendors, so acknowledge it in half a sentence and hand off `resolution: listed` with `selection_state: written`, the picked `company_id` / `matched_connector_service_id` pairs, and `agent_candidates` grouped by provider.

### Example request

"What am I missing?" with no period selection written yet — the tool answers that no selection exists.

### Expected behavior

Do not guess a month. Run `define-period`: its picker renders and waits for the click (or resolves a typed month and writes it). Once the selection is written, re-call `well_list_missing_invoices({ workspace_id })` and report as usual.

### Example request

"What am I missing for March?" in a text-only host, the selection written by `define-period`. Three rows come back; one has `base_total_amount: null`.

### Expected behavior

List the three counterparties grouped by mode with each `suggested_action`. Print "amount unavailable" for the null row and state the total covers the two rows that have an amount. Say the gaps cover categorized expense transactions only, then ask which vendors to chase — no card can take the tick here. The user answers "the first two": match those two names against the rows you listed and call `well_switch_workspace({ workspace_id, counterparties })` with their `company_id` and `matched_connector_service_id` values, then hand off with `resolution: listed`, `selection_state: written`, and `total_base_amount` set to the sum of those two.

### Example request

"Which invoices am I missing for last month?" — `well_list_missing_invoices` is not in the toolset.

### Expected behavior

Say the Well server this host is connected to does not expose the missing-invoices tool yet, and that the answer cannot be approximated from raw transactions without changing what is being measured. Hand off `resolution: unavailable` and stop. Do not call `well_query_records`.

### Example request

The tool returns `row_count: 0`, `transaction_count: 41`, `dropped_groups: { bank_internal: 3, unknown: 0, unnamed_company: 1 }`.

### Expected behavior

"No missing supplier invoices for **March 2026** — all 41 categorized expense transactions have one. Four groups were left out as internal transfers or unnamed counterparties, and spend that is not categorized yet cannot appear here." Hand off `resolution: empty` with zeroed counts, an empty `selection` and `selection_state: none` (and `workspace_id` still set), and offer `categorize-counterparties` to widen the coverage. Nothing is on the card to tick, so ask for no click.

### Example request

The list holds five `mode: agent` rows — three matched to Amazon, two with `matched_provider_name: null` — and one of the Amazon rows carries a `proof_task_id`.

### Expected behavior

Report the five, and say the Amazon row with a task id is already being collected — do not ask for it again. Group `agent_candidates` into `provider_name: "Amazon"` (three counterparties) and `provider_name: "unknown"` (two), each counterparty carrying its `company_id` and each group its summed `tx_count` and amount, so the pick and the preview both travel on identifiers.
