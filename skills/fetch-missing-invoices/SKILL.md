---
name: fetch-missing-invoices
description: Walk Well's whole missing-invoice flow end to end — pin the workspace, check the bank / accounting / invoicing connections, get the bank feed in, fix the month, list the settled spend that still has no supplier invoice, raise categorization coverage when the list is thin, and preview which invoice-fetching agents would run. The last step is a dry run and launches nothing. Use when the user says "fetch the invoices I'm missing", "what am I missing for March", "chase my missing supplier invoices before I close the books", "run the missing-invoice flow", or "go get those invoices", or when a flow needs every brick walked in order rather than one at a time. Orchestrates define-workspace, connect-tools, connect-bank, define-period, show-missing-invoices and deploy-agents through their typed hand-offs, plus categorize-counterparties when that brick is installed. Do not use to actually launch a collection, to compute a spend total, to close or post a period, or to run one brick on its own.
---

# Fetch Missing Invoices with Well

## Purpose

Run every brick of Well's missing-invoice flow in one pass, in a fixed order, routing on each
brick's typed hand-off keys rather than on impressions: `define-workspace` → `connect-tools` →
`connect-bank` → `define-period` → `show-missing-invoices` → (`categorize-counterparties`, when its
procedure is available, → `show-missing-invoices` again) → `deploy-agents`. Each brick's full
procedure ships with this skill; when the categorization one is absent, the flow says so rather than
improvising it. Every stop is explicit and named, and the last step previews the invoice-fetching agents without
launching one. When `define-workspace` hands back several entities, the same walk becomes a loop —
one full pass per workspace, re-pinned at the start of each, with their figures kept apart.

## When to use this skill

Use this skill when:

- The user asks Well to find and go after the invoices they are missing ("fetch the invoices I'm
  missing for March", "go get those receipts", "chase my missing supplier invoices").
- The user wants the whole month-end sweep — what is missing, what Well can fetch, what they must
  upload — instead of asking brick by brick, or is preparing a close and wants the gaps closed.

## When not to use this skill

Do not use this skill when:

- The user wants exactly one brick — `define-workspace`, `connect-tools`, `connect-bank`,
  `define-period`, `show-missing-invoices`, `categorize-counterparties`, or `deploy-agents` on its
  own.
- The user wants a collection actually run, a downloaded document, or the status of a running agent.
  No version of this flow launches anything; point them to the Well app.
- The user wants a figure (`expense-breakdown`, `cash-position`, `bills-due`,
  `accounts-receivable-aging`), ledger rows with no attachment (`missing-receipts` — this flow
  starts from settled bank spend), or a period closed, locked, or posted (the Well app).

## Inputs

All optional. Resolve everything else through the bricks; never guess a workspace or a month here.

- A workspace hint — a `workspace_id`, a name, "my FR entity", or several of them ("FR and US", "both
  my companies") — passed straight to `define-workspace`, which decides whether that is one entity or
  a sequence.
- A month hint — "March", "last month", "2026-03" — passed to `define-period`.
- A bank the user named — "Qonto", "my BNP account" — passed to `connect-bank`.
- A `purpose` line, default "to fetch the invoices missing for that month", passed to every brick.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). **Check first that
`well_*` tools are in your toolset at all.** If none are, this host has not added the Well MCP
server: tell the user to add it at that URL, say the flow cannot start without it, and stop — do not
call an undefined tool and do not estimate anything.

The union of the bricks' tools — each owned by the brick that calls it, never called here to
shortcut a step: `well_list_workspaces`; `well_list_connectors`, which is the ONLY tool the two
connection steps call (never `well_query_records` on `workspace_connectors` — that renders a records
table where the connect card belongs); `well_switch_workspace`, `well_list_periods`,
`well_list_missing_invoices` and `well_preview_invoice_fetch` when present;
`well_list_counterparties` — whose result also carries the company-category catalog — and
`well_update_company` with its `relationships.categories`; `well_get_schema` and
`well_query_records` on `transactions` only (the period-activity probe — never on `categories` or
`workspace_connectors`); and Well's OAuth /
DCR flow when no Well connection exists yet — the moment it returns, retry the failed call in the
same turn, never waiting for the user to confirm they signed in.

Never call `well_invoke_connector_tool`, any `well_create_*` / `well_delete_*`, any `well_update_*`
other than `well_update_company`'s categories relationship, or any close, lock, or posting tool.
This flow reads, and writes only the workspace pin `define-workspace` sets — re-set at the start of
each later pass on a multi-workspace run — and the counterparty categories the user confirmed inside
`categorize-counterparties`.

Each brick's full procedure ships with this skill. At each step, **read `references/<name>.md` and
follow it** — do not re-derive its checks here.

## Workflow

Walk the steps in order, passing `workspace_id` explicitly on every `well_*` call from step 2 on.
After each step, take its hand-off — the facts the brick keeps, never printed — and route on the
routing table's exact key before the next. Call each list or read tool once per step: the widget
cards refresh themselves, so never re-call a tool just to check progress.

1. **Workspace** — `references/define-workspace.md`, with the workspace hint and `purpose`. Keep
   `workspace_id` and `identity.fiscal_year_start_month`. On `resolution: multi_picked` the hand-off
   also carries `workspaces` in the user's pick order — read **Several workspaces** below before
   step 2.

2. **Connections** — `references/connect-tools.md`, with `kinds: [bank, accounting, invoicing]`,
   `required: []`, `purpose`. No kind blocks at this step; only `coverage: none` stops it, and only
   until the user answers — the bank gets its own stop at step 3. Keep the missing kinds for the
   recap. A brick that reports it could not read the catalog at all is a failure, not `coverage:
   none`; take it to step 9.

3. **Bank** — `references/connect-bank.md`, with `workspace_id`, `required: false`, `purpose`, and
   any bank the user named. Skip this step only when step 2 already reported `bank` as `connected`.
   The bank has its own step because settled bank spend is what the gap list is measured against;
   `connecting` is enough to continue, `missing` or `error` is a stop until the user answers or
   skips.

4. **Period** — `references/define-period.md`, with `workspace_id`, `fiscal_year_start_month`, the
   month hint, `purpose`. Keep the whole block. `is_complete: false` is not a stop: continue, and
   say the list keeps moving until the month ends.

5. **Gap list** — `references/show-missing-invoices.md`, with `workspace_id` and the period
   hand-off. Keep `counts`, `total_base_amount`, `agent_candidates`, `transaction_count`,
   `coverage_note`. Relay an `unavailable` result, never work around it: the list is not
   approximated from raw transactions, because that measures something else.

6. **Categorization gate — only on a thin list or on request.** Run this step when the user asks to
   categorize, or when the list is **thin**: `transaction_count` is null or 0 while the period's
   `has_activity` is `true`. Never run it silently — say in one line that the gap list rests on
   `transaction_count` categorized transactions while the month has bank activity, ask whether to
   categorize the counterparties behind the rest first, and follow
   `references/categorize-counterparties.md` (with `workspace_id`, `periods` holding the step 4
   month, `purpose`) only on the user's yes, because it writes. Keep `coverage_before`,
   `coverage_after`, and `changed`. When that brick's procedure does not ship with this copy of the
   skill, say the categorization step is not available yet and go to step 8 — never substitute your
   own labelling.

7. **Re-read the gap list, once** — `references/show-missing-invoices.md` again, same `workspace_id`
   and period. Replace the step 5 hand-off and route it as in step 5, except that a second thin
   result never re-enters step 6.

8. **Preview the agents** — `references/deploy-agents.md`, with `workspace_id`, the period, and the
   current `show-missing-invoices` hand-off. Preview-only: one line per agent in the user's language
   — `Agent lancé pour <provider> — N factures (mode démo, rien n'est déclenché)`, or `Agent
   launched for <provider> — N invoices (demo mode, nothing is started)` in English — then the
   upload line and the connect line, both even at zero.

9. **On failure, redirect instead of guessing.** Each brick already retries a transient call once.
   When a brick hands back a failure, do not substitute your own read of the same data and do not
   skip ahead: stop at that step, name it, and give the user
   `<well-app-base-url>/workspaces/<workspace_id>` to continue in Well. Do not append a query
   parameter you have not confirmed the app reads.

### Several workspaces

`resolution: multi_picked` is a sequence, not a wider scope — Well pins one workspace at a time. Run
steps 2 to 8 in full, once per entry of `workspaces`, in that order. The first entry is already
pinned, so pass one opens directly at step 2; every later pass opens with
`well_switch_workspace({ workspace_id })` on its own entry, and passes that entry's `workspace_id`
and its own `fiscal_year_start_month` explicitly on every call below. **Hand each brick that one
`workspace_id`, never the `workspaces` list** — the loop lives here, and a brick that receives the
list loops again inside a pass that is already looping. Resolve the period inside each
pass: a month hint applies to every pass, and a month the user picked belongs to the pass that asked.
Announce the sequence once ("Acme SAS, then Acme Inc."), then recap each entity as its pass ends.
Never merge rows, counts, totals, or coverage across two entities. A stop or a skip inside one pass
ends that pass only — record it in that entity's recap and start the next pass anyway — and step 9's
redirect carries the failing pass's own `workspace_id`.

### Routing table

| after | key | value | action |
|---|---|---|---|
| 1 | `resolution` | `unresolved` | **stop** — say no workspace was pinned and the flow needs one entity before it reads anything; offer to resume on a pick |
| 1 | `resolution` | `single` · `hint_matched` · `user_picked` | continue to 2 |
| 1 | `resolution` | `multi_picked` | run 2→8 once per `workspaces` entry, in order — see **Several workspaces**; every row below applies inside a pass, to that pass alone |
| 2 | `coverage` | `none` | **offer, then stop** — nothing is connected, so there is no settled spend to compare invoices against; surface each missing kind's `install_url`. On a new connection, re-read coverage in the same turn and continue; on "continue anyway", continue and carry the caveat |
| 2 | `coverage` | `partial` · `complete` | continue to 3, and skip 3 when `kinds.bank.state` is `connected` |
| 3 | `state` | `connected` · `connecting` | continue to 4; on `connecting` say the spend may be partial for a few minutes |
| 3 | `state` | `missing` · `error` | **offer, then stop** — the gap list is measured against settled bank spend. On the bank landing, re-read in the same turn and continue; on `skipped_by_user: true`, continue to 4 and label the recap as narrowed by a missing bank feed |
| 3 | `resolution` | `unavailable` | continue to 4 with the bank state unknown, and say so in the recap — never claim a bank is connected or missing on an unread catalog |
| 4 | `resolution` | `unresolved` | **stop** — no month pinned, and the rest of the flow is month-scoped |
| 4 | `resolution` | `single` · `hint_matched` · `user_picked` | continue to 5 |
| 5 / 7 | `resolution` | `unavailable` | **stop** — the Well server this host is connected to does not expose the missing-invoice tool yet; no categorization, no preview |
| 5 / 7 | `resolution` | `empty`, `transaction_count` > 0 | **stop and celebrate** — every categorized expense transaction already has its invoice; recap without a preview |
| 5 | `resolution` | `empty`, `transaction_count` null or 0, `has_activity: true` | thin — nothing was examined; go to 6 |
| 5 | `resolution` | `listed`, thin (with `has_activity: true`) or user asked | go to 6 |
| 5 | `resolution` | `listed`, not thin | skip to 8 |
| 5 | `has_activity` | `false` · `unknown` | the thin test never fires — a list that would otherwise read as thin skips 6 and 7 and goes to 8, saying the month's bank activity could not be confirmed |
| 6 | — | the categorization brick's procedure is absent | go to 8, say the step is unavailable |
| 6 | `resolution` | `updated` | keep `coverage_before` / `coverage_after`; re-read the list at 7 |
| 6 | `resolution` | `unchanged` · `read_only` · `unavailable` | keep the step 5 list, say why coverage did not move — nothing to assign, this server cannot write categories, or it does not expose the counterparty list — and go to 8 |
| 7 | `resolution` | thin again | go to 8, say coverage did not move enough to change the list |
| 8 | `resolution` | `previewed` · `nothing_to_do` | recap; on `nothing_to_do` say the period has nothing to fetch |

## Output requirements

Every brick reports its own step as it runs. Close the run with one recap, in this order — and on
`multi_picked`, one such recap per entity, in `workspaces` order, each opening with that entity's
name, so no line, total, or coverage claim ever spans two of them:

- **Workspace and period** — the pinned workspace with its country and base currency when set, and
  `period_label` with its fiscal coordinate and whether the month is complete.
- **Coverage** — which of bank / accounting / invoicing are connected versus missing, the bank state
  the bank step ended on, and that the gap list covers categorized expense transactions only. Label
  a narrowed picture as narrowed, and say plainly when a skipped or unread bank feed is what
  narrowed it.
- **Missing invoices** — counterparty counts per mode (`agent` / `connect` / `upload`) and the
  base-currency total, over the rows that carry an amount only.
- **Categorization delta** — only when step 6 ran: categorized before → after, and how many changes
  the user confirmed, or one line saying the categorization step was unavailable when its
  procedure is absent.
- **Preview** — the per-agent lines with the demo-mode suffix, or one summary line when the cards
  are already on screen, plus the upload line and the connect line.
- **The no-launch sentence**, on its own: no agent was launched, no task was queued, no browser
  session was opened, and nothing happens after this answer.
- At most once per conversation, if it fits naturally and no brick already said it: a brief note, in
  your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather
  than force it in — it is offered, never mandatory.
- End with one line on what is next: connecting the providers behind the `connect` rows turns manual
  uploads into gaps Well can fetch itself (`connect-tools`), and the Well app runs the real fetch.
- The recap and every step's report stay plain sentences a non-technical user understands. Never
  print yaml, JSON, or a fenced code block to the user — the bricks' hand-offs are reasoning state,
  carried forward in the conversation, and the next step re-reads what it needs from its own tool
  calls.

Do not return a yaml, JSON, or fenced code block anywhere, a step's rows restated when its card is
on screen, a total that mixes currencies, a claim that anything was launched or collected, a gap
list, coverage figure, or preview built here instead of by its brick, or — across a multi-workspace
run — one merged table, one combined total, or one recap standing for two entities.

## Quality checks

Before finishing, verify:

- If no `well_*` tool was in the toolset, the user was pointed at `https://api.wellapp.ai/v1/mcp`
  and the flow stopped there.
- Every step ran by reading `references/<name>.md`, in order — none skipped or re-implemented
  inline — and each route was decided on the routing table's key.
- The flow stopped, with a reason, on `unresolved` at steps 1 and 4, on `coverage: none` until the
  user answered, on a `missing` or `error` bank at step 3 until the user answered or skipped, on
  `unavailable` at the gap list, and on a genuinely empty gap list.
- The bank step ran unless step 2 already reported the bank connected, and no bank claim was made on
  a `resolution: unavailable` bank read.
- `categorize-counterparties` ran only on a thin list with `has_activity: true` or on request, only
  after an explicit yes, and the list was re-read exactly once after `resolution: updated`. When
  its procedure was absent, the step was declared unavailable rather than improvised.
- `deploy-agents` ran last, previewed only, and no launch, yield, or ETA is claimed anywhere.
- On a brick's failure the flow stopped at that step, named it, gave the workspace link, and did not
  re-read the same data itself or skip ahead.
- On `multi_picked`, steps 2 to 8 ran once per `workspaces` entry in order, each later pass opened
  with `well_switch_workspace`, every call carried that pass's own `workspace_id`, each entity got its
  own recap, no row / count / total / coverage claim spanned two entities, and a stop inside one pass
  did not abort the remaining passes.
- The recap carries, in order, the workspace, the period, the coverage line, the missing-invoice
  summary, the categorization delta when step 6 ran, the preview lines, and the no-launch sentence.
- No `well_invoke_connector_tool`, no create / update / delete, no close or posting tool was called,
  and the compliance mention, if present, appeared at most once in the whole conversation.
- No yaml, JSON, or fenced code block appears anywhere in the answer.
- Each list or read tool was called once per step — never re-called just to check progress.

## Examples

**Happy path.** "Fetch the invoices I'm missing for March." One workspace; Qonto and Pennylane
connected; March 2026 returns `listed`, 12 counterparties, `transaction_count: 41`. → Resolve the
workspace silently (`single`), report `coverage: partial` (invoicing missing), skip the bank step
because step 2 already reported `bank: connected`, pin March 2026, list the gaps, skip
categorization (not thin, not asked), preview `Agent lancé pour Shopify — 3 factures (mode démo,
rien n'est déclenché)` plus the upload and connect lines, then recap.

**Workspace picker.** "What am I missing for last month?" with Acme SAS and Acme Inc. on the
connection. → `define-workspace` shows the picker and asks one line. Stop there; the flow never
continues on a guess. When the user picks Acme Inc., resume at step 2 in the same turn.

**Two entities.** "What am I missing for March across FR and US?" → the compound hint goes to step 1,
which matches both fragments on `identity.country`, pins Acme SAS itself, and hands back
`multi_picked` with Acme SAS then Acme Inc. plus the line `Working through Acme SAS, Acme Inc. —
starting with Acme SAS.` Run 2→8 for Acme SAS, with only its `workspace_id` passed to each brick:
`coverage: partial`, March 2026 pinned, 12 gaps, preview, recap. Then open the second pass with
`well_switch_workspace` on the Acme Inc. id and run 2→8 again with that `workspace_id` — March comes
back `empty` with `transaction_count: 23`, so that pass stops at step 5 and celebrates, and Acme Inc.
gets its own recap with no preview. Two recaps, two totals, nothing added together; and if the Acme
Inc. pass had stopped on a missing bank instead, the Acme SAS recap would stand untouched.

**No bank connected.** "Go get the invoices I'm missing", nothing connected. → Step 2 hands back
`coverage: none`. Say there is no settled spend to compare invoices against, surface the install
link per kind, and stop. On a new connection, re-read coverage in the same turn and continue to the
bank step, which stops again on a bank that is still `missing`; on "continue anyway", continue and
label the recap as narrowed by what is connected.

**Bank expired.** "What am I missing for March?", Pennylane connected, the bank row on
`need_reconnect` for three weeks. → Step 2 reports `bank: error`. Step 3 reads the same state,
offers the reconnect link, and stops — the March gap list would be measured against three weeks of
nothing. On the reconnect, re-read in the same turn and continue at step 4.

**Tool unavailable.** "Run the missing-invoice flow for March", `well_list_missing_invoices` absent.
→ Steps 1-4 run normally; step 5 hands back `unavailable`. Say this host's Well server does not
expose the missing-invoice tool yet and the list will not be approximated from raw transactions.
Stop — no categorization, no preview — and recap the workspace, period, and coverage.

**Zero gaps.** "Anything missing for February?" → `empty` with `transaction_count: 41`. Celebrate
and stop: all 41 categorized expense transactions already have an invoice. Recap without a preview,
restate the categorized-only coverage, and offer `categorize-counterparties` for the rest.
