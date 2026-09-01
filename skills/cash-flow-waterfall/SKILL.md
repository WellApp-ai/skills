---
name: cash-flow-waterfall
requires: [define-workspace, connect-tools]
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

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- A reporting period — a calendar year and month — to bridge a past period rather than the live window. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. This skill never calls it directly.
- `well_get_cash_flow_bridge` — the authoritative bridge steps, each carrying a `label`, a `value`, and a `kind`. Call this directly; never assemble a bridge by summing `transactions` yourself.
- `well_query_records` — used by `connect-tools` for the connection check; called here only for the data-freshness read in step 3.
- `well_list_connectors` — how `connect-tools` surfaces install links. This skill never calls it directly.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own. When a brick it needs is absent, the step that needs it says so and stops.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to reconcile how your cash position changed"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below, and never merge data across workspaces in one run. Omitting it is not the safe, read-everything option: `well_get_cash_flow_bridge` answers for **one** workspace chosen for you — whichever this connection was last switched to, otherwise the token's default — so a missing `workspace_id` can silently answer about a workspace the user never named, while the record reads in steps 2 and 3 do the opposite and merge rows from every authorized workspace into one result. Neither is what was asked for. Do not lean on an earlier `well_switch_workspace` instead: a later call is not guaranteed to see that switch, so the explicit argument is the only reliable instruction. If it hands back `resolution: unresolved`, stop: there is nothing to reconcile without a pinned workspace.
   - **If `define-workspace` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank]`, `required: [bank]`, `mode: internal_check`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - **`mode: internal_check` is not optional here.** The default, `flow_step`, renders the connect picker and ENDS THE TURN on a Continue click — right when the user asked to connect something, wrong for a figure they asked for. Omitting it turns a one-round-trip answer into a three-round-trip flow.
   - `coverage: none` → stop; there are no balances to bridge between yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Both ends of the bridge are measured balances, so a stale connector can move either anchor and change the whole reconciliation.

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

Run `define-workspace`, then `connect-tools`, call `well_get_cash_flow_bridge()`, and walk the four steps in order, saying "in" and "out" in words rather than relying on signs. State the net movement. Close with a pointer to `cost-structure` for the category split, noting the two will not tie out.

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
