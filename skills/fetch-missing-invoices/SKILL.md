---
name: fetch-missing-invoices
description: Walk Well's whole missing-invoice flow end to end — pin the workspace, confirm the bank / accounting / invoicing connections, fix the months, list the settled spend that still has no supplier invoice, raise categorization coverage when the list is thin, take the user's pick of the vendors to chase, and preview what Well would fetch for them. Nothing runs from the chat, and nothing collects the invoices yet. The last card hands the picked vendors to the Well app, whose acquisition page lists them and collects nothing. Use when the user says "fetch the invoices I'm missing", "what am I missing for March", "chase my missing supplier invoices before I close the books", "run the missing-invoice flow", or "go get those invoices", or when a flow needs every brick walked in order rather than one at a time. The flow is click-chained — the widget cards' Use / Validate / Continue clicks drive it forward. Do not use to run a collection from the chat, to compute a spend total, to close or post a period, or to run one brick on its own.
---

# Fetch Missing Invoices with Well

## Purpose

Run every step of Well's missing-invoice flow, in a fixed order: workspace → connections → bank → period → gap list and vendor pick → (categorization, on a thin list and a yes, → gap list again) → agent preview. The flow is **click-chained**: each card the flow renders ends the turn, and where the card carries the choice, the user's click writes it server-side AND prefills a message in their composer, which they send to move the flow on. A card whose choice is already made ends the turn all the same, and any message moves the flow on. Every stop is explicit, the workspace read ends its own turn before the connection check, the gap-list card takes the vendor pick and ends its own turn before the agent preview, and a multi-workspace pick loops the whole walk one entity at a time. The last step starts nothing from the chat: its card opens the acquisition link, whose acquisition page in Well lists the picked vendors and states that Well cannot collect them yet.

This skill is **self-contained**: each step below carries everything the flow needs. Each step also exists as its own skill (`define-workspace`, `connect-tools`, `connect-bank`, `define-period`, `show-missing-invoices`, `categorize-counterparties`, `deploy-agents`) for solo use; this flow does not read them.

**The duplication is deliberate, and it can drift.** Four rules below are copies of a brick's own rule, word for word: step 2's connection-state precedence belongs to `connect-tools`, step 4's fiscal derivation to `define-period`, step 5's vendor-pick contract to `show-missing-invoices`, and step 6's card-is-the-tool rule to `categorize-counterparties`. Each brick stays the source of truth. When one of those rules changes in its brick, change the copy here in the same PR — that is the price this skill pays for reading no brick at run time.

## When to use this skill

- The user asks Well to find and go after the invoices they are missing ("fetch the invoices I'm missing for March", "go get those receipts", "chase my missing supplier invoices").
- The user wants the whole month-end sweep — what is missing, what Well can fetch, what they must upload — instead of asking brick by brick, or is preparing a close and wants the gaps closed.

## When not to use this skill

- The user wants exactly one step on its own — use that step's own skill.
- The user wants a downloaded document or the status of a running collection. This flow starts nothing itself, and no Well surface starts one yet: its last card opens the acquisition link, whose acquisition page lists the picked vendors and collects nothing, so there is no run to follow.
- The user wants a figure (`expense-breakdown`, `cash-position`, `bills-due`, `accounts-receivable-aging`), ledger rows with no attachment (`missing-receipts` — this flow starts from settled bank spend), or a period closed, locked, or posted (the Well app).

## Inputs

All optional; never guess a workspace or a month.

- A workspace hint — a `workspace_id`, a name, "my FR entity", or several ("FR and US", "both my companies").
- A month hint — "March", "last month", "2026-03", "Q1" (several months are a legal selection).
- A bank the user named — "Qonto", "my BNP account".
- A `purpose` line, default "to fetch the invoices missing for that month", used in the card-pointing lines.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). **Check first that `well_*` tools are in your toolset at all.** If none are, tell the user to add the server at that URL and stop — the flow cannot start without it; never call an undefined tool or estimate anything.

The flow's tools, each owned by the step that calls it:

- `well_list_workspaces` — the workspace read. Returns `workspaces[]` (`workspace_id`, `workspace_name`, `is_primary`, `identity` with `country`, `base_currency`, `fiscal_year_start_month`) plus `session: { pinned_workspace_id, workspace_queue, selected_periods, selected_counterparties }` — the server-held context the cards' clicks write. Renders the workspace picker card (multi-select tiles).
- `well_switch_workspace` — the session write. Accepts `workspace_id`, `workspace_ids` (first = pin, rest = queue), `periods` (`[{ calendar_year, calendar_month }]`), `counterparties` (`[{ company_id, matched_connector_service_id }]`, at most 200), and `ack` (`"connectors"` | `"bank"`). The widget cards call it on their **Use** / **Validate** / **Continue** clicks — and each click also prefills its message in the user's composer; the flow calls the tool itself only for typed answers, matched hints, the text-only vendor pick of step 5, and the multi-workspace re-pin between passes. A `counterparties` call scopes the pick to the workspace it is dispatched to and leaves the pin alone; a switch to another workspace clears the pick.
- `well_wait_for_selection({ kind, timeout_s? })` — the click read, legal only AFTER this conversation has rendered the matching card: its one job is reading the click the user made on that card when their next message is not its prefill. Never at step start, never before the card exists, never as a probe for a pin, selection, pick, or ack — a trusted value lives only in this conversation's history; a fresh conversation trusts none (rule 8), so an unresolved step renders its card at once, no call before the render. `kind` is `"workspace"`, `"periods"`, `"counterparties"`, `"connect_ack"`, or `"bank_ack"`. An already-made selection returns instantly as `{ status: "selected", selection, already_set: true }` — workspace: `{ workspace_id, workspace_queue }`; periods: `{ periods }`; counterparties: `{ workspace_id, counterparties }`; acks: `{ acknowledged: true }`; when nothing is set yet it waits briefly (default 10 seconds) and returns `{ status: "no_selection_yet" }`, a normal result, not an error.
- `well_list_connectors` — the ONLY tool the two connection steps call. Unscoped at step 2, `kind: "bank"` at step 3.
- `well_list_periods` — the period picker read, when present.
- `well_list_missing_invoices` and `well_preview_invoice_fetch`, when present — both called with `workspace_id` only, **no periods argument**: the server uses the clicked selection, and an error comes back only when no selection exists yet — and never in the same turn as each other. The gap-list rows carry a bounded `transactions` list plus `transactions_omitted`; the preview's agents carry `domain` (the provider's bare host), the envelope carries `acquisition_url` — the acquisition link for those hosts — and it carries `scoped_to_selected_counterparties: true` when the server held a pick for this workspace, which is what tells a preview scoped to the pick from one covering the whole period.
- `well_list_counterparties` — the categorization read; its result's `meta.categoryCatalog` carries the company-category catalog (never fetch it any other way). `well_update_company` with `relationships.categories` — the one write, user-confirmed only.
- Well's OAuth / DCR flow when no Well connection exists yet — the moment it returns, retry the failed call in the same turn.

Never call `well_query_records`, `well_get_entity`, or `well_get_schema` — no activity checks, no enrichment, no side reads: the flow calls no tool outside a step's own list, every extra widget-bearing call renders an unwanted card, and the missing-invoice read IS the activity check. Never call `well_invoke_connector_tool`, any `well_create_*` / `well_delete_*`, any `well_update_*` other than `well_update_company`'s categories relationship, or any close, lock, or posting tool. This flow reads, and writes only the session context (pin, queue, periods, picked counterparties, acks) and the counterparty categories the user confirmed.

## The click chain — rules that govern every step

1. **One widget card per turn — never two.** Each list tool's result renders its card (step 6's all-categorized read renders none); a turn renders at most one, never re-calls a tool just to check progress (the cards refresh themselves), and never calls a tool outside its step's own list. `well_list_workspaces` renders the picker on every path, resolved or not, so its turn always ends on that card and step 2's connector read opens the next turn — in step 1 and in every pass of **Several workspaces**. The two cards that follow a choice the user makes on a card — the gap list, then the preview — obey the same rule from opposite ends: the gap-list card ends its turn on the vendor pick, and the preview read opens the next turn.
2. **A card ends the turn.** After rendering any card, end the turn with one short line telling the user what to click (e.g. "Pick your workspace on the card.", "Tick the vendors to chase, then click Continue."). The click writes the choice server-side and prefills a message in the composer; the user sends it with Enter. The missing-invoices card is no exception — it carries the vendor checkboxes and its **Continue** click writes the pick, so step 5 ends its turn on a click pointer like every other step. The preview card ends the last turn on its **Deploy** action, which opens the acquisition link rather than writing a session value.
3. **Resolve the next message, never re-ask.** This rule governs a turn that ended on a choice the user has still to make. A turn that ended only to keep one card per turn — step 1 on a resolved path, a pass boundary of a multi-workspace run — waits on nothing: any message moves the flow on and no wait call runs. Otherwise, in this order: (a) the message is the card's prefill — "Continue in <name>" (multi: "Continue in <first> — then <n2>, <n3>"), "Work on <Month Year> and <Month Year>", or "Continue" — the click already executed server-side; acknowledge in half a sentence and proceed, never re-verifying with an extra tool call what the prefill already states (the one exception is the connect steps' "Continue", where the next step's own read is the verification); (b) any other message — call `well_wait_for_selection` with that step's kind and `timeout_s: 10` once: `selected` (fresh or `already_set`) → proceed; `no_selection_yet` → one line asking to click the card, end the turn. Never re-ask in text something the user already clicked. "Keep for later" is a card's own dismissal, not a choice: nothing is written, so the step it belongs to has not been answered — say the step stays open and stop.
4. **Never ask for the workspace in text.** When the workspace is unresolved, call `well_list_workspaces` so the picker renders at the point of need. A `session.pinned_workspace_id` this conversation established is used silently (rule 8).
5. **Acks gate the connect steps.** Steps 2 and 3 are always user stops — green included. The card's **Continue** (its sent prefill, or a typed continue) is the only way past them.
6. **Pass `workspace_id` explicitly on every `well_*` read from step 2 on.** The pin is a convenience, not the contract. The one exception is step 4's period write: `well_switch_workspace({ periods })` carries no `workspace_id`, so it leaves the pin untouched and applies to the workspace the current pass pinned.
7. **One list or read call per step.** Each step's facts come from its one read; the next step re-reads what it needs itself.
8. **Session state from another conversation is stale.** Desktop-class hosts keep one MCP session per connector, shared across ALL conversations, so at conversation start the `session` values may be another conversation's leftovers. Trust a session value — and a wait-read's `already_set` — only when THIS conversation rendered the matching card and got the click, or took the typed choice. Otherwise ignore it: never mention it ("already pinned" / "already recorded" is forbidden phrasing), never skip a picker over it — the fresh click overwrites the leftover server-side, so downstream session-default reads stay correct.

9. **A vendor pick is trustworthy only for the gap-list card now on screen.** A pick this conversation made is a pick of ONE card's rows. Re-reading the gap list at step 7, and changing the months at step 4, both replace those rows, so the earlier pick no longer names what the user is looking at — and the preview reads the pick from the session rather than from the card. The server drops the pick on both of those boundaries — a month change and a fresh gap-list read each clear it — so after either one, take the tick and the Continue click again on the refreshed card before previewing anything. An `already_set` answer from `well_wait_for_selection` says a pick exists; it never says the pick belongs to the card on screen.

## Workflow

### Step 1 — Workspace

Call `well_list_workspaces()`. Auth error → OAuth/DCR, then retry in the same turn. Zero workspaces → say the account has no workspace yet and stop (`unresolved`).

That read renders the workspace picker, so **step 1 always ends its turn** (rule 1) — on the resolved paths as much as on the unresolved one. What the path decides is which workspace the flow works in and which line closes the turn.

- `session.pinned_workspace_id` set by THIS conversation → use it silently; a non-empty `session.workspace_queue` beside it means that multi-pick is mid-walk (see **Several workspaces**). Set otherwise → a leftover (rule 8): ignore it; a hint or the picker decides.
- Exactly one workspace → use it, no pin call needed.
- A hint matching exactly one workspace (`workspace_id` exact, or case-insensitive on names / `identity.country`) → `well_switch_workspace({ workspace_id })`. A compound hint whose every fragment matches exactly one workspace → `well_switch_workspace({ workspace_ids: [...] })` in the user's order — first pinned, rest queued. Zero or several matches for any fragment → the picker decides; never pick the closest name and never default to `is_primary`.
- Otherwise the picker is the question (the tiles are multi-select): end the turn with one card-pointing line. The **Use** click pins the choice and prefills "Continue in <name>" (multi form for several tiles); resolve the next message by rule 3 — a non-empty queue makes the run multi-workspace, and the click already pinned, so never re-pin. A typed decline ("later") → stop: no workspace, no flow.

On the three resolved paths the workspace needs no click: name the entity in one line, say the next turn checks the connections, and end the turn — no wait call, since nothing is waiting on a selection. Any next message opens step 2; a message naming a different workspace re-runs step 1 instead.

Keep: `workspace_id`, `identity.fiscal_year_start_month`, `base_currency`, and whether a queue exists. Narrate the pinned entity in one line ("Working in **Acme SAS** (FR, EUR).").

### Step 2 — Connections (always a stop)

Call `well_list_connectors({ workspace_id })` once, unscoped — the connect picker card renders with all three kinds, under its generic title and the workspace attribution strip, so name the three kinds in your own lines. Read each `direction: input` row's kind from `data_domains` (`bank` / `accounting` / `invoicing` — never from `category_id` or a display name) and its state in this precedence: `to_configure` / `disabled` → **missing**; `need_reconnect` / `error` / `degraded` / `suspended` → **error** (a reconnect, even if it synced before); `enabled` with `last_successful_sync_at` → **connected**; otherwise → **connecting** (treat as connected, data partial for a few minutes). Per kind: any connected row wins; name an errored row beside a live one.

Say one line per kind — what is connected, what is missing or in error and why it matters for the job — then end the turn: connect from the card's per-row Connect buttons if needed, then click Continue. **Green or not, this step stops until the Continue prefill (or a typed continue) arrives**; resolve the next message by rule 3 — the "Continue" prefill needs no verification call, since step 3's own read verifies. The user connects tools from the card during the stop; whatever they connect shows up in the later steps' own reads. A read that fails twice is a failure (step 9), never a report that nothing is connected — the read said nothing, which is not the same as an empty answer. Keep the per-kind states for the recap; label the recap as narrowed when kinds stayed missing.

### Step 3 — Bank (always a stop)

Call `well_list_connectors({ workspace_id, kind: "bank" })` once — the bank-only card renders, naming the bank scope itself (a card showing non-bank tools means the call was unscoped; redo it scoped). Reduce the bank rows with the same state precedence. **This step always runs and always stops, a connected bank included** — settled bank spend is what the gap list is measured against, so the user sees and confirms the feed. Say one line (connected / first sync running / expired, reconnect from the card / missing), tell the user to click Continue, and end the turn. Resolve the next message by rule 3 — the "Continue" prefill or a typed continue moves the flow on (step 4's own read verifies), and a typed "skip the bank" continues too, with the recap labelled as narrowed by a missing bank feed. Never claim a bank state you did not read.

### Step 4 — Period

- `session.selected_periods` written by THIS conversation, and the user is not changing months → use it silently. Present otherwise → a leftover (rule 8): ignore it; the hint or the picker decides.
- A month hint → resolve it (a bare "March" is the most recent March that has ended; "last month" the last complete month; "this month" legal but incomplete; "Q1" / several months = one multi-month selection, oldest first; a future month is refused) and write it: `well_switch_workspace({ periods: [{ calendar_year, calendar_month }, …] })`.
- No hint → call `well_list_periods({ workspace_id })` (the period picker renders; months multi-select) and end the turn with one card-pointing line. The **Validate** click writes the selection server-side and prefills "Work on <Month Year> and <Month Year>"; resolve the next message by rule 3. When `well_list_periods` is absent, propose the last complete month in one line, and write the confirmed answer with `well_switch_workspace({ periods })`.

For each selected month derive the fiscal coordinate — exactly this, mirroring the Well platform:

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

(1-based months; `fiscal_year_start_month` null → assume 1 and say so; period 13 cannot exist.) `is_complete` per month from the calendar. No activity probe: the flow never reads `transactions` — step 5's gap list is the activity check. An incomplete month is not a stop — say the list keeps moving until the month ends. Narrate the selection in one line with its fiscal coordinates.

When this step changes the months after a pick was already taken, that pick belongs to the months the user left (rule 9). Walk step 5 again for the new months and take the tick and the Continue click on the refreshed card; never preview the new months on the old pick.

### Step 5 — Gap list and vendor pick

Call `well_list_missing_invoices({ workspace_id })` — **no periods argument**; the server reads the clicked selection. An error saying no selection exists → back to step 4. Tool absent from the toolset → `unavailable`: say this Well server does not expose it yet, and never approximate the list from raw transactions. Retry a transient failure once; a second failure → step 9.

The result renders the missing-invoices card — the counterparty rows with their Agent / Connect / Upload badges, grouped by the person the spend is attributed to when that data is there and flat when it is not, each row carrying a checkbox and its own transaction table, and the footer offering **Keep for later** and **Continue**. Say one line only — counterparties per mode and the total — never restating rows the card shows and never re-grouping them. Rules: rows come grouped by the server, never re-aggregate; a null `base_total_amount` is "amount unavailable", never converted or summed; the only total sums non-null base-currency amounts and says how many rows it excludes; quote `period_label` from the result; disclose non-zero `dropped_groups` (internal transfers, unnamed counterparties); always state the coverage line — the list covers the period's **categorized** expense transactions only, `transaction_count` of them examined.

**The card takes the vendor pick.** Its **Continue** click writes the ticked vendors into the session — each as its `company_id` plus its `matched_connector_service_id`, identifiers only, never a display name — and prefills "Continue". In a host that drew no card, ask which vendors to chase, resolve the names against the rows you listed, and write the pick yourself with `well_switch_workspace({ workspace_id, counterparties })`, leaving out any row whose `company_id` is null. A row already carrying a `proof_task_id` is being collected: say so and do not ask for it again.

Keep: `counts` per mode, `total_base_amount`, `transaction_count`, `agent_candidates` (the `mode: agent` rows grouped by `matched_provider_name`, unmatched under `"unknown"`, each group with its counterparties and their `company_id`, summed `tx_count`, summed non-null amount, and the shared `matched_connector_service_id` as `provider_id`), `selection` (the picked `company_id` / `matched_connector_service_id` pairs), `coverage_note`, and `resolution` — `listed`, `empty`, or `unavailable`. Then, in the same turn: step 6's question when thin, step 7's close otherwise.

### Step 6 — Categorization gate (only on a thin list or on request)

**Thin** = `transaction_count` null or 0 — the gap list examined no categorized expense transactions. Run this step only then, or when the user asks — and never silently: say in one line that the gap list rests on `transaction_count` categorized transactions and may be hiding gaps, ask whether to categorize the counterparties behind the rest first, and proceed only on the user's yes — the card it opens saves each pick immediately.

On yes: call `well_list_counterparties({ workspace_id, periods })` once — the periods argument here is explicit; take it from the step 4 selection. A read with nothing to categorize — all rows categorized, or none — renders no card: say so in half a sentence, hand off `resolution: unchanged`, and continue to step 7 **in the same turn** — no card renders, and step 7's close line ends the turn. Otherwise the counterparties card renders with a category select on every row: **the card is the categorization tool** — a pick saves immediately through the card's own write, and the card shows its own saves. Say one coverage line (categorized out of total, biggest uncategorized by amount), one card line (picking a category in a row saves it immediately; say "continue" when done), and **end the turn** — no proposal list, no per-row commentary, no enrichment read, no "shall I apply". Propose categories only when the user explicitly asks, from the rows' names and domains plus the result's `meta.categoryCatalog`, with no extra tool call, writing via `well_update_company` (replace-set) only after a yes. On the user's next message, continue to step 7. Keep `resolution` — `rendered` (the read ran and its result carries the card), `updated` (a confirmed proposal wrote at least one row), `unchanged`, or `unavailable` (`well_list_counterparties` absent — say the step is unavailable, never substitute your own labelling).

### Step 7 — Close the gap-list turn

Every path out of steps 5 and 6 ends its turn here. When step 6 rendered its card, step 7 runs on the user's next message: repeat step 5's one call and replace its hand-off — the refreshed card renders, carrying whatever the user's picks unhid. That re-read replaces the rows any earlier pick was made on, so the pick has to be taken again on this card (rule 9). A second thin result never re-enters step 6 — say coverage did not move enough to change the list. Then end the turn with one close line naming the supplier count, the base-currency total, and what to do on the card: tick the vendors to chase and click Continue. Never call `well_preview_invoice_fetch` in this turn. `empty` with `transaction_count` > 0 stops and celebrates instead — nothing to tick, no pointer.

### Step 8 — Preview what would be fetched

Runs only on the user's next message after step 7's close line, and only with a pick taken on the gap-list card now on screen. Resolve that message by rule 3: the "Continue" prefill means the click already wrote the pick; any other message gets one `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` call, and `no_selection_yet` ends the turn on one line asking for the tick and the click. An `already_set` answer proves a pick exists, not that it belongs to this card (rule 9): when the months changed or the gap list was re-read since it was taken, ask for the tick again on the refreshed card instead of previewing on it. A typed decline ends the run with the recap and no preview.

With the pick in hand: when `well_preview_invoice_fetch` is in the toolset, call it with `{ workspace_id }` — **no periods argument** — and use its `agents`, `upload_rows`, `connect_rows`, `provider_id`, `domain`, `acquisition_url`, `scoped_to_selected_counterparties` and `hints` as returned. **`scoped_to_selected_counterparties: true` means the result IS the picked set** — the server filtered every route to the recorded pick, and naming a period does not widen it — so say the plan covers the picked vendors only. Without that flag the server held no pick, so the result covers the whole period: narrow it from step 5/7's `agent_candidates`, which carry a `company_id` per counterparty where the tool's rows do not, and say the plan covers the whole period when there is nothing to narrow from. When the tool is absent: derive the preview from step 5/7's `agent_candidates`, keeping only the counterparties whose `company_id` is in the pick — matched on that id, never on a name — one group being one agent, and call nothing. No agents, uploads, or connects → `nothing_to_do`: say the picked vendors have nothing to fetch. The preview card and the closing recap share this turn.

Output, in the user's language (read from the conversation, not the workspace country):

- One line per agent, each saying nothing has started — French `Agent prêt pour <provider> — N factures (rien n'est encore lancé)`, English `Agent ready for <provider> — N invoices (nothing started yet)`. Write these lines whatever the host drew: you cannot tell a host that drew the preview card from one that did not (see **How this reaches the user**), so this output never branches on a card being on screen. Keep each line to the provider and its count, and never expand one into the row detail the card carries. Above five agents, name the five largest by invoice count and close with one line covering the rest — a length rule, not a host rule.
- The upload line and the connect line, always both, even at zero. A vendor whose `domain` is null gets its own line: the acquisition link cannot name it, so no run carries it.
- The coverage line: the plan covers categorized expense transactions only.
- The scope line: the picked vendors only when `scoped_to_selected_counterparties` was true, the whole period when the flag was absent and there was nothing to narrow the result from.
- One line on what the link does: confirm the vendors on the card and click Deploy, which opens the acquisition link. Where no card was drawn, give the tool's `acquisition_url`, or the workspace link when the preview carried none, and add no query parameter of your own.
- **The nothing-collected sentence, on its own**: no agent has started, no task is queued, no browser session is open, and Well cannot collect these invoices yet — the acquisition page lists the picked vendors and does nothing else. Counts are transactions missing an invoice, never a yield, a result, or an ETA.

### Step 9 — On failure, redirect instead of guessing

Each step retries a transient call once. On a second failure, never substitute your own read or skip ahead: stop at that step, name it, and give the user `<well-app-base-url>/workspaces/<workspace_id>` to continue in Well. Do not append a query parameter you have not confirmed the app reads.

## Several workspaces

Several workspaces picked is **one Use click**: the card pins the first, leaves the rest in the session's `workspace_queue`, and prefills "Continue in <first> — then <n2>, <n3>" — the sent prefill names the sequence, and no read ever spans two entities. The loop lives here and only here:

- Run steps 2 → 8 in full on the pinned workspace.
- Then read the queue from `well_list_workspaces`' `session.workspace_queue` and call `well_switch_workspace({ workspace_id: <next> })`. That read renders the picker again, so this turn ends there too (rule 1): name the entity the next pass works in and end it. The pass's step 2 opens the following turn, and every call in the pass carries that pass's own `workspace_id`. Repeat until the queue is walked.
- Resolve the period inside each pass: a month hint applies to every pass; a clicked selection belongs to the pass that asked.
- Announce the sequence once when the queue first appears, then recap each entity as its pass ends. Never merge rows, counts, totals, or coverage across two entities. A stop or a skip inside one pass ends that pass only — record it in that entity's recap and start the next pass anyway; step 9's redirect carries the failing pass's own `workspace_id`.

## Routing table

| after | key | value | action |
|---|---|---|---|
| 1 | resolution | unresolved (decline, or no workspace) | **stop** — nothing pinned; offer to resume on a click |
| 1 | card | picker rendered, workspace unresolved | **end turn** — one line: pick on the card, then send the prepared message |
| 1 | resolution | resolved, no queue | **end turn** on the same picker — one line naming the entity; step 2 opens the next turn |
| 1 | resolution | resolved, queue non-empty | same end turn, then run 2→8 on the pin and loop the queue — see **Several workspaces** |
| 2 | card | connect card rendered | **end turn** — one line: connect from the card if needed, then click Continue |
| 2 | ack | "Continue" prefill, typed continue, or a wait-read ack | continue to 3 — **always**, whatever the coverage; carry missing kinds as recap caveats |
| 3 | card | bank card rendered | **end turn** — same one-line pattern |
| 3 | ack | "Continue" prefill, typed continue, or skip | continue to 4 — a bank still missing or in error labels the recap as narrowed |
| 4 | card | period picker rendered | **end turn** — one line: pick the month(s), then send the prepared message |
| 4 | selection | written (click, hint, or session) | continue to 5 |
| 5 / 7 | resolution | `unavailable` | **stop** — the server does not expose the gap-list tool; no categorization, no preview |
| 5 / 7 | resolution | `empty`, `transaction_count` > 0 | **stop and celebrate** — every categorized expense transaction has its invoice; recap without a preview |
| 5 | resolution | `empty` or `listed`, thin | go to 6 (ask first) |
| 5 | resolution | `listed`, not thin | continue to 7 in the same turn |
| 6 | resolution | `rendered` or `updated` | end turn at the card line; step 7 re-reads on the user's next message |
| 6 | read | nothing to categorize (no card renders) | half a sentence, `unchanged`, **continue to 7 in the same turn** |
| 6 | resolution | `unchanged` (other reasons) / `unavailable` | keep the step 5 list, say why coverage did not move, go to 7 |
| 7 | resolution | thin again | say coverage did not move enough; the tick-and-Continue line still ends the turn |
| 7 | close | close line sent | **end turn** — step 8 runs only on the user's next message |
| 8 | selection | "Continue" prefill, or a wait-read pick on the card now on screen | preview the picked vendors |
| 8 | selection | `already_set` pick taken before a month change or a gap-list re-read | **end turn** — one line asking for a fresh tick on the refreshed card; no preview (rule 9) |
| 8 | selection | `no_selection_yet`, or Keep for later | **end turn** — one line asking for the tick and the Continue click; no preview |
| 8 | reply | typed decline | recap without a preview |
| 8 | resolution | `previewed` / `nothing_to_do` | recap; on `previewed` end the turn on the card's Deploy line; on `nothing_to_do` say the picked vendors have nothing to fetch |

## Output requirements

Every step reports itself in one to three plain sentences as it runs — no yaml, no JSON, no fenced code block, no table of rows a card already shows; the hand-off facts are reasoning state carried in conversation, never printed. Close the run with one recap, in this order — and on a multi-workspace run, one recap per entity, each opening with the entity's name, no line spanning two:

- **Workspace and period** — the pinned workspace (country, base currency when set) and the period label with its fiscal coordinates and whether the months are complete.
- **Coverage** — which of bank / accounting / invoicing were connected at their cards, the bank state the bank step ended on, and that the gap list covers categorized expense transactions only. Label a narrowed picture as narrowed, and say plainly when a missing bank feed is what narrowed it.
- **Missing invoices** — counterparty counts per mode (agent / connect / upload), the base-currency total over the rows that carry an amount, and how many vendors the user picked to chase.
- **Categorization delta** — only when step 6 ran: the coverage its one read showed, and whether the flow left the picking to the user. Count changes only for a proposal the user confirmed — the card's own saves are never re-read, so claim no after figure for them. When the step was unavailable, or everything was already categorized, say that in one line instead.
- **Preview** — the per-agent lines for the picked vendors (the five-largest form above five agents), plus the upload line, the connect line, the scope line, and the line for any vendor the acquisition link cannot name.
- **The nothing-collected sentence**, on its own, saying that Well cannot collect these invoices yet and that the acquisition page only lists the picked vendors.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- One closing line: connecting the providers behind the `connect` rows turns manual uploads into gaps an agent could fetch once Well can collect them.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew a card from one that did not — which
is why every step's card-pointing line has to read sensibly even where no card appeared.
Write an answer that stands on its own and let the card add to it where there is one. Do
not compose a second rendering of rows the tool already returned; where a visual the tool
does not draw genuinely reads better and the `well-design-system` skill is available, use
it.

## Quality checks

Before finishing, verify:

- If no `well_*` tool was in the toolset, the user was pointed at `https://api.wellapp.ai/v1/mcp` and the flow stopped there.
- Every step ran in order; each route came from the routing table's key; no step was skipped — the bank step included, whatever step 2 reported.
- No turn rendered two widget cards; every card ended its turn with one card-pointing line — the missing-invoices card included — and no wait call ran before or in the card's turn; every next message was resolved by rule 3 — a prefill taken at its word with no extra verification call, any other message getting one `well_wait_for_selection` call with `timeout_s: 10` — and nothing was re-asked in text.
- Every `well_list_workspaces` turn ended on the workspace picker — step 1 on a resolved path included, and each pass boundary of a multi-workspace run — so no connector read shared a turn with it.
- No "which workspace?" or "which month?" question was asked in text where a card renders; a session pin or selection was reused only when this conversation established it — a leftover was ignored, unmentioned, its picker rendered anyway (rule 8).
- Steps 2 and 3 each stopped for their ack — green coverage and a connected bank included — and moved on only on the "Continue" prefill, a typed continue, or a wait-read ack.
- `well_list_missing_invoices` and `well_preview_invoice_fetch` were called with `workspace_id` only — no periods argument — never in the same turn as each other (the gap-list turn ended on step 7's tick-and-Continue line), and a no-selection error went back to step 4, never to a guessed month.
- The vendor pick was in hand before step 8 previewed anything: the card's "Continue" prefill, or one `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` call, or the flow's own write on the text-only path. The pick travels as `company_id` and `matched_connector_service_id`; no vendor name was written into it, and no preview stood in for a pick that never came.
- The pick belonged to the gap-list card on screen (rule 9): a pick taken before a month change or before step 7's re-read was taken again, never carried into the preview.
- Step 6 ran only on a thin list or on request, only after an explicit yes, wrote only rows the user confirmed, and the list was re-read exactly once after step 6's card rendered. An all-categorized read was stated in half a sentence and the flow continued to step 7's close line in the same turn.
- Step 8 previewed only: every agent line said nothing has started, the upload and connect lines appeared even at zero, the deploy line and the nothing-collected sentence were both present, and no collection, yield, or ETA was claimed — in the chat or in the Well app. Its wording came from the agent count alone — no sentence assumed, or denied, that a card was on screen — and no acquisition link was built by hand.
- The scope line came from `scoped_to_selected_counterparties`: the picked vendors only when it was true, the whole period when it was absent and no `agent_candidates` narrowed the result.
- On failure the flow stopped at that step, named it, gave the workspace link, and did not re-read the same data itself or skip ahead.
- On a multi-workspace run, the queue came from the session block, each pass re-pinned with `well_switch_workspace`, every call carried that pass's `workspace_id`, and each entity got its own recap with nothing merged.
- No forbidden tool was called — `well_query_records`, `well_get_entity`, and `well_get_schema` included — no yaml / JSON / fenced block was printed, and each list or read tool ran once per step.

## Examples

**Happy path.** "Fetch the invoices I'm missing for March." One workspace, Qonto + Pennylane connected. Step 1 reads the one workspace, names it, and ends its turn on the picker; the next message opens step 2. Steps 2 and 3 each render their card, end the turn, and move on when "Continue" arrives. Step 4 writes March 2026 from the hint. Step 5 reads 12 counterparties, `transaction_count: 41`, not thin; step 7 ends the turn asking the user to tick the vendors to chase and click Continue. The "Continue" prefill arrives with seven vendors picked, so step 8 previews those seven — the preview carries `scoped_to_selected_counterparties: true`, so it already covers them only — ends its turn on the card's Deploy line, and closes with the recap and the nothing-collected sentence.

**A stale session.** A fresh conversation opens with a pin and `selected_periods` set — leftovers (rule 8): ignore both silently; the pickers render at steps 1 and 4, nothing says "already pinned".

**Not the prefill.** At the bank card the next message is "keep going": one wait-read (`kind: "bank_ack"`) — `already_set: true` → resume at step 4; `no_selection_yet` → a line pointing at Continue ends the turn.

**Two entities.** "March across FR and US" → `well_switch_workspace({ workspace_ids: [fr, us] })` pins FR, queues US, and step 1 ends its turn naming the sequence. Run 2→8, recap. Read `session.workspace_queue`, re-pin, end that turn on the picker, then run 2→8 again — `empty` with `transaction_count: 23` celebrates at step 5. Two recaps, nothing added together.

**Thin list.** `empty`, `transaction_count: 0` → say the list rests on 0 categorized transactions, ask whether to categorize first; on yes, step 6's card, one re-read at step 7, and step 8 previews once the vendor pick arrives from the refreshed card.

**No pick yet.** At the missing-invoices card the next message is "what now?": one wait-read (`kind: "counterparties"`) — `selected` → step 8 previews the picked vendors; `no_selection_yet` → one line asking for the tick and the Continue click ends the turn. "Keep for later" writes nothing: say the list stays available and stop.

**A pick from the month before.** The user picked five vendors for March, then says "actually, do April": step 4 writes April, step 5 renders April's card, and the March pick is not April's (rule 9). Ask for the tick and the Continue click on the April card, and preview nothing until it arrives — a wait-read here answers `no_selection_yet`, because the month change already dropped the March pick.

**Text-only host.** No card is drawn at step 5, so the rows are listed in text and the flow asks which vendors to chase. The user names three; match them against the listed rows, write the pick with `well_switch_workspace({ workspace_id, counterparties })` from each row's `company_id` and `matched_connector_service_id`, then preview those three at step 8 and give the acquisition link instead of a Deploy pointer.

**Tool unavailable.** `well_list_missing_invoices` absent → step 5 is `unavailable`: say so; never approximate from raw transactions; stop and recap workspace, period, and coverage.
