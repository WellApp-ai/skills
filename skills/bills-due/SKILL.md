---
name: bills-due
requires: [define-workspace, connect-tools]
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

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to build your payment calendar from the bills you still owe"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is no payment calendar to build without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [invoicing, accounting, bank]`, `required: []`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to plan yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `invoicing`, `accounting`, or `bank`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (invoicing and accounting connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no bills synced yet — say so and stop, rather than presenting an empty calendar as a clear one.

4. **Resolve the workspace's own company — never infer it.** Call `well_get_schema({ root: "workspaces" })`, then read `workspaces.own_company` on the resolved workspace. Treat all three of these as **unresolved**, not just the null case: the relation is `null`; the field is **absent from the schema entirely** (some workspaces don't expose it, and an absent field is not permission to work around it); or it resolves to more than one plausible company. When unresolved, ask the user which company in Well is theirs and use their answer **for this run only**. Never infer it from the workspace's name, title, logo, slug, or email domain — a workspace named after its owner is a coincidence, not a record, and a wrong pick silently swaps payables for receivables. No MCP tool can persist `own_company`; if the user wants it set permanently, point them at their workspace in the Well app (`<well-app-base-url>/workspaces/<workspace_id>`), where the own-company picker writes it, and say plainly that until then every run will ask again.

   Then **fold in duplicate company records.** One legal entity often has several `companies` rows, differing only by a legal-form prefix or suffix (`EI-`, `SARL`, `SAS`, `SA`, `Ltd`, `GmbH`), punctuation, or accents — and their bills would otherwise vanish from the calendar. Query `companies` and compare each name against the resolved own company after normalizing both sides identically: Unicode NFD, strip combining marks, lowercase, replace every punctuation or separator character (`,` `.` `-` `&` `'` `"` `/`) with a single space, collapse runs of whitespace to one, then trim. The punctuation step is not optional: without it `ACME, LTD` and `ACME LTD` normalize to `acme, ltd` and `acme ltd`, neither contains the other, and the alias is never even proposed. Treat a pair as a candidate alias when **either** normalized name contains the other — containment is directional, so test both ways (`"ei-da silva marly joao"` contains `"da silva marly joao"`, but not the reverse; testing one direction only misses the alias). Candidates are *proposed*, never merged silently: list them, take an explicit yes, then treat the confirmed set as one identity for the rest of this run. Flag the duplicate as a data-quality issue worth fixing in Well — do not call `well_update_company`/`well_delete_company` to merge records yourself.

5. **Query the unpaid bills.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — field behavior varies by connector), then query `invoices` where `receiver_company_id` matches the confirmed own-company identity set and `payment_status` is `unpaid` or `partial`, `orderBy: { field: "due_date", direction: "asc" }` (soonest first — overdue items with a past `due_date` sort to the top naturally). Include `issuer.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`, `invoice_number`.
   - **`payment_status` is authoritative** for whether money is still owed. Lifecycle `status` is a separate dimension, and some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid` — that combination is normal for those sources, not a data fault. Filter on `payment_status`; note the mismatch once in a clause if it's widespread, rather than discrediting the whole calendar over it.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `receiver_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *issuer* before putting anything on the calendar, because a null receiver alone does not make a row a bill:
     - **Issuer is the own-company identity** → an invoice the workspace *issued* that lost its receiver. That is a receivable, and money coming in does not belong on a payment calendar. Leave it out and point the user at `accounts-receivable-aging`.
     - **Issuer is an external company** → genuinely unresolved, and a bill on the balance of evidence. Place it in the calendar as a labeled entry ("unattributed — receiver not recorded"): a large unattributed bill landing next week changes the plan.
     - **Issuer is null too** → nothing places this row on either side. Report it as a separate unsplit line with a count and total, outside the calendar and outside the cumulative running total.
   - **Invoices whose issuer and receiver are the same company** move no cash. Keep them off the calendar and out of the running total, and note them once as a data-quality issue worth fixing in Well.

6. **Group into planning buckets and run the total.** Walking the sorted list, group each bill into overdue, due this week, due this month, or due later (relative to today's date), and keep a running cumulative sum of `balance_due` as you go, so the user can see "by [date], you'll have paid out $X total."

7. **Normalize currency.** If results span more than one `local_currency`, either convert to one base currency via the `exchange_rates` root or report totals per currency — never blend currencies silently.

8. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What bills are due?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The as-of date the calendar was generated for.
- Bills grouped into overdue / due this week / due this month / due later, each bill showing vendor name, amount, currency, and due date.
- A running cumulative total per bucket (and, if useful, at key dates within a bucket), so the user can see cash outflow building up over time.
- Whether the picture is complete: which relevant connector categories (invoicing/bills, and banking or accounting to confirm what's actually been paid) are connected versus still missing, so the user knows whether this calendar reflects every bill they owe or a partial view gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `expense-breakdown` for the biggest-bills (amount-ranked) framing, noting that this skill is date-ordered cash-planning rather than amount-ranked.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 8's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- `well_get_schema` was called before querying `invoices` for the first time.
- `own_company` was read, not inferred. If it was null, absent from the schema, or ambiguous, the user was asked — it was never derived from the workspace's name, logo, slug, or email domain, and an absent field was not treated as license to guess.
- Duplicate company records (legal-form prefixes/suffixes, punctuation, accents) were checked with two-directional normalized containment and confirmed with the user before being folded into the own-company identity — not merged silently, and not missed by testing containment one way only.
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
