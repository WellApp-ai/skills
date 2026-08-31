---
name: avg-burn
requires: [define-workspace, connect-tools]
description: Answer "what is our burn rate?" using Well's MCP financial graph — the trailing average of real monthly outflows, with the window it was measured over and how much of that window actually carried spend. Use when the user asks "what's our burn rate", "how much are we spending per month", "what's our monthly burn", or "how much goes out each month". Requires a connected Well workspace with bank or accounting data; if none is connected, this skill guides the user to connect one first.
---

# Check Your Average Monthly Burn with Well

## Purpose

Report one figure: the average monthly outflow. It comes from `well_get_burn`, the same computation the Well app's avg-burn tile renders, with internal transfers excluded and FX already applied.

The window matters as much as the number. The average always divides by the whole window, so a window containing months with no recorded spend reports a LOWER figure than the months that did have spend — which is honest, but reads as "the typical month" unless you say otherwise.

## When to use this skill

Use this skill when the user asks:

- "What's our burn rate?"
- "How much are we spending per month?"
- "What's our monthly burn?"
- "How much goes out each month?"

## When not to use this skill

Do not use this skill when:

- The user wants **how long the cash lasts** — use `runway`. It composes this burn with the cash position; do not divide the two yourself here.
- The user wants **what the spend is made of** — use `cost-structure`. That covers a single closed month by category and will not sum to a trailing average, so the two are not a decomposition of one another.
- The user wants **cash projected forward** — use `cash-forecast`.
- The user wants **inflows as well as outflows**, reconciled — use `cash-flow-waterfall`. This skill reports outflow only.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- A reporting period — a calendar year and month — to measure a past window rather than the live one. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.
- A window length in months (default 3). Widen it to smooth a lumpy month, narrow it to react faster.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_get_burn` — the authoritative trailing average monthly burn, plus `trailing_months`, `months_in_window` and `months_with_data`. Call this directly; do not sum or group `transactions` yourself, and do not read the `avg_burn` field nested in `well_get_runway` instead — that one is pinned to the runway's own window and cannot be widened.
- `well_query_records` — used by `connect-tools` for the connection check; called here only for the data-freshness read in step 3.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to measure your average monthly burn"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below, and never merge data across workspaces in one run. Omitting it is not the safe, read-everything option: `well_get_burn` answers for **one** workspace chosen for you — whichever this connection was last switched to, otherwise the token's default — so a missing `workspace_id` can silently answer about a workspace the user never named, while the record reads in steps 2 and 3 do the opposite and merge rows from every authorized workspace into one result. Neither is what was asked for. Do not lean on an earlier `well_switch_workspace` instead: a later call is not guaranteed to see that switch, so the explicit argument is the only reliable instruction. If it hands back `resolution: unresolved`, stop: there is no burn to measure without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank, accounting]`, `required: []`, `mode: internal_check`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - **`mode: internal_check` is not optional here.** The default, `flow_step`, renders the connect picker and ENDS THE TURN on a Continue click — right when the user asked to connect something, wrong for a figure they asked for. Omitting it turns a one-round-trip answer into a three-round-trip flow.
   - `coverage: none` → stop; burn cannot be measured yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank` or `accounting`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (bank connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Keep those timestamps — a connector that has not synced in weeks makes the figure stale rather than wrong. `well_get_burn` returning `unavailable: true` in the next step is the other half of this check.

4. **Get the burn.** Call `well_get_burn()`. Pass `year` and `month` only if the user named a past period, and `months_back` only if they asked for a different window. It returns `amount` (a positive magnitude, not a signed figure), `currency`, and the window metadata:
   - **This is the only analytics tool this skill calls for its own answer.** `well_get_burn`'s own response carries every figure this answer states — `amount`, the window metadata, and the `per_month` series the average is the mean of. Do not call `well_get_runway`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge` or `well_get_cash_position` to source anything this answer states — not for a comparison, not for a series, not for one number in a sentence. Each of them draws its own card, so an uninvited second call renders a second block beside the one the user asked for, answering a question they did not ask. `well_get_burn`'s own description points at `well_get_runway` and `well_get_cost_structure`; inside this skill those are skills to name, not tools to call — and `well_get_runway`'s nested `avg_burn` is doubly out of bounds, since it is pinned to the runway's own window. If the answer you want needs a figure this payload does not carry — months of cash left, a category split, a projected balance — that figure belongs to another skill: name it, as the Output requirements already say, rather than fetching it here. What this forbids is enriching THIS answer, not answering a second question the user actually asked: when they ask one, hand it to the skill that owns it and let it answer as its own block.
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
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off.
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
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The figure came straight from `well_get_burn`, not summed from `transactions` and not lifted out of `well_get_runway`'s nested `avg_burn`.
- The window (`trailing_months`) is stated, not left implicit.
- When `months_with_data` was lower than `months_in_window`, both numbers were stated and the divisor was explained — the figure was never presented as the typical month.
- `unavailable: true` was reported as "not measured yet", never as a burn of zero.
- No runway figure, spend breakdown, or forecast was composed here — each was pointed at by name instead.
- Only this block's analytics tool was called — `well_get_burn`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_runway`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge`, `well_get_cash_position`) was called to source any figure in this answer, including one number in a sentence.
- Which connector categories are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's our burn rate?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, check freshness, call `well_get_burn()`, and answer with the amount, the currency, and the trailing window — e.g. "You're burning about €13,400 a month, averaged over the last 3 full months." Add the coverage line if the window has dark months, then point at `runway` and `cost-structure` without answering either.

### Example request

"Our burn looks low — we had a quiet month in there. Can you average over six?"

### Expected behavior

Call `well_get_burn({ months_back: 6 })`. Report the wider average and, if `months_with_data` is still below `months_in_window`, say how many months of the six actually carried spend and that the average divides by all six. The user's instinct is the thing this metadata exists to confirm or correct, so answer it directly rather than only restating the new figure.

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

Keep to the house words. Write "connect", never "integrate". Write "sessions", never "chat". Write "business data", never "financial data". Write "tokens", never "credits". Name every object by its own name, the workspace, the connector, the company, or the invoice, and never show the user a raw id on its own. A Well app address is a link, not an id, so keep it whole even when it carries a workspace id.
