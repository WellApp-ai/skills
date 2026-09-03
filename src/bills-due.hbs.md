---
name: bills-due
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

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one.
- How far out to plan — default buckets are overdue, due this week, due this month, and due later.
- A target currency — default to reporting per-currency if the bills span more than one.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces`, `well_list_connectors` — read by the workspace and connection steps below.
- `well_query_records` — read `invoices`, `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- Well's OAuth / Dynamic Client Registration (DCR) flow — most hosts trigger it automatically when the Well MCP server is added.

## Workflow

1. **Pin the workspace.** {{> define-workspace purpose="to build your payment calendar from the bills you still owe"}}

2. **Confirm the connections this answer needs.** {{> connect-tools purpose="to build your payment calendar from the bills you still owe" kinds="invoicing, accounting, bank" internalCheck=true}}
   - `coverage: none` → stop; there is nothing to plan yet.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** Coverage reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no bills synced yet — say so and stop, rather than presenting an empty calendar as a clear one.

4. **Resolve your own company.** {{> confirm-my-company purpose="to tell your bills from your invoices" consequence="swaps payables for receivables" foldAliases=true onDecline="state plainly that bills can't be isolated from the full invoice list until it's set"}}
   - Use its `identity_set` — the own company plus every confirmed alias — for every issuer/receiver comparison below.
   - `resolution: unresolved` means the user declined to confirm. Say plainly that bills can't be isolated from the full invoice list until it's set, and stop rather than putting both sides on the calendar.

5. **Query the unpaid bills.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — field behavior varies by connector), then query `invoices` where `receiver_company_id` matches the `identity_set` from `confirm-my-company` and `payment_status` is `unpaid` or `partial`, `orderBy: { field: "due_date", direction: "asc" }` (soonest first — overdue items with a past `due_date` sort to the top naturally). Include `issuer.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`, `invoice_number`.
   - **`payment_status` is authoritative** for whether money is still owed. Lifecycle `status` is a separate dimension, and some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid` — that combination is normal for those sources, not a data fault. Filter on `payment_status`; note the mismatch once in a clause if it's widespread, rather than discrediting the whole calendar over it.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `receiver_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *issuer* before putting anything on the calendar, because a null receiver alone does not make a row a bill:
     - **Issuer is the own-company identity** → an invoice the workspace *issued* that lost its receiver. That is a receivable, and money coming in does not belong on a payment calendar. Leave it out and point the user at `accounts-receivable-aging`.
     - **Issuer is an external company** → genuinely unresolved, and a bill on the balance of evidence. Place it in the calendar as a labeled entry ("unattributed — receiver not recorded"): a large unattributed bill landing next week changes the plan.
     - **Issuer is null too** → nothing places this row on either side. Report it as a separate unsplit line with a count and total, outside the calendar and outside the cumulative running total.
   - **Invoices whose issuer and receiver are the same company** move no cash. Keep them off the calendar and out of the running total, and note them once as a data-quality issue worth fixing in Well.

6. **Group into planning buckets and run the total.** Walking the sorted list, group each bill into overdue, due this week, due this month, or due later (relative to today's date), and keep a running cumulative sum of `balance_due` as you go, so the user can see "by [date], you'll have paid out $X total."

7. **Normalize currency.** If results span more than one currency, {{> normalize-currency}}
   - `partial: true` means a currency had no rate in Well. Name it and say the total covers the rest, rather than letting a quietly smaller total read as complete.
   - Build any per-row figure from its `converted` entries, matched back by tag, rather than re-applying rates yourself.

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
- The workspace came from `define-workspace`'s hand-off, and its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off, and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
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

Pin the workspace, confirm connections, and spot-check that rows have landed; pull unpaid/partial payables sorted by `due_date` ascending, group into overdue/this-week/this-month/later, and present each bucket with vendor, amount, currency, due date, and a running cumulative total — e.g. "By July 18, you'll have paid out $12,400 total." If any bills are overdue, call that bucket out first.

### Example request

"Are we caught up on bills, or is anything overdue?"

### Expected behavior

If the query returns zero unpaid/partial invoices, say plainly that there are no bills currently due (not an error, not a guess). If some are overdue and others are upcoming, show the overdue bucket first with its own subtotal, then the upcoming buckets with the running total continuing from there.

### Example request

"What do we owe this month?" (workspace whose schema does not expose `workspaces.own_company`, and where several bills sit on a legal-form variant of the company's name)

### Expected behavior

Detect in step 4 that `own_company` is unresolved because the field is absent from the schema — not merely null — and ask which company is theirs rather than inferring it from the workspace's name or logo. Once confirmed, normalize both sides (punctuation folded to spaces, runs collapsed) and test containment in both directions, so a `EI-` or `, LTD` variant is offered as a candidate alias rather than having its bills quietly vanish from the calendar. Then split the null-`receiver_company_id` invoices on the issuer: an own-company issuer is a stray receivable and stays off the payment calendar entirely, an external issuer is placed as a labeled entry because a large unattributed bill landing next week changes the plan, and a both-null row is reported separately, outside the cumulative running total.

## Voice
{{> voice}}
