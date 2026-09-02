---
name: define-period
description: Pin the calendar month(s) and fiscal coordinates a Well workspace job works on, and hand off a typed result — or, in `collect` mode, hand a single month's calendar coordinates back to a caller that commits the period by starting a run. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to fetch the invoices missing for that month"
  bankState: "connected"
  mode: "select"
  showCloseReadiness: false
---

The workspace is already pinned — pass its `workspace_id`, and `fiscal_year_start_month` from its hand-off (default `1`, calendar-aligned, and say so when it was null), on every call below.

{{#if (eq mode "collect")}}
**Collect mode.** A caller that *starts a run* from the month — a month-end close, where naming the calendar month **is** starting the close — collects **exactly one** calendar month through the same picker UX below, and hands the raw `calendar_year` + `calendar_month` back rather than relying on any server-side write. The card's own Use click may still write a selection incidentally; that write is never the deliverable, and the caller commits the period by starting its own run, not this step.
{{/if}}

Reuse a selection this conversation already wrote: when the session holds `selected_periods` that THIS conversation itself established (its own card click or typed months) and the user isn't asking to change the month, use it silently and skip straight to computing coordinates. A `selected_periods` present at conversation start that this conversation didn't write is another conversation's leftover — ignore it, never mention it, and resolve as if unset.

Read the hint before anything else — a hint that resolves is written server-side at once via `well_switch_workspace({ periods: [...] })`:
- A month plus a year ("2026-03", "March 2026") → that month, `resolution: hint_matched`.
- A bare month name ("March") → the most recent occurrence that has already ended — say which year you took.
- "last month" → the last complete month. "this month" / the running month or later → refuse it the same way as a future month, and name the last complete month instead. Every month this routine pins has ended.
- Several months ("March and April", "Q1") → {{#if (eq mode "collect")}}refuse in one line — a run closes a single calendar month — name the months you read, and ask which one to take{{else}}resolve each, write them all in one `periods` list, oldest first, never more than twelve — the server refuses a longer list outright. A quarter name reads as a calendar quarter (Q1 = Jan-Mar), so name the three months when `fiscal_year_start_month` isn't 1{{/if}}.

With no usable hint, end the turn on the picker: call `well_list_periods` when it's in your toolset (its result renders the period picker card{{#if (eq mode "collect")}}, single-select in this mode{{else}} — multi-select{{/if}}, don't restate the months under it).{{#if showCloseReadiness}} Surface each offered month's close readiness (`close_status`/`close_reason`, `missing_invoice_count`/`unposted_invoice_count`, all from the same `well_list_periods` result) on the card and in one plain line per month, e.g. "March 2026 — not ready: 3 missing invoices, 2 unposted." This is the coarse, run-free readiness, never the full blocker ladder, which only appears once a run actually starts.{{/if}} End with one line — pick the month{{#unless (eq mode "collect")}}(s){{/unless}} on the card{{#if purpose}}, "{{purpose}}"{{/if}} — and stop. When the tool is absent, propose the last complete month in one line and ask to confirm or name another.{{#if (eq mode "collect")}} If the pick comes back with more than one month, refuse in one line and ask which to keep.{{/if}}

Resolve the next message, in this order: the card's prefill ("Work on <Month Year>...") → the click already wrote it, acknowledge in half a sentence, `resolution: user_picked`; a typed month or months → {{#if (eq mode "collect")}}more than one is refused the same way as a multi-month hint — take a single month, or ask which one; one month resolves{{else}}resolve and write with `well_switch_workspace({ periods })`{{/if}}, `resolution: user_picked`; any other message needing the period → `well_wait_for_selection({ kind: "periods", timeout_s: 10 })` once, `selected` continues, `no_selection_yet` asks once more and stops; a decline ("later") → `resolution: unresolved`, say nothing was pinned, stop.

For each selected month, compute `date_range` (first day to real last day, leap years included), `is_complete: true` (always true here — a month that hadn't ended was refused earlier), and the fiscal coordinate — exactly this formula, never improvised, since it's the same arithmetic Well applies server-side:

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

{{#unless (eq mode "collect")}}
Then set `has_activity` once for the whole selection. {{#if bankState}}When the bank state passed in is `missing` or `error`, no settled activity can have landed — set `unknown` and skip the probe. When it is `connected`, run the probe below; on any other value, treat it the same as absent.{{else}}No bank state was passed in, so the bank side is unconfirmed — skip the probe and set `unknown`.{{/if}} When the probe runs: call `well_get_schema({ root: "transactions" })` once per session, then one `well_query_records` on `transactions` (`workspace_id`, `limit: 1`) ranging `executed_at` over the selected months' own intervals only — one interval per run of consecutive months, `_or`-ed together, never one span from earliest to latest (a March-plus-May pick must never report April's activity). At least one row → `true`. Zero rows → `false` only when the bank state was `connected`; otherwise (or on a failed read) → `unknown` — never report `false` when you couldn't actually tell.
{{/unless}}

Never call `well_start_close` or any close/lock/posting tool — this routine only reads and writes the period selection.

{{#if (eq mode "collect")}}
Emit the hand-off — a single month, never a list:

```yaml
calendar_year: <int>
calendar_month: <1-12>
fiscal_year: <int>
fiscal_period: <1-12>
label: <text>
{{#if showCloseReadiness}}close_status: closeable | not_ready | closed | nothing_to_close
close_reason: <text>
missing_invoice_count: <int>
unposted_invoice_count: <int>
{{/if}}resolution: single | hint_matched | user_picked | unresolved
```

On `unresolved`, every other key is null/empty. Hand control straight back to the caller — this is not a period-scoped read to point at, and the caller passes `calendar_year`/`calendar_month` on to its own start tool. Nothing here is the commit.
{{else}}
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
{{/if}}

Verify before moving on: no `well_switch_workspace` call here ever pinned a workspace — every call carried `periods`, none named a workspace to pin; a month that hadn't ended was refused, never pinned; `fiscal_period`/`fiscal_year` came from the formula for every month, period 13 never produced.{{#unless (eq mode "collect")}} `has_activity` was `false` only behind a `connected` feed and an empty probe, `unknown` on anything else including a missing/absent `bankState`; the probe ranged `executed_at` alone, over the selection's own intervals, never across a gap it doesn't cover.{{/unless}}{{#if (eq mode "collect")}} Exactly one calendar month was collected, a multi-month pick was refused at every entry point (hint, picker, typed answer), the card click's incidental server write was never treated as the commit, and the hand-off carried a single month back to the caller rather than a `periods` list.{{/if}}
