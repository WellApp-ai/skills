---
name: fx-exposure
description: Measure how exposed a company is to foreign-currency risk using Well's MCP financial graph — outstanding invoice balances and cash balances summed by non-home currency and converted to the workspace's home/reporting currency at real exchange rates. Use when the user asks "measure our FX exposure", "FX exposure", "currency risk", "how much of our cash/receivables is in foreign currency", "what's our exposure to EUR/USD/GBP", or "currency breakdown of our cash and invoices". Requires a connected Well workspace with invoicing and/or banking data plus a resolvable home currency; if either is missing, this skill walks the user through connecting one or confirming the home currency first.
---

# Measure Your FX Exposure with Well

## Purpose

Use Well's MCP tools to answer "how exposed are we to foreign-currency risk?" — sum outstanding invoice balances and cash balances by non-home currency, and convert each to the workspace's home/reporting currency at a stated real exchange rate, so the user sees exactly how much value sits outside their own currency and what that's worth today. Comes from Well's synced invoice and account data, not from asking the user to estimate.

## When to use this skill

Use this skill when the user asks things like:

- "Measure our FX exposure" / "FX exposure" / "currency risk"
- "How much of our cash (or receivables) is in foreign currency?"
- "What's our exposure to EUR/USD/GBP?"
- "Currency breakdown of our cash and invoices"

## When not to use this skill

Do not use this skill when:

- The user wants a single invoice's currency in isolation — a plain lookup is enough; use `company-profile` or a direct query instead.
- The user wants a cash position without any currency-risk framing — use the sibling `cash-position` skill instead; this skill specifically layers exchange-rate conversion and risk framing on top.
- The user wants runway or burn rate — use `runway` or `avg-burn` instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- The home/reporting currency to measure exposure against — default to asking the user if it's ambiguous, or inferring it from the workspace's own data (see step 4) and stating which approach was used.
- An as-of date for the exchange rates — default to today.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_query_records` — read `invoices`, `accounts`, `account_balances`, `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- Well's OAuth / Dynamic Client Registration (DCR) flow — most hosts trigger it automatically when the Well MCP server is added.

## Workflow

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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to measure your foreign-currency exposure" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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


2. **Confirm the connections this answer needs.** 
The workspace is already pinned — pass its `workspace_id` on the call below; do not re-resolve it here.

Read the current coverage in one call: `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick; `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind; `well_list_connectors({ workspace_id })` otherwise (one unscoped call for two or three kinds — one call renders one card, and a turn never renders two).

For each of the requested kinds —
- `bank`
- `invoicing`
- `accounting`
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

   - `coverage: none` → stop; there is nothing to measure exposure against yet.
   - Any kind `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind under `skipped_by_user` → respect that, don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices` and on `accounts`. Zero rows on both means there is no exposure to measure yet — say so and stop rather than reporting zero exposure as a clean bill of health.

4. **Query outstanding invoices and current cash balances.** Call `well_get_schema({ root: "invoices" })`, `well_get_schema({ root: "accounts" })`, and `well_get_schema({ root: "account_balances" })` before querying each for the first time this session.
   - Invoices: query `invoices` where `payment_status` is `unpaid` or `partial`, regardless of whether the workspace is issuer or receiver — exposure means "money we're owed or owe in a foreign currency," not one side only. Include `local_currency`, `grand_total`, `balance_due`, `issuer.name`, `receiver.name`.
   - Cash: query `accounts` joined to `account_balances` where `balance_at_to IS NULL` (the current-balance row) — never join to `ledger_accounts` for this. Group by `accounts.currency`.
   - Group both result sets by currency.

5. **Determine the home/reporting currency, then separate out the exposure set.** Check `identity.base_currency` from the workspace hand-off first. If it's set, use it. If it's null (accounting settings not yet configured on this workspace), either ask the user directly, or infer it as the most common currency across step 4's invoice/account groups. Whichever approach is used, state it plainly in the output; never silently assume USD or any other default. Once determined, separate out everything in step 4's groups that is **not** the home currency — that's the exposure set.

6. **Convert each non-home currency to the home currency, using the home currency from step 5 as the target and `mode: convert`.** 
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

   - Use its `per_currency` rows for the per-currency exposure lines and its `converted_total` for the single home-currency figure. A workspace with exactly one foreign currency still needs converting — `mode: convert` makes that explicit. Every rate and rate date it returns belongs in the output; an exposure number without its rate is not auditable.
   - `partial: true` means a currency had no rate in Well. That currency is still real exposure — report it in its own currency, name it as unconverted, and say the home-currency total excludes it. Dropping it understates exposure, which is the one direction this skill must never err in.

7. **Report exposure per currency.** For each non-home currency: the exposure amount in its original currency, the converted home-currency equivalent, and its share of total exposure. Total everything into one home-currency exposure figure.

8. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "How exposed are we to foreign-currency risk?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The home/reporting currency and how it was determined (asked vs. inferred from workspace data).
- A per-currency exposure table: original amount, converted home-currency amount, the rate and rate_date used, and % of total exposure. `well_query_records` ships its own card, and that card renders these rows — so do not restate them in prose. It draws no chart, and neither do you: this skill has no tool of its own, so the answer is the table and the prose around it.
- The as-of date the exposure and rates were computed against.
- Whether the picture is complete: which relevant connector categories (banking for cash exposure, invoicing/bills for receivable and payable exposure) are connected versus still missing — with only one of the two connected, say plainly that this is cash-only or invoice-only exposure rather than their full currency risk.
- A one-line pointer to `cash-position` for the plain cash total without the currency-risk framing.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- If step 8's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** This skill has no Well MCP tool of its own, so no card is
drawn for it on any host — the widget-disclosure reasoning the tool-backed skills carry
does not apply here. Answer in prose and a markdown table, and state every figure in the
text. Do not compose a styled visual: Well's own surfaces own how Well data is drawn, and
this answer is not one of them.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- Connection state came from the coverage hand-off, and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The home currency is explicitly stated, along with how it was determined — never silently assumed.
- Invoice exposure includes both AR and AP unpaid/partial invoices, not just one direction.
- Cash exposure comes from `accounts` joined to `account_balances` where `balance_at_to IS NULL`, never joined to `ledger_accounts`.
- `well_get_schema` was called before the first query of `invoices`, `accounts`, `account_balances`, and `exchange_rates`.
- Every conversion cites the rate and `rate_date` actually used, with the at-or-before fallback stated if an exact-date rate wasn't available.
- Every number carries a currency, and every total is anchored to an as-of date.
- Which connector categories (banking, invoicing/bills) are connected versus missing was stated from the coverage hand-off, so a cash-only or invoice-only exposure figure is never presented as the full picture.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"How exposed are we to foreign-currency risk right now?"

### Expected behavior

Pin the workspace, confirm connections, and spot-check that rows have landed; pull unpaid/partial invoices and current account balances grouped by currency; determine the home currency (from `identity.base_currency`, or by asking the user or inferring it from those groups, stating which); separate out the non-home-currency groups as the exposure set; convert the per-currency subtotals to the home currency and present a table showing each foreign currency's original amount, converted amount, rate/rate_date used, and share of total exposure, plus a total exposure figure and as-of date.

### Example request

"What's our EUR exposure?" (asked on a workspace where every invoice and account is already in the home currency)

### Expected behavior

Determine the home currency, query invoices and account balances, find no non-home-currency balances at all, and report plainly that FX exposure is zero — the workspace holds no foreign-currency cash or receivables — rather than fabricating a risk figure or forcing a currency breakdown where none exists.

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
