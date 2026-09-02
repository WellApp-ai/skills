---
name: define-period
requires: [define-workspace]
description: Pin the calendar month or months — with their fiscal coordinates — a Well workspace job works on, written server-side by the user's click on the period picker card, and hand the selection off as a typed result; or, in `collect` mode, hand one month's coordinates back to a caller that commits the period by starting a run, where naming the month is starting and this skill writes no commit. Use when the user says "last month", "March", "2026-03", "the period we're working on", asks which month a job covers, when a Well skill needs the period fixed before it reads data, or when a close or other start-a-run flow needs one month collected first. Defaults to the last complete month, refuses a month that has not ended, derives fiscal coordinates from the workspace's fiscal-year start month, and reports whether the selection has any activity. Do not use to close, lock, or reopen a period, to run a month-end close, to resolve which workspace the conversation is about, or to list what is missing inside the month.
---

# Define Period with Well

## Purpose

Fix which month or months a job works on, and make that selection live **server-side**, where the period-scoped tools read it. The period picker card's **Use** click writes the selection itself (it calls `well_switch_workspace` with `periods`) and prefills a confirmation — "Work on <Month Year> and <Month Year>" — in the user's composer; the user sends it, and that message is how the skill resumes. A typed month is written the same way the click writes it, by calling `well_switch_workspace({ periods })` directly. Once the selection is written, the later reads (`well_list_missing_invoices`, `well_preview_invoice_fetch`) are called **without** a periods argument — the server holds the user's selection. Read only otherwise: derive each month's fiscal coordinate, check for activity, and hand off. In Well's fetch-missing-invoices flow it runs straight after `define-workspace`, and that flow's bank step runs after it.

**Two modes.** The default (`mode: select`) is everything above: the selection is written server-side and the period-scoped reads that follow omit their periods argument. A caller that *starts a run* from the month — a month-end close, where naming the calendar month **is** starting the close, so the month names the run directly — invokes `mode: collect` instead. In `collect` this skill collects **exactly one** calendar month through the same picker UX, treats the picker purely as month collection, and hands the raw `calendar_year` + `calendar_month` back for the caller to pass to its start tool. It is not the commit: the card's own **Use** click may still write a selection incidentally, but in `collect` that write is never the deliverable and is never relied on. The caller commits the period by starting its run.

## When to use this skill

Use this skill when:

- The user names or implies a month ("last month", "March", "2026-03", "the invoices I'm missing for Q1").
- A calling skill or flow (fetch missing invoices, a month-end review, a close preparation) needs the period selection fixed before it reads data.
- The user asks which month or accounting period the conversation is working on.
- A period-scoped tool answered that no period selection exists yet.
- A period-scoped answer came back and the user wants to move to another month.

## When not to use this skill

Do not use this skill when:

- The workspace is not pinned yet — run `define-workspace` first and pass its `workspace_id` in.
- The user wants to close, lock, reopen, or post a period. This skill never starts a close run; that is the Well app's job.
- The user wants what is actually missing or unpaid inside the month — that is the `show-missing-invoices` step of the flow, after this one.
- The user asks which counterparties carry no category — that is `categorize-counterparties`, which runs between this step and the gap list. The gap list covers categorized spend only, so it cannot answer it.
- The user wants a figure (cash, runway, spend) — the data skills resolve their own window.

## Inputs

The calling skill or the user provides:

- `mode` — `select` (default) writes the selection server-side and hands off the period list, so the period-scoped reads that follow omit their periods argument; `collect` collects a single calendar month and hands its `calendar_year` + `calendar_month` back for a caller that commits the period by starting a run (a close). Optional; defaults to `select`.
- `show_close_readiness` — optional boolean, default `false`. When `true` (a close/start caller passes it), surface each period's **close readiness** on the picker and in the hand-off: the `close_status` (`closeable`, `not_ready`, `closed`, `nothing_to_close`) and single `close_reason` that `well_list_periods` already returns per period, plus its `missing_invoice_count` / `unposted_invoice_count`. This is the **run-free** readiness — a coarse "is this month closeable, and roughly why not" — **not** the full blocker ladder, which only `well_get_close_state` carries and only after a run is started. Reading and stating these fields is never calling a close tool; the guardrail below (never call `well_start_close` or any close/lock/posting tool) stands unchanged.
- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; never resolve a workspace here.
- `fiscal_year_start_month` — the workspace's `identity.fiscal_year_start_month` from the same hand-off, 1-12. Optional. When it is null or absent, assume `1` (calendar-aligned, the same default Well applies to a workspace with no accounting settings) and say so in the answer.
- `bank_state` — the bank side's state from the same flow: `connect-bank`'s `state`, or the bank kind's `state` from `connect-tools`' hand-off — `connected`, `connecting`, `error`, or `missing`. Optional. It is the only thing that tells a month holding no activity apart from a month with no bank feed behind it; this skill reads no connector state of its own.
- `probe` — optional boolean, default `true`. A caller passes `false` when it cannot afford the activity probe's two reads, because it bans `well_query_records`, or because its own later read is the activity check. With `probe: false` this skill calls neither `well_get_schema` nor `well_query_records`: `has_activity` comes from `bank_transaction_count` where the period rows carry it, and is `unknown` where they do not.
- `hint` — what the user said about the month: `"March"`, `"last month"`, `"2026-03"`, `"Q1"`. Optional.
- `purpose` — one line from the calling skill (e.g. "to fetch the invoices missing for that month"), used in the card-pointing line when one is needed. Optional.
- `title` / `subtitle` — copy for the period picker card. Optional; pass straight through when the picker tool accepts them.

**Several workspaces.** A multi-workspace run is driven by the caller: the pin plus the session's `workspace_queue` (read from `well_list_workspaces`' `session` block) name the sequence, and this skill always works on the currently pinned workspace only. The caller re-pins with `well_switch_workspace({ workspace_id })` between passes: that form moves the pin alone and leaves the `workspace_queue` standing, while `workspace_ids` replaces the queue and ends the run early. **This skill pins nothing.** Its one write is the period selection, and `well_switch_workspace({ periods })` carries no workspace and leaves the pin where it stands. Each pass writes and hands off its own period selection, and nothing is merged across two entities.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry.

**Composed skills.** One atomic Well skill owns the step before this one — invoke it, don't reimplement it:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there is no connection yet, and pins exactly one workspace. Supplies the `workspace_id` every call here carries, and the `fiscal_year_start_month` the fiscal coordinate is derived from. It ships with the `well-skills` plugin. This skill takes its `workspace_id` and never resolves the workspace itself: when none was passed and this conversation established no pin, run `define-workspace` first (step 2) rather than asking for a workspace here.

**The tools this skill calls**, one line each — for full field semantics, fallback paths, and edge cases on any of them, read `references/tool-reference.md`:

- `well_list_periods` — **only when it is present in your toolset.** Lists the workspace's periods with their fiscal coordinates and state; in MCP-Apps hosts its result renders the period picker card. Called at step 4, with no usable hint. Check for the tool by name before you plan around it.
- `well_switch_workspace({ periods: [{ calendar_year, calendar_month }, …] })` — how a period selection is **written**. The card's **Use** click calls it; call it yourself when a hint or a typed answer resolves the months (steps 3 and 5), so the selection is just as live as a clicked one. A `periods` list holds at most twelve months.
- `well_wait_for_selection({ kind: "periods", timeout_s? })` — reads the click on an already-rendered picker card (step 5), for when a later message is not the card's prefill. Never call it before this conversation has rendered the picker, and never as a probe for whether a selection already exists.
- `well_list_workspaces` — resync only, for a `session.selected_periods` this conversation itself wrote (step 2). Never trust it to skip the picker.
- `well_get_schema` + `well_query_records` on root `transactions` — the activity probe (step 6). Two answers cancel it before it runs: a `bank_transaction_count` on the period rows, and a caller's `probe: false`.

Never call `well_start_close` or any close, lock, or posting tool. A close creates a run; this skill only reads and writes the session's period selection. If a caller asks this skill to close a period, refuse and point at the Well app.

**How the fiscal coordinate is derived** — exactly this, never improvised. It is the same arithmetic Well applies server-side, so the numbers match what the app shows for the same workspace:

```
fiscal_period = ((calendar_month - fiscal_year_start_month + 12) % 12) + 1
fiscal_year   = calendar_month >= fiscal_year_start_month ? calendar_year : calendar_year - 1
```

`calendar_month` and `fiscal_year_start_month` are 1-based (1 = January). `fiscal_year` is the calendar year in which the fiscal year **started**. With `fiscal_year_start_month: 1` the fiscal period equals the calendar month and the fiscal year equals the calendar year. Period 13 is Well's adjustment period: it sits outside the twelve calendar months, so it carries no calendar month and the period-scoped reads refuse it. This formula never produces it, so a 13 here means the inputs were wrong, not the month.

## Workflow

Call each list or read tool once per step, and render at most one widget card per turn. The cards refresh themselves. A card click executes server-side and prefills a message in the user's composer — rendering a card therefore ends the turn, and the sent message is how the skill resumes.

**In `mode: collect`** (a close or other start-a-run caller) the shape below is the same but the commit is not. Collect **exactly one** calendar month — refuse a multi-month pick in one line, since a run closes a single month — and treat the picker purely as month collection. Do not rely on the card click's server-side write as the selection: the deliverable is the month's `calendar_year` + `calendar_month`, handed back for the caller to pass to its start tool (`well_start_close`). Skip the "later reads omit their periods argument" narration entirely — it does not apply — and at step 8 hand control back to the caller rather than pointing at a period-scoped read. Everything else (workspace, hint resolution, the picker UX, the fiscal-coordinate arithmetic, the refusal of a month that has not ended) is unchanged.

**When `show_close_readiness` is `true`** (the close flow passes it, always in `collect`), read the per-period `close_status` / `close_reason` and the `missing_invoice_count` / `unposted_invoice_count` that `well_list_periods` returns, and state them alongside the picker and in the hand-off — one plain line per month the picker offers, e.g. "March 2026: not ready, 3 missing invoices, 2 unposted." This is what lets the caller's confirm double as a deliberate go-ahead: the user sees whether the month is closeable, and roughly why not, **before** confirming the month that starts the run. Be explicit that this is the coarse, run-free readiness — the full blocker ladder appears only after the run starts (the caller's `well_get_close_state`), so never present these counts as the complete list of what is blocking the close.

1. **Confirm the MCP server is configured.** If no `well_*` tool is available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the period is pinned against their workspace's fiscal settings and data. Stop until it is there.

2. **Confirm the workspace, and reuse a selection that already exists.** Require `workspace_id`. If the caller did not pass one, run `define-workspace` and take its hand-off; never resolve a workspace here — and never ask for it in text. Read `fiscal_year_start_month` from the same hand-off; when it is null, use `1` and say the workspace has no fiscal-year setting yet so you assumed a calendar year. When the session holds `selected_periods` that THIS conversation itself wrote (its own card click or typed months, earlier in the conversation) and the user is not asking to change the month, use that selection silently and go to step 6 — never re-ask a choice this conversation already made. A `selected_periods` present at conversation start that this conversation did not write is another conversation's leftover: ignore it, never mention it — "already recorded" / "already selected" is forbidden phrasing — and continue to steps 3–4 as if it were unset; the user's fresh pick overwrites it server-side.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Read the hint before you read anything else.** A hint that resolves is written server-side at once: call `well_switch_workspace({ periods: [...] })` with the resolved months, say which months you took, and go to step 6.
   - A month plus a year (`"2026-03"`, `"March 2026"`) → that month. `resolution: hint_matched`.
   - A bare month name (`"March"`) → the most recent occurrence of that month that has already ended. In April 2026, `"March"` is March 2026; in February 2026, `"March"` is March 2025 — say which year you took.
   - `"last month"` / `"the previous month"` → the last complete month. `"this month"` / `"the current month"` → refuse the running month the same way you refuse a future one, and name the last complete month instead.
   - **Several months named** ("March and April", "Q1", "the first quarter") — **in `mode: select`**, a legal selection: resolve each month and write them all in one `periods` list, oldest first, and never more than twelve. `resolution: hint_matched`. A hint spanning more than a year exceeds the cap: say so and ask which twelve months to take. A quarter name is read as a calendar quarter — "Q1" is January to March — so when `fiscal_year_start_month` is not `1`, name the three months you took, because the workspace's own first quarter starts elsewhere. **In `mode: collect`**, refuse a multi-month hint in one line — a close runs a single calendar month — name the months you read, ask which one to take, and neither write nor hand back more than one.
   - A month that has not ended — the running month or a later one → refuse it in one line, name the last complete month instead, and let the picker or the user's answer decide. Every month this skill pins has ended: the picker leaves a still-accruing month unselectable, and the period-scoped reads that follow refuse the whole call when the selection holds one, so a running month does not read partially, it reads not at all.

4. **With no usable hint, end the turn on the picker.**
   - When `well_list_periods` is in your toolset, call it (with `workspace_id`, and `title` / `subtitle` when supported). Its result renders the period picker card — do not restate the periods under it and do not ask "which month?" in text; the card is the question. End the turn with one short line: pick the month or months on the card, then send the message it prepares. Use `purpose` when the caller gave one. Nothing else in the turn. The **Use** click writes the selection server-side and prefills "Work on <Month Year> and <Month Year>" in the composer. **In `mode: collect`**, ask for a single month on the card; if the pick comes back with several, refuse in one line — a close runs a single calendar month — and ask which one to keep.
     - In a text-only host (no cards, and usually no wait tool), the card cannot appear at all: name the last three complete months on one line each — month, fiscal year and period — and ask one line. This is the only host where a typed question stands in for the picker.
   - When the tool is absent, propose the **last complete month** in one line and ask the user to confirm or name another: "March 2026 is the last complete month. Work on that?" Stop and wait. On a confirmation, write it with `well_switch_workspace({ periods: [...] })`, `resolution: single`.

5. **Resolve the next message after the card.** In this order, and never by re-asking:
   - The message is the card's prefill ("Work on <Month Year> …") → the click already wrote the selection server-side. Acknowledge in half a sentence and continue to step 6 — never re-verify with an extra tool call what the prefill already states, and never re-write the selection. `resolution: user_picked`.
   - The message names a month or months in its own words → step 3's typed path: resolve, write with `well_switch_workspace({ periods })`, `resolution: user_picked`. In `mode: collect`, a message naming more than one month is refused the same way as a multi-month hint — take a single month, or ask which one.
   - Any other message that needs the period → call `well_wait_for_selection({ kind: "periods", timeout_s: 10 })` once. `selected` (fresh or `already_set`) → the click landed; narrate it and continue. `no_selection_yet` → one line asking to click the card, end the turn.
   - A decline ("later") → `resolution: unresolved`. Say nothing was pinned and stop; do not run any period-scoped read.

6. **Compute the coordinates, then check the selection holds anything.** For each selected month:
   - Build `date_range`: `from` is the first day (`YYYY-MM-01`), `to` is its last day (28, 29 on a leap February, 30, or 31).
   - `is_complete` is `true` when the month's last day is before today. It is `true` for every month this skill pins, because a month that has not ended was refused back at step 3.
   - Derive `fiscal_year` and `fiscal_period` with the formula in Tooling.
   Then set `has_activity` once for the whole selection. Take the first branch that applies:

   1. `bank_state` is `missing` or `error` → `unknown`. No settled activity can have reached Well, so run no probe and read no count.
   2. The period rows carry `bank_transaction_count` → run no probe, and read the counts in this precedence: one selected month above 0 sets `true`, because that month holds bank activity whatever the other months carry; otherwise a selected month whose count is missing sets `unknown`; otherwise every selected month is at 0, which sets `false` **only when `bank_state` is `connected`** and `unknown` in every other case, a `connecting` feed and an absent `bank_state` included. A 0 from the count carries the same gate as a 0 from the probe: a feed that is still landing, or one this skill cannot see the state of, has not proved the month is empty.
   3. The caller passed `probe: false`, and no count is available → `unknown`.
   4. Otherwise probe. Call `well_get_schema({ root: "transactions" })` once per session, then one small `well_query_records` on `transactions` with `workspace_id`, `limit: 1`, and a whereClause built from the selected months' own `date_range` values: one `executed_at` interval per run of consecutive months, and an `_or` of those intervals when the selection breaks into more than one run. Never range from the earliest `from` straight to the latest `to`: months picked on the card need not be consecutive, so a March-plus-May selection read as one span reports `true` on a transaction that only April holds. The `_or` joins intervals of `executed_at`; never `_or` a second date field into it. At least one row → `true`. Zero rows → `false` only when `bank_state` is `connected`: a feed still `connecting` has not finished landing, so an empty result proves nothing yet, and with no `bank_state` at all this skill cannot tell an empty month from an absent feed — both are `unknown`. The query failed twice, or the schema exposes no usable date field → `unknown`. Never report `false` when you could not read.

7. **On failure, redirect instead of guessing.** A transient error on any call → retry once. A second failure → do not invent the selection's state; the months themselves are pinned (arithmetic, not data), so hand off with `has_activity: unknown` and give the user `<well-app-base-url>/workspaces/<workspace_id>` to check the month in Well. Do not append query parameters you have not confirmed the app reads.

8. **Hand off.** State the selection in one line and keep the hand-off facts below for the caller — never printed as a block. Remind the caller in your own reasoning, not in print: the period-scoped reads that follow (`well_list_missing_invoices`, `well_preview_invoice_fetch`) are called **without** a periods argument, because the server holds this selection.
   - **In `mode: collect`**, the hand-off is the single month's `calendar_year` + `calendar_month` (plus its derived `fiscal_year` / `fiscal_period` for narration), and the deliverable line says the caller commits the period by starting its run — nothing here is the commit. Hand control back to the caller; do not point at a period-scoped read, and do not tell the caller to omit a periods argument.

## Output requirements

Return:

- One line naming the selection in both calendars, and its state: "Working on **March 2026**, fiscal year 2026, period 3. The month is complete and has bank activity." For several months: "Working on **February and March 2026**, fiscal periods 2 and 3, both complete." When `fiscal_year_start_month` was assumed, say so in the same line.
- The hand-off, kept for the calling flow and never printed: `periods` — one entry per selected month, each with `calendar_year`, `calendar_month`, `fiscal_year`, `fiscal_period`, its label, `date_range` (`from` the first day, `to` the real last day), `is_complete`, and `bank_transaction_count` when the month's `well_list_periods` row carried one (absent where the row did not carry it, and on the hint path where no row was read: absent is not 0); `period_label` for the whole selection — "to" only for consecutive months (e.g. "March 2026", "March to April 2026"), and "and" when the selection skips a month ("March and May 2026"), so a reader is never told a gap is covered; `has_activity` (`true`, `false`, or `unknown`); and `resolution` — `single`, `hint_matched`, `user_picked`, or `unresolved`. On `unresolved`, nothing else is kept. The selection itself lives server-side (`session.selected_periods`), which is why the later reads omit their periods argument; these keys are narration and routing vocabulary, and the hand-off travels as plain conversation, not as a data block.
- Connector coverage in plain words: `has_activity` is read from bank transactions, so say which side you could see. `unknown` because `bank_state` said the feed is missing or in error is a different answer from `false`, and the user has to be able to tell them apart — point at `connect-bank`, or `connect-tools` when the wider set is missing. When no `bank_state` reached this skill, say the bank side is unconfirmed rather than naming a cause you cannot check.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- End with a one-line pointer to the next step. Inside a flow, hand control back to the skill that called this one — and in `mode: collect` that is the whole hand-off: the caller starts the run from the collected month, so name no period-scoped follow-up. On a standalone ask (only ever `mode: select`), name the step that actually follows: `categorize-counterparties` when it is installed ("Do the suppliers behind this month all carry a category?"), and `show-missing-invoices` when it is not ("Which invoices are missing for this month?"). With neither installed, ask what the user wants to do in the month.
- The whole answer stays one to three plain sentences a non-technical user understands: the selection now pinned, whether it is complete and holds activity, and the next step. Never print yaml, JSON, or a fenced code block to the user.

Do not return:

- A yaml or JSON block, or any fenced code block — the hand-off travels as plain conversation.
- A restated list of periods when the picker card is already on screen, or a text question "which month?" in a host that renders the card.
- A fiscal period computed any way other than the formula in Tooling.
- Any figure, total, or record count from inside the selection. One exception: `bank_transaction_count` travels in the hand-off, because a caller decides on it whether to ask the user for a bank connection.
- An instruction to a later skill to pass the periods explicitly — the server holds the selection; explicit periods are only the older-server degrade path.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the period picker from one that
did not. Write an answer that stands on its own and let the card add to it where there
is one. State the periods in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, run the full checklist in `references/quality-checklist.md` — it re-checks the workspace pin, the server-side write, `show_close_readiness` handling, the fiscal formula, `has_activity`'s precedence rules, and every hard prohibition above against what you actually did this run.

## Examples

Seven worked examples cover hint resolution, the no-hint picker path, a several-months hand-off (both consecutive and with a gap), a quarter name, a missing bank feed, and a `collect`-mode call from a close — read `references/examples.md`.

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
