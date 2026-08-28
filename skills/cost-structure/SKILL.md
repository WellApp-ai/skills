---
name: cost-structure
description: Answer "what are we spending on?" using Well's MCP financial graph — a deterministic category breakdown of one month's outflow, with the share each category takes and which grouping produced it. Use when the user asks "what are we spending on", "break down our expenses", "where is the money going", "what are our biggest costs", or "show me our cost structure". Requires a connected Well workspace with bank or accounting data; if none is connected, this skill guides the user to connect one first.
---

# Break Down Your Spend with Well

## Purpose

Answer what the money went on, for one month, by category. The breakdown is `well_get_cost_structure`'s — the same computation the Well app's cost-structure donut renders, with the categories coming from a defined ladder rather than an LLM's guess.

One month, never a span. The tool returns the exact bounds it covered and this skill reports them, because a category breakdown presented over the wrong period is worse than no breakdown at all.

## When to use this skill

Use this skill when the user asks:

- "What are we spending on?"
- "Break down our expenses."
- "Where is the money going?"
- "What are our biggest costs?"
- "Show me our cost structure."

## When not to use this skill

Do not use this skill when:

- The user wants **how much** goes out per month rather than on what — use `avg-burn`. These do not reconcile: this skill covers one closed month, that one a trailing average.
- The user wants **how long the cash lasts** — use `runway`.
- The user wants **inflows and outflows reconciled** into an opening-to-closing bridge — use `cash-flow-waterfall`.
- The user wants **unpaid bills by due date** rather than settled spend by category — use `bills-due`.
- The user wants **which specific invoices or transactions** make up a category — this skill reports category totals; drill into the records in the Well app or with `well_query_records` directly.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- A reporting period — a calendar year and month — to break down a specific past month instead of the latest closed one. Both or neither: a month with no year, or a year with no month, is refused rather than guessed.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_get_cost_structure` — the authoritative category breakdown for one month, with each entry's share and the ladder rung that produced the grouping. Call this directly; never re-derive categories by grouping `transactions` yourself.
- `well_query_records` — used for the data-freshness read in step 3.
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

With several workspaces and no usable hint, end the turn on the card: the `well_list_workspaces` result already rendered the picker (one tile per workspace, multi-select). Don't restate the workspaces under it. End with one short line naming the entities — "to break down your spend by category" — and stop. In a text-only host, list each workspace on one line (name, country, base currency, "(default)" on the primary) and ask the same one-line question. Never default to the primary workspace on the user's behalf.

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

   - **`mode: internal_check` is not optional here.** The default, `flow_step`, renders the connect picker and ENDS THE TURN on a Continue click — right when the user asked to connect something, wrong for a figure they asked for. Omitting it turns a one-round-trip answer into a three-round-trip flow.
   - `coverage: none` → stop; there is no spend to categorize yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: for each connected connector, the latest `workspace_connector_sync_logs` row's `status` and `completed_at`. An empty `entries` array in the next step is the other half of this check — it means nothing is categorized for the month, which is different from nothing having been spent.

4. **Get the breakdown.** Call `well_get_cost_structure()`. Pass `year` and `month` only if the user named a past month. It returns `entries` (an array of `{ category, amount, pct }`, sorted by amount descending), `currency`, the `period_start`/`period_end` bounds, and a `rung`.
   - **This is the only analytics tool this skill calls for its own answer.** `well_get_cost_structure`'s own response carries every figure this answer states — the `entries` with their shares, the currency, the period bounds and the `rung`. Do not call `well_get_runway`, `well_get_burn`, `well_get_cash_position`, `well_get_cash_forecast` or `well_get_cash_flow_bridge` to source anything this answer states — not for a comparison, not for a series, not for one number in a sentence. Each of them draws its own card, so an uninvited second call renders a second block beside the one the user asked for, answering a question they did not ask. A month-over-month comparison is the most tempting of these and the clearest violation: it needs a second read of another block's tool, and the trend it would narrate is another skill's answer. If the answer you want needs a figure this payload does not carry — a monthly burn rate, a change against an earlier month, unpaid obligations rather than settled spend — that figure belongs to another skill: name it, as the Output requirements already say, rather than fetching it here. What this forbids is enriching THIS answer, not answering a second question the user actually asked: when they ask one, hand it to the skill that owns it and let it answer as its own block.
   - **Read the period off `period_start`/`period_end` and state it.** Never derive it from today's date, and never present the figures as a quarter or a multi-month span — the window is always a single month. If both fields are absent, say the period is unknown rather than naming one.
   - `amount` is a magnitude (outflow), not a signed figure. `pct` is the entry's share of the total; take it from the tool rather than recomputing it.
   - `rung` says which grouping actually produced these categories — `ledger_account` (the workspace's own chart of accounts), `category_normalized` (Well's auto-categorization), `transaction_type` (a technical fallback bucket), or `uncategorised` (no rung qualified). State it, so the user knows whether they are looking at their own ledger's categories or Well's.
   - An empty `entries` array means nothing is categorized for that month. Say that, rather than reporting zero spend.
   - If `hints` are present (e.g. a coverage caveat about uncategorized spend), disclose them rather than presenting the breakdown as unconditionally complete.

5. **If the tool call errors**, do not invent categories. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back. If it errors again, the fallback is: (a) state the fallback question plainly in your reply ("What are we spending on?"), (b) say plainly that the breakdown is unavailable rather than estimating one, and (c) link the user to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly.

## Output requirements

Return:

- The month the breakdown covers, read off `period_start`/`period_end`.
- The categories, largest first, each with its amount, currency, and share of the total.
- Which `rung` produced the grouping.
- A freshness/caveat line: any `hints` the tool surfaced.
- Whether the picture is complete: which relevant connector categories (bank/cash, accounting) are connected versus still missing. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off.
- A one-line pointer to `avg-burn` for the monthly rate, and to `bills-due` for unpaid obligations rather than settled spend. Name them; do not answer them here.
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
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call.
- Connection state came from the coverage hand-off, and data freshness was read separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The categories and their shares came straight from `well_get_cost_structure`, never re-derived by grouping `transactions`.
- The period was read off `period_start`/`period_end` and stated — not derived from today's date, and never described as a quarter or a multi-month span.
- The `rung` was stated, so the user knows which grouping produced the categories.
- An empty `entries` array was reported as "nothing categorized for this month", never as zero spend.
- `pct` was taken from the tool rather than recomputed.
- No burn rate, runway, or bills list was composed here — each was pointed at by name instead.
- Only this block's analytics tool was called — `well_get_cost_structure`, plus at most the single retry the fallback step documents — and no other block's analytics tool (`well_get_runway`, `well_get_burn`, `well_get_cash_position`, `well_get_cash_forecast`, `well_get_cash_flow_bridge`) was called to source any figure in this answer, including one number in a sentence.
- Which connector categories are connected versus missing was stated from the coverage hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What are we spending on?"

### Expected behavior

Pin the workspace, confirm connections, call `well_get_cost_structure()`, and present the categories largest first with each share — naming the month from `period_start`/`period_end` and the `rung` that produced the grouping. Close with a pointer to `avg-burn` and `bills-due` rather than answering either.

### Example request

"Break down March for me."

### Expected behavior

Call `well_get_cost_structure({ year: 2026, month: 3 })`, then report the month the response actually covered rather than the one requested. A requested month with no data still returns whatever the endpoint could cover, so the bounds in the response are the answer's period — asserting March when the response covers February is the specific error this step exists to prevent.

### Example request

"Where did the money go last quarter?"

### Expected behavior

Say that this breakdown covers a single month, name the month it returned, and offer to run it for each month of the quarter separately. Do not present one month's figures as a quarter, and do not sum three calls into a single category table without saying that is what you did.
</content>
