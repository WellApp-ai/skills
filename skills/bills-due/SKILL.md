---
name: bills-due
requires: [define-workspace, connect-tools, confirm-my-company, normalize-currency]
description: Show what bills are coming due and when, as a date-ordered cash-planning view of accounts payable with a running cumulative total, using Well's MCP financial graph. Use when the user asks "what bills are due", "upcoming payments", "what do we owe this week/month", "AP due dates", "what's our cash outflow looking like", "when are our bills due", or "payment calendar". Requires a connected Well workspace with invoicing/bills data; if none is connected, this skill walks the user through connecting one first.
---

# See What Bills Are Coming Due with Well

## Purpose

Use Well's MCP tools to answer "what bills are coming due, and when?" — a date-ordered view of unpaid accounts payable, grouped into overdue / due this week / due this month / due later, with a running cumulative total so the user can see how much cash is about to go out and by what date. Comes from Well's synced invoice data, not from asking the user to check a spreadsheet.

## When to use this skill

Use this skill when the user asks things like:

- "What bills are due?" / "What do we owe this week/month?"
- "Upcoming payments" / "AP due dates" / "payment calendar"
- "What's our cash outflow looking like?"
- "When are our bills due?"

## When not to use this skill

Do not use this skill when:

- The user wants bills ranked by **size**, not by date — "which vendors/bills are the biggest" is amount-ranked with no date sequencing or running total. No skill covers that framing today, so rank this skill's own rows by amount and say you did, rather than presenting the date-ordered buckets as an answer to it.
- The user is asking who owes **them** money (receivables, not payables) — use `accounts-receivable-aging` instead.
- The user wants cash-on-hand or runway, not a bills list — use `runway` instead.
- The user wants a deep dive on one specific vendor — use `company-profile` instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- How far out to plan — default buckets are overdue, due this week, due this month, and due later.
- A target currency — default to reporting per-currency if the bills span more than one.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_query_records` — read `invoices`, `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Four atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.
- `confirm-my-company` — works out which company in the workspace is the user's own legal entity, folds in its duplicate records, and hands back the `identity_set` that decides which side of an invoice is a payable.
- `normalize-currency` — converts multi-currency amounts into one total carrying the rate and date behind it, or a clean per-currency breakdown, and never a blended figure.

All four ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1, 2, 4, and 7 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to build your payment calendar from the bills you still owe"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is no payment calendar to build without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [invoicing, accounting, bank]`, `required: []`, `mode: internal_check`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to plan yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `invoicing`, `accounting`, or `bank`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (invoicing and accounting connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no bills synced yet — say so and stop, rather than presenting an empty calendar as a clear one.

4. **Resolve your own company — run `confirm-my-company`.** Invoke the `confirm-my-company` skill with the pinned `workspace_id`, `purpose: "to tell your bills from your invoices"`, `consequence: "swaps payables for receivables"`, and `on_decline: "state plainly that bills can't be isolated from the full invoice list until it's set"`. That skill owns the three-way unresolved test (the relation is null, the field is absent from the schema entirely, or it resolves to more than one company), the never-infer rule, and the both-direction normalized containment that folds a legal entity's duplicate `companies` rows into one identity. Use its `identity_set` — the own company plus every confirmed alias — for every issuer/receiver comparison below.
   - `resolution: unresolved` means the user declined to confirm. Say plainly that bills can't be isolated from the full invoice list until it's set, and stop rather than putting both sides on the calendar.
   - **If `confirm-my-company` isn't installed**, do it inline: call `well_get_schema({ root: "workspaces" })` and read `workspaces.own_company`, treating null, absent-from-the-schema, and ambiguous alike as unresolved; ask which company is theirs rather than inferring it from the workspace's name, logo, slug, or email domain; then propose duplicate `companies` rows as aliases by comparing identically normalized names (Unicode NFD, strip combining marks, lowercase, punctuation to single spaces, collapse whitespace) with containment tested in **both** directions, folding only on an explicit yes.

5. **Query the unpaid bills.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — field behavior varies by connector), then query `invoices` where `receiver_company_id` matches the `identity_set` from `confirm-my-company` and `payment_status` is `unpaid` or `partial`, `orderBy: { field: "due_date", direction: "asc" }` (soonest first — overdue items with a past `due_date` sort to the top naturally). Include `issuer.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`, `invoice_number`.
   - **`payment_status` is authoritative** for whether money is still owed. Lifecycle `status` is a separate dimension, and some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid` — that combination is normal for those sources, not a data fault. Filter on `payment_status`; note the mismatch once in a clause if it's widespread, rather than discrediting the whole calendar over it.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `receiver_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *issuer* before putting anything on the calendar, because a null receiver alone does not make a row a bill:
     - **Issuer is the own-company identity** → an invoice the workspace *issued* that lost its receiver. That is a receivable, and money coming in does not belong on a payment calendar. Leave it out and point the user at `accounts-receivable-aging`.
     - **Issuer is an external company** → genuinely unresolved, and a bill on the balance of evidence. Place it in the calendar as a labeled entry ("unattributed, receiver not recorded"): a large unattributed bill landing next week changes the plan.
     - **Issuer is null too** → nothing places this row on either side. Report it as a separate unsplit line with a count and total, outside the calendar and outside the cumulative running total.
   - **Invoices whose issuer and receiver are the same company** move no cash. Keep them off the calendar and out of the running total, and note them once as a data-quality issue worth fixing in Well.

6. **Group into planning buckets and run the total.** Walking the sorted list, group each bill into overdue, due this week, due this month, or due later (relative to today's date), and keep a running cumulative sum of `balance_due` as you go, so the user can see "by [date], you'll have paid out $X total."

7. **Normalize currency — run `normalize-currency`.** If results span more than one currency, invoke the `normalize-currency` skill with the pinned `workspace_id`, the tagged amounts (one tag per bill, so the cumulative total is built on converted values), `target_currency` (default: the workspace's base currency), and `as_of` (default today). That skill owns the never-blend invariant, the rate read from `exchange_rates`, the most-recent-rate-at-or-before-`as_of` fallback, and the rule that every converted figure carries the rate and date behind it. Report its `converted_total` with those rates, or its `per_currency` breakdown — never a blended total. Build any per-row figure from its `converted` entries, matched back by tag, rather than re-applying rates yourself.
   - `partial: true` means a currency had no rate in Well. Name it and say the total covers the rest, rather than letting a quietly smaller total read as complete.
   - **If `normalize-currency` isn't installed**, do it inline: group amounts per currency first, then either convert via the `exchange_rates` root — using the most recent rate at or before `as_of`, never a later one, and stating the rate and date used — or report totals per currency. Never blend currencies silently.

8. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What bills are due?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The as-of date the calendar was generated for.
- Bills grouped into overdue / due this week / due this month / due later, each bill showing vendor name, amount, currency, and due date.
- A running cumulative total per bucket (and, if useful, at key dates within a bucket), so the user can see cash outflow building up over time.
- Whether the picture is complete: which relevant connector categories (invoicing/bills, and banking or accounting to confirm what's actually been paid) are connected versus still missing, so the user knows whether this calendar reflects every bill they owe or a partial view gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line note that this list is date-ordered cash planning rather than amount-ranked, so a reader after "who do we owe the most" knows to ask for it re-sorted.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 8's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the figures in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already shows.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- `well_get_schema` was called before querying `invoices` for the first time.
- The own company came from `confirm-my-company`'s hand-off — its `identity_set`, not a value resolved here — and on `resolution: unresolved` the documented fallback ran rather than a guess.
- Duplicate company records were folded by `confirm-my-company`, which proposes them for an explicit yes; none were merged silently here, and no `well_update_company`/`well_delete_company` call was made.
- Null-`receiver_company_id` invoices were split on the issuer before reaching the calendar: own-company issuer routed to receivables and excluded, external issuer placed as a labeled entry, both-null reported as a separate unsplit line outside the running total.
- Invoices whose issuer equals their receiver were kept off the calendar and out of the cumulative total.
- Unpaid status came from `payment_status`, not lifecycle `status`. A `status: paid` / `payment_status: unpaid` combination was treated as normal connector behavior, not as grounds for discrediting the calendar.
- Only invoices where the workspace is the **receiver** are counted — never invoices where the workspace is the issuer.
- Results are sorted by `due_date` ascending, not by amount.
- The running cumulative total was computed correctly while walking the sorted list.
- Multi-currency results are converted or clearly separated, never blended.
- Every number carries a currency and an as-of date.
- Which connector categories (invoicing/bills, banking or accounting) are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What bills do we have coming due this month?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; pull unpaid/partial payables sorted by `due_date` ascending, group into overdue/this-week/this-month/later, and present each bucket with vendor, amount, currency, due date, and a running cumulative total — e.g. "By July 18, you'll have paid out $12,400 total." If any bills are overdue, call that bucket out first.

### Example request

"Are we caught up on bills, or is anything overdue?"

### Expected behavior

If the query returns zero unpaid/partial invoices, say plainly that there are no bills currently due (not an error, not a guess). If some are overdue and others are upcoming, show the overdue bucket first with its own subtotal, then the upcoming buckets with the running total continuing from there.

### Example request

"What do we owe this month?" (workspace whose schema does not expose `workspaces.own_company`, and where several bills sit on a legal-form variant of the company's name)

### Expected behavior

Detect in step 4 that `own_company` is unresolved because the field is absent from the schema — not merely null — and ask which company is theirs rather than inferring it from the workspace's name or logo. Once confirmed, normalize both sides (punctuation folded to spaces, runs collapsed) and test containment in both directions, so a `EI-` or `, LTD` variant is offered as a candidate alias rather than having its bills quietly vanish from the calendar. Then split the null-`receiver_company_id` invoices on the issuer: an own-company issuer is a stray receivable and stays off the payment calendar entirely, an external issuer is placed as a labeled entry because a large unattributed bill landing next week changes the plan, and a both-null row is reported separately, outside the cumulative running total.

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

Keep to the house words in what you write to the user. Write "connect", never "integrate". Write "sessions", never "chat". Write "business data", never "financial data". Write "tokens", never "credits". Name every object by its own name, the workspace, the connector, the company, or the invoice, and never show the user a raw id on its own. A Well app address is a link, not an id, so keep it whole even when it carries a workspace id.
