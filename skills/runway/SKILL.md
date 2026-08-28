---
name: runway
description: Answer "how much runway do we have?" using Well's MCP financial graph — months of cash left, computed from real synced balances divided by actual trailing burn, with the dividend and divisor shown so the number can be challenged. Use when the user asks "what's my runway", "how much runway do we have", "when do we run out of cash", or "how many months of cash are left". Requires a connected Well workspace with bank or accounting data; if none is connected, this skill guides the user to connect one first.
---

# Check Your Runway with Well

## Purpose

Answer one question: how many months of cash are left. The figure is `well_get_runway`'s, which is the same computation the Well app's own runway tile renders — cash on hand divided by trailing average burn, with sign-convention detection, internal-transfer exclusion and FX conversion already applied.

This skill reports that one figure and the two numbers behind it. It does not draw a forecast, break down spend, or chart a trend — each of those is its own skill, and asking for a runway should not produce all four.

## When to use this skill

Use this skill when the user asks:

- "What's my runway?" / "How much runway do we have?"
- "When do we run out of money?"
- "How many months of cash are left?"

## When not to use this skill

Do not use this skill when:

- The user asks about the **burn rate itself** — how much goes out per month — use `avg-burn`. That skill reports the burn over a window you can widen or narrow, which this skill's figure cannot.
- The user wants to see **cash projected forward month by month** — use `cash-forecast`. It returns the real settled balances plus the projection the app charts; do not project this skill's two numbers forward yourself into a series the product does not compute.
- The user wants **what the money is being spent on** — use `cost-structure`.
- The user wants only the **current balance**, with no burn or runway math — use `cash-position`.
- The user wants to know how the opening balance became the closing one — use `cash-flow-waterfall`.
- The workspace has no bank/cash connector at all and the user declines to connect one — say runway cannot be computed instead of estimating from nothing.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A reporting period — a calendar year and month — to read the runway as it stood at the end of a past month rather than today. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.
- Nothing else. There is deliberately no burn-window option: the runway figure composes the endpoint's own trailing burn, so a custom window would pair `months` from one window with `avg_burn` from another and the division this skill shows could not reproduce its own headline. A user asking for a different window wants `avg-burn`.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace.
- `well_get_runway` — the authoritative cash-on-hand, trailing-average burn, and computed runway. Call this directly; do not re-derive cash or burn yourself from raw `accounts`/`transactions`/`account_balances` reads — that path is more error-prone and can drift from what the app shows.
- `well_query_records` — used by `connect-tools` for the connection check; called here only for the data-freshness read in step 3.
- `well_list_connectors` — how `connect-tools` surfaces install links.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to compute your cash runway" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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

   - **`internalCheck=true` is not optional here.** Omitting it renders the connect picker and ENDS THE TURN on a Continue click — right when the user asked to connect something, wrong for a figure they asked for. Omitting it turns a one-round-trip answer into a three-round-trip flow.
   - `coverage: none` → stop; runway can't be computed yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Keep those timestamps: the answer has to say how fresh its inputs are, and a connector that hasn't synced in weeks makes the number stale rather than wrong. `well_get_runway` returning `"insufficient_data"` in the next step is the other half of this check.

4. **Get the runway.** Call `well_get_runway()`. Pass `year` and `month` only if the user named a past period. The tool takes no burn-window option. It returns `cash` (amount + currency), `avg_burn` (amount + currency + trailing window), `months`, and a `status`:
   - **This is the only analytics tool this skill calls for its own answer.** `well_get_runway`'s own response carries every figure this answer states, the burn scalar in `avg_burn` included. Do not call `well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge` or `well_get_cash_position` to source anything this answer states — not for a comparison, not for a series, not for one number in a sentence. Each of them draws its own card, so an uninvited second call renders a second block beside the one the user asked for, answering a question they did not ask. The tools' own descriptions invite exactly these calls — `well_get_runway`'s says to call `well_get_burn` for a different window — and inside this skill that invitation does not apply. If the answer you want needs a figure this payload does not carry — a month-by-month burn series, a change in the burn or the cash rather than in the runway, a category split — that figure belongs to another skill: name it, as the Output requirements already say, rather than fetching it here. What this forbids is enriching THIS answer, not answering a second question the user actually asked: when they ask one, hand it to the skill that owns it and let it answer as its own block.
   - `"ok"` → a real months figure — proceed to step 5.
   - `"capped"` → runway exceeds 36 months; report as "more than 36 months," not the raw number.
   - `"infinite"` → cash is positive and the workspace isn't burning (net inflow); say so explicitly — this is "not applicable / cash-flow positive," not a divide-by-zero.
   - `"insufficient_data"` → not enough connected cash/transaction data to compute. Treat this the same as step 7's fallback below — don't retry the same call expecting a different answer.
   - `partial: true` means some accounts or transactions were excluded from the computation (e.g. a missing FX rate) — surface the `excluded` counts and any `hints` as a caveat rather than presenting the number as unconditionally complete.
   - `change` / `trend` are present only when a prior-month baseline exists, and they describe the **runway itself** — `change` is the signed month-over-month percentage change in the months figure, not in cash and not in burn. `trend` is good/bad polarity rather than raw sign, so a shortening runway is `"down"`. If you state the percentage, say what it is a change in; never attach it to the burn or cash figure sitting beside it.

5. **Compute months + days.** The tool returns `months` as a single decimal figure (e.g. `7.3`), not pre-split into months/days:
   - `whole_months = floor(months)`; remaining days = `(months - whole_months) * 30.44` (average days per month).
   - Always state the result as **"X months and Y days"** — never months alone, never a bare decimal-months figure. (Skip this split for `"capped"`/`"infinite"` — there's no meaningful days remainder to compute.)

6. **Show the division.** State the cash figure and the burn figure, and that the runway is the first divided by the second. This is the whole reason the tool returns all three: a runway with no visible dividend and divisor is a number the user cannot challenge. Do not stop at the headline.

7. **If the runway tool call itself errors, or returns `"insufficient_data"`**, do not fabricate a number. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or stays `"insufficient_data"`, the fallback is: (a) state the fallback question plainly in your reply ("What's my runway?"), (b) give your best caveated estimate from whatever partial data the tool did return, or say plainly that it can't be computed yet, and (c) link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Headline: **"You have approximately X months and Y days of runway."** (or the `"capped"`/`"infinite"` phrasing from step 4, when applicable)
- Cash on hand: amount, currency, as-of date — straight from `well_get_runway`'s `cash` field.
- Average monthly burn: amount, currency, and the trailing window used to compute it — straight from `avg_burn`.
- The division (cash ÷ average monthly burn) so the number is auditable rather than a black box — this is the same computation the Well app itself renders, not a skill-side estimate.
- A freshness/caveat line (sync recency from `as_of`; any `partial`/`excluded`/`hints` the tool surfaced).
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing, so the user knows whether this runway reflects their full cash position or a partial one gated by what's connected today.
- A one-line pointer to `cash-forecast` for the month-by-month projection, and to `cost-structure` for what is driving the burn. Name them; do not answer them here.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 7's fallback was used, the fallback answer and link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the figures in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- Connection state came from the coverage hand-off, and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- Cash and burn figures came straight from `well_get_runway`'s response, not re-derived from raw record reads.
- Cash-flow-positive (`"infinite"`) and capped (`"capped"`) workspaces are reported with their dedicated phrasing, not as a division error or a raw number past 36 months.
- The final answer states runway in **both months and days**, and shows the division behind it.
- The trailing window used for burn (`avg_burn.trailing_months`) is stated, not left implicit.
- Data staleness (`as_of`) is surfaced when it's more than a few days old.
- If `partial: true`, the `excluded` counts and any `hints` were disclosed rather than silently absorbed into the number.
- If `change` was stated, it was named as a change in the runway itself — never attached to the burn or cash figure beside it — and `trend` was read as good/bad polarity rather than as the raw direction of the number.
- No forecast series, no spend breakdown, and no trend was composed here — each was pointed at by name instead. Reporting the `change`/`trend` this tool itself returned is not composing one.
- Only this block's analytics tool was called — `well_get_runway`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge`, `well_get_cash_position`) was called to source any figure in this answer, including one number in a sentence.
- Which connector categories (bank/cash, accounting) are connected versus missing was stated from the coverage hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's my runway right now?"

### Expected behavior

Pin the workspace, confirm connections, note how fresh the connected data is, call `well_get_runway()`, and answer with a headline like "You have approximately 7 months and 12 days of runway," followed by the cash figure, the burn figure, the trailing window, the division between them, and the as-of date — all read directly from the tool's response. Close with a one-line pointer to `cash-forecast` and `cost-structure` rather than answering either.

### Example request

"What was our runway at the end of March, and what if we averaged burn over six months instead of three?"

### Expected behavior

Two questions, and only the first is this skill's. Call `well_get_runway({ year: 2026, month: 3 })` for the runway as it stood at that month's end. For the six-month burn, call `avg-burn` — and say why the two are separate: this runway divides by the endpoint's own trailing burn, so quoting a six-month average as its divisor would print a division that cannot reproduce the headline above it.

### Example request

"We haven't connected our bank yet — can you tell me our runway?"

### Expected behavior

Detect the missing/insufficient connector during step 2, via the coverage hand-off, present install links for bank/accounting connectors instead of guessing a number, and stop.
