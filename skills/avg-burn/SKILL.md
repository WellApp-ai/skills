---
name: avg-burn
description: Answer "what is our burn rate?" using Well's MCP financial graph — the trailing average of real monthly outflows, computed here from the workspace's own transactions, with every check it rests on visible and repairable. Use when the user asks "what's our burn rate", "how much are we spending per month", "what's our monthly burn", or "how much goes out each month". Requires a connected Well workspace with bank data; if none is connected, this skill guides the user to connect one first.
---

# Check Your Average Monthly Burn with Well

## Purpose

Report one figure: the average monthly outflow.

This skill computes it, rather than reading it off a tool that computed it elsewhere. That is the point. A burn is a policy — which months, which movements count, which categories the business does not treat as spend — and a policy the reader cannot see is one they cannot check. Every rule below is stated here and applied here; `well_sum_transactions` does the arithmetic over exactly the filter this skill names, and holds no opinion of its own.

The window matters as much as the number. The average divides by the whole window, so a window containing months with no recorded spend reports a LOWER figure than the months that did — honest, but it reads as "the typical month" unless you say otherwise.

## When to use this skill

Use this skill when the user asks:

- "What's our burn rate?"
- "How much are we spending per month?"
- "What's our monthly burn?"
- "How much goes out each month?"

**What the figure is, arithmetically.** This is not a description of something else's behaviour. It is what the steps below do:

- **Sum of outflow magnitudes over the window, divided by every month IN the window.** The divisor is the window length, never the count of months that carried spend.
- **Outflow is elected from the window's own rows, not read off the sign.** Which sign means money leaving is a property of the feed. Step 10 measures it; two windows over the same workspace can differ and both be right.
- **Internal transfers are excluded structurally, not by category.** A movement whose two payment-means legs both resolve to accounts the workspace owns is not spend leaving the business. No category, label, or transaction type decides this, so recategorizing a row does not change the burn.
- **A fixed category list could not replace that rule.** Internal or external is a fact about the counterparty account, not about the transaction. A transfer between two accounts you own is internal; the same transfer to a sister company at a bank you have not connected is external, and counts. Category, label and amount are identical in both cases. Close one of your own accounts and yesterday's internal transfer reads as external today, its category unchanged.
- **Card spend lands on its repayment date, not its purchase date.** What the feed delivers is the repayment leaving the bank account, so a window can look low simply because a repayment falls just outside it. This is a property of the data, not a rule these steps apply.
- **FX is applied per row before summing**, into the workspace's base currency.
- **The window's anchor is the month step 4 asked for, never today's date.** `define-period` refuses a month that has not ended, so a mid-month run cannot report a partial month as a full one.

## When not to use this skill

Do not use this skill when:

- The user wants **how long the cash lasts** — use `runway`. It composes this burn with the cash position; do not divide the two yourself here.
- The user wants **what the spend is made of** — use `cost-structure`. That covers a single closed month by category and will not sum to a trailing average, so the two are not a decomposition of one another.
- The user wants **cash projected forward** — use `cash-forecast`.
- The user wants **inflows as well as outflows**, reconciled — use `cash-flow-waterfall`. This skill reports outflow only.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. This skill never picks a workspace itself.
- A reporting period — a calendar year and month — to anchor a past window rather than the live one. This skill never infers a month from today's date; when the user has not named one, step 4 asks on a card.
- A window length in months (default 3). Widen it to smooth a lumpy month, narrow it to react faster.
- Categories that are not spend for their business. Step 11 asks; nothing is exempt by default. The exclusion is keyed on the category, so something the reader thinks of as a transaction type has to be exempted through the category those rows carry.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_sum_transactions` — the arithmetic. Takes the window, the grouping, whether to drop internal transfers, and the exempted category keys; returns per group `sum_negative`, `sum_positive` and both counts. It defines no burn: this skill states the policy and that tool applies it.
- `well_render_burn` — the card. Takes the figure this skill computed and the policy behind it, and renders both; it measures nothing and refuses a figure whose method is missing or self-contradictory. Well derives no burn of its own, so this is the only way the number reaches a card.
- `well_list_workspaces` — how step 1 resolves the workspace.
- `well_query_records` — the sync-log, account, transaction-count and uncategorized reads in steps 5 to 9. Step 3 reads connector state through `well_list_connectors` alone; a `well_query_records` call on `workspace_connectors` bypasses that logic.
- `well_get_schema` — read once per session before the first `well_query_records` on a root.
- `well_list_connectors` — how step 3 surfaces install links.
- `well_list_periods` — how step 4 renders the anchor-month picker. Reads `purpose: "analysis"` so the card offers only months this skill can report on.
- `well_switch_workspace` — writes the picked month server-side; also how step 1 resolves a named workspace hint.
- `well_wait_for_selection` — how a card step resumes when the next message needs its answer but is not itself the pick.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by step 1.

## Workflow

**Every step is a gate, and a gate that fails stops the run.** It puts the repair on screen and says what is at stake; it does not report a figure anyway with a caveat attached. A number nobody can trust is worse than a stop that says why.

**A read that fails is not a gate that passed.** Every gate below decides on the result of a call, so the call erroring and the call returning "nothing wrong" are different outcomes and must never collapse into each other. On a failed or partial read, the gate's answer is unknown: stop, say which read failed, and offer Re-check. A gate that treats an error as a pass reports a figure on evidence it never obtained, which is the one failure this whole file exists to prevent.

**A repaired gate resumes where it stopped.** Each card's Continue names its own step, so the run re-runs that step alone and carries on. It never re-enters at step 1: a picker the reader already answered must not appear twice.


### Stage A — scope

1. **Pin the workspace.** `[1]` 
Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. A card click executes server-side and prefills a message in the user's composer — rendering a card therefore ends the turn, and the sent message is how the routine resumes.

Confirm the Well MCP server is configured — if `well_list_workspaces` (or any `well_*` tool) is not available, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop until it's there.

Call `well_list_workspaces()`.
- Auth error → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry `well_list_workspaces()` yourself in the same turn and continue — do not ask the user to confirm they signed in.
- `success: false` with a non-auth error → retry once; on a second failure, do not invent a workspace — tell the user and give them `<well-app-base-url>` to open Well directly.
- Zero workspaces → the account has no workspace yet. Say so, point the user to Well to finish signing up, and return `resolution: unresolved`.
- `session.pinned_workspace_id` set, and THIS conversation established it (its own picker click or typed choice earlier in the conversation), and the user is not asking to pick or switch → use it silently, map it to its row, `resolution: user_picked`, skip straight to the hand-off. A non-empty `session.workspace_queue` alongside it means a multi-pick is mid-walk — hand off `multi_picked` with the pin first and the queue behind it.
- `session.pinned_workspace_id` set, but this conversation never rendered the picker nor took a typed choice → it's another conversation's leftover. Ignore it and resolve as if unset. Never mention it — "already pinned" is forbidden phrasing — and never skip the picker because of it.

Resolve without asking when you can:
- Exactly one workspace → use it, `resolution: single`. Say which one in one line; do not ask for confirmation and do not call `well_switch_workspace`.
- Several workspaces and a hint (a `workspace_id`, name, or company behind it) → match it exactly on `workspace_id`; otherwise case-insensitively on `workspace_name`, `identity.registered_name`, `identity.trade_name`, or — for a country hint such as "my US entity" — on `identity.country` (ISO code). Exactly one match → use it, `resolution: hint_matched`, say which one you matched, and call `well_switch_workspace({ workspace_id })` so a later call can't fall back to a sibling entity. Zero or several matches → fall to the picker below; never pick the closest name.
- A hint naming several entities ("FR and US", "both my companies") is a sequence, not an ambiguity — split it into fragments, match each exactly as above, keep the user's order. Every fragment matching exactly one distinct workspace, and at least two distinct workspaces matched → call `well_switch_workspace({ workspace_ids: [...] })` once, in that order — the first is pinned, the rest become the session's `workspace_queue` — `resolution: multi_picked`. Any fragment matching zero or several workspaces → fall to the picker; never resolve part of a compound hint and drop the rest silently.

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to measure your average monthly burn" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

Resolve the next message after the card, in this order, never by re-asking:
- The message is the card's prefill ("Continue in <name>", or the multi form "— then …") → the click already pinned it server-side. Acknowledge in half a sentence and continue — never re-verify with an extra call, never call `well_switch_workspace` for it. A single name → `resolution: user_picked`; the multi form → `resolution: multi_picked`.
- The message names one or more workspaces in its own words → map each to its `workspace_id` from the earlier result — never a guessed id — then call `well_switch_workspace` yourself (`workspace_id` for one, `workspace_ids` for several, in the user's order). A name matching zero or several rows is asked about, never guessed.
- The message declines ("later", "not now") → `resolution: unresolved`. Say nothing was pinned and stop; do not call `well_wait_for_selection`, do not run any workspace-scoped call.
- Any other message that needs the workspace → call `well_wait_for_selection({ kind: "workspace", timeout_s: 10 })` once. `selected` → continue on `selection.workspace_id` (an empty `selection.workspace_queue` is `user_picked`, non-empty is `multi_picked`). `no_selection_yet` → one line asking to click the card, end the turn.

Emit the hand-off:

```yaml
workspace_id: <uuid>
workspace_name: <name or null>
is_primary: <true|false>
identity:
  registered_name: <value or null>
  trade_name: <value or null>
  country: <ISO code or null>
  base_currency: <ISO code or null>
  fiscal_year_start_month: <1-12 or null>
resolution: single | hint_matched | user_picked | multi_picked | unresolved
workspaces: [{ workspace_id, workspace_name, identity, ... }, …]  # multi_picked only — pinned entry first, then the queue in order
```

On `unresolved`, every other key is null. Pass `workspace_id` explicitly on every `well_*` call from here on, pinned or not — a pin changes what an omitted argument falls back to, it does not make the argument optional.

On `multi_picked`: the caller runs its whole walk on the pinned workspace first, then calls `well_switch_workspace({ workspace_id: <next> })` on the next queue entry (read from `well_list_workspaces`' `session.workspace_queue`, never from chat) and repeats. Each pass carries its own `workspace_id` explicitly and gets its own recap — nothing is merged across two entities: no shared row, no combined total.

Verify before moving on: exactly one workspace is pinned, or `resolution: unresolved` — never two, never a merged view; `session.pinned_workspace_id` was trusted only when this conversation established it; a hint resolved only on an exact id match or an unambiguous case-insensitive name match; `well_switch_workspace` was called exactly once on a hint match or typed pick and not at all for a pick the card itself already made; on `multi_picked`, the loop rule (one entity at a time, own recap, no merging) was stated in the hand-off.


2. **Confirm the accounting settings this figure reads.** `[2]` 
The workspace is already pinned — pass its `workspace_id` on the call below.

An earlier step may already have handed one of these fields forward. Take what the hand-off carries, and query only for what it does not — a value already in hand does not earn a second round-trip.

For anything still missing: read `well_get_schema({ root: "workspaces" })` once per session, then one `well_query_records` on `workspaces` for this workspace's accounting settings.

Ask for exactly what the figure consumes and nothing else: `base_currency`. A field the computation never reads is not a gate — demanding a fiscal year start for a figure measured in calendar months blocks a workspace on a value that would change nothing.

Present → hand the values back and carry on. Absent → stop. Say which field is missing and what it decides ("so every amount can be converted into one currency"), and point the user at `<well-app-base-url>/workspaces/<workspace_id>` to set it. A settings row that does not exist at all reads the same as one whose field is null: both are unset, and neither is guessed.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the settings could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: each requested field with its value or `null`, and `resolution: complete | incomplete`.

Verify before moving on: only the fields the computation reads were required; a missing field stopped the run rather than being defaulted; no value was inferred from the workspace's name, country, or any other field.

   - Only `base_currency`. This figure is measured in calendar months and never reads a fiscal year start, so requiring one would block a workspace on a value that would change nothing.

3. **Confirm the bank connection.** `[3]` 
The workspace is already pinned — pass its `workspace_id` on the call below; do not re-resolve it here.

Read the current coverage in one call: `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick; `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind; `well_list_connectors({ workspace_id })` otherwise (one unscoped call for two or three kinds — one call renders one card, and a turn never renders two).

For each of the requested kinds —
- `bank`
— keep only rows whose `direction` is `input` and whose `data_domains` contains that kind (never a display name or `category_id`), and read each qualifying row's state in this order, first match wins:
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install.
3. `enabled` with `last_successful_sync_at` set → **connected** (note "data may be partial" if `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — treat as connected for the run.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn and keep going. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off and let the caller decide what to do — do not turn the read into a stop.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `coverage: none` → stop; burn cannot be measured. The install links are already on screen, so do not add a second set.

4. **Ask which month anchors the window.** `[4]` 
The workspace is already pinned — pass its `workspace_id`, and `fiscal_year_start_month` from its hand-off (default `1`, calendar-aligned, and say so when it was null), on every call below.


Reuse a selection this conversation already wrote: when the session holds `selected_periods` that THIS conversation itself established (its own card click or typed months) and it holds exactly one month and the user isn't asking to change the month, use it silently and skip straight to computing coordinates. A written selection carrying more than one month belongs to an earlier, different-purpose call in this same conversation — it is not a fit for a single-month pick, so fall through to the hint and picker below rather than silently anchoring on its first entry. A `selected_periods` present at conversation start that this conversation didn't write is another conversation's leftover — ignore it, never mention it, and resolve as if unset.

Read the hint before anything else — a hint that resolves is written server-side at once via `well_switch_workspace({ periods: [...] })`:
- A month plus a year ("2026-03", "March 2026") → that month, `resolution: hint_matched`.
- A bare month name ("March") → the most recent occurrence that has already ended — say which year you took.
- "last month" → the last complete month. "this month" / the running month or later → refuse it the same way as a future month, and name the last complete month instead. Every month this routine pins has ended.
- Several months ("March and April", "Q1") → refuse in one line — a report anchors on a single month — name the months you read, and ask which one to take.

With no usable hint, end the turn on the picker: call `well_list_periods({ workspace_id, purpose: "analysis" })` when it's in your toolset (its result renders the period picker card, single-select — one month anchors the figure being reported, don't restate the months under it). End with one line — pick the month on the card, "to measure your average monthly burn" — and stop. When the tool is absent, propose the last complete month in one line and ask to confirm or name another. If the pick comes back with more than one month, refuse in one line and ask which to keep.

Resolve the next message, in this order: the card's prefill ("Work on <Month Year>...") → the click already wrote it, acknowledge in half a sentence, `resolution: user_picked`; a typed month or months → more than one is refused the same way as a multi-month hint — take a single month, or ask which one; one month resolves and writes with `well_switch_workspace({ periods })`, `resolution: user_picked`; any other message needing the period → `well_wait_for_selection({ kind: "periods", timeout_s: 10 })` once, `selected` continues, `no_selection_yet` asks once more and stops; a decline ("later") → `resolution: unresolved`, say nothing was pinned, stop.

For each selected month, compute `date_range` (first day to real last day, leap years included), `is_complete: true` (always true here — a month that hadn't ended was refused earlier), and the fiscal coordinate — exactly this formula, never improvised, since it's the same arithmetic Well applies server-side:

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

Then set `has_activity` once for the whole selection. When the bank state passed in is `missing` or `error`, no settled activity can have landed — set `unknown` and skip the probe. When it is `connected`, run the probe below; on any other value, treat it the same as absent. When the probe runs: call `well_get_schema({ root: "transactions" })` once per session, then one `well_query_records` on `transactions` (`workspace_id`, `limit: 1`) ranging `executed_at` over the selected months' own intervals only — one interval per run of consecutive months, `_or`-ed together, never one span from earliest to latest (a March-plus-May pick must never report April's activity). At least one row → `true`. Zero rows → `false` only when the bank state was `connected`; otherwise (or on a failed read) → `unknown` — never report `false` when you couldn't actually tell.

Never call `well_start_close` or any close/lock/posting tool — this routine only reads and writes the period selection.

Emit the hand-off:

```yaml
periods:
  - calendar_year: <int>
    calendar_month: <1-12>
    fiscal_year: <int>
    fiscal_period: <1-12>
    label: <text>
    date_range: { from: <YYYY-MM-DD>, to: <YYYY-MM-DD> }
    is_complete: true
period_label: <text — dash for consecutive months, "and" when the selection skips one>
has_activity: <true|false|unknown>
resolution: single | hint_matched | user_picked | unresolved
```

On `unresolved`, every other key is null/empty.

Verify before moving on: no `well_switch_workspace` call here ever pinned a workspace — every call carried `periods`, none named a workspace to pin; a month that hadn't ended was refused, never pinned; `fiscal_period`/`fiscal_year` came from the formula for every month, period 13 never produced. `has_activity` was `false` only behind a `connected` feed and an empty probe, `unknown` on anything else including a missing/absent `bankState`; the probe ranged `executed_at` alone, over the selection's own intervals, never across a gap it doesn't cover. `well_list_periods` carried `purpose: "analysis"` on the call, a multi-month pick or typed multi-month answer was refused at every entry point exactly as `collect` mode does, and the `periods` list in the hand-off carried exactly one entry rather than the general multi-select shape.


### Stage B — has the data landed

5. **Confirm every sync has finished, and recently.** `[5, 12, 13]` 
The workspace is already pinned, and the connectors are already known to be connected — this checks whether what they carry has landed, which coverage does not answer.

One `well_query_records` on `workspace_connector_sync_logs` for the connected connectors: read each one's latest row's `status` and `completed_at`.

A sync still running → stop and say which connector, "before the burn is measured". Offer **Re-check** rather than a wait: nothing here polls, and a reader who watched the sync finish is the fastest signal there is.

A latest sync older than 24 hours → stop, name the connector and the age, and offer both Re-check and the reconnect link. Stale data makes a figure old rather than wrong, and saying which it is matters more than the figure.

Every connector finished and recent → hand the timestamps back and carry on.

**Resuming.** The Re-check prefill names this step, so a run that comes back re-reads the sync logs alone and continues from here. It never re-enters at the workspace or the period: those were answered already, and asking twice reads as the routine having lost its place.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say freshness could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: per connector, its latest `status`, `completed_at`, and age in hours; `resolution: fresh | syncing | stale`.

Verify before moving on: freshness came from the sync logs rather than from connector state; a running sync and a stale one were reported as different situations; the age was stated, not summarized as "recent".

   - A polling loop would sit here until every sync finalizes. This skill does not poll: it stops, and Re-check is how the reader drives it forward. A loop that waits on its own gives a reader nothing to do and no way to tell a slow sync from a stuck one.
   - A connector step 3 passed through as `connecting` has no sync row at all, so it matches none of the branches above. Treat it as not yet landed: it stops the run the same way a stale sync does, and Re-check is the affordance.

6. **Confirm the window holds transactions.** `[11]` 
The workspace and the window are already pinned, to measure your average monthly burn.

One `well_query_records` on `transactions` (`limit: 1`) ranging `executed_at` over the window's own interval, scoped to the workspace. Read `totalCount`, not the rows: the question is whether the window holds anything, and one count answers it in one call.

At least one → carry on, and keep the count.

None → stop. A window with no transactions produces a figure of zero, and zero standing on nothing measured is not a reading — say that instead of reporting it. Two situations look identical here and must not be described identically: a feed that has delivered nothing yet, and a real month in which nothing moved. The freshness step above tells them apart, so cite what it found rather than guessing.

Offer **Re-check** when the feed is the likely cause, and offer the period picker when the window may simply be the wrong one.

**Resuming.** Either affordance names this step in its prefill, so a run that comes back re-counts the window alone and continues from here.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the activity check could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: `transaction_count`, the window it covers, `resolution: has_activity | empty`.

Verify before moving on: the count came from `totalCount` rather than from walking rows; the window ranged `executed_at` over its own interval only; an empty window was never reported as a burn of zero.

   - Step 4's picker ran its own probe, over the anchor month alone. This one ranges the whole trailing window, so the two answer different questions and a month with activity does not settle the window. Count here rather than reusing that result.

### Stage C — whose accounts

7. **Attach every account to a company you own.** `[9, 10]` 
The workspace is already pinned.

One `well_query_records` on `accounts` for this workspace, reading each account's owning company and its `ownership`.

Two things fail here, and they are one card because they are one decision — whose account is this:

- No company attached. Nothing can place the account on either side of a transfer.
- `ownership` unresolved. The account has a company, but whether the workspace owns it is unanswered.

Either → stop, list the accounts, and surface the assignment card so the reader picks the company per account. This is a genuine decision only they can make: an account's owner cannot be inferred from its name, its bank, or the company that appears most often beside it, and a guess here is indistinguishable from a fact in everything computed afterwards.

Say what it decides — "so a movement between two of your own accounts can be told from money leaving".

**Resuming.** The card's Continue names this step, so a run that comes back re-reads the accounts alone and continues from here.

All accounts resolved → hand them back and carry on.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the account links could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: per account, its id, name, company, and ownership; `unresolved_count`; `resolution: complete | unresolved`.

Verify before moving on: ownership was read rather than inferred; both failures were surfaced as one decision; no account was assigned a company on the reader's behalf.


**What stage C does not gate, and why it matters to the answer.** Three more conditions bear on the figure without gating it: every transaction resolving to an account `[6]`, carrying a payment type `[7]`, and transfers resolving both legs `[8]`. Those are extraction and reconciliation gaps, not decisions a reader can make: the rows that fail them are the ones the connector could not resolve, and a picker asking someone to hand-enter what a sync should have delivered is not a repair. So they are counted rather than gated.

**Count them here, because the answer has to carry the number.** One `well_query_records` on `transactions` over the window, scoped to the workspace, reading `totalCount` under a filter for a null account. Hand the count forward as `unplaceable_count` alongside the window's own `transaction_count` from step 6. A transaction with no leg on a known account cannot be placed inside or outside the transfer rule, so that ratio is the bound on how much of the figure is certain, and it is what the confidence line reports.

### Stage D — classification

8. **Categorize the window.** `[14]` 
The workspace and the window are already pinned.

One `well_query_records` on `transactions` over the window, filtered to rows with no category. Read `totalCount` and, when it is non-zero, the rows themselves so the card has something to list.

None → carry on.

Any → stop and surface the categorize card for the window. Say how many rows and how much of the window's value sit behind them, because those two numbers are what tell a reader whether this is a minute of work or an afternoon, and say what it unlocks — "so the categories you exempt can actually be applied".

Do not offer to categorize them yourself, and do not propose labels unless the reader asks. The card carries the classifier's own proposals where it has them; a second opinion typed into the chat competes with the one on screen.

**Resuming.** The card's Continue names this step, so a run that comes back re-counts the window alone and continues from here. A reader who fixed some but not all comes back to the same stop with a smaller number, which is progress rather than a failure.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the categorization coverage could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: `uncategorized_count`, the value behind it, `resolution: complete | outstanding`.

Verify before moving on: the count covered the window and nothing wider; the stop stated both the count and the value at stake; no category was assigned or proposed outside the card.


9. **Settle the currency.** `[15]` Group the sum by currency and convert per row. 
The workspace is already pinned — pass its `workspace_id` on every call below.

Group the input amounts by currency for the rate lookup **only** — keep every tagged row, since the rate found for a currency gets applied back to each of its rows later, not just to a subtotal.

Settle the target currency: the caller's value if given, otherwise the workspace's `identity.base_currency`. If both are absent, ask rather than guessing, or fall back to reporting per currency and say why.

Take the single-currency shortcut (report the one total, `resolution: single_currency`, no rate lookup) only when that one currency already equals the target currency, or when the mode is `per_currency`. A lone *foreign* currency, with conversion asked for, is not a shortcut — convert it like any other.

Read each non-target currency's rate: `well_get_schema({ root: "exchange_rates" })` once per session, then look up the pair as of the as-of date (default today). An exact-date rate → use it. No exact-date rate → use the most recent rate at or before the as-of date, and record that date — never a rate dated after it, and never an arbitrary nearby one. Check pair direction against the schema before dividing rather than multiplying.

A missing rate excludes that one currency — leave it out of the converted total, keep it in the per-currency breakdown, carry it in `excluded` with the reason, and mark the total `partial`. Never drop a currency silently.

Convert per row, then total: apply each currency's rate to every tagged row in that currency, not just to its subtotal, then sum the converted rows.

Emit the hand-off:

```yaml
target_currency: <ISO code or null>
as_of: <YYYY-MM-DD>
converted_total: <number or null>
per_currency:
  - currency: <ISO code>
    native_amount: <number>
    converted_amount: <number or null>
    rate: <number or null>
    rate_date: <YYYY-MM-DD or null>
    rate_is_exact: <true|false>
converted:
  - tag: <caller's row id>
    currency: <ISO code>
    native_amount: <number>
    converted_amount: <number or null>
excluded: [{ currency: <ISO code>, reason: <text> }, …]
partial: <true|false>
resolution: converted | per_currency | single_currency | unresolved
```

Verify before moving on: the single-currency shortcut was taken only when that currency already equalled the target or the mode was `per_currency`; every converted figure carries the rate and rate date used, with the fallback date stated when an exact-date rate wasn't available; no rate dated after the as-of date was used; a currency with no available rate was excluded explicitly and the total marked `partial`; no total blends currencies anywhere in the output.

   - A currency value that is not an ISO code is not a currency. Some rows carry free text in that field; they cannot be converted, so exclude them, count them, and say so rather than letting a rate lookup fail on a line of payslip text.

10. **Elect the sign convention.** 
Which sign means money leaving is a property of the FEED, not of the data model. Most connectors store an outflow as a negative amount; some store it as a positive magnitude and carry the direction elsewhere. Two windows over the same workspace can differ, and both be right.

So it is measured, never assumed — "before any outflow is totalled". It costs no extra call: the sum returns `sum_negative`, `sum_positive`, `count_negative` and `count_positive` per group, and the counts are the evidence.

Read them over the whole window, not per month: one month of a signed feed can hold no negatives at all, and electing per month would flip conventions mid-window and total two different things together.

- Negatives are a substantial share of the rows → the feed is **signed**, and the outflow is `sum_negative` as returned. It is already a positive magnitude: the sum totals the ABSOLUTE amount of the rows on each side, so neither subtotal is ever negative. Hand it on unchanged. Negating it would report a negative burn on every signed-feed workspace, which is most of them.
- Almost no negatives, and positives throughout → the feed records **magnitude only**, and this sum cannot separate direction. Stop. The sum groups by month, currency and category, and none of those carries direction, so adding the two subtotals would total every row in the window and count customer payments and refunds as spend. Say that this feed keeps direction in a field the sum cannot filter on, and that the burn cannot be computed from it as things stand.
- Neither shape is clear → say so and stop. A convention elected from ambiguous evidence produces a confident figure that may be inverted, which is worse than no figure.

State which convention you elected and the counts behind it, so a reader can check the choice rather than take it.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the convention could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: `convention: signed | magnitude | ambiguous`, both counts, and — for a signed feed only — the outflow as a positive magnitude.

Verify before moving on: the election came from counts rather than from a provider name or a field label; it was made once over the window; the elected subtotal was handed on unchanged rather than re-signed; a magnitude-only feed stopped rather than totalling both subtotals; the choice and its evidence were both stated.

    - Before the exemptions, not after. Step 11 shows each candidate category's share of the window's outflow, and there is no outflow to apportion until the sign that means "leaving" is settled.

11. **Confirm the exemptions.** `[16]` 
The workspace, the window, and the categories are already settled.

Internal transfers are already out, structurally, by the leg rule — a movement with both legs on accounts the workspace owns never entered the sum. Do not offer them here and do not describe this step as excluding them: repeating an exclusion that already happened invites a reader to think it did not.

This is the second exclusion, and it is the reader's alone: what is genuinely not burn for their business. Loan principal, an intra-group recharge, something they treat as investment rather than cost.

**The exclusion is keyed on the category, and only on the category.** The sum filters on category keys, so an exemption the reader thinks of as a transaction type has to be made through the category those rows carry. Offer categories, take the selection as category keys, and if the reader names a type that no category isolates, say the sum cannot exclude it rather than accepting a selection that would be silently dropped.

Call the sum grouped by category once, so every option carries its own share of the window, then surface the exemption card. A list of category names with no amounts asks the reader to decide blind, and the amount is the whole content of the decision.

Take no default. Nothing is exempt until they say so, and a proposed exemption is a figure altered on their behalf.

Exempting everything is a real answer and must read as one: say the figure has nothing left to measure rather than reporting zero.

**Resuming.** The card's Continue names this step, so a run that comes back re-reads the selection alone and continues from here.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the exemptions could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: `exempted_category_keys`, the remaining total, `resolution: confirmed | none_exempted`.

Verify before moving on: internal transfers were not offered; the selection was handed off as category keys and nothing else; every option showed its own amount; nothing was exempt by default; an all-exempt selection was reported as nothing measured rather than as zero.


### Stage E — compute

12. **Anchor the window, then divide.** The window is the `trailing_months` months ending with the month step 4 pinned, where `trailing_months` is the window length from Inputs: the number the user named, or 3 when they named none. Sum the elected outflow across it with `well_sum_transactions({ from, to, axes: ["month", "currency"], exclude_internal_transfers: true, exempt_categories: [...] })`, then divide by the number of months IN the window — not by the number that carried spend.
    - **Convert before you add, then again before you divide.** The response comes back per month AND per currency, in native units. Apply step 9's rate to each month-currency subtotal, add the converted subtotals within a month to get that month's outflow, and only then divide across months. Adding native units first and converting the total is how a burn ends up denominated in nothing — and it is why step 2 gates the workspace on having a `base_currency` at all.
    - **The outflow is the subtotal step 10 elected, used as returned.** Both subtotals arrive as positive magnitudes, because the sum totals the absolute amount on each side. A negative month is therefore not a missing conversion — it means something re-signed a figure that was already a magnitude.
    - Keep the per-month series: it is what lets you say whether burn is rising or falling, and a month with no outflow belongs in it as a zero rather than being dropped.
    - `meta.partial: true` means the aggregate was cut short. Every figure is then a floor, and saying so is not optional. If the call itself errors, there is no figure: retry once, and on a second failure say the sum could not be read rather than reporting a total assembled from the groups that did come back.

13. **Put the figure on the card.** Call `well_render_burn` with the amount, the currency, the window, both month counts, the convention and the counts it was elected from, the row and unplaceable counts, and the three exclusion groups. Every one of those is a figure this stage already produced — the tool requires them because a number whose method is not stated cannot be checked, and it refuses rather than renders when one is missing.
    - **Render once, after the answer is settled.** The card is the last thing the run does, not a step it passes through, and a turn never draws two.
    - **A refusal is a finding, not a retry.** The tool rejects a negative amount, a magnitude feed, coverage wider than its window, a divisor that disagrees with the window, and `signed` elected from no negative rows. Each of those means this stage got something wrong, so read the message and fix the computation rather than restating the call.
    - The card states the method beside the figure rather than disclaiming it. Do not add a caveat about whose number it is: Well derives no burn of its own, so this figure is Well's, computed under the policy stated here.

**Not in this skill.** Grouping the answer by company `[17]` or by category `[18]` is `cost-structure`'s job — name it rather than answering it here.

## Output requirements

Return:

- The burn figure: amount, currency, and the window it covers.
- The window's coverage when some months carried no spend — both numbers, and the fact that the average divides by the whole window.
- **Which sign convention you elected, and the counts behind it.** A reader cannot check a figure whose direction was decided silently.
- **What you excluded, in three named groups**: internal transfers (structural), the categories the reader exempted, and the rows dropped for an unreadable amount or currency. A single "some rows were excluded" hides the difference between a rule and a defect.
- A confidence line from stage C's count: `unplaceable_count` against the window's `transaction_count` — how many rows could not be placed inside or outside the transfer rule, and so how much of the figure is certain.
- A freshness line: the oldest sync behind the figure, from step 5.
- A one-line pointer to `runway` for how long the cash lasts, and to `cost-structure` for what the spend is made of. Name them; do not answer them here.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.

**How this reaches the user.** Step 13 renders the card, and the host decides whether to draw it. The `_meta.ui.resourceUri` key that carries it never reaches you, so you cannot tell a host that drew the card from one that did not — and some hosts draw nothing at all. Write an answer that stands on its own for those, and let the card add to it where there is one. Do not compose a second rendering of figures the card already carries.

**One number, once.** `well_get_runway` carries its own `avg_burn`, and the app's KPI tile has its own. Do not quote either beside this figure: they answer the same question over a different window, and two burns in one reply reads as a contradiction rather than as detail.

## Quality checks

Before finishing, verify:

- Every gate that failed stopped the run and put a repair on screen; none was reported as a caveat under a figure.
- A resumed run re-ran the gate that stopped it and no earlier one — no picker was shown twice.
- The workspace came from step 1, and its `workspace_id` rode every `well_*` call rather than being left off.
- Step 2 required only `base_currency`, never a fiscal year start.
- Connection state came from step 3 and freshness from step 5; a connected connector was never assumed to mean data had landed.
- The sign convention was elected from the window's counts, stated in the answer, and elected once over the whole window rather than per month.
- The divisor was the window length. When some months were dark, both numbers were stated and the figure was never presented as the typical month.
- Internal transfers were excluded structurally, and described that way — never as something a recategorization would change.
- Exclusions were reported in their three named groups, not merged into one count.
- The unresolvable rows from stage C were disclosed as a bound on confidence, not silently absorbed.
- The card was rendered once, at the end, and a refusal from it was read as a fault in this skill's own arithmetic rather than retried.
- No runway figure, spend breakdown, or forecast was composed here — each was pointed at by name.
- No second burn figure appeared beside this one.

## Examples

### Example request

"What's our burn rate?"

### Expected behavior

Walk the gates. On a clean workspace, the answer is one figure with its window, the elected convention and its counts, what was excluded, and how fresh the data is — then a pointer to `runway` and `cost-structure`.

On a real workspace, the first run usually stops. Say which gate, how many rows, and how much value sits behind it, and put the repair on screen: "136 transactions in this window have no category, covering about €18,400. Categorize them and I'll pick up here." The second run goes straight through.

### Example request

"Our burn looks low — we had a quiet month in there. Can you average over six?"

### Expected behavior

Widen the window to six months and re-run. A wider window is not a repaired gate, so the resume rule does not apply: three of the six months were never gated, and steps 6 and 8 both scope to "the window". Re-run them over the new six before computing, and expect the added months to surface uncategorized rows the narrower run never saw.

Then report the wider average and, if some of the six carried no spend, say how many did and that the average divides by all six. The user's instinct is the thing the window metadata exists to confirm or correct, so answer it directly rather than only restating the new figure.

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
