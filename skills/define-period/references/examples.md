# Worked Examples

Seven scenarios for `define-period`, covering hint resolution, the picker path, a
several-months hand-off (consecutive and with a gap), a quarter name, a missing bank
feed, and a `collect`-mode call from a close.

### Example request

The fetch-missing-invoices flow calls define-period with the Acme SAS `workspace_id`, `fiscal_year_start_month: 1`, `hint: "March"`, `probe: false`, `purpose: "to fetch the invoices missing for that month"`. Today is 12 April 2026.

### Expected behavior

"March" resolves to the most recent March that has ended: March 2026. Write it server-side — `well_switch_workspace({ periods: [{ calendar_year: 2026, calendar_month: 3 }] })` — derive `fiscal_period = ((3 - 1 + 12) % 12) + 1 = 3` and `fiscal_year = 2026`, and run no probe: the hint resolved the month, so no period row was read and no `bank_transaction_count` reached the hand-off, and `probe: false` bars the `transactions` read. Answer: "Working on **March 2026**, fiscal year 2026, period 3. The month is complete, and I cannot confirm the bank side from here." Hand off `has_activity: unknown`. Keep `resolution: hint_matched`, and point at `show-missing-invoices` — which will read this selection from the server, with no periods argument.

### Example request

"Let's go through a month." — no hint, `well_list_periods` is in the toolset. Today is 12 April 2026.

### Expected behavior

Call `well_list_periods({ workspace_id, title, subtitle })` — the picker card renders. End the turn with one line: "Pick the month on the card, then send the message it prepares." The user clicks **Use** on February 2026 and sends the prefilled "Work on February 2026": the click already wrote the selection. Narrate "Working on **February 2026**, fiscal year 2026, period 2." and continue with `resolution: user_picked` — no verification read.

### Example request

The user clicks **Use** with February and March 2026 both selected and sends the prefilled "Work on February 2026 and March 2026".

### Expected behavior

The click already wrote both months server-side. Derive both fiscal coordinates. The period rows carry no `bank_transaction_count` on this server, and this caller passed no `probe: false`, so probe once: February and March are consecutive, so the two months form one interval, 2026-02-01 to 2026-03-31. Answer: "Working on **February and March 2026** — fiscal periods 2 and 3, both complete." Keep `resolution: user_picked` with both entries in `periods`. The later reads cover the whole selection without naming it. April could not have been picked here — the card leaves the running month unselectable, and a selection holding it would make those reads refuse every month at once.

### Example request

The user clicks **Use** with March and May 2026 selected — April is left out — and sends the prefilled "Work on March 2026 and May 2026".

### Expected behavior

Two months, two runs. Probe both intervals in one call, `_or`-ed: `executed_at` in 2026-03-01 to 2026-03-31, or in 2026-05-01 to 2026-05-31. A single span from 2026-03-01 to 2026-05-31 would answer `true` on an April transaction the user did not select, so it is never built. Answer "Working on **March and May 2026**, fiscal periods 3 and 5, both complete." with `resolution: user_picked` and both entries in `periods`.

### Example request

"Let's do Q1."

### Expected behavior

Q1 names three months — a legal selection, not an ambiguity. Write all three in one call: `well_switch_workspace({ periods: [{ calendar_year: 2026, calendar_month: 1 }, { calendar_year: 2026, calendar_month: 2 }, { calendar_year: 2026, calendar_month: 3 }] })`, oldest first. Answer "Working on **January through March 2026**, fiscal periods 1 to 3, all complete." with `resolution: hint_matched`.

### Example request

The caller's hand-off carries `bank_state: missing`, and it asks for last month.

### Expected behavior

Pin the month normally — the fiscal coordinate is arithmetic, not data. Skip the probe, report `has_activity: unknown`, and say why in one line: "I can't tell whether February 2026 holds any activity. No bank feed is connected to this workspace." Point at `connect-bank` for the bank side, then hand off. Do not report `has_activity: false`. Had no `bank_state` reached this skill at all, the probe would run, and an empty result would still be `unknown` — with the bank side named as unconfirmed rather than missing.

### Example request

The close-books flow calls define-period with `mode: collect`, the Acme SAS `workspace_id`, `fiscal_year_start_month: 1`, `show_close_readiness: true`, and `hint: "last month"`. Today is 12 April 2026.

### Expected behavior

`collect` collects one month for a caller that will start the run from it. "Last month" is March 2026 — the last complete month. Do not treat this as a commit: hand back `calendar_year: 2026, calendar_month: 3` (and, for narration, fiscal year 2026, period 3) so close-books can pass it straight into `well_start_close`. Because `show_close_readiness: true` was passed, read March's `close_status` / `close_reason` and its `missing_invoice_count` / `unposted_invoice_count` from `well_list_periods` and state them in the same line — "Collected **March 2026** for the close. Not ready: 3 missing invoices, 2 unposted (run-free readiness; the full blocker ladder appears once the close starts)" — then hand control back to close-books; name no `show-missing-invoices` or `categorize-counterparties` follow-up, and do not tell close-books to omit a periods argument. Had the user asked for two months here, refuse in one line: a close runs a single month.
