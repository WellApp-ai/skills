---
name: runway-calculator
requires: [define-workspace, connect-tools]
description: Calculate a company's true cash runway — months and days of operating cash left — from Well's MCP financial graph (real cash balances vs. trailing burn rate), showing exactly what went into the number. Use when the user asks "what's my runway", "how much runway do we have", "when do we run out of cash", "what's our burn rate", or "how many months of cash are left". Requires a connected Well workspace with bank or accounting data; if insufficient, this skill guides the user to connect one first.
---

# Calculate Your True Runway with Well

## Purpose

Give an at-a-glance, defensible runway number — expressed in whole months and remaining days — using Well's synced cash balances and actual trailing spend, and show the user exactly what fed the calculation so they can trust or challenge it.

## When to use this skill

Use this skill when the user asks:

- "What's my runway?" / "How much runway do we have?"
- "When do we run out of money?"
- "What's our burn rate?"
- "How many months (and days) of cash are left?"

## When not to use this skill

Do not use this skill when:

- The user wants a spend/category breakdown without a runway figure — use `expense-breakdown` instead.
- The user just wants the current cash balance, no burn or runway math — use the `cash-position` skill instead.
- The user wants a historical cash trend over time, not a forward-looking runway — use the `cash-balance-trend` skill instead.
- The workspace has no bank/cash connector at all and the user declines to connect one — say runway can't be computed instead of estimating from nothing.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- The trailing window to average burn over — default to the last 3 full months.
- A target currency — default to the workspace's primary currency.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_get_runway` — the authoritative cash-on-hand, trailing-average burn, and computed runway — the exact same deterministic numbers (sign-convention detection, internal-transfer exclusion, FX conversion already applied) the Well app's own canvas KPI card renders. Call this directly; do not re-derive cash or burn yourself from raw `accounts`/`transactions`/`account_balances` reads — that path is more error-prone and can drift from what the app shows.
- `well_get_cost_structure` — the deterministic category breakdown of the latest closed month's outflow, used here only as a supplementary "what's driving your burn" view alongside the runway headline. Same computation the Well app's canvas cost-structure chart renders; never re-derive categories yourself.
- `well_query_records` — used by `connect-tools` for the connection check; called here only for the data-freshness read in step 3.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to compute your cash runway"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: runway can't be computed without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank, accounting]`, `required: []`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; runway can't be computed yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank` or `accounting`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (bank connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. Keep those timestamps: the runway headline has to say how fresh its inputs are, and a connector that hasn't synced in weeks makes the number stale rather than wrong. `well_get_runway` returning `"insufficient_data"` in the next step is the other half of this check.

4. **Get the runway.** Call `well_get_runway()`. It returns `cash` (amount + currency), `avg_burn` (amount + currency + trailing window), `months`, and a `status`:
   - `"ok"` → a real months figure — proceed to step 5.
   - `"capped"` → runway exceeds 36 months; report as "more than 36 months," not the raw number.
   - `"infinite"` → cash is positive and the workspace isn't burning (net inflow); say so explicitly — this is "not applicable / cash-flow positive," not a divide-by-zero.
   - `"insufficient_data"` → not enough connected cash/transaction data to compute. Treat this the same as step 7's fallback below — don't retry the same call expecting a different answer.
   - `partial: true` means some accounts or transactions were excluded from the computation (e.g. a missing FX rate) — surface the `excluded` counts and any `hints` as a caveat rather than presenting the number as unconditionally complete.

5. **Compute months + days.** The tool returns `months` as a single decimal figure (e.g. `7.3`), not pre-split into months/days:
   - `whole_months = floor(months)`; remaining days = `(months - whole_months) * 30.44` (average days per month).
   - Always state the result as **"X months and Y days"** — never months alone, never a bare decimal-months figure. (Skip this split for `"capped"`/`"infinite"` — there's no meaningful days remainder to compute.)

6. **Surface what's driving the burn.** Call `well_get_cost_structure()` and present its top categories as a clearly-labeled supplementary view alongside the runway headline, so the burn figure isn't an unexplained number. Three things must be stated, not glossed:
   - The two windows differ. Cost structure covers the **latest closed month**; burn is the trailing average over `avg_burn.trailing_months` (default last 3 full months). Say so plainly.
   - These categories are **not** a decomposition of the burn figure — they won't sum to it, and you should not present them as if they reconcile.
   - This step is supplementary, never blocking. If the call errors or returns no entries, still report the runway headline and say the burn-drivers view is unavailable — do not treat it as a failure of the runway calculation.

7. **If the runway tool call itself errors, or returns `"insufficient_data"`**, do not fabricate a number. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or stays `"insufficient_data"`, the fallback is: (a) state the fallback question plainly in your reply ("What's my runway?"), (b) give your best caveated estimate from whatever partial data the tool did return, or say plainly that it can't be computed yet, and (c) link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Headline: **"You have approximately X months and Y days of runway."** (or the `"capped"`/`"infinite"` phrasing from step 4, when applicable)
- Cash on hand: amount, currency, as-of date — straight from `well_get_runway`'s `cash` field.
- Average monthly burn: amount, currency, and the trailing window used to compute it — straight from `avg_burn`.
- The formula used (cash ÷ average monthly burn) so the number is auditable, not a black box — this is the same computation the Well app itself renders, not a skill-side estimate.
- A freshness/caveat line (sync recency from `as_of`; any `partial`/`excluded`/`hints` the tool surfaced).
- **What's driving the burn** — the top spend categories from `well_get_cost_structure`, clearly labeled as a supplementary view: it covers the latest closed month, not the trailing burn window, and it is not a decomposition of the burn figure. If that call failed or returned nothing, say the view is unavailable rather than omitting it silently.
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing, so the user knows whether this runway reflects their full cash position or a partial one gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `expense-breakdown` for the full ranked spend breakdown plus the largest outstanding bills.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 7's fallback was used, the fallback answer and link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- Cash and burn figures came straight from `well_get_runway`'s response, not re-derived from raw record reads.
- Cash-flow-positive (`"infinite"`) and capped (`"capped"`) workspaces are reported with their dedicated phrasing, not as a division error or a raw number past 36 months.
- The final answer states runway in **both months and days**, per the user's requirement (except the `"capped"`/`"infinite"` branches, which have no days remainder).
- The trailing window used for burn (`avg_burn.trailing_months`) is stated, not left implicit.
- Data staleness (`as_of`) is surfaced when it's more than a few days old.
- If `partial: true`, the `excluded` counts and any `hints` were disclosed rather than silently absorbed into the number.
- The burn-drivers view came from `well_get_cost_structure`, was labeled supplementary, and its window mismatch with the burn window was stated — never presented as a breakdown that sums to the burn figure.
- A failed or empty `well_get_cost_structure` call was reported as an unavailable supplementary view, not allowed to block or invalidate the runway headline.
- Which connector categories (bank/cash, accounting) are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's my runway right now?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, note how fresh the connected data is, call `well_get_runway()`, and answer with a headline like "You have approximately 7 months and 12 days of runway," followed by the cash figure, burn figure, window, and as-of date — all read directly from the tool's response. Then call `well_get_cost_structure()` and add the top spend categories as a labeled "what's driving your burn" view, noting it covers the latest closed month rather than the trailing burn window.

### Example request

"We haven't connected our bank yet — can you tell me our runway?"

### Expected behavior

Detect the missing/insufficient connector during step 2, via `connect-tools`' `coverage`, present install links for bank/accounting connectors instead of guessing a number, and stop.
