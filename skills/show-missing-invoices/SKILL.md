---
name: show-missing-invoices
requires: [define-workspace, define-period]
description: List the settled spend in one Well workspace that still has no supplier invoice for a given month or fiscal period, one row per counterparty, each row carrying how the gap can be closed — Well's agent fetches it, connect the provider, or upload it by hand — and hand the list off as a typed result. The card carries a checkbox per vendor, and its Continue click writes the picked vendors into the session as identifiers so the fetch step acts on the user's pick. Use when the user asks which invoices or receipts are missing, "what am I missing for March", "which vendor invoices do I still owe my accountant", "show me the gaps before I close the books", or when a close-books or fetch-missing-invoices flow needs the period's gap list before it collects anything. Needs a workspace pinned by define-workspace and a period resolved by define-period. Do not use to fetch, download, or collect the documents themselves, to compute a spend total, or to list unpaid customer invoices.
---

# Show Missing Invoices with Well

## Purpose

Answer "what supplier invoices am I still missing for this period?" for exactly one workspace and the period selection the user picked. Read Well's gap list, report it once — one row per counterparty, with how each gap can be closed — take the user's pick of the vendors to chase, and emit a typed hand-off the next step reads to decide what to collect. The gap-list step of Well's fetch-missing-invoices flow, after `define-period`: it takes `workspace_id` from `define-workspace`, and the period comes from the **server-held selection** the user's click on the period card (or `define-period`) already wrote — so the gap-list call carries no periods argument at all. It lists gaps only; it never fetches, downloads, or collects a document.

**This step ends on a click, like the workspace, period and connect steps.** The card carries a checkbox per vendor, lists each row's own transactions, and closes on **Keep for later** and **Continue**. The Continue click writes the picked vendors into the session context — each vendor as its `company_id` plus its `matched_connector_service_id`, never a display name — and prefills the user's composer with one of two sentences, chosen by the pick: "Continue. Well has a connector for some of the vendors I picked. Show the connect step for those connectors first, then the deploy step." when at least one picked vendor carries a `matched_connector_service_id`, and "Continue. Well has no connector for the vendors I picked. Show the deploy step." when none does. The user sends that message, it names the order the steps after this one run in, and it is what moves the flow on. Render the card, say your summary, and end the turn.

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
- The user wants the documents fetched from the suppliers' portals — the next step is `deploy-agents`, which reads this skill's hand-off and previews that fetch, and `connect-tools` comes before it when the pick names a vendor Well carries a connector for. None of those steps collects a document.
- The user wants invoices already in the ledger that have no source document attached — that is the `missing-receipts` skill; this skill starts from settled bank spend, not from ledger rows.
- The user wants bills still to be paid (`bills-due`) or unpaid customer invoices (`accounts-receivable-aging`) — those are money owed, not documents missing.
- The user wants how much was spent or on what (`cost-structure`) — this skill counts gaps, it is not a spend report.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace` first — its picker renders at the point of need, and no "which workspace?" question is asked in text.
- A period selection written server-side — required, but **not passed to the tool**: the user's click on the period card, or `define-period` on a typed month, already wrote it, and the tool reads it on its own. The `define-period` hand-off (its `periods`, `period_label`, `is_complete`) is narration context only — except on the older-server degrade path in Tooling, where its `periods` entries are the months the call carries. If no selection exists yet, the tool says so — run `define-period` then; never guess a period from today's date.
- `purpose` — one line from the calling skill (e.g. "to decide which suppliers Well should chase"), used when a question is needed. Optional.

Every month in the selection has ended. `define-period` pins no running month, and the gap-list read refuses the WHOLE call when the selection holds one — a running month does not read partially, it reads not at all.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes, and only when the next entry is a DIFFERENT workspace: a re-pin to the workspace already pinned records no choice and clears the queue. This skill pins nothing itself — its one write is the text-only vendor pick of step 4. Each pass gets its own gap list, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_missing_invoices` — the only tool this skill calls for the gap list. Input: `workspace_id` explicitly, as on every `well_*` call, and **no periods argument** — omitted, the server uses the period selection the user's click (or `define-period`) already wrote. An error comes back only when no selection exists yet: run `define-period`, then re-call. Pass the months explicitly only on an older server that holds no session selection, and then take them from `define-period`'s hand-off (`periods`), never from today's date — the degrade path, never the default. Output: `workspace_id`, `base_currency`, `periods_requested`, `periods_covered`, `months`, `transaction_count`, `rows`, `row_count`, `group_count`, `dropped_groups`, `hints`, `success`, and `error` on failure. **The five single-month fields — `calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period` and `period_label` — come back only when the selection held exactly one month.** With several months they are absent from the envelope: `periods_requested` says how many months the call read, `periods_covered` names them (each as `calendar_year`, `calendar_month`, `period_label`, oldest first), and `months` carries each month's own `calendar_year`, `calendar_month`, `period_label`, `fiscal_year`, `fiscal_period`, `row_count`, `transaction_count`, `group_count` and `dropped_groups`. `periods_requested`, `periods_covered` and `months` come back on every success, one month included; the top-level `transaction_count`, `row_count`, `group_count` and `dropped_groups` are always totals across every month read. **`well_list_missing_invoices`' `transaction_count` counts the transactions that are MISSING their invoice** — the gap total behind the rows. It is not a count of the transactions Well examined, and it is no denominator. `well_list_periods` carries a field of the same name that counts every transaction a month holds; name the owning tool whenever you refer to either, because the two never mean the same thing.
- `well_switch_workspace` — the selection write, and the only write this skill is part of. The card calls it on its **Continue** click with `workspace_id`, `counterparties` — an array of `{ company_id, matched_connector_service_id }`, at most 200 entries, ONE per company, copied off the rows — and `counterparty_periods`, the months the card listed, which bound the pick to those months. Call it yourself only on the text-only path of step 4, where the user names the vendors in prose. A counterparties call scopes the selection to the workspace it is dispatched to and leaves the pin alone, so it never re-pins; re-pinning between workspaces belongs to the caller, and a switch to another workspace clears the selection.
- `well_wait_for_selection({ kind: "counterparties", timeout_s? })` — the click read, legal only after THIS conversation rendered the missing-invoices card. Its one job is reading the pick when the user's next message is not one of the card's two Continue prefills. Never before the card exists, and never as a probe. An already-made pick returns instantly as `{ status: "selected", selection: { workspace_id, periods, counterparties }, already_set: true }`, where `selection.periods` names the months the pick was listed for — empty when the pick names none and so covers every month read; with nothing picked yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }` — a normal result, not an error. `selection.workspace_id` is the workspace the pick was made in, and it is what says whether the pick is yours: compare it with the pinned workspace before you act on the pick. A pick read for a different workspace than the pinned one is not this pass's pick — treat it as no pick and ask for the tick on the card now on screen. The fetch step never honours a pick from another workspace, so handing one on previews something other than the vendors the user ticked.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace, the queue a multi-workspace caller walks, and `selected_counterparties` once a pick is written. This skill never re-pins; re-pinning belongs to the caller.

Each entry in `rows` is **one counterparty in one month**, already grouped by the server — never re-aggregate it. Every row carries its own month — `calendar_year`, `calendar_month` and `period_label` — and `rows` runs oldest month first. So a counterparty with a gap in two of the selected months holds two rows: attribute each row by its own tag, and never merge the two.

- `id`, `company_id`, `name` — the counterparty; `tx_count` — how many settled transactions of theirs have no invoice; `base_total_amount` — their total in `base_currency`, or `null`. `company_id` is the identifier the selection travels on; a row whose `company_id` is `null` cannot be picked, so it is reported and left out of the selection.
- `transactions` — the row's own lines, in ledger order, capped by the server, each with `id`, `date`, `description`, `category`, `category_key`, `amount`, `currency` and `base_amount`. The card lists them under the counterparty. `amount` is signed and stays in the transaction's own currency, so never add those across currencies. `base_amount` is the same line in `base_currency`, still signed, and the magnitudes of those DO sum to `base_total_amount` — it is the one per-line figure a text-only host can state beside the row total. Branch on `category_key`, never on the `category` label. `transactions_omitted` says how many the cap left out — quote that number instead of implying the list is complete.
- `mode` — how the gap can be closed: `agent` (Well can collect it from the provider), `connect` (connect the named provider first), `upload` (the user supplies the document). It is the ONE route the card suggests.
- `available_modes` — every route the row offers: `agent` and `upload` on every row, plus `connect` when Well carries a connector for the matched provider. Two or three entries, never one. The card renders one badge per entry, so `mode` names the suggestion and this names the choice.
- `suggested_action` — the backend's raw routing decision for that row, BEFORE the downgrade rules, as one of `connect_provider`, `chrome_extension_fetch` and `manual_upload`. It can disagree with `mode`, which is that decision after the downgrades. Word every user-facing sentence off `mode`, and never print this enum value to the user.
- `matched_provider_name`, `matched_provider_has_blueprint`, `matched_connector_service_id` — the provider behind an `agent` or `connect` row; `matched_provider_name` is `null` when Well could not match one.
- `proof_task_id` — the close-proof task bound to that row, `null` until one is minted. It records that Well already tracks the gap; it reports no fetch. When it is set, say the row is already recorded and do not ask for the same document again — read `acquisition_status` for where the row actually stands.
- `acquisition_status`, `refusal_reason` — where the row stands, and why Well will not act on it. `waiting` means no document has arrived and nothing is fetching; `processing` means a document arrived and the pipeline has not settled it; `mapped` means the gap is closed; `refused` means the document landed and the bridge declined to link it. Report progress only on `processing` and closure only on `mapped`, and never say a fetch is under way on `waiting`. Report both fields verbatim when they explain an inactionable row; never reword them into a cause you inferred.

`dropped_groups` (`bank_internal`, `unknown`, `unnamed_company`) counts the **groups** the server could not turn into a row — one count per group, never a transaction count. The three counters do not mean the same thing, so never sum them into one figure:

- `bank_internal` — party-less bank operations. No supplier can invoice them, so they are not gaps.
- `unknown` — the server resolved no counterparty for the spend.
- `unnamed_company` — the counterparty carries no usable name or key, so the card cannot render it.

`bank_internal` and `unknown` are SINGLETON buckets: one month's operations of either kind are one group however many they are, and a read over several months counts the months that held any. So never quote either counter as a quantity of operations.

`unknown` and `unnamed_company` are categorized expense spend that still has no supplier invoice. **They are gaps**, and this list can neither show them nor chase them. Disclose every non-zero counter, name `unknown` plus `unnamed_company` as spend this list leaves out, and claim nothing over it.

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

3. **Read the gap list.** Call `well_list_missing_invoices` once, with `workspace_id` and nothing else — the server reads the period selection the user clicked. `period_label` in the result is the period name to quote when the selection held one month. When it held several, the result carries no `period_label` of its own: name every month from `periods_covered`, and take each month's own totals from `months`.
   - An error saying no period selection exists yet → run `define-period` (its picker renders and waits for the click), then re-call once the selection is written. Do not guess a month to fill the argument.
   - `success: false` naming a period that has not ended → the read refused the whole call, so no month in the selection returned rows. This is not transient: never retry it, and never fall through to step 8. Send the flow back to `define-period` for a completed month.
   - Any other `success: false`, or a transient failure → retry once. A second failure → step 8.
   - `row_count: 0` → nothing to tick, but read `dropped_groups` before you call the period complete. An empty row list is not by itself a complete period.
     - `unknown` plus `unnamed_company` is 0 → no supplier invoice is missing for the period. Say so plainly. Name a non-zero `bank_internal` in the same line WITHOUT its number — say the period also holds bank operations with no counterparty, which no supplier can invoice.
     - `unknown` plus `unnamed_company` is above 0 → say Well could not attribute that many groups of the period's categorized spend to a named counterparty. Say this list shows none of them and cannot chase them. Never call the period complete, and claim nothing over those groups.
     - Either way, add the coverage caveat below and hand off `resolution: empty` with an empty selection.

4. **Report it once, and let the card take the pick.**
   - In an MCP-Apps host the result already renders the missing-invoices card: the counterparty rows, each carrying one collection-method badge per entry of its `available_modes` (**Deploy agent**, **Connect tools**, **Upload**), a checkbox, and its own transaction table, in one flat list. Do not restate the rows in text under it, and do not re-group them yourself. Give the summary line — how many counterparties in each mode, and the total — then the coverage line from step 6 and one line telling the user to tick the vendors to chase and click Continue. Nothing else: no per-row commentary and no restated rows.
   - In a text-only host, list the counterparties grouped by mode — `agent` first (Well can close these itself), then `connect`, then `upload` — largest amount first inside each group. Give each row's name, `tx_count` and amount, and say how the gap can be closed in plain words from the group's `mode`. Cap the list at fifteen rows and say how many remain. Then ask which vendors to chase. When the user names them, resolve each name against the rows you listed and write the pick yourself — `well_switch_workspace({ workspace_id, counterparties })`, copying `company_id` and `matched_connector_service_id` off each matched row. **The pick holds one entry per COMPANY, never one per row.** A counterparty with a gap in two of the selected months holds two rows, and a repeated `company_id` makes the write refuse the whole call: deduplicate on `company_id` first, and keep the `matched_connector_service_id` of the first row that carries one. Pass no display name, and leave out a row whose `company_id` is null. When the user answers "all of them", write one entry per distinct `company_id`, and at most 200 — a longer list is refused.
   - A row whose `base_total_amount` is `null` has no FX rate for its currency: print **amount unavailable** for it. Never convert it yourself, and never add native amounts of different currencies together.

5. **Total honestly.** The only total is the sum of the non-null `base_total_amount` values, stated in `base_currency`. When some rows are null, say the total covers the rows that have an amount and name how many do not. When every row is null, report no total at all.

6. **State the coverage.** Say it in one line, every time, even when the list is empty: these gaps cover the period's **categorized** expense transactions only, so spend that is not categorized yet cannot appear here. **The result carries no count of the transactions Well examined**, so state that bound in words and quantify it with nothing. Never quote `transaction_count` as the transactions read: it counts the transactions missing their invoice. Add each non-zero `dropped_groups` counter, kept apart as the field list above keeps them, and any `hints` the tool returned.

7. **End the turn on the card, then read the pick.** A list with rows always ends its turn here — the card is on screen and the choice is the user's. Resolve their next message in this order, and never re-ask what they already clicked.
   - The message is one of the card's two Continue prefills → the click already wrote the selection server-side. Acknowledge it in half a sentence and hand off; run no verification call. The prefill also names the order the next steps run in: a message asking for the connect step first sends the flow to `connect-tools` and to `deploy-agents` after it; a message asking for the deploy step sends it straight to `deploy-agents`. Follow the order the message asks for.
   - The message names vendors, or accepts every row → treat it as the text-only pick of step 4 and write it yourself.
   - Any other message → call `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → compare its `selection.workspace_id` with the workspace this list was read for. The two match → take its `counterparties` as the pick and hand off. They differ → a pick read for a different workspace than the pinned one is not this pass's pick: treat it as no pick, ask for the tick on the card now on screen, and end the turn again. `no_selection_yet` → one line asking the user to tick the vendors and click Continue, and end the turn again.
   - **Keep for later** dismisses the card and writes nothing. Nothing is picked, so the flow does not go on to fetching: say the list stays available and stop.
   - An empty list has nothing to pick: skip this step and hand off `resolution: empty`.

8. **On failure, redirect instead of guessing.** After a second failure, do not build a gap list by hand. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same list there. Do not append a query parameter you have not confirmed the app reads.

9. **Hand off.** Keep the hand-off facts below so the next step can act on the list, and on the user's pick, without re-reading either — never printed as a block.

## Output requirements

Return:

- One line summarising the period: the `period_label`, how many counterparties fall in each mode, and the total (e.g. "**March 2026** holds 12 suppliers with no invoice: 7 Well can fetch, 3 need a connection, 2 need an upload. €18,430 of settled spend."). When the card is on screen this line replaces the rows, not the coverage and next-step lines below.
- **Several months in the selection: name them all.** One label never stands for a list that spans months, and the result carries no single label to quote. Name each month from `periods_covered` in that line and keep the counts and the total as the totals across every month read (e.g. "**February 2026 and March 2026** hold 19 suppliers with no invoice: 11 Well can fetch, 5 need a connection, 3 need an upload. €31,200 of settled spend across both months."). Add the per-month split from `months` when the user asked for a month-by-month answer. Never compose a range label the result does not carry, and never quote one month's label for the whole list.
- The coverage line from workflow step 6.
- One line telling the user to tick the vendors to chase and click Continue, whenever the list has rows. In a text-only host, the question of step 4 takes its place.
- The hand-off, kept for the calling flow and never printed: `workspace_id` — always the workspace this list was read for, from the tool response or from the `define-workspace` hand-off when no call was made; the period — the single-month fields (`calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period`, `period_label`) when the result carried them, and `periods_covered` plus `periods_requested` and the per-month `months` totals when it did not, so the next step is never told one month for a list that spans several; `base_currency`; `transaction_count`; the `rows` exactly as returned; the `counts` per mode (`agent`, `upload`, `connect`); `total_base_amount` — the sum of the non-null `base_total_amount` values, or null; `agent_candidates` — the `mode: agent` rows grouped by `matched_provider_name`, rows with no matched provider under `"unknown"`, each group carrying its counterparties (`company_id`, name, `tx_count`, `base_total_amount`), its summed `tx_count`, its summed non-null amount, and the `matched_connector_service_id` its rows share; `selection` — the vendors the user picked, each as its `company_id` plus its `matched_connector_service_id` or null, in the order the pick came in; `selection_state` — `written` (the Continue click, a wait-read whose `selection.workspace_id` matched this workspace, or your own text-only write recorded it), `pending` (the card is on screen and nothing is picked yet, or the only pick read was made in a different workspace than the pinned one and so counts as no pick), or `none` (an empty or unavailable list has nothing to pick); the `coverage_note` — one line, categorized expense transactions only, plus `dropped_groups` when non-zero; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `rows` is empty, every count is 0, `total_base_amount` is null, and `selection` is empty. On `unavailable`, only `workspace_id`, the period, and the `coverage_note` are kept. `selection` carries identifiers only — a later step routes on `company_id` and `matched_connector_service_id`, never on a vendor's display name. These keys are reasoning vocabulary for you and the calling flow, and the hand-off travels as plain conversation, not as a data block. `selection` and `selection_state` are this skill's own record of the pick it saw; the step that follows reads the pick the card wrote into the session.
- Connector coverage in plain words: this list is only as complete as what feeds it — bank data is what makes a settled transaction visible, and accounting or invoicing connections are what let Well match an invoice to it. Say which of those are behind the answer, and if `connect` rows exist, that connecting those providers turns manual uploads into gaps Well can close itself.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step on every turn that carries no tick request — the empty list, the unavailable list, and the turn after the pick is written. The card turn ends on the tick request instead, so the pointer waits for the turn after it. When the `categorize-counterparties` skill is installed and rows carry no category: "Want me to label the vendors behind these gaps first?" That skill writes company-level industry labels, so say plainly that it changes what Well knows about the vendors, not which invoices are missing — this list is bounded by TRANSACTION categorization, which is a different axis. Then, once a pick is written, the pick decides which step follows, and each pointer holds only when that skill is installed: a pick naming a vendor Well carries a connector for goes to `connect-tools` first and to `deploy-agents` after it ("Shall I connect the tools behind the vendors you picked, then show you what Well would fetch?"), and a pick naming none goes straight to `deploy-agents` ("Shall I show you what Well would fetch for the vendors you picked?"). Point at no step this host cannot run. Otherwise hand control back to the skill that called this one, or, when the user asked for the list on its own, ask which gap they want to close first.
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
never reaches you, so you cannot tell a host that drew the missing-invoices card from
one that did not. Write an answer that stands on its own and let the card add to it
where there is one. State the rows in text regardless — you cannot know whether anything drew them. What
you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_missing_invoices` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and computed nothing.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this conversation established — no leftover pin from another conversation was reused or mentioned, and no workspace question was asked in text.
- The tool was called once, with no periods argument — the server-held selection decided the period. A single-month result had its `period_label` quoted from the result; a multi-month result named every month from `periods_covered`, quoted no single label, and invented no range label. A no-selection error sent the flow to `define-period`, not to a guessed month.
- Each row was attributed by its own month tag (`calendar_year`, `calendar_month`, `period_label`); two rows for one counterparty in two months were left as two rows, and the hand-off carried `periods_covered` rather than one month whenever the list spanned several.
- The counterparty rows were used as returned and not re-grouped or re-counted; the card's own transaction tables were left to the card.
- A list with rows ended its turn on the card with one line asking for the tick and the Continue click. The Continue prefill was taken at its word with no verification call, and the order it named — the connect step first, or the deploy step straight away — is the order the answer followed; any other message got one `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` call, and the wait tool was never called before the card existed. A `selected` answer was taken as the pick only when its `selection.workspace_id` was the workspace this list was read for; a pick read for a different workspace than the pinned one was treated as no pick — the turn ended asking for the tick on the card now on screen, and `selection_state: pending` went to the hand-off.
- The pick travels as identifiers — `company_id` plus `matched_connector_service_id` — and no display name was written into the selection. A text-only pick was resolved against the rows that were listed, a row with a null `company_id` was left out of it, and the write carried one entry per company: a counterparty listed in two months was written once, and the list stayed within 200 entries.
- Every `null` `base_total_amount` was reported as "amount unavailable"; the total summed only non-null base-currency amounts and disclosed how many rows it excluded.
- The categorized-only coverage line was stated, even on an empty list, with each non-zero `dropped_groups` counter and any `hints`. The line quantified no examined-transaction figure, and `transaction_count` was never presented as the transactions Well read.
- An empty row list was resolved on `dropped_groups`: the period was called complete only when `unknown` plus `unnamed_company` was 0. Above 0, the answer named the unattributed group count, said this list can neither show nor chase it, and claimed nothing over it.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the call was retried once before the workspace-link fallback. A refusal naming a period that has not ended was sent back to `define-period` instead — never retried, and never resolved with the workspace link.
- The connector-coverage line was stated: which of bank, accounting, or invoicing data is behind the answer, and — when `connect` rows exist — that connecting those providers turns manual uploads into gaps Well can close itself.
- The hand-off facts were kept — `workspace_id`, the period, `counts`, `agent_candidates`, `selection`, `selection_state`, `coverage_note`, and `resolution` — and no yaml, JSON, or fenced code block appears anywhere in the answer.
- Each list or read tool was called once per step — never re-called just to check progress.
- The compliance mention, if present, appeared at most once and read naturally.
- The turn that carries no tick request ends with the next-step pointer — the empty list, the unavailable list, and the turn after the pick is written (`connect-tools` before `deploy-agents` when the pick names a connector Well carries, otherwise the caller or a question). The card turn ends on the tick request instead. `categorize-counterparties` was offered only over rows that carry no category, and never as a way to surface more gaps.

## Examples

### Example request

The fetch-missing-invoices flow calls this skill with the `workspace_id` of Acme SAS, after the user clicked March 2026 on the period card, `purpose: "to decide which suppliers Well should chase"`. The host is Claude Desktop.

### Expected behavior

Call `well_list_missing_invoices({ workspace_id })` — no periods argument; the server reads the clicked selection. The card renders the twelve counterparty rows with their badges, their checkboxes and their transaction tables. Answer in one line — "**March 2026** holds 12 suppliers with no invoice: 7 Well can fetch, 3 need a connection, 2 need an upload. €18,430 of settled spend." — add the coverage line, ask the user to tick the vendors to chase and click Continue, and end the turn. Do not list the twelve rows again. The next message is one of the card's two Continue prefills — the one naming the connect step first when the pick includes a vendor Well carries a connector for: the click already wrote the picked vendors, so acknowledge it in half a sentence, follow the order the message asks for, and hand off `resolution: listed` with `selection_state: written`, the picked `company_id` / `matched_connector_service_id` pairs, and `agent_candidates` grouped by provider.

### Example request

"What am I missing?" with no period selection written yet — the tool answers that no selection exists.

### Expected behavior

Do not guess a month. Run `define-period`: its picker renders and waits for the click (or resolves a typed month and writes it). Once the selection is written, re-call `well_list_missing_invoices({ workspace_id })` and report as usual.

### Example request

"What am I missing for March?" in a text-only host, the selection written by `define-period`. Three rows come back; one has `base_total_amount: null`.

### Expected behavior

List the three counterparties grouped by mode, saying how each gap can be closed in plain words from its `mode`. Print "amount unavailable" for the null row and state the total covers the two rows that have an amount. Say the gaps cover categorized expense transactions only, then ask which vendors to chase — no card can take the tick here. The user answers "the first two": match those two names against the rows you listed and call `well_switch_workspace({ workspace_id, counterparties })` with their `company_id` and `matched_connector_service_id` values, then hand off with `resolution: listed`, `selection_state: written`, and `total_base_amount` set to the sum of those two.

### Example request

"Which invoices am I missing for last month?" — `well_list_missing_invoices` is not in the toolset.

### Expected behavior

Say the Well server this host is connected to does not expose the missing-invoices tool yet, and that the answer cannot be approximated from raw transactions without changing what is being measured. Hand off `resolution: unavailable` and stop. Do not call `well_query_records`. This turn carries no tick request, so end it on the next-step pointer: hand control back to the calling flow, or ask what the user wants to do next when they asked for the list on its own.

### Example request

The tool returns `row_count: 0`, `transaction_count: 5`, `dropped_groups: { bank_internal: 1, unknown: 0, unnamed_company: 1 }` — the five transactions sit in the two dropped groups, so no row carries them.

### Expected behavior

One group is a real gap this list cannot show, so do not call the period complete. "No supplier invoice can be listed for **March 2026**, but Well could not attribute one group of the period's categorized spend to a named counterparty. This list shows none of it and cannot chase it. The period also holds bank operations with no counterparty, and no supplier can invoice those. Spend that is not categorized yet cannot appear here either." Hand off `resolution: empty` with zeroed counts, an empty `selection` and `selection_state: none` (and `workspace_id` still set). The `unknown` and `unnamed_company` groups carry no resolvable company, so there is no counterparty row to label: do not offer `categorize-counterparties` here. End on the next-step pointer instead — hand control back to the calling flow, or ask which month to look at next when the user asked for the list on its own. Nothing is on the card to tick, so ask for no click.

### Example request

The tool returns `row_count: 0`, `transaction_count: 0`, `dropped_groups: { bank_internal: 0, unknown: 0, unnamed_company: 0 }`.

### Expected behavior

Every counter is 0, so the period is complete and the wording says so. "No missing supplier invoices for **March 2026**. Every categorized expense from a supplier has its invoice. Spend that is not categorized yet cannot appear here." Quantify no examined-transaction figure: the result carries none. Hand off `resolution: empty` exactly as above, and ask for no click. End on the next-step pointer — hand control back to the calling flow, or ask which month to look at next.

### Example request

The user clicked February 2026 and March 2026 on the period card, so the selection holds two months. The result carries `periods_requested: 2`, `periods_covered` naming both months, `months` with each month's own totals, and no `period_label` on the envelope.

### Expected behavior

Name both months in the summary line — "**February 2026 and March 2026** hold 19 suppliers with no invoice: 11 Well can fetch, 5 need a connection, 3 need an upload. €31,200 of settled spend across both months." — and quote no single label, because the result carries none. Leave the rows to the card: a supplier with a gap in both months holds one row per month, each tagged with its own `period_label`, and the two are never merged. Hand off `periods_covered` and the `months` totals in place of the single-month fields, so the preview step is not told one month.

### Example request

The list holds five `mode: agent` rows — three matched to Amazon, two with `matched_provider_name: null` — and one of the Amazon rows carries a `proof_task_id` with `acquisition_status: waiting`.

### Expected behavior

Report the five. The Amazon row's task id with `waiting` means Well already records that gap and nothing is fetching it, so say it is already recorded and do not ask for that document again — never say a collection is under way on `waiting`. Group `agent_candidates` into `provider_name: "Amazon"` (three counterparties) and `provider_name: "unknown"` (two), each counterparty carrying its `company_id` and each group its summed `tx_count` and amount, so the pick and the preview both travel on identifiers.

## Voice

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
