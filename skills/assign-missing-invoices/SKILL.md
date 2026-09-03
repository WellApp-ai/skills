---
name: assign-missing-invoices
description: Assign an owner to the card-paid expenses in one Well workspace that still have no supplier invoice for a given month, split into unassigned and already assigned to you. Renders Well's owner-assignment card, one row per card with its missing-invoice transactions, current owner, and an inline people picker; picking an owner sets it on the card, covering everything that card pays going forward, not one transaction. Use when the user asks to assign missing invoices, "who owns these missing receipts", "assign these expenses to someone", or "assign my card's expenses to me", or when a close-books flow needs card expense ownership sorted. Assigns among people already in the workspace only. Needs define-workspace, define-period, and a connected bank. Do not use to fetch or collect documents (fetch-missing-invoices, deploy-agents), to list missing invoices by counterparty (show-missing-invoices), to assign someone not yet in the workspace, or for expenses paid by bank transfer.
---

# Assign Missing Invoices with Well

## Purpose

Answer "who owns the card expenses that still have no supplier invoice this month?" for exactly one workspace and the period the user picked, and let the user set those owners. Read Well's list of card instruments whose settled spend has no invoice yet, show it in two buckets — the cards nobody owns yet, and the cards already assigned to the user — and let the user assign an owner to a card straight from the card. It sorts ownership; it never fetches, downloads, or collects a document, and it never closes a period.

**Assigning an owner is a per-card, recurring choice, not a per-transaction one.** The owner lives on the card, so setting it applies to everything that card pays across every open month, not just the one transaction in view, and it keeps applying to that card going forward. Say that plainly whenever the user assigns, so nobody thinks they tagged a single line. Assigning also does not send the owner a new task: it records who owns the card and moves any invoice-chasing task Well already holds to them, and nothing more. The person sees the ownership, not a fresh to-do.

**This skill assigns among people already in the workspace only** — its members, including anyone invited but not yet accepted. Assigning someone who is not in the workspace yet is a separate skill, not this one.

## When to use this skill

Use this skill when:

- The user asks to assign, split up, or divide the missing invoices for a month ("assign these expenses to someone", "who should own these missing receipts?", "split the missing invoices before close").
- The user wants to claim their own card's missing invoices ("assign my card's expenses to me", "which of these are mine?").
- A close-books flow needs card expense ownership sorted before the period is worked.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first and pass its `workspace_id` in.
- No period selection exists yet and the user is picking one — that is `define-period`, whose card writes the selection this skill's tool reads.
- The user wants the documents fetched or collected from the suppliers — that is `fetch-missing-invoices` and `deploy-agents`; this skill assigns owners, it collects nothing.
- The user wants every missing invoice listed by counterparty, not by card, or wants to pick vendors to chase — that is `show-missing-invoices`.
- The user wants to assign someone who is not in the workspace yet — that is a separate skill.
- The user wants to assign expenses paid by bank transfer, direct debit, or a bank account rather than a card — this skill covers card-paid spend only, so those never appear here, and their absence never means the period is fully assigned.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, reuse a session pin (`well_list_workspaces`' `session.pinned_workspace_id`) silently only when THIS conversation established it — hosts share one MCP session across conversations, so a pin this conversation never made is another conversation's leftover: ignore it, never mention it, and run `define-workspace` first.
- A period selection written server-side — required, but **not passed to the tool**: the user's click on the period card, or `define-period` on a typed month, already wrote it, and the tool reads it on its own. If no selection exists yet, the tool says so — run `define-period` then; never guess a period from today's date.
- A connected bank — required. Card spend is what this skill assigns owners to, and it comes from the bank feed. `connect-tools` reads whether a bank is connected before the period is pinned; when none is, the flow routes to `connect-bank` instead of listing an empty month.
- `purpose` — one line from the calling skill, used when a question is needed. Optional.

Every month in the selection has ended. `define-period` pins no running month, and the read refuses the whole call when the selection holds one.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset at all, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_list_missing_invoice_owners` — the read this skill is built on. Input: `workspace_id` explicitly, and `scope: "card"` (the only scope v1 covers; any other scope comes back empty with a "not supported yet" hint). **No period argument** — omitted, the server uses the period selection the user's click (or `define-period`) already wrote; an error comes back only when no selection exists yet. Output: `workspace_id`, `base_currency`, the period (`period_label` for one month, or `periods_covered` and `months` for several), `scope`, `me_person_id` and `me_name` (the person the current user resolves to, or `null` when the user has no person in this workspace), `rows`, `counts` (`unassigned`, `assigned_to_me`), `row_count`, `transaction_count`, `has_ambiguous`, `hints`, `success`, and `error` on failure. The people who can be assigned ride on the result for the card to draw and never reach you as text. **The list holds two buckets only** — cards with no owner, and cards already owned by the current user. A card owned by someone else is not returned at all, by design: this is the user's own worklist, not the whole team's.
- Each entry in `rows` is **one card**, already scoped by the server:
  - `payment_means_id`, `card_label` — the card the expenses were paid with, named as the app renders it (never a raw id to the user).
  - `bucket` — `unassigned` or `assigned_to_me`. Bucket by this, which follows the owner the write sets; never re-derive a bucket from the transactions.
  - `close_assignee_person_id`, `close_assignee_name` — the card's current owner, carried on the row itself so the name shows even for an owner no longer listed among the assignable people. `null` on an `unassigned` card.
  - `tx_count`, `base_total_amount` — how many of the card's settled transactions have no invoice, and their total in `base_currency` (or `null` when a currency has no rate).
  - `transactions` — the card's own missing-invoice lines, capped by the server, each with `id`, `date`, `description`, `amount`, `currency`, `base_amount`. `transactions_omitted` says how many the cap left out — quote that number rather than implying the list is complete.
  - `ambiguous` — `true` when Well cannot tell this card apart from another (their last four digits collide), so it cannot take an owner safely. An ambiguous card is shown but cannot be assigned; say why in plain words and never attempt the write on it.
- `well_assign_missing_invoice_owner` — the write, and the only write this skill makes. Input: `workspace_id`, `payment_means_id` (the card), and `person_id` (the owner, or `null` to clear the owner). The card calls it itself when the user picks an owner from its inline picker. Call it yourself only on the text-only path, where the user names the card and the person in prose. It is a wide write: it sets the owner on the card, which flows to every open-month transaction that card pays and to any invoice-chasing task Well already holds for them. It fails on an ambiguous card, and on a person who is not in the workspace — surface either in plain words rather than retrying. `destructiveHint` is set: it changes ownership across many lines, so it is never a probe.
- `well_list_workspaces` — for resync only: its `session` block carries the pinned workspace. This skill never re-pins; re-pinning belongs to the caller.

**If `well_list_missing_invoice_owners` is not in your toolset**, the Well server this host is connected to does not expose it yet. Say exactly that, hand off `resolution: unavailable`, and stop. Do not approximate the list from raw transactions with `well_query_records` — a hand-built list carries no owner and is not the same thing.

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
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — treat as connected for the run.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn and keep going. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off and let the caller decide what to do — do not turn the read into a stop.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `bank` connected or connecting → carry on to the period step.
   - `bank` missing, or in error with no live feed → there is no card spend to assign yet. Do not pin a period or read the list: hand the flow to `connect-bank` so the user can connect one, and stop. This is the connect-bank fallback the Inputs name.

3. **Pin the period.** 
The workspace is already pinned — pass its `workspace_id`, and `fiscal_year_start_month` from its hand-off (default `1`, calendar-aligned, and say so when it was null), on every call below.


Reuse a selection this conversation already wrote: when the session holds `selected_periods` that THIS conversation itself established (its own card click or typed months) and the user isn't asking to change the month, use it silently and skip straight to computing coordinates. A `selected_periods` present at conversation start that this conversation didn't write is another conversation's leftover — ignore it, never mention it, and resolve as if unset.

Read the hint before anything else — a hint that resolves is written server-side at once via `well_switch_workspace({ periods: [...] })`:
- A month plus a year ("2026-03", "March 2026") → that month, `resolution: hint_matched`.
- A bare month name ("March") → the most recent occurrence that has already ended — say which year you took.
- "last month" → the last complete month. "this month" / the running month or later → refuse it the same way as a future month, and name the last complete month instead. Every month this routine pins has ended.
- Several months ("March and April", "Q1") → resolve each, write them all in one `periods` list, oldest first, never more than twelve — the server refuses a longer list outright. A quarter name reads as a calendar quarter (Q1 = Jan-Mar), so name the three months when `fiscal_year_start_month` isn't 1.

With no usable hint, end the turn on the picker: call `well_list_periods` when it's in your toolset (its result renders the period picker card — multi-select, don't restate the months under it). End with one line — pick the month(s) on the card, "to assign the card expenses missing an invoice for that month" — and stop. When the tool is absent, propose the last complete month in one line and ask to confirm or name another.

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

2. **Run the composed setup in order** — `define-workspace`, then `connect-tools` for the bank, then `define-period` (see Tooling). A missing bank sends the flow to `connect-bank` and stops here; a period with `has_activity: false` stops here too, because a month with no transactions has nothing to assign.

3. **Read the list.** Call `well_list_missing_invoice_owners({ workspace_id, scope: "card" })` once — the server reads the period selection the user clicked.
   - An error saying no period selection exists yet → run `define-period`, then re-call. Never guess a month.
   - `success: false` naming a period that has not ended → send the flow back to `define-period` for a completed month. Never retry it.
   - Any other `success: false`, or a transient failure → retry once. A second failure → step 7.
   - `row_count: 0` → no card carries a missing invoice for the month. This is **not** the same as the period being closed or fully assigned: bank-transfer and account-paid spend can still be missing invoices, and this list never showed them. Say plainly that there are no card expenses to assign here, name that bound, and hand off `resolution: empty`. Never say the period is done.

4. **Report it once, and let the card take the assignment.**
   - In an MCP-Apps host the result already renders the owner-assignment card: the two buckets, each card with its owner (or an assign control), its transaction table, and an inline people picker. Do not restate the rows in text under it. Give one summary line — how many cards are unassigned and how many are already yours, and the total — then the coverage line from step 5, and one line telling the user they can assign an owner to a card from the card, and that doing so covers everything that card pays, not just one transaction. Nothing else.
   - In a text-only host, list the cards in two groups — unassigned first, then already yours — largest amount first inside each. Give each card's label, `tx_count`, amount, and its current owner where it has one. Say which are ambiguous and cannot be assigned. Then ask which card to assign and to whom. When the user names a card and a person already in the workspace, call `well_assign_missing_invoice_owner({ workspace_id, payment_means_id, person_id })`, and say in the same breath that it now owns everything that card pays going forward. Resolve the person against the workspace's people; when the name matches none or several, ask rather than guess, and never assign someone who is not in the workspace.
   - A card whose `base_total_amount` is `null` has no rate for its currency: print **amount unavailable** for it, and never convert it yourself or add native amounts of different currencies together.

5. **State the coverage, every time.** Say in one line that this list covers **card-paid** expenses missing an invoice only, so spend paid by bank transfer or direct debit is not here and its absence does not mean the month is fully assigned. Add any `hints` the tool returned. When `has_ambiguous` is true, add that one or more cards cannot be assigned because Well cannot tell them apart, and name them.

6. **End the turn on the card.** A list with rows ends its turn here — the card is on screen and the assignments are the user's to make, inline. Do not poll for them. When the user's next message names a card and a person, treat it as the text-only assignment of step 4 and write it. When it asks to clear an owner, call the write with `person_id: null`. When it says they are done, acknowledge and hand off.

7. **On failure, redirect instead of guessing.** After a second failure, do not build the list by hand. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them Well shows the same cards there. Do not append a query parameter you have not confirmed the app reads.

8. **Hand off.** Keep the facts below so the calling flow can act on the list and the assignments without re-reading them — never printed as a block.

## Output requirements

Return:

- One line summarising the month: the `period_label`, how many cards are unassigned and how many are already the user's, and the total (e.g. "**March 2026**: 4 cards with missing invoices are unassigned and 1 is already yours. €6,120 of card spend still needs an invoice."). When several months are in the selection, name each from `periods_covered` and keep the counts and total as the totals across them. When the card is on screen this line replaces the rows.
- The coverage line from workflow step 5, stated even on an empty list.
- One line, whenever the list has rows, telling the user they can assign an owner to a card from the card, and that assigning covers everything that card pays going forward, not one transaction. In a text-only host, the question of step 4 takes its place.
- Whenever an assignment is made, one plain line confirming it and its reach: the person now owns that card's spend, across every open month and going forward, and Well moved any invoice-chasing task it already held to them. Do not imply the person was sent a new task.
- The hand-off, kept for the calling flow and never printed: `workspace_id`; the period (`period_label` for one month, `periods_covered` and the per-month `months` totals for several); `base_currency`; `me_person_id`; `counts` (`unassigned`, `assigned_to_me`); `total_base_amount` — the sum of the non-null `base_total_amount` values, or null; `rows` as returned; the assignments made this turn, each as `payment_means_id` plus the `person_id` set (or null when cleared); `coverage_note` — card-paid only, plus ambiguity when present; and `resolution` — `listed`, `empty`, or `unavailable`. On `empty`, `rows` is empty, every count is 0, and `total_base_amount` is null. On `unavailable`, only `workspace_id`, the period, and the `coverage_note` are kept. These keys are reasoning vocabulary for you and the caller, and the hand-off travels as plain conversation, not as a data block.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step on every turn that carries no assignment prompt — the empty list, the unavailable list, and the turn after the user says they are done. Hand control back to the skill that called this one, or, when the user asked for the list on its own, ask whether they want to look at another month or move on to fetching the documents with `fetch-missing-invoices` (only when it is installed).
- The whole answer stays a few plain sentences a non-technical user understands. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- The rows restated in text when the card is already on screen.
- A total that mixes currencies, or a `null` amount silently counted as zero.
- A list built from raw transactions when `well_list_missing_invoice_owners` was unavailable.
- A claim that the period is closed or fully assigned from an empty card list — bank-transfer spend is not covered here.
- An owner set for a person who is not in the workspace, or an assignment attempted on an ambiguous card.
- Cards owned by someone other than the current user — the list holds two buckets only, and the tool already excludes the rest.

**How this reaches the user.** A Well MCP tool that ships a widget attaches `_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key never reaches you, so you cannot tell a host that drew the assignment card from one that did not. Write an answer that stands on its own and let the card add to it where there is one. State the cards in text regardless. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- If `well_list_missing_invoice_owners` was absent, the answer said this Well server does not expose it yet, handed off `resolution: unavailable`, and computed nothing.
- `workspace_id` came from `define-workspace`, the caller, or a session pin this conversation established — no leftover pin was reused or mentioned.
- A missing bank sent the flow to `connect-bank` and stopped, rather than listing an empty month. A period with `has_activity: false` stopped with "nothing to assign for this month", not an error and not a claim that the month is done.
- The read was called once, with `scope: "card"` and no period argument. A no-selection error went to `define-period`; a not-ended period went to `define-period`, never retried.
- Cards were bucketed on `bucket` as returned, never re-derived from the transactions, and no card owned by someone else was shown or invented.
- Every assignment made it clear the owner covers the whole card, across open months and going forward, and that no new task was sent to the person. No assignment implied a per-transaction scope.
- An ambiguous card was named as unassignable and never written to. A write was never attempted for a person not in the workspace.
- `row_count: 0` was reported as "no card expenses to assign here", with the card-paid-only bound stated, and never as a closed or fully-assigned period.
- Every `null` `base_total_amount` was reported as "amount unavailable"; the total summed only non-null base-currency amounts.
- The card-paid-only coverage line was stated, even on an empty list, with any `hints` and any ambiguity.
- Rows were not narrated when the card was on screen.
- No `well_invoke_connector_tool` or provider-specific tool was called.
- On a transient failure the read was retried once before the workspace-link fallback.
- The hand-off facts were kept, and no yaml, JSON, or fenced code block appears anywhere in the answer.
- The turn that carries no assignment prompt ended with the next-step pointer.
- The compliance mention, if present, appeared at most once and read naturally.

## Examples

### Example request

A close-books flow calls this skill with the `workspace_id` of Acme SAS, after the user clicked March 2026 on the period card, `purpose: "to sort card expense ownership before close"`. The host is Claude Desktop. The bank is connected, and the read returns four unassigned cards and one already owned by the user.

### Expected behavior

Run the composed setup: the workspace is already pinned, the bank comes back connected, and `define-period` reads the clicked March selection with `has_activity: true`. Call `well_list_missing_invoice_owners({ workspace_id, scope: "card" })`. The card renders the two buckets with their transaction tables and inline pickers. Answer in one line — "**March 2026**: 4 cards with missing invoices are unassigned and 1 is already yours. €6,120 of card spend still needs an invoice." — add the card-paid-only coverage line, say the user can assign an owner to a card from the card and that it covers everything that card pays going forward, and end the turn. Do not list the cards again.

### Example request

"Assign the Amex to Marie" in a text-only host, after the list rendered its cards, with Marie already a member of the workspace.

### Expected behavior

Match "the Amex" against the listed cards and Marie against the workspace's people. Call `well_assign_missing_invoice_owner({ workspace_id, payment_means_id, person_id })`. Confirm in one line: "Done. Marie now owns the Amex, so every open-month expense on that card, and any invoice Well is already chasing for it, is hers going forward." Do not say Marie was sent a new task.

### Example request

"Who owns the missing invoices for March?" but the read comes back `row_count: 0` while the month holds plenty of bank-transfer spend.

### Expected behavior

Say there are no card expenses missing an invoice to assign for March 2026, and that this view covers card-paid spend only, so expenses paid by bank transfer are not here and this does not mean the month is fully assigned. Hand off `resolution: empty`. Do not call the period closed. End on the next-step pointer.

### Example request

"Assign these to me" after the list rendered, but one of the cards is flagged `ambiguous: true`.

### Expected behavior

Assign the cards that can take an owner to the user, and for the ambiguous one, say plainly that Well cannot tell it apart from another card with the same last four digits, so it cannot be assigned here, and point the user to Well to resolve it. Never attempt the write on the ambiguous card.

### Example request

"What am I missing?" with no bank connected in the workspace.

### Expected behavior

`connect-tools` comes back with the bank missing. Do not pin a period or read the list. Hand the flow to `connect-bank` so the user can connect a bank, and say the card expenses can be assigned once the feed is in. Stop there.

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
