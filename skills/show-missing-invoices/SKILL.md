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

- `well_list_missing_invoices` — the only tool this skill calls for the gap list, and only once per step. Call it with `workspace_id` and **no periods argument**: the server reads the period selection the user's click (or `define-period`) already wrote. An error naming no selection yet sends the flow to `define-period`, never a guessed month; a `success: false` naming a period that has not ended is not transient and goes back to `define-period` too, never retried. The response carries `workspace_id`, `base_currency`, `periods_requested`, `periods_covered`, `months`, `transaction_count`, `rows`, `row_count`, `dropped_groups`, `hints`, `success`, and `error` on failure — plus the single-month fields (`calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period`, `period_label`) only when the selection held exactly one month. For the full call contract — the older-server degrade path, and exactly which envelope fields appear on a multi-month read — read `references/tool-contracts.md`.
- `well_switch_workspace` — the selection write, and the only write this skill is part of. The card calls it on its **Continue** click with the picked vendors; call it yourself only on the text-only path of Workflow step 4, with `workspace_id` and `counterparties` (`{ company_id, matched_connector_service_id }` pairs, one per company, at most 200). It scopes the selection to the workspace it is dispatched to and never re-pins. For the full call shape, read `references/tool-contracts.md`.
- `well_wait_for_selection({ kind: "counterparties", timeout_s? })` — the click read, legal only after THIS conversation rendered the missing-invoices card, and never as a probe before it exists. Returns `{ status: "selected", selection: { workspace_id, periods, counterparties }, already_set? }` or, with nothing picked yet after a brief wait (default 10 seconds), `{ status: "no_selection_yet" }` — a normal result, not an error. A `selected` answer counts only when its `selection.workspace_id` matches the pinned workspace; otherwise treat it as no pick and ask for the tick on the card now on screen. For the full detail, read `references/tool-contracts.md`.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace, the multi-workspace queue, and `selected_counterparties` once a pick is written. This skill never re-pins; re-pinning belongs to the caller.

Each row in `rows` is **one counterparty in one month**, already grouped by the server — never re-aggregate it, and never merge two rows for the same counterparty across two months. `company_id` is the identifier the pick travels on; a row with no `company_id` cannot be picked. `mode` is the ONE route the card suggests — `agent` (Well can collect it from the provider), `connect` (connect the provider first), or `upload` (the user supplies it) — and every user-facing sentence is worded off `mode`, never off `suggested_action`, which is an internal routing enum you never print to the user. A row whose `base_total_amount` is `null` has no FX rate for its currency: print **amount unavailable** for it, never convert it yourself, and never add native amounts of different currencies together. When a row already carries a `proof_task_id`, say it is already recorded and do not ask for the same document again — read `acquisition_status` for where it actually stands (report progress only on `processing`, closure only on `mapped`, and never say a fetch is under way on `waiting`). `dropped_groups` counts three kinds of spend the server could not turn into a row; `bank_internal` (party-less bank operations) is not a gap, but `unknown` and `unnamed_company` are real gaps this list cannot show or chase — disclose every non-zero counter and claim nothing over them. For the full row and transaction field catalog and the exact `dropped_groups` counting rules, read `references/tool-contracts.md`.

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
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the period (single-month fields when the result carried one, `periods_covered` plus `periods_requested` and the per-month `months` totals when it did not); `base_currency`; `transaction_count`; the `rows` exactly as returned; `counts` per mode (`agent`, `upload`, `connect`); `total_base_amount` — the sum of the non-null `base_total_amount` values, or null; `agent_candidates` — the `mode: agent` rows grouped by `matched_provider_name` (unmatched rows under `"unknown"`), each group carrying its counterparties and its summed `tx_count` and amount; `selection` — the picked vendors, each as `company_id` plus `matched_connector_service_id` or null, identifiers only, never a display name; `selection_state` — `written`, `pending`, or `none`; the `coverage_note`; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, every count is 0 and `selection` is empty; on `unavailable`, only `workspace_id`, the period, and the `coverage_note` are kept. These keys are reasoning vocabulary for you and the calling flow, and the hand-off travels as plain conversation, not as a data block. For the exact meaning of every key, when `selection_state` is `pending` versus `none`, and how `agent_candidates` groups its rows, read `references/handoff-and-checks.md`.
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

Before finishing, verify the essentials inline: the tool was called once with no periods argument and no guessed month, `workspace_id` came from `define-workspace` or a same-conversation pin, every `null` `base_total_amount` was reported as "amount unavailable", the categorized-only coverage line was stated even on an empty list, no `well_invoke_connector_tool` or provider-specific tool was called, and the answer holds no yaml, JSON, or fenced code block. For the full pre-hand-off checklist — every rule above stated as its own verification line, including the exact conditions for `selection_state: pending` versus `none` and for calling a period complete — read `references/handoff-and-checks.md`.

## Examples

For worked examples covering a single-period read through a card, a no-selection retry into `define-period`, the text-only fallback with a null-amount row, the missing-tool degrade, both `dropped_groups` outcomes for an empty list, a multi-month read, and a provider-grouped `agent_candidates` hand-off, read `references/examples.md`.

## Voice

<!-- voice:begin -->
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
<!-- voice:end -->
