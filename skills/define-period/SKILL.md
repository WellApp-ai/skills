---
name: define-period
description: Pin exactly one calendar month — and the fiscal year and fiscal period behind it — for a Well workspace, then hand it off as a typed result the rest of the flow works on. Use when the user says "last month", "March", "2026-03", "the period we're working on", asks which month a job covers, or when a Well skill needs one accounting period fixed before it reads data. Defaults to the last complete month, accepts the current month as incomplete, derives the fiscal coordinate from the workspace's fiscal-year start month, and reports whether the month has any activity. Do not use to close, lock, or reopen a period, to run a month-end close, to resolve which workspace the conversation is about, or to list what is missing inside the month.
---

# Define Period with Well

## Purpose

Fix one calendar month for a job, and say exactly which month it is in both calendars — the user's ("March 2026") and the workspace's fiscal one (`fiscal_year` + `fiscal_period`). Read only: propose the last complete month, accept a hint or a pick, derive the fiscal coordinate from the workspace's fiscal-year start month, check whether the month holds any activity, and return a typed hand-off. Third step of Well's fetch-missing-invoices flow, after `define-workspace` and `connect-tools`.

## When to use this skill

Use this skill when:

- The user names or implies a month ("last month", "March", "2026-03", "the invoices I'm missing for Q1").
- A calling skill or flow (fetch missing invoices, a month-end review, a close preparation) needs one period fixed before it reads data.
- The user asks which month or accounting period the conversation is working on.
- A period-scoped answer came back and the user wants to move to another month.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first and pass its `workspace_id` in.
- The user wants to close, lock, reopen, or post a period. This skill never starts a close run; that is the Well app's job.
- The user wants what is actually missing, unpaid, or uncategorized inside the month — that is the `show-missing-invoices` step of the flow, after this one.
- The user wants a figure (cash, runway, spend) — the data skills resolve their own window.
- The user wants a range longer or shorter than a month (a quarter, a year, a single week). This skill pins exactly one month; ask which month of the range and pin that.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; never resolve a workspace here.
- `fiscal_year_start_month` — the workspace's `identity.fiscal_year_start_month` from the same hand-off, 1-12. Optional. When it is null or absent, assume `1` (calendar-aligned, the same default Well applies to a workspace with no accounting settings) and say so in the answer.
- `hint` — what the user said about the month: `"March"`, `"last month"`, `"2026-03"`, `"Q1"`. Optional.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for that month"), used in the question if one is asked. Optional.
- `title` / `subtitle` — copy for the period picker card. Optional; pass straight through when the picker tool accepts them.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Two paths, decided by what your toolset actually holds:

- `well_list_periods` — **only when it is present in your toolset.** It returns the workspace's periods with their fiscal coordinates and state. In MCP-Apps hosts its result renders a period picker card; pass `title` / `subtitle` through when the tool accepts them. Check for the tool by name before you plan around it — do not call a tool you have not seen listed.
- `well_get_schema` + `well_query_records` on root `transactions` — the path to use when `well_list_periods` is absent. Call `well_get_schema({ root: "transactions" })` once per session and read the date fields from the result rather than assuming them. Range on `executed_at`, and on that field alone: it is the non-null settlement date Well buckets a transaction's month by, and it already falls back through `booking_date` then `value_date` at ingest when the bank sends no execution date. One field, one range, the whole month. `booking_date` is nullable and is *not* the month field — on the rows where the two disagree it belongs to a different month, so widening the probe with it reports activity this month does not hold. Only when the schema exposes no `executed_at` should you range on `booking_date` instead, and then say the probe is approximate. The probe answers one boolean — does this month hold any bank activity — never a count and never a figure.

Never call `well_start_close` or any close, lock, or posting tool. A close creates a run; this skill only reads. If a caller asks this skill to close a period, refuse and point at the Well app.

**How the fiscal coordinate is derived** — exactly this, never improvised (it mirrors `deriveFiscalPeriod` in the Well platform, so the numbers match what the app and the close endpoints use):

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

`calendar_month` and `fiscal_year_start_month` are 1-based (1 = January). `fiscal_year` is the calendar year in which the fiscal year **started**. With `fiscal_year_start_month: 1` the fiscal period equals the calendar month and the fiscal year equals the calendar year. Period 13 does not exist and this formula never produces it — a 13-period result means the inputs were wrong, not the month.

## Workflow

1. **Confirm the MCP server is configured.** If no `well_*` tool is available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the period is pinned against their workspace's fiscal settings and data. Stop until it is there.

2. **Confirm the workspace.** Require `workspace_id`. If the caller did not pass one, run `define-workspace` and take its hand-off; never pick a workspace here. Pass `workspace_id` explicitly on every call below. Read `fiscal_year_start_month` from the same hand-off; when it is null, use `1` and say the workspace has no fiscal-year setting yet so you assumed a calendar year.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the hint before you read anything else.**
   - A month plus a year (`"2026-03"`, `"March 2026"`) → that month. `resolution: hint_matched`.
   - A bare month name (`"March"`) → the most recent occurrence of that month that has already ended. In April 2026, `"March"` is March 2026; in February 2026, `"March"` is March 2025 — say which year you took.
   - `"last month"` / `"the previous month"` → the last complete month. `"this month"` / `"the current month"` → the running month, `is_complete: false`.
   - A range (`"Q1"`, `"the first quarter"`, `"H1"`, `"2026"`) → do not pick one for the user. Name the months the range covers and ask which one. This skill pins a month, not a range.
   - A month that has not started yet → refuse it in one line, name the last complete month instead, and ask. Do not pin a future month.

4. **With no usable hint, propose or show.**
   - When `well_list_periods` is in your toolset, call it (with `workspace_id`, and `title` / `subtitle` when supported). In an MCP-Apps host its result renders the period picker card — do not restate the periods as a list or table under it. Ask one line, using the caller's `purpose` when given ("Which month should I fetch the missing invoices for?"), and stop.
   - When the tool is absent, propose the **last complete month** in one line and ask the user to confirm or name another: "March 2026 is the last complete month — work on that?" Stop and wait. Do not proceed on an unconfirmed guess when the user gave no hint at all.

5. **Read the answer.**
   - The card's primary button sends `Work on <label>`; a typed answer names a month. Map the label back to the period from the same tool result — never a guessed year. `resolution: user_picked`.
   - A confirmation of your proposal ("yes", "that one") → `resolution: single`.
   - A decline, or "later" → `resolution: unresolved`. Say nothing was pinned and stop; do not run any period-scoped read.
   - An answer that names no recognizable month → say so and ask once more against the same set.

6. **Compute the period, then check it holds anything.**
   - Build `date_range`: `from` is the first day of the month (`YYYY-MM-01`), `to` is its last day (28, 29 on a leap February, 30, or 31).
   - `is_complete` is `true` when the month's last day is before today, `false` for the running month. The current month is a legal answer — it is returned with `is_complete: false` so a caller that needs a closed month can refuse it rather than silently working on a partial one. Never silently swap a user's current-month pick for the previous month.
   - Derive `fiscal_year` and `fiscal_period` with the formula in Tooling.
   - Set `has_activity`: `well_get_schema({ root: "transactions" })` once per session, then one small `well_query_records` on `transactions` with `workspace_id`, `limit: 1`, and a whereClause ranging `executed_at` between `from` and `to`. Do not `_or` a second date field into it — see Tooling for why `booking_date` widens the month rather than completing it. At least one row → `true`. Zero rows → `false`. No bank connector connected, the query failed twice, or the schema exposes no usable date field → `unknown`. Never report `false` when you could not read.

7. **On failure, redirect instead of guessing.** A transient error on any call → retry once. A second failure → do not invent the period's state; the month itself is still pinned (it is arithmetic, not data), so return the hand-off with `has_activity: unknown` and give the user `<well-app-base-url>/workspaces/<workspace_id>` to check the month in Well. Do not append query parameters you have not confirmed the app reads.

8. **Hand off.** State the pinned month in one line and emit the hand-off block below.

## Output requirements

Return:

- One line naming the month in both calendars, and its state: "Working on **March 2026** — fiscal year 2026, period 3. The month is complete and has bank activity." When `fiscal_year_start_month` was assumed, say so in the same line ("no fiscal-year setting on this workspace, so I assumed a calendar year").
- The hand-off block, exactly these keys, so a calling skill can read it:

  ```yaml
  calendar_year: <YYYY>
  calendar_month: <1-12>
  fiscal_year: <YYYY>
  fiscal_period: <1-12>
  period_label: <e.g. March 2026>
  date_range:
    from: <YYYY-MM-01>
    to: <YYYY-MM-DD, last day of the month>
  is_complete: <true|false>
  has_activity: <true|false|unknown>
  resolution: single | hint_matched | user_picked | unresolved
  ```

  On `unresolved`, every other key is null.
- Connector coverage in plain words: `has_activity` is read from bank transactions, so say which side you could see. `unknown` because no bank connector is connected is a different answer from `false`, and the user has to be able to tell them apart — point at `connect-tools` when the bank side is missing.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. When the `show-missing-invoices` skill is installed: "Which invoices are missing for this month?". Otherwise hand control back to the skill that called this one, or, when the user asked for the period on its own, ask what they want to do in it.

Do not return:

- More than one month, or a range presented as a period.
- A restated list of periods when the picker card is already on screen.
- A fiscal period computed any way other than the formula in Tooling.
- Any figure, total, or record count from inside the month.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `workspace_id` came from `define-workspace` (or the caller) and was passed on every call — the workspace was not resolved here.
- `well_list_periods` was used only after confirming it is in the toolset; otherwise the transactions path ran.
- `well_start_close` — and every other close, lock, or posting tool — was not called.
- `fiscal_period` and `fiscal_year` came from the formula, with `fiscal_year_start_month` defaulted to 1 and the assumption disclosed when it was null.
- `fiscal_period` is between 1 and 12. Period 13 was never produced.
- `date_range.from` is the first day and `date_range.to` the real last day of that month, leap years included.
- The current month, when picked, was returned with `is_complete: false` and not swapped for the previous one.
- A range hint (`Q1`, a year) produced a question, not a guess; a future month was refused.
- `has_activity` is `unknown` — not `false` — when the read failed or no bank connector is connected.
- The transactions probe read the date fields from `well_get_schema` rather than assuming them, and ranged `executed_at` alone — no `_or` widening the month with `booking_date`.
- On a transient failure the call was retried once before the fallback link.
- The hand-off block carries every key with `resolution` set.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`show-missing-invoices` when installed, otherwise the caller or a question).

## Examples

### Example request

The fetch-missing-invoices flow calls define-period with the Acme SAS `workspace_id`, `fiscal_year_start_month: 1`, `hint: "March"`, `purpose: "to fetch the invoices missing for that month"`. Today is 12 April 2026.

### Expected behavior

"March" resolves to the most recent March that has ended: March 2026. Derive `fiscal_period = ((3 - 1 + 12) % 12) + 1 = 3` and `fiscal_year = 2026`. Probe `transactions` for activity between 2026-03-01 and 2026-03-31, find rows, and answer: "Working on **March 2026** — fiscal year 2026, period 3. The month is complete and has bank activity." Emit the block with `resolution: hint_matched`, `is_complete: true`, `has_activity: true`, and point at `show-missing-invoices`.

### Example request

"Let's go through a month." — no hint, several months of data, `well_list_periods` is in the toolset. Today is 12 April 2026.

### Expected behavior

Call `well_list_periods({ workspace_id, title, subtitle })`. The picker card renders on the result — do not restate the periods. Ask one line: "Which month should I work on?" and stop. The user presses **Work on February 2026**; map that label back to its period from the same result, derive the fiscal coordinate, probe activity, and emit the block with `resolution: user_picked`. With the tool absent instead, propose the last complete month in one line — "March 2026 is the last complete month — work on that?" — and wait.

### Example request

"Do this month." — today is 12 April 2026, `fiscal_year_start_month: 4`.

### Expected behavior

Pin April 2026, and say plainly that the month is still running: `fiscal_period = ((4 - 4 + 12) % 12) + 1 = 1`, `fiscal_year = 2026` (April opens the fiscal year). Answer: "Working on **April 2026** — fiscal year 2026, period 1. The month is still running, so anything I read for it is partial." Emit the block with `is_complete: false`, `resolution: user_picked`. Do not swap it for March, and do not refuse it — a caller that needs a closed month reads `is_complete` and decides.

### Example request

"Let's do Q1."

### Expected behavior

Do not pick one. Answer in one line — "Q1 is January, February and March 2026 — which one should I work on?" — and stop. When the user answers "February", pin February 2026 with `resolution: user_picked`. If they insist on all three, say this step pins one month at a time and offer to run the flow month by month, starting with January.

### Example request

The workspace has no bank connector and the caller asks for last month.

### Expected behavior

Pin the month normally — the fiscal coordinate is arithmetic, not data. Report `has_activity: unknown`, and say why in one line: "I can't tell whether February 2026 holds any activity — no bank connector is connected to this workspace." Point at `connect-tools` for the bank side, then hand off. Do not report `has_activity: false`.
