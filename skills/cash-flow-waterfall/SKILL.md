---
name: cash-flow-waterfall
description: Answer "where did the cash go?" using Well's MCP financial graph — a bridge from the opening cash position to the closing one, showing total inflows and total outflows for the period. Use when the user asks "where did the cash go", "reconcile our cash movement", "why did our balance change", "show me the cash flow bridge", or "how did we get from last month's balance to this one". Requires a connected Well workspace with a banking connector; if none is connected, this skill guides the user to connect one first.
---

# Reconcile Your Cash Movement with Well

## Purpose

Explain how the opening cash position became the closing one: opening balance, total inflows, total outflows, closing balance. The steps are `well_get_cash_flow_bridge`'s — the same ones the Well app's cash-flow waterfall draws.

This reconciles a movement. It is not a category breakdown, and it will not tie out against one — `cost-structure` splits a single month's outflow by category, while this covers both directions across the period.

## When to use this skill

Use this skill when the user asks:

- "Where did the cash go?"
- "Reconcile our cash movement."
- "Why did our balance change?"
- "Show me the cash flow bridge."
- "How did we get from last month's balance to this one?"

## When not to use this skill

Do not use this skill when:

- The user wants **outflow split by category** — use `cost-structure`. The two answer different questions and will not reconcile against each other; presenting one as the breakdown of the other is wrong.
- The user wants **cash projected forward** — use `cash-forecast`. This skill looks backward only.
- The user wants **today's balance** — use `cash-position`.
- The user wants **the monthly outflow rate** — use `avg-burn`.
- The user wants **which specific transactions** made up the inflows or outflows — this skill reports totals; drill into the records in the Well app or with `well_query_records` directly.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A reporting period — a calendar year and month — to bridge a past period rather than the live window. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_get_cash_flow_bridge` — the authoritative bridge steps, each carrying a `label`, a `value`, and a `kind`. Call this directly; never assemble a bridge by summing `transactions` yourself.
- `well_query_records` — called here only for the data-freshness read in step 3.
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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to reconcile how your cash position changed" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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
4. Otherwise (`enabled` or `processing`, no successful sync yet) → **connecting** — treat as connected for the run.

At least one **connected** row for a kind → connected, and name any **error** row for that same kind alongside it (a live connector does not cancel a dead one). Only **connecting** rows → connecting. Only **error** rows → error, name the connector, offer the reconnect link. No qualifying row → missing, including a `to_configure` row the user started but never finished.

This is a coverage read for a data skill, not a connect step: hand the per-kind states straight back in the same turn and keep going. No closing question, no `well_wait_for_selection`, no card acknowledgment to wait for. When a `required` kind is missing, say so in the hand-off and let the caller decide what to do — do not turn the read into a stop.

On a transient `well_list_connectors` failure, retry once; on a second failure, do not invent coverage — say it's unknown, give the user `<well-app-base-url>/workspaces/<workspace_id>`, and hand the failure back to the caller with no coverage claim.

Hand off, kept for the caller and never printed as a block: per requested kind, its state (`connected`/`connecting`/`error`/`missing`), the connector(s) behind it, and the `install_url` to act on; `coverage` — `complete` when every requested kind is connected or connecting, `none` when none is (an all-`error` workspace is `none`, not `partial`), `partial` otherwise; `skipped_by_user`; `required` echoed back.

Verify before moving on: `well_list_connectors` was the only connector-listing tool called — no `well_query_records` on `workspace_connectors`, no provider-specific tool; each kind's state came from the four-line precedence above, not from a name or `is_connected` alone; `coverage: none` was used (not `partial`) when every requested kind was in error; a transient failure was retried once before the fallback link.

   - `coverage: none` → stop; there are no balances to bridge between yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Both ends of the bridge are measured balances, so a stale connector can move either anchor and change the whole reconciliation.

4. **Get the bridge.** Call `well_get_cash_flow_bridge()`. Pass `year` and `month` only if the user named a past period. It returns `steps` in render order, each `{ label, value, kind }`, plus `currency`:
   - **This is the only analytics tool this skill calls for its own answer.** `well_get_cash_flow_bridge`'s own response is a self-contained reconciliation: its `start` and `total` steps ARE the opening and closing balances, so neither anchor needs fetching from anywhere else. Do not call `well_get_cash_position`, `well_get_runway`, `well_get_burn`, `well_get_cost_structure` or `well_get_cash_forecast` to source anything this answer states — not for a comparison, not for a series, not for one number in a sentence. Each of them draws its own card, so an uninvited second call renders a second block beside the one the user asked for, answering a question they did not ask. `well_get_cash_position` is the specific temptation, and its own description already warns against it: that tool answers the balance right now, not this period's closing one, so pairing them reports two different readings as though they were the same. If the answer you want needs a figure this payload does not carry — a category split of the outflow, a burn rate, a forward projection — that figure belongs to another skill: name it, as the Output requirements already say, rather than fetching it here. What this forbids is enriching THIS answer, not answering a second question the user actually asked: when they ask one, hand it to the skill that owns it and let it answer as its own block.
   - `kind: "start"` and `kind: "total"` carry an ABSOLUTE cash position — the opening and closing anchors.
   - `kind: "increase"` and `kind: "decrease"` carry a gross flow MAGNITUDE, always positive. **The direction lives in `kind`, not in the sign.** Never report a `decrease` as a negative number the tool gave you, and never add the magnitudes as though they were signed — a decrease has to be subtracted, which the sign will not tell you.
   - `unavailable: true`, or an EMPTY `steps` array, means neither anchor could be measured. That is missing data, **not a period with no movement** — say the bridge is unavailable rather than reporting flat cash.
   - The closing anchor is a **measurement**, not the sum of the flows. When the two disagree there is a residual, and the tool surfaces it as a hint. Report it; do not quietly reconcile the difference away or adjust a figure to make the bridge balance.
   - If `hints` are present (excluded accounts, an FX gap, or that residual), disclose them rather than presenting the bridge as balanced.

5. **If the tool call errors, or returns `unavailable: true`**, do not construct a bridge. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back. If it errors again or stays unavailable, the fallback is: (a) state the fallback question plainly in your reply ("Where did the cash go?"), (b) say plainly that the bridge cannot be measured for this period, and (c) link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly.

## Output requirements

Return:

- The four steps in order — opening balance, total inflows, total outflows, closing balance — each with its amount and currency, and the direction stated in words rather than left to a sign.
- The net movement between the anchors, and the residual if the flows do not account for all of it.
- A freshness/caveat line: any `hints` the tool surfaced.
- Whether the picture is complete: which banking connectors are connected versus still missing. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off.
- A one-line pointer to `cost-structure` for what the outflows were spent on, noting explicitly that it covers one month by category and will not tie out against this bridge. Name it; do not answer it here.
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
- The workspace came from `define-workspace`'s hand-off, and its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off, and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The steps came straight from `well_get_cash_flow_bridge`, never assembled by summing `transactions`.
- Direction was taken from `kind`, never inferred from a sign, and the magnitudes were not added as though they were signed.
- An empty `steps` array or `unavailable: true` was reported as missing data, never as a period with no movement.
- A residual between the measured closing anchor and the flows was reported rather than reconciled away.
- The pointer to `cost-structure` says the two will not tie out, so neither is presented as the other's breakdown.
- No forecast, burn rate, or category split was composed here — each was pointed at by name instead.
- Only this block's analytics tool was called — `well_get_cash_flow_bridge`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_cash_position`, `well_get_runway`, `well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast`) was called to source any figure in this answer, including one number in a sentence.
- Which connector categories are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"Where did the cash go last month?"

### Expected behavior

Pin the workspace, confirm connections, call `well_get_cash_flow_bridge()`, and walk the four steps in order, saying "in" and "out" in words rather than relying on signs. State the net movement. Close with a pointer to `cost-structure` for the category split, noting the two will not tie out.

### Example request

"Our balance barely moved — show me the cash flow."

### Expected behavior

Report the bridge as returned. If `unavailable: true` or `steps` is empty, say the bridge could not be measured — do NOT confirm the user's read that cash was flat, because those are different facts and the tool distinguishes them. A genuinely flat period returns two anchors and two zero flows, and that is the case where confirming it is correct.

### Example request

"The inflows and outflows don't add up to the closing balance."

### Expected behavior

Confirm it, and name the residual. The closing anchor is measured independently of the flows, so a gap is a real finding about the data rather than an arithmetic slip — surface the tool's hint for it and do not adjust a figure to close the gap.

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
