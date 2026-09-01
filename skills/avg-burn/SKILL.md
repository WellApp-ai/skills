---
name: avg-burn
description: Answer "what is our burn rate?" using Well's MCP financial graph — the trailing average of real monthly outflows, with the window it was measured over and how much of that window actually carried spend. Use when the user asks "what's our burn rate", "how much are we spending per month", "what's our monthly burn", or "how much goes out each month". Requires a connected Well workspace with bank or accounting data; if none is connected, this skill guides the user to connect one first.
---

# Check Your Average Monthly Burn with Well

## Purpose

Report one figure: the average monthly outflow. It comes from `well_get_burn`, the same computation the Well app's avg-burn tile renders, with internal transfers excluded and FX already applied.

The window matters as much as the number. The average always divides by the whole window, so a window containing months with no recorded spend reports a LOWER figure than the months that did have spend — which is honest, but reads as "the typical month" unless you say otherwise.

**What the figure is, arithmetically.** You do not compute this — `well_get_burn` does — but
you have to describe it correctly when the user asks what it counts:

- **Sum of outflow magnitudes over the window, divided by every month IN the window.** The
  divisor is the window length, never the count of months that carried spend. This is the whole
  reason `months_with_data` and `months_in_window` are both returned.
- **Outflow is elected per window, not read off the sign.** A workspace's sign convention is
  measured within the window being reported, so two windows over the same workspace can disagree
  and both be right.
- **Internal transfers are excluded structurally, not by category.** A movement whose both
  payment-means legs resolve to accounts the workspace owns is not spend leaving the business.
  No category, label, or transaction type decides this, so a user recategorizing a row does not
  change the burn.
- **Card and loan legs are excluded.** Card spend counts on the date its repayment leaves the
  bank account, so a window can look low simply because the repayment falls outside it.
- **FX is applied before summing**, into the workspace's base currency.
- **The window is anchored to the last closed month that carries data**, not to today, so a
  mid-month run does not report a partial month as a full one.

## When not to use this skill

Do not use this skill when:

- The user wants **how long the cash lasts** — use `runway`. It composes this burn with the cash position; do not divide the two yourself here.
- The user wants **what the spend is made of** — use `cost-structure`. That covers a single closed month by category and will not sum to a trailing average, so the two are not a decomposition of one another.
- The user wants **cash projected forward** — use `cash-forecast`.
- The user wants **inflows as well as outflows**, reconciled — use `cash-flow-waterfall`. This skill reports outflow only.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Step 1 resolves it; this skill never picks a workspace itself.
- A reporting period — a calendar year and month — to measure a past window rather than the live one. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.
- A window length in months (default 3). Widen it to smooth a lumpy month, narrow it to react faster.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how the workspace step below resolves the workspace.
- `well_get_burn` — the authoritative trailing average monthly burn, plus `trailing_months`, `months_in_window` and `months_with_data`. Call this directly; do not sum or group `transactions` yourself, and do not read the `avg_burn` field nested in `well_get_runway` instead — that one is pinned to the runway's own window and cannot be widened.
- `well_query_records` — the data-freshness read in step 3, and nothing else. Step 2 reads connector state through `well_list_connectors` alone; a `well_query_records` call on `workspace_connectors` bypasses that logic and the step checks that it did not happen.
- `well_list_connectors` — how the connection step below surfaces install links.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by step 1. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, step 1 calls it.

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


2. **Confirm the connections this answer needs.** 
The workspace is already pinned — pass its `workspace_id` on the call below; do not re-resolve it here.

Read the current coverage in one call: `well_list_connectors({ workspace_id, from_selection: true })` when this run follows a vendor pick; `well_list_connectors({ workspace_id, kind })` when the job covers exactly one kind; `well_list_connectors({ workspace_id })` otherwise (one unscoped call for two or three kinds — one call renders one card, and a turn never renders two).

For each of the requested kinds —
- `bank`
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

   - `coverage: none` → stop; burn cannot be measured yet. The install links are already on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Step 2 reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Keep those timestamps — a connector that has not synced in weeks makes the figure stale rather than wrong. `well_get_burn` returning `unavailable: true` in the next step is the other half of this check.

4. **Get the burn.** Call `well_get_burn()`. Pass `year` and `month` only if the user named a past period, and `months_back` only if they asked for a different window. It returns `amount` (a positive magnitude, not a signed figure), `currency`, and the window metadata:
   - **This is the only analytics tool this skill calls.** `well_get_burn`'s response carries every figure this answer states. Never call `well_get_runway`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge` or `well_get_cash_position` to source anything here — not a comparison, not a series, not one number in a sentence. Each draws its own card, so a second call renders a second block answering a question nobody asked. `well_get_runway`'s nested `avg_burn` is doubly out of bounds: it is pinned to the runway's own window. A figure this payload does not carry belongs to another skill — name it. That forbids enriching THIS answer, not answering a second question the user actually asked.
   - `unavailable: true` → `amount` is a placeholder, not a measurement. A burn of zero standing on nothing measured is not a reading — say so instead of reporting €0 of spend, and treat this as the fallback below.
   - `partial: true` → individual transactions were excluded from an otherwise real figure (e.g. a missing FX rate). Disclose the `excluded` count and any `hints`.
   - `months_with_data` lower than `months_in_window` → the average still divides by every month in the window. State both numbers. A workspace with spend in 2 of 3 months has a real average over 3 months, NOT the typical monthly outflow, and reporting it as the latter overstates how little is going out.
   - `change` / `trend`, when present, are the month-over-month movement. `trend` is good/bad polarity rather than raw sign — a rising burn is `"down"`.

5. **If the tool call errors, or returns `unavailable: true`**, do not guess a figure. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back. If it errors again or stays unavailable, the fallback is: (a) state the fallback question plainly in your reply ("What's our burn rate?"), (b) say plainly that it cannot be measured yet rather than estimating, and (c) link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly.

## Output requirements

Return:

- The burn figure: amount, currency, and the window it covers (`trailing_months`).
- The window's coverage when `months_with_data` is lower than `months_in_window` — both numbers, and the fact that the average divides by the whole window.
- A freshness/caveat line: `as_of`, plus any `partial`/`excluded`/`hints` the tool surfaced.
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing, read off step 2's `coverage` and `skipped_by_user`.
- A one-line pointer to `runway` for how long the cash lasts at this rate, and to `cost-structure` for what the spend is made of. Name them; do not answer them here.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If the fallback above was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one. Do
not compose a second rendering of figures the tool already returned.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from step 1, and its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from step 2 and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The window (`trailing_months`) is stated, not left implicit.
- If the user asked what the figure counts, the divisor was described as the whole window and the transfer exclusion as structural — never as something a recategorization would change.
- When `months_with_data` was lower than `months_in_window`, both numbers were stated and the divisor was explained — the figure was never presented as the typical month.
- `unavailable: true` was reported as "not measured yet", never as a burn of zero.
- No runway figure, spend breakdown, or forecast was composed here — each was pointed at by name instead.
- No other block's analytics tool was called to source any figure here — only `well_get_burn`, plus the single retry step 5 allows.
- Which connector categories are connected versus missing was stated from step 2, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's our burn rate?"

### Expected behavior

Pin the workspace, confirm the connections, check freshness, call `well_get_burn()`, and answer with the amount, the currency, and the trailing window — e.g. "You're burning about €13,400 a month, averaged over the last 3 full months." Add the coverage line if the window has dark months, then point at `runway` and `cost-structure` without answering either.

### Example request

"Our burn looks low — we had a quiet month in there. Can you average over six?"

### Expected behavior

Call `well_get_burn({ months_back: 6 })`. Report the wider average and, if `months_with_data` is still below `months_in_window`, say how many months of the six actually carried spend and that the average divides by all six. The user's instinct is the thing this metadata exists to confirm or correct, so answer it directly rather than only restating the new figure.

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
