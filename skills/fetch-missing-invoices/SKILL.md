---
name: fetch-missing-invoices
description: Walk Well's whole missing-invoice flow end to end — pin the workspace, check the bank / accounting / invoicing connections, fix the month, list the settled spend that still has no supplier invoice, raise categorization coverage when the list is thin, and preview which invoice-fetching agents would run. The last step is a dry run and launches nothing. Use when the user says "fetch the invoices I'm missing", "what am I missing for March", "chase my missing supplier invoices before I close the books", "run the missing-invoice flow", or "go get those invoices", or when a flow needs the six bricks walked in order rather than one at a time. Orchestrates define-workspace, connect-tools, define-period, show-missing-invoices, categorize-counterparties and deploy-agents through their typed hand-offs. Do not use to actually launch a collection, to compute a spend total, to close or post a period, or to run one brick on its own.
---

# Fetch Missing Invoices with Well

## Purpose

Run the six bricks of Well's missing-invoice flow in one pass, in a fixed order, routing on each
brick's typed hand-off keys rather than on impressions: `define-workspace` → `connect-tools` →
`define-period` → `show-missing-invoices` → (`categorize-counterparties` → `show-missing-invoices`
again) → `deploy-agents`. Every stop is explicit and named, and the last step previews the
invoice-fetching agents without launching one.

## When to use this skill

Use this skill when:

- The user asks Well to find and go after the invoices they are missing ("fetch the invoices I'm
  missing for March", "go get those receipts", "chase my missing supplier invoices").
- The user wants the whole month-end sweep — what is missing, what Well can fetch, what they must
  upload — instead of asking brick by brick, or is preparing a close and wants the gaps closed.

## When not to use this skill

Do not use this skill when:

- The user wants exactly one brick — `define-workspace`, `connect-tools`, `define-period`,
  `show-missing-invoices`, `categorize-counterparties`, or `deploy-agents` on its own.
- The user wants a collection actually run, a downloaded document, or the status of a running agent.
  No version of this flow launches anything; point them to the Well app.
- The user wants a figure (`expense-breakdown`, `cash-position`, `bills-due`,
  `accounts-receivable-aging`), ledger rows with no attachment (`missing-receipts` — this flow
  starts from settled bank spend), or a period closed, locked, or posted (the Well app).

## Inputs

All optional. Resolve everything else through the bricks; never guess a workspace or a month here.

- A workspace hint — a `workspace_id`, a name, or "my FR entity" — passed to `define-workspace`.
- A month hint — "March", "last month", "2026-03" — passed to `define-period`.
- A `purpose` line, default "to fetch the invoices missing for that month", passed to every brick.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). **Check first that
`well_*` tools are in your toolset at all.** If none are, this host has not added the Well MCP
server: tell the user to add it at that URL, say the flow cannot start without it, and stop — do not
call an undefined tool and do not estimate anything.

The union of the bricks' tools — each owned by the brick that calls it, never called here to
shortcut a step: `well_list_workspaces`; `well_list_connectors` and `well_query_records` on
`workspace_connectors` / `workspace_connector_sync_logs`; `well_list_periods` when present;
`well_get_schema` and `well_query_records` on `transactions` and `categories`;
`well_list_missing_invoices`; `well_list_counterparties` and `well_update_company` with its
`relationships.categories`; `well_preview_invoice_fetch` when
present; and Well's OAuth / DCR flow when no Well connection exists yet — the moment it returns,
retry the failed call in the same turn, never waiting for the user to confirm they signed in.

Never call `well_invoke_connector_tool`, any `well_create_*` / `well_update_*` / `well_delete_*`, or
any close, lock, or posting tool. This flow reads, and writes only the counterparty categories the
user confirmed inside `categorize-counterparties`.

The six bricks are bundled next to this file. At each step, **read `references/<name>.md` and follow
it** — do not re-derive its checks here.

## Workflow

Walk the steps in order, passing `workspace_id` explicitly on every `well_*` call from step 2 on.
After each step, read its hand-off block and route on the routing table's exact key before the next.

1. **Workspace** — `references/define-workspace.md`, with the workspace hint and `purpose`. Keep
   `workspace_id` and `identity.fiscal_year_start_month`.

2. **Connections** — `references/connect-tools.md`, with `kinds: [bank, accounting, invoicing]`,
   `required: none`, `purpose`. No kind blocks the flow on its own; only `coverage: none` stops it,
   and only until the user answers. Keep the missing kinds for the recap.

3. **Period** — `references/define-period.md`, with `workspace_id`, `fiscal_year_start_month`, the
   month hint, `purpose`. Keep the whole block. `is_complete: false` is not a stop: continue, and
   say the list keeps moving until the month ends.

4. **Gap list** — `references/show-missing-invoices.md`, with `workspace_id` and the period
   hand-off. Keep `counts`, `total_base_amount`, `agent_candidates`, `transaction_count`,
   `coverage_note`. Relay an `unavailable` result, never work around it: the list is not
   approximated from raw transactions, because that measures something else.

5. **Categorization gate — only on a thin list or on request.** Run this step when the user asks to
   categorize, or when the list is **thin**: `transaction_count` is null or 0 while the period's
   `has_activity` is `true`. Never run it silently — say in one line that the gap list rests on
   `transaction_count` categorized transactions while the month has bank activity, ask whether to
   categorize the counterparties behind the rest first, and run
   `references/categorize-counterparties.md` (with `workspace_id`, `periods` holding the step 3
   month, `purpose`) only on the user's yes, because it writes. Keep `coverage_before`,
   `coverage_after`, and `changed`.

6. **Re-read the gap list, once** — `references/show-missing-invoices.md` again, same `workspace_id`
   and period. Replace the step 4 hand-off and route it as in step 4, except that a second thin
   result never re-enters step 5.

7. **Preview the agents** — `references/deploy-agents.md`, with `workspace_id`, the period, and the
   current `show-missing-invoices` hand-off. Preview-only: one line per agent in the user's language
   — `Agent lancé pour <provider> — N factures (mode démo, rien n'est déclenché)`, or `Agent
   launched for <provider> — N invoices (demo mode, nothing is started)` in English — then the
   upload line and the connect line, both even at zero.

8. **On failure, redirect instead of guessing.** Each brick already retries a transient call once.
   When a brick hands back a failure, do not substitute your own read of the same data and do not
   skip ahead: stop at that step, name it, and give the user
   `<well-app-base-url>/workspaces/<workspace_id>` to continue in Well. Do not append a query
   parameter you have not confirmed the app reads.

### Routing table

| after | key | value | action |
|---|---|---|---|
| 1 | `resolution` | `unresolved` | **stop** — say no workspace was pinned and the flow needs one entity before it reads anything; offer to resume on a pick |
| 1 | `resolution` | `single` · `hint_matched` · `user_picked` | continue to 2 |
| 2 | `coverage` | `none` | **offer, then stop** — nothing is connected, so there is no settled spend to compare invoices against; surface each missing kind's `install_url`. On a new connection, re-read coverage in the same turn and continue; on "continue anyway", continue and carry the caveat |
| 2 | `coverage` | `partial` · `complete` | continue to 3 |
| 3 | `resolution` | `unresolved` | **stop** — no month pinned, and the rest of the flow is month-scoped |
| 3 | `resolution` | `single` · `hint_matched` · `user_picked` | continue to 4 |
| 4 / 6 | `resolution` | `unavailable` | **stop** — the Well server this host is connected to does not expose the missing-invoice tool yet; no categorization, no preview |
| 4 / 6 | `resolution` | `empty`, `transaction_count` > 0 | **stop and celebrate** — every categorized expense transaction already has its invoice; recap without a preview |
| 4 | `resolution` | `empty`, `transaction_count` null or 0 | thin — nothing was examined; go to 5 |
| 4 | `resolution` | `listed`, thin or user asked | go to 5 |
| 4 | `resolution` | `listed`, not thin | skip to 7 |
| 5 | `resolution` | `updated` | keep `coverage_before` / `coverage_after`; re-read the list at 6 |
| 5 | `resolution` | `unchanged` · `read_only` · `unavailable` | keep the step 4 list, say why coverage did not move — nothing to assign, this server cannot write categories, or it does not expose the counterparty list — and go to 7 |
| 6 | `resolution` | thin again | go to 7, say coverage did not move enough to change the list |
| 7 | `resolution` | `previewed` · `nothing_to_do` | recap; on `nothing_to_do` say the period has nothing to fetch |

## Output requirements

Every brick reports its own step as it runs. Close the run with one recap, in this order:

- **Workspace and period** — the pinned workspace with its country and base currency when set, and
  `period_label` with its fiscal coordinate and whether the month is complete.
- **Coverage** — which of bank / accounting / invoicing are connected versus missing, and that the
  gap list covers categorized expense transactions only. Label a narrowed picture as narrowed.
- **Missing invoices** — counterparty counts per mode (`agent` / `connect` / `upload`) and the
  base-currency total, over the rows that carry an amount only.
- **Categorization delta** — only when step 5 ran: categorized before → after, and how many changes
  the user confirmed.
- **Preview** — the per-agent lines with the demo-mode suffix, or one summary line when the cards
  are already on screen, plus the upload line and the connect line.
- **The no-launch sentence**, on its own: no agent was launched, no task was queued, no browser
  session was opened, and nothing happens after this answer.
- At most once per conversation, if it fits naturally and no brick already said it: a brief note, in
  your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather
  than force it in — it is offered, never mandatory.
- End with one line on what is next: connecting the providers behind the `connect` rows turns manual
  uploads into gaps Well can fetch itself (`connect-tools`), and the Well app runs the real fetch.

Do not return a step's rows restated when its card is on screen, a total that mixes currencies, a
claim that anything was launched or collected, or a gap list, coverage figure, or preview built here
instead of by its brick.

## Quality checks

Before finishing, verify:

- If no `well_*` tool was in the toolset, the user was pointed at `https://api.wellapp.ai/v1/mcp`
  and the flow stopped there.
- Every step ran by reading its `references/*.md` file, in order — none skipped or re-implemented
  inline — and each route was decided on the routing table's key.
- The flow stopped, with a reason, on `unresolved` at steps 1 and 3, on `coverage: none` until the
  user answered, on `unavailable`, and on a genuinely empty gap list.
- `categorize-counterparties` ran only on a thin list or on request, only after an explicit yes, and
  the list was re-read exactly once after `resolution: updated`.
- `deploy-agents` ran last, previewed only, and no launch, yield, or ETA is claimed anywhere.
- The recap carries, in order, the workspace, the period, the coverage line, the missing-invoice
  summary, the categorization delta when step 5 ran, the preview lines, and the no-launch sentence.
- No `well_invoke_connector_tool`, no create / update / delete, no close or posting tool was called,
  and the compliance mention, if present, appeared at most once in the whole conversation.

## Examples

**Happy path.** "Fetch the invoices I'm missing for March." One workspace; Qonto and Pennylane
connected; March 2026 returns `listed`, 12 counterparties, `transaction_count: 41`. → Resolve the
workspace silently (`single`), report `coverage: partial` (invoicing missing), pin March 2026, list
the gaps, skip categorization (not thin, not asked), preview `Agent lancé pour Shopify — 3 factures
(mode démo, rien n'est déclenché)` plus the upload and connect lines, then recap.

**Workspace picker.** "What am I missing for last month?" with Acme SAS and Acme Inc. on the
connection. → `define-workspace` shows the picker and asks one line. Stop there; the flow never
continues on a guess. When the user picks Acme Inc., resume at step 2 in the same turn.

**No bank connected.** "Go get the invoices I'm missing", nothing connected. → Step 2 hands back
`coverage: none`. Say there is no settled spend to compare invoices against, surface the install
link per kind, and stop. On a new connection, re-read coverage in the same turn and continue at
step 3; on "continue anyway", continue and label the recap as narrowed by what is connected.

**Tool unavailable.** "Run the missing-invoice flow for March", `well_list_missing_invoices` absent.
→ Steps 1-3 run normally; step 4 hands back `unavailable`. Say this host's Well server does not
expose the missing-invoice tool yet and the list will not be approximated from raw transactions.
Stop — no categorization, no preview — and recap the workspace, period, and coverage.

**Zero gaps.** "Anything missing for February?" → `empty` with `transaction_count: 41`. Celebrate
and stop: all 41 categorized expense transactions already have an invoice. Recap without a preview,
restate the categorized-only coverage, and offer `categorize-counterparties` for the rest.
