---
name: runway-calculator
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

- Which workspace to use, if they manage more than one.
- The trailing window to average burn over — default to the last 3 full months.
- A target currency — default to the workspace's primary currency.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — resolve the workspace.
- `well_get_runway` — the authoritative cash-on-hand, trailing-average burn, and computed runway — the exact same deterministic numbers (sign-convention detection, internal-transfer exclusion, FX conversion already applied) the Well app's own canvas KPI card renders. Call this directly; do not re-derive cash or burn yourself from raw `accounts`/`transactions`/`account_balances` reads — that path is more error-prone and can drift from what the app shows.
- `well_get_cost_structure` — the deterministic category breakdown of the latest closed month's outflow, used here only as a supplementary "what's driving your burn" view alongside the runway headline. Same computation the Well app's canvas cost-structure chart renders; never re-derive categories yourself.
- `well_query_records` — read `workspace_connectors` to check which connectors are enabled before attempting a computation.
- `well_list_connectors` — surface install links when cash/accounting data is missing.
- Well's OAuth/DCR flow (or the Well connector's `authenticate` tool, if the host exposes one) — if no Well MCP connection exists yet.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) isn't available in your toolset, the Well MCP server hasn't been added to this host. Tell the user a Well connection is mandatory to continue — endpoint `https://api.wellapp.ai/v1/mcp` — because Well is where their financial data is aggregated securely to compute a real runway number; without it there's nothing to calculate from. Stop until it's there; don't estimate from assumptions.

2. **Confirm the account.** Call `well_list_workspaces()`.
   - Auth error → no Well MCP connection yet; trigger the Well connector's OAuth/DCR handshake. The moment it returns, immediately retry `well_list_workspaces()` yourself in the same turn and continue — don't stop to ask the user to confirm login or wait for a new message.
   - Zero or one workspace → use it, or say none exist. If more than one workspace exists, ask the user which one to use, and use that single workspace for the rest of this skill. Never query or merge data across multiple workspaces in one run.

3. **Verify enough connections exist.** Query `workspace_connectors` for `status: enabled` entries.
   - If nothing looks connected yet, call `well_list_connectors()`, hand the user the top install links (bank connectors first — runway needs a real cash balance), and stop before calling `well_get_runway` at all. Once a connector shows as connected, immediately re-run this check yourself and continue through the rest of the workflow — don't wait to be re-prompted or ask the user to restate the request.
   - Note the most recent sync status/`completed_at` from `workspace_connector_sync_logs` so stale data can be flagged later.

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
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing, so the user knows whether this runway reflects their full cash position or a partial one gated by what's connected today.
- A one-line pointer to `expense-breakdown` for the full ranked spend breakdown plus the largest outstanding bills.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 7's fallback was used, the fallback answer and link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace was resolved unambiguously.
- Cash and burn figures came straight from `well_get_runway`'s response, not re-derived from raw record reads.
- Cash-flow-positive (`"infinite"`) and capped (`"capped"`) workspaces are reported with their dedicated phrasing, not as a division error or a raw number past 36 months.
- The final answer states runway in **both months and days**, per the user's requirement (except the `"capped"`/`"infinite"` branches, which have no days remainder).
- The trailing window used for burn (`avg_burn.trailing_months`) is stated, not left implicit.
- Data staleness (`as_of`) is surfaced when it's more than a few days old.
- If `partial: true`, the `excluded` counts and any `hints` were disclosed rather than silently absorbed into the number.
- The burn-drivers view came from `well_get_cost_structure`, was labeled supplementary, and its window mismatch with the burn window was stated — never presented as a breakdown that sums to the burn figure.
- A failed or empty `well_get_cost_structure` call was reported as an unavailable supplementary view, not allowed to block or invalidate the runway headline.
- Which connector categories (bank/cash, accounting) are connected versus missing was stated, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What's my runway right now?"

### Expected behavior

Resolve the workspace, confirm a connector is enabled, call `well_get_runway()`, and answer with a headline like "You have approximately 7 months and 12 days of runway," followed by the cash figure, burn figure, window, and as-of date — all read directly from the tool's response. Then call `well_get_cost_structure()` and add the top spend categories as a labeled "what's driving your burn" view, noting it covers the latest closed month rather than the trailing burn window.

### Example request

"We haven't connected our bank yet — can you tell me our runway?"

### Expected behavior

Detect the missing/insufficient connector during step 3, present install links for bank/accounting connectors instead of guessing a number, and stop.
