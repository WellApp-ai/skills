---
name: close-books
requires: [define-workspace, connect-tools, resolve-own-company]
description: Drive a month-end close for a Well workspace to the point of approval — start the close for a named month, read what is blocking it, clear the blockers one at a time, prepare the close package, and mint the approval offer the user accepts in the Well app. Use when the user asks to "close the books", "close last month", "run the month-end close", "close March", "finish the close", or "what's left to close the period". This is a WRITE flow — it advances a real close run and can resolve tasks, so it shows the state and confirms before each step. It never locks the period itself; the final approval is a first-party click in Well by design. Requires a connected Well workspace with its bank and accounting tools synced; if none, it walks the user through connecting first.
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
- Confirmation of the workspace's own company, when it is not already set (see workflow step 3).
- A yes at each consequential step: resolving a task, preparing the package, and — outside this
  skill, in the Well app — accepting the final approval.

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
    unmatched.
  - `well_set_own_company` — set the workspace's own company (see step 3). A consequential,
    accounting-critical write — only call it on an explicit user confirmation, never silently.
- `well_get_schema` — call before reading any records root for the first time in a session; field
  names are workspace- and connector-dependent, never assume them.

**Composed skills.** Three atomic Well skills own the setup this flow depends on — invoke them,
don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no
  connection yet, and pins exactly one workspace. Supplies the `workspace_id` every call carries,
  and the `fiscal_year_start_month` behind the period.
- `connect-tools` — decides whether the bank and accounting connections are really synced (a fresh
  `last_successful_sync_at`, not a bare `enabled` flag). A close reads posted ledger and settled
  bank data, so an unsynced accounting or bank tool is a blocker to surface before starting.
- `resolve-own-company` — resolves which company is the workspace's own legal entity. The close
  refuses to start until this is set, and the answer decides invoice polarity.

All three ship with the `well-skills` plugin. This skill is also installable on its own, so the
workflow carries an inline fallback for each when it is absent.

## Workflow

Work the close **one blocker at a time**, re-reading `well_get_close_state` after every change so
the next step is decided by server truth, not by memory.

1. **Pin the workspace — run `define-workspace`.** Invoke it with
   `purpose: "to close this workspace's books"` and take its typed hand-off. Pass its
   `workspace_id` explicitly on every `well_*` call below, and never merge data across workspaces
   in one run. If it returns `resolution: unresolved`, stop — there is nothing to close.
   - **If `define-workspace` isn't installed**, do its three moves inline: with no `well_*` tool,
     tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on
     an auth error, start the OAuth/DCR flow and retry in the same turn; then take the single
     workspace, or ask which to use.

2. **Confirm the tools are synced — run `connect-tools`.** A close reads the posted accounting
   ledger and settled bank transactions, so both sides must be connected and actually syncing. If
   `connect-tools` reports the accounting or bank tool missing, still `connecting`, or in error,
   say so plainly and point at what to connect (`connect-bank` for the bank side) — a close started
   before the data has landed will only report blockers the user cannot yet clear. If the skill
   isn't installed, read `well_list_connectors` yourself and check for an enabled input connector
   with a recent `last_successful_sync_at` on the bank and accounting domains before continuing.

3. **Resolve the own company — run `resolve-own-company`** in `mode: strict`, with the pinned
   `workspace_id`, `purpose: "to close this workspace's books"`, and
   `consequence: "the close cannot start and invoice polarity is wrong"`.
   - Resolved → carry its `own_company_id` and continue.
   - Unresolved → `well_start_close` will refuse. If `well_set_own_company` is in your toolset,
     show the user the candidate companies (`well_query_records` on `companies`, or a company they
     name / create with `well_create_company`), let them **explicitly confirm** which one is theirs,
     then call `well_set_own_company` with that `company_id`. This is an accounting-critical write —
     never pick or set a company silently, and never infer it from the workspace name. If the tool
     is absent, point the user at `<well-app-base-url>/workspaces/<workspace_id>` to set it in the
     app, and stop until it is set.

4. **Find or start the close.** Call `well_list_flow_runs` and reuse a live close run for the month
   the user means if one exists. Otherwise confirm the month with the user — a calendar month that
   has already ended — and call `well_start_close` with `scope: { calendar_year, calendar_month }`.
   This is the one place you name a month; from here on, echo the server's fiscal scope verbatim.
   - A current or future month → `well_start_close` refuses. Name the last complete month instead
     and let the user confirm; never pin a future month.
   - Own company not set → it refuses with `own_company_unconfirmed`. Go back to step 3.

5. **Read the state — `well_get_close_state`** with the `flow_run_id`. It returns whether the
   period is closeable, the ordered blockers, and the run's fiscal scope. Keep that scope tuple to
   copy verbatim into later calls. Summarise for the user in plain words: the month, whether it is
   closeable, and what is blocking it — never invent a count the tool did not return.

6. **Confirm the scope — `well_select_close_scope`** with the `flow_run_id`, the run's scope tuple
   copied verbatim from step 5, and the run version. This advances the run to `scope_selected`. It
   is a no-op if the run is already there.

7. **Clear the blockers, one at a time.** After each resolution, re-read `well_get_close_state` and
   let the refreshed ladder decide the next step. For each blocker family, use the tool the ladder
   names:
   - A close task the ladder marks resolvable from chat → `well_resolve_close_task`. Do not call it
     on a task routed elsewhere (a document upload, an app-only action) — tell the user where to
     resolve it instead.
   - Settled spend missing its invoice → `well_get_close_proof_gaps` to read the gap, then, **only
     after the user agrees**, `well_enqueue_close_invoice_fetch` to queue the vendor-portal fetch.
     It runs in the background; say so, and that the invoices land later. If those tools are absent,
     point at the `fetch-missing-invoices` skill or the Well app.
   - Invoices flagged unmatched → `well_retry_close_reconciliation`. If it is absent, point at the
     Well app.
   - Uncategorised transactions → point at the `categorize-counterparties` skill or the Well app;
     this skill does not categorise.
   - A blocker with no MCP remediation available → name it, say where in Well to clear it, and stop
     rather than guessing.

8. **Prepare the package — `well_prepare_close_package`** once `well_get_close_state` shows zero
   blockers. It refuses while any blocker remains — if it does, go back to step 7 and clear what it
   names. This is a consequential step: state what it produces before calling it.

9. **Mint the approval offer — `well_prepare_close_period`.** This does not close the period; it
   creates the offer the user must accept. Report that the close is prepared and ready for approval.

10. **Hand off the lock to the user.** The period is locked only when the user accepts the offer in
    Well — a one-click first-party approval, by design; you cannot accept it over MCP and must not
    try. Tell the user plainly to open Well and accept the approval (point at the approval locator
    the tool returned, or `<well-app-base-url>/workspaces/<workspace_id>`). Explain in one line that
    Well requires a human to lock a period, which is why this last step is theirs.

11. **Confirm the lock — `well_get_action_receipt`** after the user says they accepted, to read the
    durable receipt and confirm the period reached `period_closed`. Report the outcome honestly; if
    the receipt does not show it closed, say so rather than implying success.

12. **On failure, redirect instead of guessing.** A transient (network/timeout) error on a *read*
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
- Before each consequential write (resolving a task, enqueuing a vendor fetch, preparing the
  package), a clear statement of what it does, and — for the vendor fetch — an explicit
  confirmation first.
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
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never
reaches you, so you cannot tell a host that drew the card from one that did not. Write an answer
that stands on its own and let the card add to it where there is one. Do not compose a second
rendering of state the tool already returned; where a visual the tool does not draw genuinely reads
better and the `well-design-system` skill is available, use it.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of
  a tool error.
- The workspace came from `define-workspace` (or step 1's inline fallback), and its `workspace_id`
  rode every `well_*` call.
- The bank and accounting sides were checked for a real recent sync via `connect-tools` (or the
  inline fallback) before the close started, and an unsynced side was surfaced, not ignored.
- The own company was resolved before `well_start_close`, and when it was set with
  `well_set_own_company`, the company was confirmed by the user, never inferred from the workspace.
- A calendar month was named only at `well_start_close`; every later fiscal coordinate was the
  server's scope copied verbatim, never derived or minted.
- A current or future month was refused, with the last complete month offered instead.
- `well_get_close_state` was re-read after every change, and each blocker was cleared with the tool
  the ladder named — never a fabricated resolution, never a task resolved that the ladder routed
  elsewhere.
- `well_enqueue_close_invoice_fetch` was called only after an explicit user yes, because it hands
  work to a browser agent.
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

Run `define-workspace` and pin the workspace. Run `connect-tools`; the bank and accounting tools
both show a recent sync. Run `resolve-own-company` (strict) — it reads the own company from the
setting. "Last month" is the last complete month, March 2026: call
`well_start_close({ scope: { calendar_year: 2026, calendar_month: 3 } })`. Read
`well_get_close_state` — two blockers: one uncategorised-transactions task and one settled payment
missing its invoice. Confirm the scope with `well_select_close_scope` (the server's scope, copied
verbatim). Point the user at `categorize-counterparties` for the categories; for the missing
invoice, read `well_get_close_proof_gaps`, and after the user agrees, call
`well_enqueue_close_invoice_fetch`. Re-read the state each time. Once zero blockers remain, call
`well_prepare_close_package`, then `well_prepare_close_period` to mint the offer. Tell the user the
close is ready and to accept the approval in Well — you cannot lock the period yourself. After they
accept, read `well_get_action_receipt` and confirm March 2026 is closed.

### Example request

"Close March 2026." The workspace has no own company set, and `well_set_own_company` is in the
toolset.

### Expected behavior

`well_start_close` would refuse with `own_company_unconfirmed`, so resolve the own company first.
Run `resolve-own-company` (strict); it comes back unresolved. Show the candidate companies, ask the
user which one is theirs, and only on their explicit yes call `well_set_own_company` with that
`company_id`. Then start the close for March 2026 and continue the normal flow. Never pick the
company for them, and never infer it from the workspace name.

### Example request

"Close this month." Today is 12 April 2026.

### Expected behavior

April 2026 has not ended, so a close cannot run on it. Say so in one line, offer the last complete
month — March 2026 — instead, and let the user confirm before starting. Do not pin a future or
running month.
