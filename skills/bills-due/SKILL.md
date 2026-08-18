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

- The user wants bills ranked by **size**, not by date — "which vendors/bills are the biggest" is amount-ranked with no date sequencing or running total. Use `expense-breakdown`'s accounts-payable view instead; this skill exists specifically for date-ordered cash-flow planning, not "who do we owe the most."
- The user is asking who owes **them** money (receivables, not payables) — use `accounts-receivable-aging` instead.
- The user wants cash-on-hand or runway, not a bills list — use `runway-calculator` instead.
- The user wants a deep dive on one specific vendor — use `company-profile` instead.

## Inputs

The user may provide:

- Which workspace to use (if they manage more than one in Well).
- How far out to plan — default buckets are overdue, due this week, due this month, and due later.
- A target currency — default to reporting per-currency if the bills span more than one.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — resolve which workspace to query.
- `well_query_records` — read `workspace_connectors`, `invoices`, `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — surface install links when the workspace lacks data.
- Well's OAuth / Dynamic Client Registration (DCR) flow — if no Well MCP connection exists yet, most hosts trigger this automatically when the Well MCP server is added (it exposes standard OAuth discovery + DCR, no manual client secret needed). If your host exposes a dedicated `authenticate` tool for the Well connector, call that instead.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) isn't available in your toolset, the Well MCP server hasn't been added to this host. Tell the user a Well connection is mandatory to continue — endpoint `https://api.wellapp.ai/v1/mcp` — because Well is where their financial data is aggregated securely to compute a real bills-due calendar; without it there's nothing to plan from. Stop until it's there; don't estimate from assumptions.

2. **Confirm the account.** Attempt `well_list_workspaces()`.
   - If the call fails with an auth error, no Well MCP connection exists yet — start the Well connector's OAuth/DCR flow (via the host's connector authentication, or the Well connector's `authenticate` tool if present). The moment that flow returns, immediately retry `well_list_workspaces()` yourself in the same turn and continue — don't stop to ask the user to confirm they've logged in or wait for a new message.
   - If it returns one workspace, use it. If more than one workspace exists, ask the user which one to use, and use that single workspace for the rest of this skill. Never query or merge data across multiple workspaces in one run.

3. **Verify the workspace has enough data.** Query `workspace_connectors` (fields: `status`, `connector.name`, `connector.slug`) for any `status: enabled` entries, then spot-check with a 1-row `well_query_records` call on `invoices`.
   - If no connector is enabled, or the spot-check returns zero rows, call `well_list_connectors()` and present the top 2-3 `install_url` links (invoicing/accounting connectors first), and stop here until one is connected — there is nothing to plan yet. Once a connector shows as connected, immediately re-run this check yourself and continue through the rest of the workflow — don't wait to be re-prompted or ask the user to restate the request.
   - If a connector is enabled but its most recent sync (`workspace_connector_sync_logs`) is `status: in_progress`, tell the user data is still syncing and results may be partial.

4. **Resolve the workspace's own company — never infer it.** Call `well_get_schema({ root: "workspaces" })`, then read `workspaces.own_company` on the resolved workspace. Treat all three of these as **unresolved**, not just the null case: the relation is `null`; the field is **absent from the schema entirely** (some workspaces don't expose it, and an absent field is not permission to work around it); or it resolves to more than one plausible company. When unresolved, ask the user which company in Well is theirs and use their answer **for this run only**. Never infer it from the workspace's name, title, logo, slug, or email domain — a workspace named after its owner is a coincidence, not a record, and a wrong pick silently swaps payables for receivables. No MCP tool can persist `own_company`; if the user wants it set permanently, point them at their workspace in the Well app (`<well-app-base-url>/workspaces/<workspace_id>`), where the own-company picker writes it, and say plainly that until then every run will ask again.

   Then **fold in duplicate company records.** One legal entity often has several `companies` rows, differing only by a legal-form prefix or suffix (`EI-`, `SARL`, `SAS`, `SA`, `Ltd`, `GmbH`), punctuation, or accents — and their bills would otherwise vanish from the calendar. Query `companies` and compare each name against the resolved own company after normalizing both sides identically: Unicode NFD, strip combining marks, lowercase, trim. Treat a pair as a candidate alias when **either** normalized name contains the other — containment is directional, so test both ways (`"ei-da silva marly joao"` contains `"da silva marly joao"`, but not the reverse; testing one direction only misses the alias). Candidates are *proposed*, never merged silently: list them, take an explicit yes, then treat the confirmed set as one identity for the rest of this run. Flag the duplicate as a data-quality issue worth fixing in Well — do not call `well_update_company`/`well_delete_company` to merge records yourself.

5. **Query the unpaid bills.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — field behavior varies by connector), then query `invoices` where `receiver_company_id` matches the confirmed own-company identity set and `payment_status` is `unpaid` or `partial`, `orderBy: { field: "due_date", direction: "asc" }` (soonest first — overdue items with a past `due_date` sort to the top naturally). Include `issuer.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`, `invoice_number`.
   - **`payment_status` is authoritative** for whether money is still owed. Lifecycle `status` is a separate dimension, and some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid` — that combination is normal for those sources, not a data fault. Filter on `payment_status`; note the mismatch once in a clause if it's widespread, rather than discrediting the whole calendar over it.
   - **Don't let an equality filter hide rows.** A filter on `receiver_company_id` silently drops invoices where it is `null`. Query that bucket separately and place those bills in the calendar as labeled entries ("unattributed — counterparty not recorded"), not in a footnote: a large unattributed bill landing next week changes the plan. Handle invoices whose issuer and receiver are the same company the same way — surface them labeled, don't drop them.

6. **Group into planning buckets and run the total.** Walking the sorted list, group each bill into overdue, due this week, due this month, or due later (relative to today's date), and keep a running cumulative sum of `balance_due` as you go, so the user can see "by [date], you'll have paid out $X total."

7. **Normalize currency.** If results span more than one `local_currency`, either convert to one base currency via the `exchange_rates` root or report totals per currency — never blend currencies silently.

8. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What bills are due?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The as-of date the calendar was generated for.
- Bills grouped into overdue / due this week / due this month / due later, each bill showing vendor name, amount, currency, and due date.
- A running cumulative total per bucket (and, if useful, at key dates within a bucket), so the user can see cash outflow building up over time.
- Whether the picture is complete: which relevant connector categories (invoicing/bills, and banking or accounting to confirm what's actually been paid) are connected versus still missing, so the user knows whether this calendar reflects every bill they owe or a partial view gated by what's connected today.
- A one-line pointer to `expense-breakdown` for the biggest-bills (amount-ranked) framing, noting that this skill is date-ordered cash-planning rather than amount-ranked.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 8's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- A Well workspace was resolved unambiguously (not guessed when multiple existed).
- Data presence was checked, not just connector "enabled" status.
- `well_get_schema` was called before querying `invoices` for the first time.
- `own_company` was read, not inferred. If it was null, absent from the schema, or ambiguous, the user was asked — it was never derived from the workspace's name, logo, slug, or email domain, and an absent field was not treated as license to guess.
- Duplicate company records (legal-form prefixes/suffixes, punctuation, accents) were checked with two-directional normalized containment and confirmed with the user before being folded into the own-company identity — not merged silently, and not missed by testing containment one way only.
- Invoices with a null `receiver_company_id`, or with issuer equal to receiver, were surfaced as labeled entries in the calendar — not dropped by the equality filter, and not demoted to a footnote.
- Unpaid status came from `payment_status`, not lifecycle `status`. A `status: paid` / `payment_status: unpaid` combination was treated as normal connector behavior, not as grounds for discrediting the calendar.
- Only invoices where the workspace is the **receiver** are counted — never invoices where the workspace is the issuer.
- Results are sorted by `due_date` ascending, not by amount.
- The running cumulative total was computed correctly while walking the sorted list.
- Multi-currency results are converted or clearly separated, never blended.
- Every number carries a currency and an as-of date.
- Which connector categories (invoicing/bills, banking or accounting) are connected versus missing was stated, so the user knows whether the picture is complete or partial.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What bills do we have coming due this month?"

### Expected behavior

Resolve the workspace, confirm invoice data exists, pull unpaid/partial payables sorted by `due_date` ascending, group into overdue/this-week/this-month/later, and present each bucket with vendor, amount, currency, due date, and a running cumulative total — e.g. "By July 18, you'll have paid out $12,400 total." If any bills are overdue, call that bucket out first.

### Example request

"Are we caught up on bills, or is anything overdue?"

### Expected behavior

If the query returns zero unpaid/partial invoices, say plainly that there are no bills currently due (not an error, not a guess). If some are overdue and others are upcoming, show the overdue bucket first with its own subtotal, then the upcoming buckets with the running total continuing from there.
