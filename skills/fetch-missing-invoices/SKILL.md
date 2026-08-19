---
name: fetch-missing-invoices
description: Walk Well's whole missing-invoice flow end to end — pin the workspace, confirm the bank / accounting / invoicing connections, fix the months, list the settled spend that still has no supplier invoice, raise categorization coverage when the list is thin, and preview which invoice-fetching agents would run. The last step is a dry run and launches nothing. Use when the user says "fetch the invoices I'm missing", "what am I missing for March", "chase my missing supplier invoices before I close the books", "run the missing-invoice flow", or "go get those invoices", or when a flow needs every brick walked in order rather than one at a time. The flow is click-chained — the widget cards' Use / Validate / Continue clicks drive it forward. Do not use to actually launch a collection, to compute a spend total, to close or post a period, or to run one brick on its own.
---

# Fetch Missing Invoices with Well

## Purpose

Run every step of Well's missing-invoice flow in one pass, in a fixed order: workspace → connections → bank → period → gap list → (categorization, on a thin list and a yes, → gap list again) → agent preview. The flow is **click-chained**: each picker or connect card the flow renders is answered by the user's click, which writes the choice server-side — no chat message arrives from a card — and the flow reads the click back with `well_wait_for_selection`. Every stop is explicit, the last step previews without launching, and a multi-workspace pick loops the whole walk one entity at a time.

This skill is **self-contained**: each step below carries everything the flow needs. Each step also exists as its own skill (`define-workspace`, `connect-tools`, `connect-bank`, `define-period`, `show-missing-invoices`, `categorize-counterparties`, `deploy-agents`) for solo use; this flow does not read them.

## When to use this skill

- The user asks Well to find and go after the invoices they are missing ("fetch the invoices I'm missing for March", "go get those receipts", "chase my missing supplier invoices").
- The user wants the whole month-end sweep — what is missing, what Well can fetch, what they must upload — instead of asking brick by brick, or is preparing a close and wants the gaps closed.

## When not to use this skill

- The user wants exactly one step on its own — use that step's own skill.
- The user wants a collection actually run, a downloaded document, or the status of a running agent. No version of this flow launches anything; point them to the Well app.
- The user wants a figure (`expense-breakdown`, `cash-position`, `bills-due`, `accounts-receivable-aging`), ledger rows with no attachment (`missing-receipts` — this flow starts from settled bank spend), or a period closed, locked, or posted (the Well app).

## Inputs

All optional; never guess a workspace or a month.

- A workspace hint — a `workspace_id`, a name, "my FR entity", or several ("FR and US", "both my companies").
- A month hint — "March", "last month", "2026-03", "Q1" (several months are a legal selection).
- A bank the user named — "Qonto", "my BNP account".
- A `purpose` line, default "to fetch the invoices missing for that month", used in the card-pointing lines.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). **Check first that `well_*` tools are in your toolset at all.** If none are, tell the user to add the server at that URL, say the flow cannot start without it, and stop — do not call an undefined tool and do not estimate anything.

The flow's tools, each owned by the step that calls it:

- `well_list_workspaces` — the workspace read. Returns `workspaces[]` (`workspace_id`, `workspace_name`, `is_primary`, `identity` with `country`, `base_currency`, `fiscal_year_start_month`) plus `session: { pinned_workspace_id, workspace_queue, selected_periods }` — the server-held context the cards' clicks write. Renders the workspace picker card (multi-select tiles).
- `well_switch_workspace` — the session write. Accepts `workspace_id`, `workspace_ids` (first = pin, rest = queue), `periods` (`[{ calendar_year, calendar_month }]`), and `ack` (`"connectors"` | `"bank"`). The widget cards call it on their **Use** / **Validate** / **Continue** clicks; the flow calls it itself only for typed answers, matched hints, and the multi-workspace re-pin between passes.
- `well_wait_for_selection({ kind, timeout_s? })` — the click read. `kind` is `"workspace"`, `"periods"`, `"connect_ack"`, or `"bank_ack"`. Blocks until the matching click lands and returns `{ status: "selected", selection }` — workspace: `{ workspace_id, workspace_queue }`; periods: `{ periods }`; acks: `{ acknowledged: true }` — or `{ status: "no_selection_yet" }` on timeout (about 45 seconds), a normal result, not an error.
- `well_list_connectors` — the ONLY tool the two connection steps call (never `well_query_records` on `workspace_connectors` — that renders a records table where the connect card belongs). Unscoped at step 2, `kind: "bank"` at step 3.
- `well_list_periods` — the period picker read, when present.
- `well_list_missing_invoices` and `well_preview_invoice_fetch`, when present — both called with `workspace_id` only, **no periods argument**: the server uses the clicked selection, and an error comes back only when no selection exists yet.
- `well_list_counterparties` — the categorization read; its result's `meta.categoryCatalog` carries the company-category catalog (never fetch it any other way). `well_update_company` with `relationships.categories` — the one write, user-confirmed only.
- `well_get_schema` + `well_query_records` on `transactions` only — the period-activity probe (never on `categories` or `workspace_connectors`).
- Well's OAuth / DCR flow when no Well connection exists yet — the moment it returns, retry the failed call in the same turn.

Never call `well_invoke_connector_tool`, any `well_create_*` / `well_delete_*`, any `well_update_*` other than `well_update_company`'s categories relationship, or any close, lock, or posting tool. This flow reads, and writes only the session context (pin, queue, periods, acks) and the counterparty categories the user confirmed.

## The click chain — rules that govern every step

1. **One widget card per turn — never two.** Each list tool's result renders its card; a turn renders at most one and never re-calls a tool just to check progress (the cards refresh themselves).
2. **Wait in the same turn.** After rendering a picker or connect card, call `well_wait_for_selection` with that step's kind in the same turn. On `selected`: narrate the pick or the click in one short sentence and continue immediately. On `no_selection_yet`: end the turn with one line — click the card, then say continue — and nothing else.
3. **Resync, never re-ask.** On the user's next message after such a stop, re-call the wait once or read `well_list_workspaces`' `session` block; continue on what the click wrote. Never re-ask in text something the user already clicked, and never wait for a card to "send a message" — cards print no chat text, ever.
4. **Never ask for the workspace in text.** When the workspace is unresolved, call `well_list_workspaces` so the picker renders at the point of need, then wait. When `session.pinned_workspace_id` is already set, use it silently.
5. **Acks gate the connect steps.** Steps 2 and 3 are always user stops — green included. The card's **Continue** click (or the user's typed continue) is the only way past them.
6. **Pass `workspace_id` explicitly on every `well_*` call from step 2 on.** The pin is a convenience, not the contract.
7. **One list or read call per step.** Each step's facts come from its one read; the next step re-reads what it needs itself.

## Workflow

### Step 1 — Workspace

Call `well_list_workspaces()`. Auth error → OAuth/DCR, then retry in the same turn. Zero workspaces → say the account has no workspace yet and stop (`unresolved`).

- `session.pinned_workspace_id` set → use it silently; a non-empty `session.workspace_queue` beside it means a multi-pick is mid-walk (see **Several workspaces**).
- Exactly one workspace → use it, no pin call needed.
- A hint matching exactly one workspace (`workspace_id` exact, or case-insensitive on names / `identity.country`) → `well_switch_workspace({ workspace_id })`. A compound hint whose every fragment matches exactly one workspace → `well_switch_workspace({ workspace_ids: [...] })` in the user's order — first pinned, rest queued. Zero or several matches for any fragment → the picker decides; never pick the closest name and never default to `is_primary`.
- Otherwise the picker is on screen (the tiles are multi-select): wait on `kind: "workspace"`. `selected` → the click already pinned `selection.workspace_id` (never re-pin it); a non-empty `selection.workspace_queue` makes the run multi-workspace. Timeout → one line, end turn. A typed decline ("later") → stop: no workspace, no flow.

Keep: `workspace_id`, `identity.fiscal_year_start_month`, `base_currency`, and whether a queue exists. Narrate the pinned entity in one line ("Working in **Acme SAS** (FR, EUR).").

### Step 2 — Connections (always a stop)

Call `well_list_connectors({ workspace_id })` once, unscoped — the connect picker card renders with all three kinds. Read each `direction: input` row's kind from `data_domains` (`bank` / `accounting` / `invoicing` — never from `category_id` or a display name) and its state in this precedence: `to_configure` / `disabled` → **missing**; `need_reconnect` / `error` / `degraded` / `suspended` → **error** (a reconnect, even if it synced before); `enabled` with `last_successful_sync_at` → **connected**; otherwise → **connecting** (treat as connected, data partial for a few minutes). Per kind: any connected row wins; name an errored row beside a live one.

Say one line per kind — what is connected, what is missing or in error and why it matters for the job — then wait on `kind: "connect_ack"` in the same turn. **Green or not, this step stops until the card's Continue click (or a typed continue) arrives.** The user connects tools from the card during the stop; whatever they connect shows up in the later steps' own reads. A read that fails twice is a failure (step 9), never `coverage: none`. Keep the per-kind states for the recap; label the recap as narrowed when kinds stayed missing.

### Step 3 — Bank (always a stop)

Call `well_list_connectors({ workspace_id, kind: "bank" })` once — the bank-only card renders (a card showing non-bank tools means the call was unscoped; redo it scoped). Reduce the bank rows with the same state precedence. **This step always runs and always stops, a connected bank included** — settled bank spend is what the gap list is measured against, so the user sees and confirms the feed. Say one line (connected / first sync running / expired, reconnect from the card / missing), then wait on `kind: "bank_ack"` in the same turn. Continue only on the ack or a typed continue; a typed "skip the bank" continues too, with the recap labelled as narrowed by a missing bank feed. Never claim a bank state you did not read.

### Step 4 — Period

- `session.selected_periods` already set and the user is not changing months → use it silently.
- A month hint → resolve it (a bare "March" is the most recent March that has ended; "last month" the last complete month; "this month" legal but incomplete; "Q1" / several months = one multi-month selection, oldest first; a future month is refused) and write it: `well_switch_workspace({ periods: [{ calendar_year, calendar_month }, …] })`.
- No hint → call `well_list_periods({ workspace_id })` (the period picker renders; months multi-select), wait on `kind: "periods"`. `selected` → `selection.periods` is already written server-side. Timeout → one line, end turn. When `well_list_periods` is absent, propose the last complete month in one line, and write the confirmed answer with `well_switch_workspace({ periods })`.

For each selected month derive the fiscal coordinate — exactly this, mirroring the Well platform:

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

(1-based months; `fiscal_year_start_month` null → assume 1 and say so; period 13 cannot exist.) `is_complete` per month from the calendar. Probe activity once over the whole selection: `well_get_schema({ root: "transactions" })` once per session, then one `well_query_records` on `transactions`, `limit: 1`, ranging `executed_at` (that field alone — `booking_date` belongs to a different month on the rows where they disagree) from the earliest first day to the latest last day. Rows → `has_activity: true`; none → `false`; unreadable or no bank → `unknown`, never `false`. An incomplete month is not a stop — say the list keeps moving until the month ends. Narrate the selection in one line with its fiscal coordinates.

### Step 5 — Gap list

Call `well_list_missing_invoices({ workspace_id })` — **no periods argument**; the server reads the clicked selection. An error saying no selection exists → back to step 4. Tool absent from the toolset → `unavailable`: say this Well server does not expose it yet, and never approximate the list from raw transactions — that measures something else. Retry a transient failure once; a second failure → step 9.

The result renders the missing-invoices card (one row per counterparty with its Agent / Connect / Upload badge). Say one line only — counterparties per mode and the total — never restating rows the card shows. Rules: rows come grouped by the server, never re-aggregate; a null `base_total_amount` is "amount unavailable", never converted or summed; the only total sums non-null base-currency amounts and says how many rows it excludes; quote `period_label` from the result; disclose non-zero `dropped_groups` (internal transfers, unnamed counterparties); always state the coverage line — the list covers the period's **categorized** expense transactions only, `transaction_count` of them examined.

Keep: `counts` per mode, `total_base_amount`, `transaction_count`, `agent_candidates` (the `mode: agent` rows grouped by `matched_provider_name`, unmatched under `"unknown"`, each group with its counterparties, summed `tx_count`, summed non-null amount, and the shared `matched_connector_service_id` as `provider_id`), `coverage_note`, and `resolution` — `listed`, `empty`, or `unavailable`.

### Step 6 — Categorization gate (only on a thin list or on request)

**Thin** = `transaction_count` null or 0 while step 4's `has_activity` is `true`. Run this step only then, or when the user asks — and never silently: say in one line that the gap list rests on `transaction_count` categorized transactions while the month has bank activity, ask whether to categorize the counterparties behind the rest first, and proceed only on the user's yes, because it writes. When `has_activity` is `false` or `unknown`, the thin test never fires — skip to step 8 and say the month's bank activity could not be confirmed.

On yes: call `well_list_counterparties({ workspace_id, periods })` once — the periods argument here is explicit; take it from the step 4 selection (resync from `session.selected_periods` if unsure). The counterparties card renders; say one coverage line (categorized out of total, biggest uncategorized by amount). Read the catalog from the same result's `meta.categoryCatalog` — never `well_query_records`, and an empty catalog ends the step in one sentence pointing at the Well app. Propose in batches of at most 20, biggest spend first: name, spend, one catalog category by name — no invented category, no guess for an unplaceable row. **Stop for an explicit yes per batch; no write before it.** Then one `well_update_company({ workspace_id, company_id, relationships: { categories: [<category_id>] } })` per confirmed company — the array is a replace-set (to add, send the existing ids plus the new one); never retry a failed write silently. Honor partial yeses exactly; record declines under `skipped_by_user`. After the last batch, re-read the list once with the same scope and report coverage before → after as the re-read returns it. Keep `coverage_before`, `coverage_after`, `changed`, and `resolution` — `updated`, `unchanged`, `read_only` (the server's `well_update_company` has no categories relationship — detect from its declared input before proposing), or `unavailable` (`well_list_counterparties` absent — say the step is unavailable, never substitute your own labelling).

### Step 7 — Re-read the gap list, once

Only after step 6 ended `updated`: repeat step 5's one call and replace its hand-off. A second thin result never re-enters step 6 — go to step 8 and say coverage did not move enough to change the list.

### Step 8 — Preview the agents

When `well_preview_invoice_fetch` is in the toolset: call it with `{ workspace_id }` — **no periods argument** — and use its `agents`, `upload_rows`, `connect_rows`, `provider_id`, and `hints` as returned. When it is absent (normal today, not a fault): derive the same preview from step 5/7's `agent_candidates` — one group is one agent — and call nothing. No agents, uploads, or connects → `nothing_to_do`: say the period has nothing to fetch.

Output, in the user's language (read from the conversation, not the workspace country):

- One line per agent with the demo-mode suffix — French `Agent lancé pour <provider> — N factures (mode démo : rien n'est déclenché)`, English `Agent launched for <provider> — N invoices (demo mode: nothing is actually started)`. When the tool ran and its `AgentLaunchedCard`s are on screen (Preview badge), one summary line instead — never restate them.
- The upload line and the connect line, always both, even at zero.
- The coverage line: the plan covers categorized expense transactions only.
- **The no-launch sentence, on its own**: no agent was launched, no task was queued, no browser session was opened, and nothing happens after this answer. Counts are transactions missing an invoice, never a yield, a result, or an ETA.

### Step 9 — On failure, redirect instead of guessing

Each step retries a transient call once. On a second failure, do not substitute your own read of the same data and do not skip ahead: stop at that step, name it, and give the user `<well-app-base-url>/workspaces/<workspace_id>` to continue in Well. Do not append a query parameter you have not confirmed the app reads.

## Several workspaces

Several workspaces picked is **one Use click**: the card pins the first and leaves the rest in the session's `workspace_queue` — there is no chat line announcing the list, and no read ever spans two entities. The loop lives here and only here:

- Run steps 2 → 8 in full on the pinned workspace.
- Then read the queue from `well_list_workspaces`' `session.workspace_queue`, call `well_switch_workspace({ workspace_id: <next> })`, and run steps 2 → 8 again — every call carrying that pass's own `workspace_id`. Repeat until the queue is walked.
- Resolve the period inside each pass: a month hint applies to every pass; a clicked selection belongs to the pass that asked.
- Announce the sequence once when the queue first appears, then recap each entity as its pass ends. Never merge rows, counts, totals, or coverage across two entities. A stop or a skip inside one pass ends that pass only — record it in that entity's recap and start the next pass anyway; step 9's redirect carries the failing pass's own `workspace_id`.

## Routing table

| after | key | value | action |
|---|---|---|---|
| 1 | resolution | unresolved (decline, or no workspace) | **stop** — nothing pinned; offer to resume on a click |
| 1 | wait | `no_selection_yet` | **end turn** — one line: pick on the card, then say continue; resync on the next message |
| 1 | resolution | resolved, no queue | continue to 2 |
| 1 | resolution | resolved, queue non-empty | run 2→8 on the pin, then loop the queue — see **Several workspaces** |
| 2 | ack | `connect_ack` received (or typed continue) | continue to 3 — **always**, whatever the coverage; carry missing kinds as recap caveats |
| 2 | wait | `no_selection_yet` | **end turn** — one line: connect from the card if needed, click Continue, or say continue |
| 3 | ack | `bank_ack` received (or typed continue / skip) | continue to 4 — a bank still missing or in error labels the recap as narrowed |
| 3 | wait | `no_selection_yet` | **end turn** — same one-line pattern |
| 4 | selection | written (click, hint, or session) | continue to 5 |
| 4 | wait | `no_selection_yet` | **end turn** — one line: pick the month(s), then say continue |
| 5 / 7 | resolution | `unavailable` | **stop** — the server does not expose the gap-list tool; no categorization, no preview |
| 5 / 7 | resolution | `empty`, `transaction_count` > 0 | **stop and celebrate** — every categorized expense transaction has its invoice; recap without a preview |
| 5 | resolution | `empty` or `listed`, thin, `has_activity: true` | go to 6 (ask first) |
| 5 | resolution | `listed`, not thin | skip to 8 |
| 5 | has_activity | `false` / `unknown` | the thin test never fires — go to 8, say the month's activity could not be confirmed |
| 6 | resolution | `updated` | re-read once at 7 |
| 6 | resolution | `unchanged` / `read_only` / `unavailable` | keep the step 5 list, say why coverage did not move, go to 8 |
| 7 | resolution | thin again | go to 8, say coverage did not move enough |
| 8 | resolution | `previewed` / `nothing_to_do` | recap; on `nothing_to_do` say the period has nothing to fetch |

## Output requirements

Every step reports itself in one to three plain sentences as it runs — no yaml, no JSON, no fenced code block, no table of rows a card already shows; the hand-off facts are reasoning state carried in conversation, never printed. Close the run with one recap, in this order — and on a multi-workspace run, one recap per entity, each opening with the entity's name, no line spanning two:

- **Workspace and period** — the pinned workspace (country, base currency when set) and the period label with its fiscal coordinates and whether the months are complete.
- **Coverage** — which of bank / accounting / invoicing were connected at their cards, the bank state the bank step ended on, and that the gap list covers categorized expense transactions only. Label a narrowed picture as narrowed, and say plainly when a missing bank feed is what narrowed it.
- **Missing invoices** — counterparty counts per mode (agent / connect / upload) and the base-currency total over the rows that carry an amount.
- **Categorization delta** — only when step 6 ran: coverage before → after and how many changes the user confirmed, or one line that the step was unavailable.
- **Preview** — the per-agent demo-mode lines (or one summary line when the cards are on screen), plus the upload line and the connect line.
- **The no-launch sentence**, on its own.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it.
- One closing line: connecting the providers behind the `connect` rows turns manual uploads into gaps Well can fetch itself, and the Well app runs the real fetch.

## Quality checks

Before finishing, verify:

- If no `well_*` tool was in the toolset, the user was pointed at `https://api.wellapp.ai/v1/mcp` and the flow stopped there.
- Every step ran in order; each route came from the routing table's key; no step was skipped — the bank step included, whatever step 2 reported.
- No turn rendered two widget cards; every picker or connect card was followed by `well_wait_for_selection` with the right kind in the same turn; every `no_selection_yet` ended the turn with one click-then-continue line; every next message resynced (wait re-called once, or the session block) instead of re-asking.
- No "which workspace?" or "which month?" question was asked in text where a card renders; a session pin or selection already set was used silently.
- Steps 2 and 3 each stopped for their ack — green coverage and a connected bank included — and moved on only on the click or a typed continue.
- `well_list_missing_invoices` and `well_preview_invoice_fetch` were called with `workspace_id` only — no periods argument — and a no-selection error went back to step 4, never to a guessed month.
- Step 6 ran only on a thin list with `has_activity: true` or on request, only after an explicit yes, wrote only user-confirmed batches, and the list was re-read exactly once after `updated`.
- Step 8 previewed only: demo-mode suffix on every agent line, upload and connect lines even at zero, the no-launch sentence present, no yield or ETA claimed.
- On failure the flow stopped at that step, named it, gave the workspace link, and did not re-read the same data itself or skip ahead.
- On a multi-workspace run, the queue came from the session block, each pass re-pinned with `well_switch_workspace`, every call carried that pass's `workspace_id`, and each entity got its own recap with nothing merged.
- No forbidden tool was called, no yaml / JSON / fenced block was printed, and each list or read tool ran once per step.

## Examples

**Happy path, one turn per click.** "Fetch the invoices I'm missing for March." One workspace; Qonto and Pennylane connected. → Step 1 resolves silently. Step 2 renders the connect card, says coverage in one line, waits on `connect_ack`; the user clicks Continue within the wait — move on in one sentence. Step 3 renders the bank card ("Bank: connected — Qonto"), waits on `bank_ack`; Continue clicked — move on. Step 4 writes March 2026 from the hint via `well_switch_workspace({ periods })`. Step 5 calls `well_list_missing_invoices({ workspace_id })` — 12 counterparties, `transaction_count: 41`, not thin. Step 8 previews, recap, no-launch sentence.

**Timeout and resync.** Same flow, but the user walks away at the bank card: the wait returns `no_selection_yet`. End the turn: "Connect or confirm your bank on the card, then say continue." Next message "continue": re-call `well_wait_for_selection({ kind: "bank_ack" })` once — the ack is there — and resume at step 4 without re-asking anything.

**Two entities, one click.** "What am I missing for March across FR and US?" → the compound hint matches both: `well_switch_workspace({ workspace_ids: [fr, us] })` pins Acme SAS and queues Acme Inc. Announce the sequence once. Run 2→8 on Acme SAS (each connect step stopping for its ack), recap it. Then read `session.workspace_queue`, `well_switch_workspace({ workspace_id: us })`, run 2→8 again — March comes back `empty` with `transaction_count: 23`, so that pass celebrates at step 5 and gets its own recap without a preview. Two recaps, nothing added together.

**Thin list.** March returns `empty` with `transaction_count: 0` while `has_activity` is `true`. → Say the gap list rests on 0 categorized transactions while the month has bank activity, and ask whether to categorize first. On yes, run step 6's batches with explicit confirmation, re-read once at step 7, then preview at step 8.

**Tool unavailable.** `well_list_missing_invoices` is not in the toolset. → Steps 1-4 run normally; step 5 is `unavailable`. Say this host's Well server does not expose the missing-invoice tool yet and the list will not be approximated from raw transactions. Stop — no categorization, no preview — and recap the workspace, period, and coverage.
