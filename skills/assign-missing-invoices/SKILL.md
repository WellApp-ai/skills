---
name: assign-missing-invoices
description: Assign the settled expense transactions in one Well workspace that still have no supplier invoice for a month to a set of owners, split into unassigned, yours, and owned by others. Renders Well's owner-assignment card, one row per transaction with its owner set and a multi-select picker; picking owners replaces the set on that line, and several lines can take the same set at once. Assigning a (counterparty × month) gap to several people holds one task per owner, and one invoice resolves them all. Use when the user asks to assign missing invoices, "who owns these missing receipts", "assign these to Marie and Théo", or "assign these to me", or when a close-books flow needs expense ownership sorted. Assigns among workspace members only. Needs define-workspace, define-period, and a connected bank. Do not use to fetch or collect documents (fetch-missing-invoices, deploy-agents), to list gaps by counterparty or pick vendors to chase (show-missing-invoices), or to assign someone not in the workspace.
---

# Assign Missing Invoices with Well

## Purpose

Answer "who owns the settled expenses that still have no supplier invoice this month?" for exactly one workspace and the period the user picked, and let the user set those owners. Read Well's list of missing-invoice transactions — one row per line, each carrying its current owner set — show it in three buckets (the lines nobody owns yet, the lines already owned by the user, and the lines owned only by other people), and let the user assign a set of owners to a line, or to several lines at once, straight from the card. It sorts ownership; it never fetches, downloads, or collects a document, and it never closes a period.

**Assignment is per transaction, and the owner is a set of people.** Picking owners on a line **replaces** that line's owner set: the people you send become its owners and anyone not sent is removed. The owner lives on the transaction, so each month is assigned fresh — assigning a line this month sets nothing for next month.

**One (counterparty × month) gap, one task per owner, one shared proof.** When you assign the transactions of a (counterparty × month) gap to several people, Well holds **one task per distinct owner** for that gap, visible in each owner's own task list. Three Uber lines in March all owned by Marie become one task for Marie; the same lines owned by Marie and Théo become one task each. **One supplier invoice resolves every owner's task for that gap** — the fan-out is for accountability, not for N separate collections. Say that plainly whenever the user assigns, so nobody thinks each owner has to chase the same invoice separately.

**Volume is handled by multi-select.** To own a whole month of one vendor's spend, select every line of that vendor and assign the same set once. The card carries a checkbox per row and an "assign selected to…" action for exactly this.

**This skill assigns among people already in the workspace only** — its members, including anyone invited but not yet accepted. Assigning someone who is not in the workspace yet is a separate skill, not this one; the write refuses a person outside the workspace rather than adding them.

## When to use this skill

Use this skill when:

- The user asks to assign, split up, or divide the missing invoices for a month ("assign these expenses to someone", "who should own these missing receipts?", "split the missing invoices before close").
- The user names people to own some lines ("assign the three Uber charges to Marie and Théo", "put these on me").
- The user wants to claim their own missing invoices ("assign my expenses to me", "which of these are mine?").
- A close-books flow needs expense ownership sorted before the period is worked.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first so the pinned workspace is the one this skill's tools read.
- No period selection exists yet and the user is picking one — that is `define-period`, whose card writes the selection this skill's tool reads.
- The user wants the documents fetched or collected from the suppliers — that is `fetch-missing-invoices` and `deploy-agents`; this skill assigns owners, it collects nothing.
- The user wants every missing invoice listed by counterparty, or wants to pick which vendors to chase — that is `show-missing-invoices`; it narrows what gets fetched, this skill assigns owners to the lines.
- The user wants to assign someone who is not in the workspace yet — that is a separate skill.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required, and **passed explicitly on every call** to both tools below. Comes from `define-workspace`. If absent, reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace` first. A pin changes what an omitted `workspace_id` falls back to; it does not make the argument optional. Omitting it is the sibling-entity fallback, so pass it on the read and on every write.
- A period selection written server-side — required, but **not passed to the tool** in the normal flow: the user's click on the period card, or `define-period` on a typed month, already wrote it, and the read uses it on its own. If no selection exists yet, the read says so — run `define-period` then; never guess a period from today's date.
- A connected bank — required. The missing-invoice lines come from the bank feed. `connect-tools` reads whether a bank is connected before the period is pinned; when none is, the flow routes to `connect-bank` instead of listing an empty month.
- `purpose` — one line from the calling skill, used when a question is needed. Optional.

Every month in the selection has ended. `define-period` pins no running month, and the read refuses the whole call when the selection holds one.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_missing_invoice_owners` — the read this skill is built on. Input: `workspace_id` explicitly, as on every `well_*` call. Name the period ONE way — `{ calendar_year, calendar_month }`, `{ fiscal_year, fiscal_period }`, or `periods: [...]` for several months — or, as this flow does, pass **no period** so the server uses the selection the user's click (or `define-period`) already wrote. An error comes back when no selection exists yet, when the selected month has not ended, or for the adjustment period (13). Output: `periods_covered`, `base_currency`, `me_person_id` (the person the current user resolves to, or `null` when the token carries no person), `transactions`, the per-bucket `unassigned_count` / `assigned_to_me_count` / `assigned_to_others_count`, `row_count`, `transaction_count`, `transactions_omitted`, `sampled`, `resolved_workspace`, `success`, and `error` on failure.
  - Each entry in `transactions` is **one settled expense line still missing its supplier invoice**:
    - `transaction_id` — pass this to `well_assign_missing_invoice_owners` to set the line's owner set. Never show the raw id to the user.
    - `counterparty` — `name`, `company_id`, and `logo_url` when a provider was matched. Name the counterparty as the app renders it, with its logo where there is one.
    - `date` — the line's posting date (`YYYY-MM-DD`), or `null` when undated.
    - `description` — the bank's remittance text; may be `null`.
    - `amount`, `currency` — the line amount in its own currency, sign preserved (negative is money out); `null` when unknown.
    - `base_amount` — the same amount in `base_currency`, sign preserved; `null` when no rate covered the line's date.
    - `owners` — the line's live owner set, each `person_id` + `name`, highest-precedence first, **empty** when nobody owns the line yet.
    - `bucket` — `unassigned`, `assigned_to_me`, or `assigned_to_others`, computed against the calling person. Bucket by this, never re-derive it from `owners`.
    - `period` — the month this line belongs to.
  - **`sampled` is always true.** The rows per counterparty are a bounded sample, so `row_count` can be fewer than `transaction_count` — the window's true total — and `transactions_omitted` is the difference. This is an assignment surface, not a gap census: use it to assign owners, and quote `transactions_omitted` rather than implying the list is complete. For a period's full per-counterparty totals, that is `show-missing-invoices` (`well_list_missing_invoices`).
  - Rows come back **unassigned first**, then the caller's own, then those owned only by others.
- `well_assign_missing_invoice_owners` — the write, and the only write this skill makes. Input: `workspace_id` (explicitly, as on every `well_*` call), `transaction_ids` (one or more line ids, from the read), and `owner_person_ids` (the people who together own those lines; an **empty array clears** the owners). The write **replaces** the owner set on every named transaction with exactly `owner_person_ids`. The card calls it itself when the user picks owners from a row, or applies a set to several selected rows. Call it yourself only on the text-only path, where the user names the lines and the people in prose. Its refusals are structured on `refusal_reason`:
  - `CLOSE_OWNER_PERIOD_FROZEN` — a line whose fiscal month already closed. A frozen line refuses the **whole batch** rather than rewriting a committed close.
  - `NOT_FOUND` — a person who is not a member of the workspace, or a transaction the workspace does not own. Either refuses the batch; the person is never silently dropped.
  A refusal also carries `refusal_details` beside `error`: a frozen month rides `{ fiscalYear, fiscalPeriod }` there, and a `NOT_FOUND` names the offending id in `error` itself. Name that month or id when you surface the refusal.
  Surface a refusal in plain words and do not retry it. Output on success: `transaction_ids`, `owner_person_ids` (the set after the write, empty when cleared), `transaction_count`, and `owner_count`.
- `well_get_schema` and `well_query_records` — the text-only path only, to turn a named person into a `person_id` for `owner_person_ids`. Call `well_get_schema({ root: "people" })` once per session to learn the people fields, then `well_query_records` on `people` (with `workspace_id`) to find the person by name — the same shape `define-period` uses on `transactions`. "me" needs no lookup: it is the read's `me_person_id` — or, when that is `null`, the user has no person record in this workspace, so say that plainly and ask whom to assign instead; never resolve "me" by looking the user up by name. In an MCP-Apps host the card's picker resolves people itself, so these two are only for prose.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace. This skill never re-pins; re-pinning belongs to the caller.

**If `well_list_missing_invoice_owners` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not approximate the list from raw transactions with `well_query_records` — a hand-built list carries no owner set and is not the same thing.

Never call `well_invoke_connector_tool` or any provider-specific tool. This skill reads and writes Well's own ownership; it never touches a provider.

**Composed skills.** Three atomic Well skills own the setup this skill must not inline — invoke them, don't reimplement them:

1. **Pin the workspace.** 
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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to assign the missing-invoice owners for that workspace" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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


2. **Confirm a bank is connected.** 
The workspace is already pinned — pass its `workspace_id` on the call below; do not re-resolve it here.

Read the current coverage in one call: `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick; `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind; `well_list_connectors({ workspace_id })` otherwise (one unscoped call for two or three kinds — one call renders one card, and a turn never renders two).

For each of the requested kinds —
- `bank`
— keep only rows whose `direction` is `input` and whose `data_domains` contains that kind (never a display name or `category_id`), and read each qualifying row's state in this order, first match wins: (`bank` is **required** here — this run cannot continue past the acknowledgment without every one of them connected or connecting.)
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install.
3. `enabled` with `last_successful_sync_at` set → **connected** (note "data may be partial" if `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — stop and ask the user to wait for the first sync.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn and keep going. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off and let the caller decide what to do — do not turn the read into a stop.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `bank` connected → carry on to the period step.
   - `bank` connecting → the feed is still syncing, so no settled spend has landed to assign yet. `define-period` below is called with `bankState="connected"` and would read a still-syncing feed as an empty month, so do not pin a period or read the list. Say the bank is still syncing and to try again once it finishes, and stop.
   - `bank` missing, or in error with no live feed → there is no settled spend to assign yet. Do not pin a period or read the list: hand the flow to `connect-bank` so the user can connect one, and stop. This is the connect-bank fallback the Inputs name.

3. **Pin the period.** 
The workspace is already pinned — pass its `workspace_id`, and `fiscal_year_start_month` from its hand-off (default `1`, calendar-aligned, and say so when it was null), on every call below.


Reuse a selection this conversation already wrote: when the session holds `selected_periods` that THIS conversation itself established (its own card click or typed months) and the user isn't asking to change the month, use it silently and skip straight to computing coordinates. A `selected_periods` present at conversation start that this conversation didn't write is another conversation's leftover — ignore it, never mention it, and resolve as if unset.

Read the hint before anything else — a hint that resolves is written server-side at once via `well_switch_workspace({ periods: [...] })`:
- A month plus a year ("2026-03", "March 2026") → that month, `resolution: hint_matched`.
- A bare month name ("March") → the most recent occurrence that has already ended — say which year you took.
- "last month" → the last complete month. "this month" / the running month or later → refuse it the same way as a future month, and name the last complete month instead. Every month this routine pins has ended.
- Several months ("March and April", "Q1") → resolve each, write them all in one `periods` list, oldest first, never more than twelve — the server refuses a longer list outright. A quarter name reads as a calendar quarter (Q1 = Jan-Mar), so name the three months when `fiscal_year_start_month` isn't 1.

With no usable hint, end the turn on the picker: call `well_list_periods` when it's in your toolset (its result renders the period picker card — multi-select, don't restate the months under it). End with one line — pick the month(s) on the card, "to assign the expenses missing an invoice for that month" — and stop. When the tool is absent, propose the last complete month in one line and ask to confirm or name another.

Resolve the next message, in this order: the card's prefill ("Work on <Month Year>...") → the click already wrote it, acknowledge in half a sentence, `resolution: user_picked`; a typed month or months → resolve and write with `well_switch_workspace({ periods })`, `resolution: user_picked`; any other message needing the period → `well_wait_for_selection({ kind: "periods", timeout_s: 10 })` once, `selected` continues, `no_selection_yet` asks once more and stops; a decline ("later") → `resolution: unresolved`, say nothing was pinned, stop.

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

Verify before moving on: no `well_switch_workspace` call here ever pinned a workspace — every call carried `periods`, none named a workspace to pin; a month that hadn't ended was refused, never pinned; `fiscal_period`/`fiscal_year` came from the formula for every month, period 13 never produced. `has_activity` was `false` only behind a `connected` feed and an empty probe, `unknown` on anything else including a missing/absent `bankState`; the probe ranged `executed_at` alone, over the selection's own intervals, never across a gap it doesn't cover.

   - Read its `has_activity`: `false` means the month holds no settled transactions at all, so there is nothing to assign for it — say so, offer `connect-bank` if the bank feed looks empty, or ask for another month, and stop. `true` or `unknown` → read the list.

The workspace is pinned by step 1, the bank confirmed by step 2, and the period written by step 3, so this skill resolves none of them itself and guesses no month.

## Workflow

Call each list or read tool once per step. The card refreshes itself — never re-call a tool just to check an assignment landed.

1. **Confirm the MCP server is configured.** If `well_*` tools are not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the list is computed in Well from their bank data. Stop until it is there.

2. **Run the composed setup in order** — `define-workspace`, then `connect-tools` for the bank, then `define-period` (see Tooling). A missing bank sends the flow to `connect-bank` and stops here; a bank still connecting stops here with a wait message; a period with `has_activity: false` stops here too, because a month with no transactions has nothing to assign.

3. **Read the list.** Call `well_list_missing_invoice_owners({ workspace_id })` once, with no period — the server reads the period selection the user clicked.
   - An error saying no period selection exists yet → run `define-period`, then re-call. Never guess a month.
   - `success: false` naming a period that has not ended → send the flow back to `define-period` for a completed month. Never retry it.
   - Any other `success: false`, or a transient failure → retry once. A second failure → step 7.
   - `row_count: 0` → no settled expense carries a missing invoice for the month. Say plainly there is nothing to assign here, and hand off `resolution: empty`. Do not call the period closed.

4. **Report it once, and let the card take the assignment.**
   - In an MCP-Apps host the result already renders the owner-assignment card: one flat, searchable table, its rows ordered unassigned first, then the user's own, then everyone else's — not three labelled sections — each line with its owner set (avatars) and an inline multi-select people picker, plus a checkbox per row and an "assign selected to…" action. Do not restate the rows in text under it. Give one summary line — how many lines are unassigned, how many are already yours, how many are owned by others, and the total — then the sampling note from step 5, and one line telling the user they can set owners on a line from its picker, or select several lines and assign the same set at once. Add that assigning creates one task per owner and that one invoice resolves them all. Nothing else.
   - In a text-only host, list the lines in three groups — unassigned first, then already yours, then owned by others — largest amount first inside each. Give each line's counterparty, `date`, amount, and its current owner set where it has one. Then ask which lines to assign and to whom. When the user names one or more lines and one or more people already in the workspace, call `well_assign_missing_invoice_owners({ workspace_id, transaction_ids, owner_person_ids })` **once** with every named line and the shared set, and say in the same breath that each owner now holds a task for the gap and one invoice resolves them all. Resolve each named person to a `person_id` with `well_query_records` on `people` (after one `well_get_schema({ root: "people" })` per session); "me" is the read's `me_person_id` and needs no lookup — unless `me_person_id` is `null`, in which case the user has no person record in this workspace: say so and ask whom to assign instead, never a name lookup for "me". When a name matches none or several, ask rather than guess, and never assign someone who is not in the workspace.
   - A line whose `base_amount` is `null` has no rate for its currency: print **amount unavailable** for it, and never convert it yourself or add native amounts of different currencies together.

5. **State the sampling bound, every time.** Say in one line that the rows per counterparty are a bounded sample (`transactions_omitted` says how many lines the sample left out), so this is where owners get assigned, not where a period's total gaps are counted — `show-missing-invoices` carries the full per-counterparty totals. Quote `transactions_omitted` when it is above zero.

6. **End the turn on the card.** A list with rows ends its turn here — the card is on screen and the assignments are the user's to make, inline. Do not poll for them. When the user's next message names lines and people, treat it as the text-only assignment of step 4 and write it. When it asks to clear a line's owners, call the write with `workspace_id` and `owner_person_ids: []`. When it says they are done, acknowledge and hand off.

7. **On failure, redirect instead of guessing.** After a second failure, do not build the list by hand. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same lines there. Do not append a query parameter you have not confirmed the app reads.

8. **Hand off.** Keep the facts below so the calling flow can act on the list and the assignments without re-reading them — never printed as a block.

## Output requirements

Return:

- One line summarising the month: how many lines are unassigned, how many are already the user's, how many are owned only by others, and the total the missing invoices still cover — the sum of the MAGNITUDES of the non-null `base_amount` values (each is signed, negative is money out, so add absolute values, never net them). When `transactions_omitted` is above zero the total covers only the sampled rows, so qualify it as "across the N lines shown" (e.g. "**March 2026**: 7 expense lines have no invoice: 4 unassigned, 1 yours, 2 owned by others. €6,120 across the 7 lines shown still needs an invoice."). When several months are in the selection, name each from `periods_covered` and keep the counts and total as the totals across them. When the card is on screen this line replaces the rows.
- The sampling note from workflow step 5, stated even on an empty list.
- One line, whenever the list has rows, telling the user they can set owners on a line from its picker or select several lines and assign the same set at once, and that assigning a gap to several people creates one task per owner while one invoice resolves them all.
- Whenever an assignment is made, one plain line confirming it and its reach: the named owners now hold the gap's task each, and one supplier invoice for that gap resolves every one of them. When the write cleared a set, say the line has no owner now.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the period (`periods_covered` and the per-month coordinates); `base_currency`; `me_person_id`; the counts (`unassigned`, `assigned_to_me`, `assigned_to_others`); `row_count`, `transaction_count`, `transactions_omitted`; `total_base_amount` — the sum of the MAGNITUDES (absolute values) of the non-null `base_amount` values (each is signed, negative is money out), or null; `transactions` as returned; the assignments made this turn, each as the `transaction_ids` plus the `owner_person_ids` set (an empty set when cleared); `sampling_note`; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `transactions` is empty, every count is 0, and `total_base_amount` is null. On `unavailable`, only `workspace_id`, the period, and the `sampling_note` are kept. These keys are reasoning vocabulary for you and the caller, and the hand-off travels as plain conversation, not as a data block.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step on every turn that carries no assignment prompt — the empty list, the unavailable list, and the turn after the user says they are done. Hand control back to the skill that called this one, or, when the user asked for the list on its own, ask whether they want to look at another month or move on to fetching the documents with `fetch-missing-invoices` (only when it is installed).
- The whole answer stays a few plain sentences a non-technical user understands. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- The rows restated in text when the card is already on screen.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A list built from raw transactions when `well_list_missing_invoice_owners` was unavailable.
- A claim that the period is closed or fully assigned from an empty list.
- An owner set that includes a person who is not in the workspace, or the raw `transaction_id` shown to the user.
- A `row_count` reported as if it were the period's total when `transactions_omitted` is above zero.

**How this reaches the user.** A Well MCP tool that ships a widget attaches `_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never reaches you, so you cannot tell a host that drew the assignment card from one that did not. Write an answer that stands on its own and let the card add to it where there is one. State the lines in text regardless. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_missing_invoice_owners` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and computed nothing.
- The workspace came from `define-workspace`, the caller, or a session pin this conversation established — no leftover pin was reused or mentioned. Every call to both tools carried `workspace_id` explicitly.
- A missing bank sent the flow to `connect-bank` and stopped, and a bank still connecting stopped with a wait message, rather than listing an empty month. A period with `has_activity: false` stopped with "nothing to assign for this month", not an error and not a claim that the month is done.
- The read was called once, with no period argument. A no-selection error went to `define-period`; a not-ended period went to `define-period`, never retried.
- Lines were bucketed on `bucket` as returned, never re-derived from `owners`, and all three buckets were reported.
- Every assignment sent one write for all the named lines and the shared set, and made it clear that each owner holds a task for the gap and one invoice resolves them all. No assignment implied that each owner must collect the same invoice separately.
- A clear used `owner_person_ids: []`. A refusal (`CLOSE_OWNER_PERIOD_FROZEN`, `NOT_FOUND`) was surfaced in plain words and never retried. No write was attempted for a person not in the workspace.
- `row_count: 0` was reported as "nothing to assign here" and handed off `resolution: empty`, never as a closed or fully-assigned period.
- Every `null` `base_amount` was reported as "amount unavailable"; the total summed the magnitudes of the non-null base-currency amounts, and was qualified as "across the N lines shown" when `transactions_omitted` was above zero.
- The sampling note was stated, even on an empty list, and `transactions_omitted` was quoted when above zero.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the read was retried once before the workspace-link fallback.
- The hand-off facts were kept, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The turn that carries no assignment prompt ended with the next-step pointer.
- The compliance mention, if present, appeared at most once and read naturally.

## Examples

### Example request

A close-books flow calls this skill with the `workspace_id` of Acme SAS, after the user clicked March 2026 on the period card, `purpose: "to sort expense ownership before close"`. The host is Claude Desktop. The bank is connected, and the read returns four unassigned lines, one already owned by the user, and two owned by other people, with two further lines of the same counterparties left out of the bounded sample (`transactions_omitted: 2`).

### Expected behavior

Run the composed setup: the workspace is already pinned, the bank comes back connected, and `define-period` reads the clicked March selection with `has_activity: true`. Call `well_list_missing_invoice_owners({ workspace_id })`. The card renders one flat, searchable table ordered unassigned first, then the user's own, then everyone else's, each line with its owner set and a multi-select picker, plus row checkboxes and an "assign selected to…" action. Answer in one line — "**March 2026**: 7 expense lines have no invoice: 4 unassigned, 1 yours, 2 owned by others. €6,120 across the 7 lines shown still needs an invoice." — add the sampling note, say the user can set owners on a line or select several lines and assign the same set at once, and that assigning creates one task per owner while one invoice resolves them all, and end the turn. Do not list the lines again.

### Example request

"Assign the three Uber charges to Marie and Théo" in a text-only host, after the list rendered its lines, with Marie and Théo both members of the workspace.

### Expected behavior

Match "the three Uber charges" against the listed lines and Marie and Théo against the workspace's people. Call `well_assign_missing_invoice_owners({ workspace_id, transaction_ids: [the three ids], owner_person_ids: [marie, theo] })` once. Confirm in one line: "Done. Marie and Théo each own the March Uber gap now, so each has a task for it, and one Uber invoice for March resolves both." Do not imply they have to chase the invoice separately.

### Example request

"Who owns the missing invoices for March?" but the read comes back `row_count: 0`.

### Expected behavior

Say there are no expense lines missing an invoice to assign for March 2026, add that the list is a bounded sample and `show-missing-invoices` carries a period's full per-counterparty totals, and hand off `resolution: empty`. Do not call the period closed. End on the next-step pointer.

### Example request

"Assign these to me" after the list rendered, but one of the lines belongs to a month that has already closed.

### Expected behavior

The write refuses the batch with `refusal_reason: CLOSE_OWNER_PERIOD_FROZEN`. Say plainly that one of the lines is in a month that is already closed, so Well will not rewrite its ownership, and offer to assign the lines from the open month instead. Never retry the frozen batch.

### Example request

"What am I missing?" with no bank connected in the workspace.

### Expected behavior

`connect-tools` comes back with the bank missing. Do not pin a period or read the list. Hand the flow to `connect-bank` so the user can connect a bank, and say the expenses can be assigned once the feed is in. Stop there.

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
