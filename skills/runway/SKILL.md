---
name: runway
requires: [define-workspace, connect-tools]
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

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- A reporting period — a calendar year and month — to read the runway as it stood at the end of a past month rather than today. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.
- Nothing else. There is deliberately no burn-window option: the runway figure composes the endpoint's own trailing burn, so a custom window would pair `months` from one window with `avg_burn` from another and the division this skill shows could not reproduce its own headline. A user asking for a different window wants `avg-burn`.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_get_runway` — the authoritative cash-on-hand, trailing-average burn, and computed runway. Call this directly; do not re-derive cash or burn yourself from raw `accounts`/`transactions`/`account_balances` reads — that path is more error-prone and can drift from what the app shows.
- `well_query_records` — used by `connect-tools` for the connection check; called here only for the data-freshness read in step 3.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to compute your cash runway"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below, and never merge data across workspaces in one run. Omitting it is not the safe, read-everything option: `well_get_runway` answers for **one** workspace chosen for you — whichever this connection was last switched to, otherwise the token's default — so a missing `workspace_id` can silently answer about a workspace the user never named, while the record reads in steps 2 and 3 do the opposite and merge rows from every authorized workspace into one result. Neither is what was asked for. Do not lean on an earlier `well_switch_workspace` instead: a later call is not guaranteed to see that switch, so the explicit argument is the only reliable instruction. If it hands back `resolution: unresolved`, stop: runway can't be computed without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank, accounting]`, `required: []`, `mode: internal_check`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - **`mode: internal_check` is not optional here.** The default, `flow_step`, renders the connect picker and ENDS THE TURN on a Continue click — right when the user asked to connect something, wrong for a figure they asked for. Omitting it turns a one-round-trip answer into a three-round-trip flow.
   - `coverage: none` → stop; runway can't be computed yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank` or `accounting`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (bank connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Keep those timestamps: the answer has to say how fresh its inputs are, and a connector that hasn't synced in weeks makes the number stale rather than wrong. `well_get_runway` returning `"insufficient_data"` in the next step is the other half of this check.

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
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing, so the user knows whether this runway reflects their full cash position or a partial one gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
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
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- Cash and burn figures came straight from `well_get_runway`'s response, not re-derived from raw record reads.
- Cash-flow-positive (`"infinite"`) and capped (`"capped"`) workspaces are reported with their dedicated phrasing, not as a division error or a raw number past 36 months.
- The final answer states runway in **both months and days**, and shows the division behind it.
- The trailing window used for burn (`avg_burn.trailing_months`) is stated, not left implicit.
- If `change` was stated, it was named as a change in the runway itself — never attached to the burn or cash figure beside it — and `trend` was read as good/bad polarity rather than as the raw direction of the number.
- Data staleness (`as_of`) is surfaced when it's more than a few days old.
- If `partial: true`, the `excluded` counts and any `hints` were disclosed rather than silently absorbed into the number.
- No forecast series, no spend breakdown, and no trend was composed here — each was pointed at by name instead. Reporting the `change`/`trend` this tool itself returned is not composing one.
- Only this block's analytics tool was called — `well_get_runway`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_burn`, `well_get_cost_structure`, `well_get_cash_forecast`, `well_get_cash_flow_bridge`, `well_get_cash_position`) was called to source any figure in this answer, including one number in a sentence.
- Which connector categories (bank/cash, accounting) are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's my runway right now?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, note how fresh the connected data is, call `well_get_runway()`, and answer with a headline like "You have approximately 7 months and 12 days of runway," followed by the cash figure, the burn figure, the trailing window, the division between them, and the as-of date — all read directly from the tool's response. Close with a one-line pointer to `cash-forecast` and `cost-structure` rather than answering either.

### Example request

"What was our runway at the end of March, and what if we averaged burn over six months instead of three?"

### Expected behavior

Two questions, and only the first is this skill's. Call `well_get_runway({ year: 2026, month: 3 })` for the runway as it stood at that month's end. For the six-month burn, call `avg-burn` — and say why the two are separate: this runway divides by the endpoint's own trailing burn, so quoting a six-month average as its divisor would print a division that cannot reproduce the headline above it.

### Example request

"We haven't connected our bank yet — can you tell me our runway?"

### Expected behavior

Detect the missing/insufficient connector during step 2, via `connect-tools`' `coverage`, present install links for bank/accounting connectors instead of guessing a number, and stop.

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
