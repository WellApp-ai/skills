---
name: cash-position
description: Answer "how much cash do we have right now?" using Well's MCP financial graph — a fast, point-in-time snapshot of current bank/cash balances across all connected accounts, per currency, backed by real synced balances rather than guesswork. Use when the user asks "what's our cash position", "how much cash do we have right now", "current bank balance", "how much money is in the bank", or "what's our total cash on hand today". Requires a connected Well workspace with a banking connector; if none is connected, this skill walks the user through connecting one first.
---

# Check Your Cash Position with Well

## Purpose

Use Well's MCP tools to answer "how much cash do we have, right now?" — a snapshot of current bank/cash balances across every connected account, grouped or converted by currency, as of the latest synced moment. This is deliberately a single point-in-time number: no burn rate, no forecasting, no runway math — just what's in the bank today.

## When to use this skill

Use this skill when the user asks things like:

- "What's our cash position?"
- "How much cash do we have right now?"
- "What's our current bank balance?"
- "How much money is in the bank?"
- "What's our total cash on hand today?"

## When not to use this skill

Do not use this skill when:

- The user wants to know **how long** the cash will last — use `runway`. The burn rate on its own is `avg-burn`. Don't duplicate either one's math here, and don't let this skill drift into estimating runway.
- The user wants cash **projected forward** — use `cash-forecast`, which returns the settled month-end series plus the projection the app charts. For a trailing series alone, this skill's own `balance_history` covers it (step 4); do not assemble a series from raw `account_balances` reads.
- The user wants a spend breakdown or where money is going — use `cost-structure` instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A target currency to convert everything into — default to reporting per-currency (no forced conversion) unless the user asks for one number.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_get_cash_position` — the authoritative total cash on hand plus the per-account breakdown behind it (native amount/currency, converted amount, FX rate applied) — the exact same computation the Well app's canvas KPI card shows. Call this directly; do not re-derive the total yourself from raw `accounts`/`account_balances`/`exchange_rates` reads.
- `well_query_records` — used for the 1-row `accounts` spot-check in step 3.
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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to total the cash you have on hand right now" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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
— keep only rows whose `direction` is `input` and whose `data_domains` contains that kind (never a display name or `category_id`), and read each qualifying row's state in this order, first match wins: (`bank` is **required** here — this run cannot continue past the acknowledgment without every one of them connected or connecting.)
1. `to_configure` or `disabled` → **missing**.
2. `need_reconnect`, `error`, or `suspended` → **error** — offer `install_url` as a reconnect, not a first install.
3. `enabled` with `last_successful_sync_at` set → **connected** (note "data may be partial" if `sync_in_progress: true`).
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting**.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `coverage: none` → stop; there is nothing to total yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `accounts`, before calling `well_get_cash_position` at all. Zero rows means no bank account has landed yet — say so and stop instead of reporting a zero balance as a real cash position.

4. **Get the cash position.** Call `well_get_cash_position()`. It returns `amount`/`currency` (the converted total, in the workspace base currency), `accounts` (per-account contributions: name, native amount/currency, converted amount, FX rate applied), and `as_of` (the FX-rate anchor date).
   - **This is the only analytics tool this skill calls for its own answer.** `well_get_cash_position`'s own response carries every figure this answer states — the converted total, the per-account contributions, and `balance_history` when the user asks about direction over time. Do not call `well_get_runway`, `well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast` or `well_get_cash_flow_bridge` to source anything this answer states — not for a comparison, not for a series, not for one number in a sentence. Each of them draws its own card, so an uninvited second call renders a second block beside the one the user asked for, answering a question they did not ask. `well_get_cash_position`'s own description points at `well_get_runway` for a forward-looking figure; inside this skill that is a skill to name, not a tool to call. If the answer you want needs a figure this payload does not carry — a burn rate, months of cash left, where the money went — that figure belongs to another skill: name it, as the Output requirements already say, rather than fetching it here. What this forbids is enriching THIS answer, not answering a second question the user actually asked: when they ask one, hand it to the skill that owns it and let it answer as its own block.
   - `partial: true` means one or more accounts were excluded (e.g. missing FX rate) — surface the `excluded` count and any `hints` as a caveat rather than presenting the total as unconditionally complete.
   - If the user wants an unconverted per-currency breakdown rather than one converted total, group the returned `accounts` by `native_currency` and sum their `native_amount` — no separate query needed, the tool already carries every account's native figure.
   - `balance_history` carries the trailing closed month-ends plus today, oldest first, built by the same helper the app's forecast uses for its actuals. Use it when the user asks whether cash is rising or falling, rather than assembling a series from raw `account_balances` reads. A `null` amount is a month the history does not cover — say so rather than plotting it as zero, and never interpolate between two real points or extend the series past its last one. It is absent entirely when a reporting period was requested: a historical reading has no live final point to anchor a trailing series on.

5. **If the tool call itself errors, or the workspace has no accounts to report**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or stays empty, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What's our cash position?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Total cash position: the converted total (amount + currency), and/or a per-currency breakdown derived from `accounts` if the user wants amounts kept separate.
- A per-account breakdown: account name, native amount/currency, converted amount, as-of timestamp — straight from `well_get_cash_position`'s `accounts` field.
- An explicit one-line statement that this is a **snapshot** — no burn rate or runway is implied by this number.
- When the user asked about direction over time, the trailing series from `balance_history` with its uncovered months named as gaps — and an explicit note that it is history, not a projection.
- A freshness/caveat line: any `partial`/`excluded`/`hints` the tool surfaced.
- Whether the picture is complete: which banking connectors are connected versus still missing, so the user knows whether this total covers every account they hold or a partial view gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `runway` for how long this cash will last, and to `cash-forecast` for the month-by-month projection.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 5's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the figures in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- Connector "enabled" status was checked before calling `well_get_cash_position`, not just assumed.
- The total and per-account breakdown came straight from `well_get_cash_position`'s response, not re-derived from raw `accounts`/`account_balances`/`exchange_rates` reads.
- If `partial: true`, the `excluded` count and any `hints` were disclosed rather than silently absorbed into the total.
- Every number carries a currency and an as-of timestamp.
- Only this block's analytics tool was called — `well_get_cash_position`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_runway`, `well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge`) was called to source any figure in this answer, including one number in a sentence.
- Which banking connectors are connected versus missing was stated from the coverage hand-off, so the user knows whether the picture is complete or partial.
- The answer never computes or implies a burn rate or runway figure.
- Any trailing series came from `balance_history`, with `null` months reported as gaps rather than zeros, and was never interpolated or extended past its last real point.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's our cash position right now?"

### Expected behavior

Pin the workspace, confirm connections, and spot-check that rows have landed; call `well_get_cash_position()`, and present a per-account breakdown plus the converted total (e.g. "$412,300 USD across 3 accounts, €18,500 EUR in 1 account" — grouping the returned accounts by native currency), each with an as-of timestamp, and a one-line note that this is a snapshot with no runway implied.

### Example request

"How much money is in the bank? We just connected our bank account."

### Expected behavior

Confirm the connections; the hand-off reports the connector as connected but its latest sync still running, so carry on and tell the user the balance may be partial or incomplete rather than presenting a confident total, offering to re-check once the sync finishes.

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
</content>
