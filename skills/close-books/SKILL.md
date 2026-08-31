---
name: close-books
requires: [define-workspace, confirm-my-company, connect-bank, connect-tools, accounting-settings, define-period]
description: Drive a month-end close for a Well workspace to the point of approval — start the close for a named month, read what is blocking it, clear the blockers one at a time, prepare the close package, and mint the approval offer the user accepts in the Well app. Use when the user asks to "close the books", "close last month", "run the month-end close", "close March", "finish the close", or "what's left to close the period". This is a WRITE flow — it advances a real close run and can resolve tasks, so it shows the state before every step and asks first before retrying reconciliation or queuing a vendor invoice fetch, the two that need an explicit yes. It never locks the period itself; the final approval is a first-party click in Well by design. Requires a connected Well workspace with its bank synced — the only connection the close blocks on; an accounting connection is optional and makes the close richer. If none, it walks the user through connecting first.
---

# Close the books with Well

## Purpose

Take a workspace from "I want to close last month" to a ready-to-lock close package, over Well's
MCP server. The close is a deterministic server flow: the server computes readiness, the blockers,
and every fiscal coordinate. This skill orchestrates it — it names the month once, reads the server
state, clears blockers in order, prepares the package, and mints the approval offer. It never
computes readiness itself and never locks the period: the final lock is a first-party approval the
user gives in the Well app, by design.

## When to use this skill

Use this skill when the user asks things like:

- "Close the books for last month"
- "Run the month-end close for March"
- "What's left before I can close the period?"
- "Finish closing 2026-03"
- "Close my books"

## When not to use this skill

Do not use this skill when:

- The user only wants to *see* what is missing or unreconciled, not advance a close — use
  `show-missing-invoices`, `payment-invoice-lookup`, or a plain `well_get_close_state` read.
- The user wants to fetch missing supplier invoices as a standalone job, outside a close — use
  `fetch-missing-invoices`.
- The user wants to reopen or unlock an already-closed period — no MCP tool does that; point them
  at the Well app.
- The current or a future month is named — a close runs only on a month that has already ended.
  Name the last complete month instead and let the user confirm.

## Inputs

The user provides, or will be asked for:

- The month to close — a calendar month that has already ended (e.g. "March 2026", "last month").
- Confirmation of the workspace's own company, when it is not already set (see workflow step 2).
- A yes before retrying reconciliation or queuing a vendor invoice fetch, and — outside this skill,
  in the Well app — accepting the final approval.

## Tooling

This skill runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the
`well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the
user to add it at that URL, then retry. The close tools, and what each one does:

- `well_list_flow_runs` — list the workspace's flow runs, to find a close already in progress.
- `well_start_close` — start closing a calendar month, or resume the run that already exists for
  it. Input names the month as `calendar_year` + `calendar_month` (1-12); the server derives the
  fiscal period. **This is the only step where you name a month.** It refuses a current or future
  month, and refuses when the workspace's own company is not set.
- `well_get_close_state` — read the truth: whether the period can be closed, the ordered list of
  blockers (the remediation ladder), task and connector counts, and which actions are legal now.
  Call it after every change instead of trusting what an earlier turn reported. Its result carries
  the run's fiscal scope — **copy that scope tuple verbatim** into later calls; never derive or
  mint a fiscal coordinate yourself.
- `well_select_close_scope` — confirm the period the run closes, advancing it to `scope_selected`.
  Pass the run's scope tuple copied verbatim from `well_get_close_state`, plus the run version.
- `well_resolve_close_task` — resolve one close task the remediation ladder marks as resolvable
  from chat. Do not call it on a task the ladder routes elsewhere (e.g. a document upload).
- `well_prepare_close_package` — build the close package once zero blockers remain. It refuses
  while any blocker is open.
- `well_prepare_close_period` — mint the **approval offer** for the lock. This does NOT close the
  period; it produces the offer the user accepts in Well. You never close the period yourself.
- `well_get_action_receipt` — read the durable receipt after the user accepts, to confirm the
  period reached `period_closed`.
- Remediation tools, **used only when present in your toolset** — a close blocked on these
  families is cleared with the matching tool, otherwise point the user at the Well app or the named
  sibling skill:
  - `well_get_close_proof_gaps` — settled spend that is missing its supplier invoice.
  - `well_enqueue_close_invoice_fetch` — queue a background fetch of those missing invoices from
    the vendor. It hands work to a browser agent that visits vendor portals, so **confirm with the
    user before calling it** — mirror the caution `fetch-missing-invoices` applies.
  - `well_retry_close_reconciliation` — re-run reconciliation for invoices the ladder flags as
    unmatched. A state-changing orchestration action, not a read — **confirm with the user before
    calling it**, the same as the other consequential remediation tools here.
  - `well_set_own_company` — set the workspace's own company (see step 2). A consequential,
    accounting-critical write — only call it on an explicit user confirmation, never silently.
- `well_get_schema` — call before reading any records root for the first time in a session; field
  names are workspace- and connector-dependent, never assume them.

**Composed skills.** Six atomic Well skills own the setup this flow walks — invoke them in the order
below, don't reimplement them. The order mirrors the Well app's close flow so the chat and the app
feel like one product. Only three things must be true **before `well_start_close`** — the own company
is set, the fiscal year start is set, and the calendar month is named. The rest is ordered for parity
with the app, and the connections and categorisation are cleared as blockers after the scope is
chosen, in any order.

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no
  connection yet, and pins exactly one workspace. Supplies the `workspace_id` every call carries, and
  the `fiscal_year_start_month` behind the period. Ambient session context, not a numbered step.
- `confirm-my-company` — resolves which company is the workspace's own legal entity, and in
  `persist` mode sets it (`well_set_own_company`) on the user's explicit confirmation. **This is the
  one real start-gate:** the close refuses to start until the own company is set. The answer also
  decides invoice polarity.
- `connect-bank` — gets the bank feed connected and syncing. The bank is the **only connection the
  close treats as a blocker**, and no close tool repairs it — connecting happens on the connector
  surface, not through a `well_*` close call. It does not gate the *start*: an unsynced bank is a
  blocker to clear later, never a start refusal. **This flow gates it: an already-connected bank is
  skipped with a one-line note rather than re-shown as a connect card** (step 3) — `connect-bank`
  itself stays idempotent; the skip is decided here from a coverage read, not inside the brick.
- `connect-tools` — connects the accounting (and invoicing) side. **The close never blocks on a
  missing accounting tool**, so this step is for parity with the app and richer data, not a close
  prerequisite. Walk it, but never gate the close on it. **Same gate as the bank: an already-connected
  accounting tool is skipped with a note, and when it is missing, the connect card carries close-context
  wording** (step 4) — the brick stays idempotent, the gate and the wording live here.
- `accounting-settings` — sets the workspace's `fiscal_year_start_month`. The close derives the
  fiscal period from it and an unset value falls back to January, so it must be set **before** the
  month is named, and it locks once a period closes. The app's flow places it after the connections
  and just before the month — this flow follows that order. If no MCP tool to set the fiscal year is
  in your toolset, set it in the Well app first.
- `define-period` in **`mode: collect`** — collects exactly one calendar month through the period
  picker UX and hands its `calendar_year` + `calendar_month` back. It is *not* the commit: naming the
  month **is** starting the close, so this flow passes the collected month straight into
  `well_start_close`.

All six ship with the `well-skills` plugin. This skill is also installable on its own, so the
workflow carries an inline fallback for each when it is absent.

## Workflow

Work the close **one blocker at a time**, re-reading `well_get_close_state` after every change so
the next step is decided by server truth, not by memory.

The steps below mirror the Well app's close flow. Steps 1–6 are the setup the app walks in that
order (workspace, own company, bank, accounting, fiscal year, month); server-side only the own
company, the fiscal year start, and the named month are hard invariants, and they all matter
**before** `well_start_close`.

**This flow owns the order; the composed bricks do not.** Each brick ends its turn with its own
"next step" suggestion, tuned for a standalone run or another flow — `define-workspace` points at
`connect-tools`, `connect-bank` (with `define-period` installed) points at picking a month,
`connect-tools` points back at the bank check. Those hints are superseded here: after any brick hands
back, always continue to the **next numbered step below**, never to where the brick pointed — so no
step is skipped or re-run.

1. **Pin the workspace — run `define-workspace`.** Invoke it with
   `purpose: "to close this workspace's books"` and take its typed hand-off. Pass its
   `workspace_id` explicitly on every `well_*` call below, and never merge data across workspaces
   in one run. If it returns `resolution: unresolved`, stop — there is nothing to close.
   - **If `define-workspace` isn't installed**, do its three moves inline: with no `well_*` tool,
     tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on
     an auth error, start the OAuth/DCR flow and retry in the same turn; then take the single
     workspace, or ask which to use.

2. **Resolve the own company — run `confirm-my-company`** in `mode: strict`, `persist: true`, with
   the pinned `workspace_id`, `purpose: "to close this workspace's books"`, and
   `consequence: "the close cannot start and invoice polarity is wrong"`. This is the one setup step
   that is a real server start-gate — `well_start_close` re-reads `own_company` first and refuses
   with `own_company_unconfirmed` when it is unset — so it comes before the connections, exactly as
   the app orders it. In `persist: true`, when the anchor is unresolved and the user confirms which
   company is theirs, `confirm-my-company` sets it with `well_set_own_company` itself — the close no
   longer carries its own copy of that write.
   - **If `confirm-my-company` isn't installed**, do it inline: call
     `well_get_schema({ root: "workspaces" })` and read `workspaces.own_company`, treating null,
     absent-from-the-schema, and ambiguous alike as unresolved; never infer it from the workspace's
     name, logo, slug, or email domain. If it is unresolved and `well_set_own_company` is in your
     toolset, show the candidate companies (`well_query_records` on `companies`, or one the user
     names / creates with `well_create_company`), take an **explicit confirmation**, then call
     `well_set_own_company` with that `company_id` — accounting-critical, never silent, never
     inferred. If the tool is absent, point the user at
     `<well-app-base-url>/workspaces/<workspace_id>` and stop until it is set.
   - Resolved, read or written → carry its `own_company_id` and continue.
   - Still unset → `well_start_close` refuses with `own_company_unconfirmed`; resolve it before
     starting.

3. **Read connection coverage once, then connect the bank only if it is missing.** Read coverage
   without forcing a connect stop: run `connect-tools` in `mode: internal_check` with
   `kinds: [bank, accounting, invoicing]`, `required: [bank]`, the pinned `workspace_id`, and
   `purpose: "to close this workspace's books"`. It hands per-kind coverage back in the same turn and
   never stops. Keep that coverage for step 4 — read it once, not twice. Then gate the bank:
   - **Bank already connected and syncing** (an `input` bank row `is_connected` with a recent
     `last_successful_sync_at`, not `error` / `need_reconnect`) → **skip `connect-bank`.** Say so in
     one line — "Bank connected: Qonto, last synced <when>" — and continue. Never render the bank
     connect card for a bank the workspace already has: a redundant connect stop is exactly the
     friction this skips. The gate lives here, in the close flow; `connect-bank` itself stays
     idempotent and unchanged.
   - **Bank missing, in error, or needs reconnect** → run `connect-bank` (its default `flow_step`)
     with the pinned `workspace_id`, `required: false`, and `purpose: "to close this workspace's
     books"`. Its card renders and the turn ends on the user's Continue; take its typed `state` when
     the flow resumes. The bank is the only connection the close treats as a blocker, but it does not
     gate the *start* — an unsynced bank is a blocker to clear later, never a start refusal. No close
     tool repairs a bank connection; connecting or fixing it happens on the connector surface.
   - If `connect-tools` isn't installed for the coverage read, read
     `well_list_connectors({ kind: bank })` yourself for the bank row; if `connect-bank` isn't
     installed either, report the bank state from that row without blocking.

4. **Connect the accounting side only if it is missing.** Reuse step 3's coverage read — do not run a
   second `internal_check`.
   - **Accounting already connected** (an `input` `accounting` row `is_connected`, not `error`) →
     **skip `connect-tools`.** Say so in one line — "Accounting connected: Pennylane" — and continue.
     The close is never gated on accounting, so a redundant connect stop here only slows the user down.
   - **Accounting missing** → run `connect-tools` (its default `flow_step`) with
     `kinds: [accounting, invoicing]`, the pinned `workspace_id`, `required: []` (never required — the
     close never blocks on a missing accounting tool), `purpose: "to close this workspace's books"`,
     and **close-context card wording**: pass `title` / `subtitle` that name the close so the card
     reads as part of it, not a generic connect prompt — e.g. `title: "Connect your accounting tool for
     the close"`, `subtitle: "Optional. It makes the close richer, but the books close without it."`
     Adapt the wording to the close here rather than leaving the catalog's default; the connect card
     injects it. Walk it for parity and richer posted-ledger data, surface what is connected, and
     continue — **the server never treats a missing accounting tool as a close blocker** (posting runs
     on the standard chart of accounts), so never gate the close on it.
   - If `connect-tools` isn't installed, read `well_list_connectors` and report the accounting /
     invoicing coverage without blocking.

5. **Set the fiscal year start — run `accounting-settings`.** The close derives the fiscal period from
   `fiscal_year_start_month`, and an unset value falls back to January, so it must be right **before**
   the month is named (and it locks once the period closes). Read the current value from
   `well_list_workspaces` (`identity.fiscal_year_start_month`); a null value means it falls back to
   January. If it is unset, or the user says it is wrong, run `accounting-settings` to set it on their
   explicit confirmation — never guess it. This is a setup precondition, not the month selection —
   the month is named in step 6.
   - **If `accounting-settings` isn't installed**, do it inline: when the value is unset or wrong and
     `well_upsert_accounting_settings` is in your toolset, set it on the user's explicit confirmation
     (never guess it); if neither the skill nor that tool is available, point the user at the Well app
     to set it, and continue only once it is right.

6. **Collect the month and start the close — run `define-period` in `mode: collect`, then
   `well_start_close`.** First reuse a live run: call `well_list_flow_runs` and, if a close run
   already exists for the month the user means, resume it and skip to step 7. Otherwise run
   `define-period` in `mode: collect` with the pinned `workspace_id`, its `fiscal_year_start_month`,
   the bank's `state` from step 3 as `bank_state`, any month `hint` the user gave, **and
   `show_close_readiness: true`** — so the period picker surfaces each month's run-free close readiness
   (its `close_status` / `close_reason` and `missing_invoice_count` / `unposted_invoice_count`) right
   on the card, and the user sees whether the month is closeable, and roughly why not, **before**
   confirming it. `define-period` collects **exactly one** calendar month through the picker UX and
   hands back its `calendar_year` + `calendar_month`.
   - **The user's confirmation of the month is the deliberate go-ahead to start the close.** Starting
     is a write, so it rides an explicit choice, never a silent continuation from the setup steps: when
     the month comes from the picker, the user's card confirmation *is* that go-ahead; when it comes
     only from an up-front hint and no picker was rendered, state the month and its readiness and take
     an explicit yes before calling `well_start_close`. Never roll straight from the accounting or
     fiscal step into starting the close.
   - Naming the month **is** starting the close: pass the confirmed month straight into
     `well_start_close` with `scope: { calendar_year, calendar_month }`; from here on, echo the
     server's *fiscal* scope verbatim and never re-derive a coordinate.
   - **If `define-period` isn't installed**, confirm the last complete month with the user inline and
     pass it to `well_start_close` — never pin a month the user has not confirmed.
   - A current or future month → `well_start_close` refuses. Name the last complete month instead and
     let the user confirm; never pin a future month.
   - Own company not set → it refuses with `own_company_unconfirmed`. Go back to step 2.

7. **Read the state — `well_get_close_state`** with the `flow_run_id`. It returns whether the
   period is closeable, the ordered blockers, and the run's fiscal scope. Keep that scope tuple to
   copy verbatim into later calls. Summarise for the user in plain words: the month, whether it is
   closeable, and what is blocking it — never invent a count the tool did not return.

8. **Confirm the scope — `well_select_close_scope`** with the `flow_run_id`, the run's scope tuple
   copied verbatim from step 7, and the run version. This advances the run to `scope_selected`. It
   is a no-op if the run is already there.

9. **Clear the blockers, one at a time.** `well_get_close_state` returns the blockers; after each
   resolution, re-read it and let the refreshed ladder decide the next step. Some kinds have a close
   tool that acts on them — missing invoices, chat-resolvable tasks, and unmatched invoices; others
   the close only surfaces, and the fix lands on another surface (the bank connection, categorisation).
   By kind:
   - **Settled spend missing its invoice** → `well_get_close_proof_gaps` to read the gap, then, **only
     after the user agrees**, `well_enqueue_close_invoice_fetch` to queue the vendor-portal fetch. It
     hands work to a browser agent and runs in the background; say so, and that the invoices land
     later. If those tools are absent, point at the `fetch-missing-invoices` skill (or `deploy-agents`)
     or the Well app.
   - **Missing or unsynced bank transactions** → the bank side. No close tool repairs it — go back to
     step 3's `connect-bank`, or point at the connector surface / Well app. The close only surfaces
     this one.
   - **Uncategorised transactions** → point at the `categorize-counterparties` skill or the Well app;
     this skill does not categorise. Resolving the close task only seals the offer, it does not do the
     categorisation.
   - **A close task the ladder marks resolvable from chat** → `well_resolve_close_task`. Do not call
     it on a task routed elsewhere (a document upload, an app-only action) — tell the user where to
     resolve it instead.
   - **Invoices flagged unmatched** → **only after the user agrees**, `well_retry_close_reconciliation`.
     If it is absent, point at the Well app.
   - **A blocker with no MCP remediation** → name it in plain words, say where in Well to clear it, and
     stop rather than guessing.

10. **Prepare the package — `well_prepare_close_package`** once `well_get_close_state` shows zero
    blockers. It refuses while any blocker remains — if it does, go back to step 9 and clear what it
    names. This is a consequential step: state what it produces before calling it.

11. **Mint the approval offer — `well_prepare_close_period`.** This does not close the period; it
    creates the offer the user must accept. Report that the close is prepared and ready for approval.

12. **Hand off the lock to the user.** The period is locked only when the user accepts the offer in
    Well — a one-click first-party approval, by design; you cannot accept it over MCP and must not
    try. Tell the user plainly to open Well and accept the approval (point at the approval locator
    the tool returned, or `<well-app-base-url>/workspaces/<workspace_id>`). Explain in one line that
    Well requires a human to lock a period, which is why this last step is theirs.

13. **Confirm the lock — `well_get_action_receipt`** after the user says they accepted, to read the
    durable receipt and confirm the period reached `period_closed`. Report the outcome honestly; if
    the receipt does not show it closed, say so rather than implying success.

14. **On failure, redirect instead of guessing.** A transient (network/timeout) error on a *read*
    (`well_list_flow_runs`, `well_get_close_state`, `well_get_close_proof_gaps`) → retry that call
    once, then fall back. Never silently retry a *write* — `well_start_close`,
    `well_select_close_scope`, `well_resolve_close_task`, `well_prepare_close_package`,
    `well_prepare_close_period`, `well_set_own_company`, or `well_enqueue_close_invoice_fetch`:
    surface the exact error and ask the user how to proceed. If the workspace resolved but the flow
    cannot advance, link the user to `<well-app-base-url>/workspaces/<workspace_id>` to continue the
    close in the app.

## Output requirements

Return:

- The month being closed, in plain words, and whether the period is closeable — from
  `well_get_close_state`, never invented.
- The current blockers, each named with what clears it and where (a tool here, a sibling skill, or
  the Well app). When the list changes after a resolution, report the new state from a fresh read.
- Before each consequential write (resolving a task, retrying reconciliation, enqueuing a vendor
  fetch, preparing the package), a clear statement of what it does, and — for retrying
  reconciliation and the vendor fetch — an explicit confirmation first.
- After the package is prepared and the offer is minted: that the close is ready for approval, and
  the one action left for the user — accept the approval in Well. State plainly that you cannot lock
  the period yourself; a human approval is required by design.
- After the user accepts: the receipt outcome from `well_get_action_receipt` — closed, or not, told
  honestly.
- Every error surfaced exactly as returned, with a question about how to proceed — no silent retry
  on a write, no guessed correction.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is
  SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- If a fallback was used (MCP absent, workspace unresolved, flow stuck), the caveated note plus the
  workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the closing state in text regardless — you cannot know whether anything drew it. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of
  a tool error.
- The workspace came from `define-workspace` (or step 1's inline fallback), and its `workspace_id`
  rode every `well_*` call.
- The own company was resolved (step 2) before the connections and before `well_start_close`, and
  when it was set with `well_set_own_company`, the company was confirmed by the user, never inferred
  from the workspace — it is the one real start-gate.
- Connection coverage was read once (step 3's `connect-tools` `internal_check`), and each connection
  was **gated on that read**: an already-connected bank or accounting tool was skipped with a one-line
  note, never re-shown as a redundant connect card; only a missing/errored one rendered its connect
  card. The bank state was surfaced and an unsynced bank reported as a blocker to clear, not a start
  refusal; the accounting side was walked for parity, its connect card (when shown) carried
  close-context wording, and the close was **never gated** on it — a missing accounting tool is not a
  close blocker.
- The flow never rolled straight from the setup steps into `well_start_close`: starting the close rode
  an explicit user go-ahead — the month picker's confirmation, or an explicit yes when the month came
  only from a hint — never a silent continuation past the accounting or fiscal step.
- Before that go-ahead, each candidate month's run-free readiness from step 6 — its `close_status` /
  `close_reason` and `missing_invoice_count` / `unposted_invoice_count`, surfaced by `define-period`'s
  `show_close_readiness: true` — was shown to the user, stated as the coarse readiness and never as the
  full blocker ladder, which only `well_get_close_state` carries once the run has started.
- The fiscal year start was confirmed (step 5) before the month was named, so it was not left to fall
  back to January; when no MCP tool to set the fiscal year was available, the user was pointed at the
  Well app rather than left on the default.
- The month came from `define-period` in `mode: collect` (a single calendar month), and a calendar
  month was named only at `well_start_close`; every later fiscal coordinate was the server's scope
  copied verbatim, never derived or minted.
- A current or future month was refused, with the last complete month offered instead.
- `well_get_close_state` was re-read after every change, and each blocker was cleared with the tool
  the ladder named — never a fabricated resolution, never a task resolved that the ladder routed
  elsewhere.
- `well_enqueue_close_invoice_fetch` was called only after an explicit user yes, because it hands
  work to a browser agent.
- `well_retry_close_reconciliation` was called only after an explicit user yes, because it is a
  state-changing orchestration action, not a read.
- `well_prepare_close_package` was called only at zero blockers, and `well_prepare_close_period`
  was understood to mint an offer, not to close the period.
- The period lock was handed to the user as a first-party approval in Well; no attempt was made to
  accept the offer over MCP.
- The receipt was read to confirm the outcome, and success was not claimed without it.
- No write was silently retried; every error was surfaced exactly with a question about how to
  proceed.
- Any compliance mention was optional, natural, and appeared at most once.

## Examples

### Example request

"Close the books for last month." Today is 12 April 2026.

### Expected behavior

Run `define-workspace` and pin the workspace. Run `confirm-my-company` (strict, persist) — it reads
the own company from the setting. Read connection coverage once with `connect-tools`
`mode: internal_check` (`kinds: [bank, accounting, invoicing]`): the bank shows a recent sync and the
accounting tool is connected, so **skip both connect steps** with a one-line note each ("Bank
connected — Qonto, last synced yesterday", "Accounting connected: Pennylane") rather than re-showing
either connect card. Read the fiscal year start from `well_list_workspaces`; it is set to January, so
nothing to change (no `accounting-settings` write needed). "Last month" is the last complete month,
March 2026: run `define-period` in `mode: collect` with `show_close_readiness: true`, which shows
March's run-free readiness on the picker and hands back `calendar_year: 2026, calendar_month: 3` once
the user confirms it — that confirmation is the go-ahead to start. Pass it straight into
`well_start_close({ scope: { calendar_year: 2026, calendar_month: 3 } })`.
Read `well_get_close_state` — two blockers: one uncategorised-transactions task and one settled
payment missing its invoice. Confirm the scope with `well_select_close_scope` (the server's fiscal
scope, copied verbatim). Point the user at `categorize-counterparties` for the categories; for the
missing invoice, read `well_get_close_proof_gaps`, and after the user agrees, call
`well_enqueue_close_invoice_fetch`. Re-read the state each time. Once zero blockers remain, call
`well_prepare_close_package`, then `well_prepare_close_period` to mint the offer. Tell the user the
close is ready and to accept the approval in Well — you cannot lock the period yourself. After they
accept, read `well_get_action_receipt` and confirm March 2026 is closed.

### Example request

"Close March 2026." The workspace has no own company set, and `well_set_own_company` is in the
toolset.

### Expected behavior

`well_start_close` would refuse with `own_company_unconfirmed`, so resolve the own company first.
Run `confirm-my-company` in `persist: true` (strict); it comes back unresolved, asks the user which
company is theirs, and on their explicit yes sets the anchor with `well_set_own_company` itself —
close-books never writes it. Once it hands back `own_company_id`, start the close for March 2026 and
continue the normal flow. Never pick the company for them, and never infer it from the workspace name.

### Example request

"Close this month." Today is 12 April 2026.

### Expected behavior

April 2026 has not ended, so a close cannot run on it. Say so in one line, offer the last complete
month — March 2026 — instead, and let the user confirm before starting. Do not pin a future or
running month.

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
