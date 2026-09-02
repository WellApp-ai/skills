---
name: fetch-missing-invoices
requires: [define-workspace, define-period, connect-bank, categorize-counterparties, show-missing-invoices, connect-tools, deploy-agents]
description: Walk Well's whole missing-invoice flow end to end — pin the workspace, fix the months, get the bank feed in when a selected month holds no bank transaction, categorize the counterparties carrying no industry label, list the settled spend that still has no supplier invoice, take the user's pick of the vendors to chase, connect the services Well holds a connector for, and preview what Well would fetch for that pick. Nothing runs from the session. The last card hands the picked portals to the Well app's collect page, where the browser extension collects from them once the user starts it there. Use when the user says "fetch the invoices I'm missing", "what am I missing for March", "chase my missing supplier invoices before I close", or "run the missing-invoice flow", or when a flow needs every brick walked in order. The flow is click-chained — the cards' Use / Validate / Continue clicks drive it. Do not use to collect from the session, to compute a spend total, to close a period, or to run one brick alone.
---

# Fetch Missing Invoices with Well

## Purpose

Run every step of Well's missing-invoice flow, in a fixed order: workspace → period → bank (when a selected month holds no bank transaction) → counterparty categorization (when the months hold uncategorized counterparties) → gap list and vendor pick → connect step (when the pick names a connector) → agent preview. The flow is **click-chained**: each card the flow renders ends the turn, and where the card carries the choice, the user's click writes it server-side AND prefills a message in their composer, which they send to move the flow on. A card whose choice is already made ends the turn all the same, and any message moves the flow on. The last step starts nothing from the session: its card opens the collect link, and the collect page in Well hands the picked portals to the Well browser extension once the user starts them there.

This skill **composes**: all seven of its steps are atomic Well skills, one brick per step, and this file runs them in a fixed order rather than reimplementing what they do. Each brick owns its own tool calls, its own card and its own rules; what lives here is the ORDER, the turn boundaries between the bricks, and the one recap that spans them (see **Composed skills** under Tooling for the roster). A brick's own rules are not restated here — this file names the fact that matters to the order and points at the brick. Five steps additionally carry an **inline fallback** for the standalone-install case where that brick is absent, never a second source of truth beside it: read `references/standalone-fallbacks.md` for the full procedure of every one.

## When to use this skill

- The user asks Well to find and go after the invoices they are missing ("fetch the invoices I'm missing for March", "go get those receipts", "chase my missing supplier invoices").
- The user wants the whole month-end sweep — what is missing, what Well can fetch, what they must upload — instead of asking brick by brick, or is preparing a close and wants the gaps closed.

## When not to use this skill

- The user wants exactly one step on its own — use that step's own skill.
- The user wants a downloaded document or the status of a running collection. This flow starts nothing itself and receives nothing back: its last card opens the collect link, and the browser extension's side panel is where a run is reported. Point the user there rather than following a run from here.
- The user wants a figure (`cost-structure`, `cash-position`, `bills-due`, `accounts-receivable-aging`), ledger rows with no attachment (`missing-receipts` — this flow starts from settled bank spend), or a period closed, locked, or posted (the Well app).

## Inputs

All optional; never guess a workspace or a month.

- A workspace hint — a `workspace_id`, a name, "my FR entity", or several ("FR and US", "both my companies").
- A month hint — "March", "last month", "2026-03", "Q1" (several months are a legal selection).
- A bank the user named — "Qonto", "my BNP account".
- A `purpose` line, default "to fetch the invoices missing for that month", used in the card-pointing lines.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). **Check first that `well_*` tools are in your toolset at all.** If none are, tell the user to add the server at that URL and stop — the flow cannot start without it; never call an undefined tool or estimate anything.

**Composed skills, and the tool each one calls.** Seven atomic Well skills own the seven steps of this flow, one brick per step — invoke each one in its turn, don't reimplement it. Steps 2, 4, 5, 6 and 7 each carry an inline fallback for a standalone install where that brick is absent (see `references/standalone-fallbacks.md`); step 1 has none (the flow stops without it), and step 3 has none but `connect-tools` scoped to `kinds: [bank]` covers it.

- `define-workspace` (step 1) → `well_list_workspaces`.
- `define-period` (step 2) → `well_list_periods` on the fallback path.
- `connect-bank` (step 3, bank-only, only when a selected month holds no bank transaction) → `well_list_connectors({ kind: "bank" })`.
- `categorize-counterparties` (step 4) → `well_list_counterparties({ workspace_id, periods })`; writes via `well_update_company`'s `category_ids` replace-set.
- `show-missing-invoices` (step 5) → `well_list_missing_invoices({ workspace_id })`, **no periods argument**.
- `connect-tools` (step 6) → `well_list_connectors({ from_selection: true })`, mutually exclusive with `kind`/`q`.
- `deploy-agents` (step 7) → `well_preview_invoice_fetch({ workspace_id })`, **no periods argument**.

Two tools stand outside any one brick: `well_wait_for_selection({ kind, timeout_s? })` — the click read rule 3 calls, legal only AFTER the matching card rendered (`kind`: `"workspace"`, `"periods"`, `"counterparties"`, `"connect_ack"`, `"bank_ack"`) — and `well_switch_workspace` — the session write (`workspace_id` / `workspace_ids`, `periods`, `counterparties`, `ack`) the cards call on Use / Validate / Continue, and this flow calls only per rule 9. Well's OAuth / DCR flow runs when no Well connection exists yet — retry the failed call in the same turn once it returns.

For the full field-by-field contract of every tool above, read `references/tool-reference.md`.

Never call `well_get_entity`, `well_get_schema`, or `well_query_records` — the one carve-out is step 4's proposal mode (`root: "categories"`, `whereClause: { category_type: { _eq: "company" } }`), in a turn that renders no other card. Never call `well_invoke_connector_tool`, any `well_create_*` / `well_delete_*`, any `well_update_*` other than `well_update_company`'s `category_ids`, or any close, lock, or posting tool. This flow reads, and writes only the session context and the counterparty categories the user confirmed. For the full rationale, read `references/tool-reference.md`.

## The click chain — rules that govern every step

1. **One widget card per turn — never two.** Each list tool's result renders its card (step 4's all-categorized read renders none); a turn renders at most one, never re-calls a tool just to check progress (the cards refresh themselves), and never calls a tool outside its step's own list. `well_list_workspaces` renders the picker on every path, resolved or not, so its turn always ends there and step 2 opens the next turn — in step 1 and every multi-workspace pass. The gap-list card ends its turn on the vendor pick from the opposite end, and the read that follows (connect, then preview) opens the next turn.
2. **A card ends the turn.** After rendering any card, end the turn with one short line telling the user what to click (e.g. "Pick your workspace on the card.", "Tick the vendors to chase, then click Continue."). The click writes the choice server-side and prefills a message in the composer; the user sends it with Enter. The missing-invoices card is no exception: its **Continue** click writes the pick. The preview card ends the last turn on its **Deploy** action, which opens the collect link rather than writing a session value.
3. **Resolve the next message, never re-ask.** Governs a turn that ended on a choice still to make — a turn that only kept one card per turn (step 1 resolved, a pass boundary) waits on nothing, and any message moves the flow on with no wait call. Otherwise: (a) the message is the card's prefill — "Continue in <name>", "Work on <Month Year> and <Month Year>", or "Continue" — the click already executed server-side; acknowledge in half a sentence, never re-verifying with an extra call (the connect steps' "Continue" is the one exception — the next step's own read is the verification); (b) any other message — call `well_wait_for_selection` with that step's kind and `timeout_s: 10` once: `selected` → proceed; `no_selection_yet` → ask to click the card, end the turn. Steps 4 and 6 have no kind of their own: ask once for the Continue click and end the turn. Never re-ask in text something already clicked. "Keep for later" writes nothing — say the step stays open and stop.
4. **Never ask for the workspace in text.** When unresolved, call `well_list_workspaces` so the picker renders at the point of need. A `session.pinned_workspace_id` this conversation established is used silently (rule 8).
5. **Acks gate the connect steps.** Steps 3 and 6 are user stops whenever they run, a connected bank and a pre-checked connector included. The card's **Continue** is the only way past them.
6. **Pass `workspace_id` explicitly on every `well_*` read from step 2 on.** The pin is a convenience, not the contract: a `well_switch_workspace` write takes it only ALONGSIDE the answer it records. **`workspace_id` on its own is the PIN write** — a call carrying no `periods`, `counterparties` or `ack` pins the workspace it names, so it is never how a call names the workspace it works in. Step 2's period write carries no workspace at all. **`workspace_ids` pins too**, and replaces the queue as well.
7. **One list or read call per step.** Each step's facts come from its one read; the next step re-reads what it needs itself.
8. **Session state from another conversation is stale.** Desktop-class hosts keep one MCP session per connector, shared across ALL conversations, so at conversation start the `session` values may be leftovers. Trust a session value — and a wait-read's `already_set` — only when THIS conversation rendered the matching card and got the click, or took the typed choice. Otherwise ignore it: never mention it ("already pinned" is forbidden phrasing), never skip a picker over it.

9. **`well_switch_workspace` is a WRITE, and the flow calls it only to record a choice no card recorded.** Exactly four occasions: a matched workspace hint (step 1), a month hint or typed month (step 2), the text-only vendor pick (step 5), and the re-pin between passes of a multi-workspace run. **Never re-pin the workspace already pinned**, never re-send months a Validate click already wrote, and never call it to read the session back — `well_list_workspaces` reports the session. A re-pin is not a free no-op: naming a DIFFERENT workspace drops the counterparty pick and every step ack bound to the old one; naming the SAME one through `workspace_ids` replaces the queue, so a one-entry re-pin ends a multi-workspace run at the entity it is on. **Steps 2 to 7 pin nothing** — a switch call between the month card and the gap list is always the parasite this rule names.

    **Where the months come from as values.** Step 4 passes `periods` explicitly. Read them from the card's prefill — "Work on <Month Year> and <Month Year>" resolves to one `{ calendar_year, calendar_month }` per month named — or, when the next message is not that prefill, from `selection.periods` (rule 3's `well_wait_for_selection({ kind: "periods" })`). Re-writing the months through `well_switch_workspace` to see them echoed back is the failure this rule names.

10. **A vendor pick is trustworthy only for the gap-list card now on screen.** A pick this conversation made is a pick of ONE card's rows. Changing the months at step 2, and any second reading of the gap list, replace those rows — the server drops the pick on both boundaries — so take the tick and Continue again on the refreshed card before previewing anything. An `already_set` answer says a pick exists; it never says it belongs to the card on screen. A pick belongs to ONE workspace too: a wait-read `selection.workspace_id` mismatched against the pinned workspace is no pick — the preview never honours a pick from another workspace.

## Workflow

### Step 1 — Workspace

**Run `define-workspace`.** It confirms the MCP server is configured, drives OAuth/DCR when there is no connection yet, resolves any workspace hint, and pins exactly one workspace. No inline fallback here: with `define-workspace` absent, say the flow cannot start and stop. Zero workspaces → say the account has no workspace yet and stop (`unresolved`).

Its read is `well_list_workspaces()`, which renders the workspace picker, so **step 1 always ends its turn** (rule 1) — resolved or not:

- `session.pinned_workspace_id` set by THIS conversation → used silently; a non-empty `session.workspace_queue` beside it means a multi-pick is mid-walk (**Several workspaces** — this flow's own loop, not the brick's). Set otherwise → a leftover (rule 8): ignored.
- A hint the brick resolved, or a single workspace → pinned with no click needed. Name the entity in one line, say the next turn fixes the months, and end the turn (no wait call). A message naming a different workspace re-runs step 1.
- Otherwise the picker is the question (multi-select tiles): end the turn with one card-pointing line. The **Use** click pins the choice and prefills "Continue in <name>"; resolve the next message by rule 3 — a non-empty queue makes the run multi-workspace, and never re-pin (rule 9). A typed decline ("later") → stop: no workspace, no flow.

Keep: `workspace_id`, `identity.fiscal_year_start_month`, `base_currency`, and whether a queue exists. Narrate the pinned entity in one line ("Working in **Acme SAS** (FR, EUR).").

### Step 2 — Period

**Run `define-period`** with this workspace, the `fiscal_year_start_month` step 1 kept, and any month hint the user gave. It resolves the hint or renders the period picker (`well_list_periods({ workspace_id })`, months multi-select), writes the selection server-side, and derives each month's fiscal coordinate.

- `session.selected_periods` written by THIS conversation, and the user is not changing months → used silently. Present otherwise → a leftover (rule 8): ignored.
- On the picker path, end the turn with one card-pointing line. The **Validate** click writes the selection server-side and prefills "Work on <Month Year> and <Month Year>"; resolve the next message by rule 3, and take the month VALUES from that prefill or from the wait-read's `selection.periods` (rule 9) — never by re-writing them.

**Keep the bank count that step 3 tests.** `define-period` hands back each selected month's `bank_transaction_count` where its `well_list_periods` row carried one — the only bank signal step 3 accepts, and this flow never calls `well_list_periods` itself to collect it (a second call renders a second period picker, rule 1). On the hint path, and wherever the tool is absent, step 3 reads that month's signal as absent.

**Pass `probe: false`, and pass no `bank_state`.** Step 5's gap list is this flow's activity check, so the brick runs no activity probe of its own; the bank step runs after this one, so the brick reports the bank side as unconfirmed rather than as an empty month — expected, since step 3 is where the bank feed is answered.

**Inline fallback, for a standalone install with no `define-period`** — the month-hint resolution rules and the fiscal-coordinate formula: read `references/standalone-fallbacks.md`. **Every month this step pins has ended**; the period-scoped reads of steps 4, 5 and 7 refuse the whole call over a still-running month.

When this step changes the months after a pick was already taken, that pick belongs to the months the user left (rule 10): walk step 5 again on the refreshed card; never preview the new months on the old pick.

### Step 3 — Bank (only when a selected month holds no bank transaction)

The signal is `bank_transaction_count`, the per-month field step 2 kept from `define-period`'s hand-off. Test it over the selected months and nothing else:

- Every selected month carries a count above 0 → **skip this step.** Say so in half a sentence and continue to step 4 in the same turn: no card, no ack, no `connect-bank` run.
- Any selected month carries a count of 0, or the count is missing for any selected month → **run the step.**

**One month with no bank data is enough to run the step**: a February/March selection where only March holds transactions still runs the step — the skip needs every selected month, not the best one. **A missing count runs the step; it never skips it** — a server that predates the field, or the hint path where no period row was read, is no evidence either way. Never read an absent field as a 0 or as above 0. **Test `bank_transaction_count`, and never `transaction_count`** — a workspace that never connected a bank can still carry a high `transaction_count`.

**When the step runs, run `connect-bank`** with this workspace. It makes one `well_list_connectors({ workspace_id, kind: "bank" })` call — the bank-only card renders, naming the bank scope itself (a card showing non-bank tools means the call was unscoped) — reduces the bank rows to one state, and writes its own `ack: "bank"` on Continue. With `connect-bank` absent, run `connect-tools` scoped to `kinds: [bank]` instead. **When this step runs, it always stops, a connected bank included**: settled bank spend is what the gap list is measured against. Say one line (connected / first sync running / expired, reconnect from the card / missing), tell the user to click Continue, and end the turn. Resolve the next message by rule 3 — the "Continue" prefill or a typed continue moves the flow on with no verification call, and a typed "skip the bank" continues too, with the recap labelled as narrowed. Never claim a bank state you did not read.

Keep `resolution` — `skipped`, `acked`, or `narrowed` (the user skipped the bank).

### Step 4 — Counterparty categorization

**Run `categorize-counterparties`** with this workspace, the state step 3 ended on as its `bank_state` (nothing where step 3 was skipped — state the bank fact yourself in the coverage line instead of passing `bank_state: connected`, since a positive count is settled history, not a live connector state), and the step 2 months as its `periods` scope (values from rule 9's **Where the months come from**). This step calls `well_list_counterparties` and nothing else: it pins nothing, re-writes no month.

**This step runs on every pass, and the brick's own read decides whether it stops:** the condition is that read's `uncategorized_count` — ROWS (one counterparty per month, so quote as rows, never companies) carrying no industry category among the counterparties whose invoices the selected months still miss. **The gap list cannot decide this step**: `well_list_missing_invoices` reports no categorization figure.

- `uncategorized_count` is 0, or the read renders no card → half a sentence, `resolution: unchanged`, continue to step 5 **in the same turn**.
- `uncategorized_count` is above 0 → the card renders with a category select per row, and **this step is a stop**: move to step 5 only on the user's continue for THIS step — the card's Continue prefill, or a typed continue — never around it. No wait-read kind stands in for that continue. For the standalone fallback and the exact coverage-line wording, read `references/standalone-fallbacks.md` and `references/gap-list-and-preview-reporting.md`.

**Categorizing changes neither the gap list nor a route** (the two fields are separate — full rationale in `references/gap-list-and-preview-reporting.md`). Never tell the user categorizing will surface more missing invoices, and never call the gap list thin. The step runs BEFORE the gap list because nothing it writes changes that list.

Keep `resolution` — `rendered`, `updated`, `unchanged`, or `unavailable` (`well_list_counterparties` absent — say the step is unavailable).

### Step 5 — Gap list, vendor pick and close

**Run `show-missing-invoices`** with this workspace. It calls `well_list_missing_invoices({ workspace_id })` — **no periods argument**, the server reads the clicked selection — renders the gap card (counterparty rows with Agent / Connect / Upload badges, a checkbox and transaction table per row, footer offering **Keep for later** and **Continue**), and takes the vendor pick on its Continue click. **The pick contract is the brick's own** (both prefills, the text-only write, the wait-read, the workspace-mismatch rule); this flow keeps the turn boundary and the hand-off. An error saying no selection exists → back to step 2. Tool absent → `unavailable`: never approximate from raw transactions. Retry a transient failure once; a second failure → step 8.

Say one line only — counterparties per mode and the total, never restating rows the card shows — plus the coverage line: the list covers the period's **categorized** expense transactions only. For the exact wording rules (`dropped_groups` counting, `period_label` vs `periods_covered`, the amount-unavailable convention) and the complete hand-off field list the later steps read, see `references/gap-list-and-preview-reporting.md`; for the standalone fallback, `references/standalone-fallbacks.md`.

Close the turn on one line naming the supplier count, the base-currency total, and the tick-and-Continue instruction. Never call `well_list_connectors` or `well_preview_invoice_fetch` in this turn, and never re-pin on the way in.

An `empty` list resolves on `dropped_groups`, never on the row count alone:

- `unknown` and `unnamed_company` both 0 → **stop and celebrate**: every categorized expense from a supplier has its invoice. Name a non-zero `bank_internal` without its number. Nothing to tick.
- `unknown` or `unnamed_company` above 0 → **stop, celebrate nothing**: categorized spend exists with no named counterparty to chase, quote a number for `unnamed_company` alone and none for `unknown`; `resolution: empty` still, but never present the period as complete.

### Step 6 — Connect the services behind the picked vendors

**When the pick names at least one counterparty carrying a `matched_connector_service_id`, run `connect-tools`** with this workspace and `from_selection: true`, **and end the turn on the card it renders — before any preview.** The server reads the recorded pick and returns only the connectors behind the ticked counterparties, pre-checked, reporting `scope: "picked_vendors"`. The gap card's own prefill asks for this order in words: "Show the connect step for those connectors first, then the deploy step."

**Describing the connect rows in prose is the failure, not a shortcut**: the install links live on the card and nowhere else, and a preview that follows a connect step nobody could take reports an agent run for an invoice a connector would have fetched. Render the card, or do not claim the step ran; name the picked vendors in your own line so the user reads why those tiles are the ones on the card.

The pick names no such counterparty → skip this step entirely and go to step 7; the gap card's other prefill says so: "Well has no connector for the vendors I picked. Show the deploy step."

**Inline fallback, for a standalone install with no `connect-tools`**, and the ack handling (no `well_wait_for_selection` at this step): read `references/standalone-fallbacks.md`. This step connects nothing itself and fetches nothing — a connector the user installs here delivers its invoices on its own sync.

Keep `resolution` — `rendered`, `acked`, or `skipped` (the pick named no connector).

### Step 7 — Preview what would be fetched

Runs only on the user's next message after step 5's close line — or, when step 6 ran, after its ack — and only with a pick taken on the gap-list card now on screen. Resolve that message by rule 3: the "Continue" prefill means the click already wrote the pick; any other message gets one `well_wait_for_selection({ kind: "counterparties", timeout_s: 10 })` call, and `no_selection_yet` ends the turn on one line asking for the tick and the click. A typed decline ends the run with the recap and no preview.

**Run `deploy-agents`** with this workspace and step 5's hand-off (`selection`, `selection_state`, `agent_candidates`). It reads `well_list_workspaces`' `session.selected_counterparties` only as the resync fallback for a click the hand-off missed, which then ends its own turn on the picker (rule 1). It calls `well_preview_invoice_fetch({ workspace_id })` — **no periods argument** — renders the preview card, and owns the output: the per-agent lines, the collect link, and the vendors that link cannot take. The brick carries the same pick guards as rule 10 — a pick made before a change of months or a fresh gap-list read, or one whose `selection.workspace_id` is not the pinned workspace, each send the flow back to step 5 for a fresh tick. **What this flow owns is the turn boundary**: the preview card and the closing recap share this turn.

**Inline fallback, for a standalone install with no `deploy-agents`**, and the full line-by-line output specification: read `references/standalone-fallbacks.md` and `references/gap-list-and-preview-reporting.md`. No agents, uploads, or connects → `nothing_to_do`: say the picked vendors have nothing to fetch.

### Step 8 — On failure, redirect instead of guessing

Each step retries a transient call once. On a second failure, never substitute your own read or skip ahead: stop at that step, name it, and give the user `<well-app-base-url>/workspaces/<workspace_id>` to continue in Well. Do not append a query parameter you have not confirmed the app reads.

## Several workspaces

Several workspaces picked is **one Use click**: the card pins the first, leaves the rest in the session's `workspace_queue`, and prefills "Continue in <first> — then <n2>, <n3>" — the sent prefill names the sequence, and no read ever spans two entities. The loop lives here and only here:

- Run steps 2 → 7 in full on the pinned workspace.
- Then read the queue from `well_list_workspaces`' `session.workspace_queue` and call `well_switch_workspace({ workspace_id: <next> })` — the one re-pin rule 9 allows, and only when `<next>` is a DIFFERENT workspace from the one just walked. That read renders the picker again, so this turn ends there too (rule 1): name the entity the next pass works in and end it. The pass's step 2 opens the following turn, and every call in the pass carries that pass's own `workspace_id`. Repeat until the queue is walked.
- Resolve the period inside each pass: a month hint applies to every pass; a clicked selection belongs to the pass that asked.
- Announce the sequence once when the queue first appears, then recap each entity as its pass ends. Never merge rows, counts, totals, or coverage across two entities. A stop or a skip inside one pass ends that pass only — record it in that entity's recap and start the next pass anyway; step 8's redirect carries the failing pass's own `workspace_id`.

## Routing table

`after` is the step number. Every step names its brick under **Composed skills**; the step sections above carry the full rationale behind each action — this table is the quick lookup for what runs next and where the turn ends.

| after | key | value | action |
|---|---|---|---|
| 1 | resolution | unresolved (decline, or no workspace) | **stop** — nothing pinned |
| 1 | card | picker rendered, workspace unresolved | **end turn** — pick on the card |
| 1 | resolution | resolved, no queue | **end turn** on the picker, naming the entity; step 2 opens next |
| 1 | resolution | resolved, queue non-empty | same end turn, then run 2→7 and loop the queue — **Several workspaces** |
| 2 | card | period picker rendered | **end turn** — pick the month(s) |
| 2 | selection | written (click, hint, or session) | continue to 3 |
| 3 | signal | every selected month above 0 | **skip** — continue to 4 in the same turn |
| 3 | signal | any month at 0, or missing | run `connect-bank`, **end turn** on its card |
| 3 | ack | "Continue", typed continue, or skip | continue to 4 — a missing/errored bank labels the recap narrowed |
| 4 | condition | `uncategorized_count` > 0 | **end turn** at the card; step 5 runs only on this step's own continue |
| 4 | condition | `uncategorized_count` = 0, or no card | continue to 5 in the same turn |
| 4 | resolution | `unavailable` | say unavailable, continue to 5 |
| 5 | resolution | `unavailable` | **stop** — no connect step, no preview |
| 5 | resolution | `empty`, both `dropped_groups` counters 0 | **stop and celebrate**; recap without a preview |
| 5 | resolution | `empty`, either `dropped_groups` counter above 0 | **stop, celebrate nothing**; recap without a preview, never as complete |
| 5 | resolution | `listed` | **end turn** on the tick-and-Continue line; 6 or 7 runs next |
| 6 | pick | names a counterparty with a connector | run `connect-tools`, **end turn** on the card — never prose |
| 6 | rows | pick scope returned none | say nothing to connect, **go to 7** |
| 6 | pick | names none | **skip to 7** |
| 6 | ack | "Continue" or typed continue | continue to 7 — step 7's own read is the verification |
| 7 | selection | prefill, or a wait-read pick on the card now on screen | run `deploy-agents` |
| 7 | selection | `already_set` pick taken before a month/gap-list change | **end turn** — ask for a fresh tick; no preview (rule 10) |
| 7 | selection | `no_selection_yet`, or Keep for later | **end turn** — ask for the tick and Continue |
| 7 | reply | typed decline | recap without a preview |
| 7 | resolution | `previewed` / `nothing_to_do` | recap; the card's Deploy line, or say nothing to fetch |

## Output requirements

Every step reports itself in one to three plain sentences as it runs — no yaml, no JSON, no fenced code block, no table of rows a card already shows; the hand-off facts are reasoning state carried in conversation, never printed. Close the run with one recap, in this order — and on a multi-workspace run, one recap per entity, each opening with the entity's name, no line spanning two:

- **Workspace and period** — the pinned workspace (country, base currency when set) and the period: the one month's label with its fiscal coordinates when the selection held one month, or every month from `periods_covered` when it held several, plus whether the months are complete.
- **Coverage** — the bank step's state, or that the flow skipped it because the months already hold bank transactions, and that the gap list covers categorized expense transactions only. Label a narrowed picture as narrowed and say when a missing bank feed narrowed it.
- **Missing invoices** — counterparty counts per mode (agent / connect / upload), the base-currency total over the rows that carry an amount, and how many vendors the user picked.
- **Categorization delta** — step 4's coverage, and whether the flow left the picking to the user. Count changes only for a confirmed proposal — never claim it changed what the gap list holds.
- **Connect step** — only when step 6 ran: which picked vendors Well holds a connector for, and that a connector delivers its invoices on its own sync rather than now.
- **Preview** — the per-agent lines for the picked vendors (five-largest form above five agents — full spec in `references/gap-list-and-preview-reporting.md`), plus the upload line, the connect line, the scope line, and the line for any vendor the collect link cannot take.
- **The nothing-started sentence**, on its own, saying that nothing has started here and that the collect page hands the picked portals to the browser extension once the user starts them there.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- One closing line: connecting the providers behind the `connect` rows turns manual uploads into gaps an agent can fetch.

**How this reaches the user.** A widget-bearing tool result attaches `_meta.ui.resourceUri`, and the host decides whether to draw it — that key never reaches you, so every card-pointing line has to read sensibly whether or not a card appeared, and you must never add a second rendering of what a card already shows.

## Quality checks

Before finishing, verify the flow ran in order, each route came from the routing table, no turn rendered two widget cards, every next message was resolved by rule 3, and every hard prohibition in Tooling and the click chain held. **For the complete pre-completion checklist**, read `references/quality-checklist.md` and run down every line before closing the turn.

## Examples

For worked traces of the happy path and the edge cases above — a stale session, a multi-workspace run, the bank step skipping itself, an empty gap list that is not a complete period, a pick naming a connector, a pick from the month before, and a tool-unavailable stop — read `references/worked-examples.md`.

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
