---
name: rank-clients-by-ltv
description: Rank customers by total realized revenue paid to date — sum of paid invoices per customer — using Well's MCP financial graph, backed by real invoice data rather than guesswork. Use when the user asks "rank our clients by lifetime value", "who are our best customers", "rank clients by revenue", "biggest customers", "customer lifetime value", or "which customers have paid us the most". This is a realized-revenue ranking (paid invoices to date), not a predictive churn/retention-based LTV model. Requires a connected Well workspace with invoicing data and a resolvable `own_company`; if either is missing, this skill walks the user through connecting one or confirming their company first.
---

# Rank Your Clients by Lifetime Value with Well

## Purpose

Use Well's MCP tools to answer "who are our best customers?" by ranking customers on total **realized** revenue — the sum of every invoice this workspace has issued and been paid for, grouped by customer, to date. This computes cumulative paid-invoice revenue per customer, backed by Well's synced invoice data, not a guess.

**This is not a predictive customer-lifetime-value model.** A true forward-looking CLV needs churn, retention, and cohort data that Well's invoice graph doesn't carry. What this skill delivers is a realized-revenue ranking — "who has paid us the most so far" — even though users typically reach for "lifetime value" phrasing to ask for it. Always frame the output that way.

## When to use this skill

Use this skill when the user asks things like:

- "Rank our clients by lifetime value" / "customer lifetime value"
- "Who are our best customers?" / "Biggest customers"
- "Rank clients by revenue"
- "Which customers have paid us the most?"

## When not to use this skill

Do not use this skill when:

- The user wants to know who currently owes money (unpaid invoices) — use `accounts-receivable-aging` instead; this skill only counts **paid** invoices (realized revenue), not outstanding balances.
- The user wants a deep dive on one specific customer's full history, not a ranking across all customers — use the sibling `company-profile` skill instead.
- The user wants spend/expenses (money going out, not coming in) — use `cost-structure` instead.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to workspace resolution, which is what resolves it; this skill never picks a workspace itself.
- A time window (e.g. "this year", "last quarter") — default to **all-time** since this is a cumulative "to date" ranking, not a period-bound one. State clearly which window was used.
- How many top customers to show — default to 10.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how the workspace step resolves the workspace.
- `well_query_records` — read `invoices`, `workspaces` (for `own_company`), `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — how the connections step surfaces install links.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by the workspace step, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that step calls it.

## Workflow

1. **Pin the workspace.** {{> define-workspace purpose="to rank your customers by the revenue they've paid you"}}

2. **Confirm the connections this answer needs.** {{> connect-tools purpose="to rank your customers by the revenue they've paid you" kinds="invoicing, accounting" internalCheck=true}}
   - `coverage: none` → stop; there is nothing to rank yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no invoices synced yet — say so and stop, rather than presenting an empty ranking as a real one.

4. **Resolve your own company.** {{> confirm-my-company purpose="to count only the invoices you issued" consequence="ranks the wrong side of the invoice" foldCounterparties=true onDecline="state plainly that the ranking can't isolate this workspace's own paid invoices until it's set"}}
   - `resolution: unresolved` means the user declined to confirm. Say plainly that the ranking can't isolate this workspace's own paid invoices until it's set, and stop rather than ranking both sides together.

5. **Resolve the time window.** Default to **all-time** (this is a cumulative "to date" ranking). If the user names a window (e.g. "this year"), use it and filter on `issue_date`. State explicitly which window was used in the output either way.

6. **Query paid revenue by customer.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — this skill relies on `payment_status`, a separate dimension from lifecycle `status`, and field behavior can vary by connector). Query `invoices` where `issuer_company_id` matches the `identity_set` from the own-company step and `payment_status` is `paid` (optionally filtered on `issue_date` to the resolved window). Include `receiver.name`, `grand_total`, `local_currency`. Group and sum `grand_total` by `receiver_company_id`/`receiver.name`, collapsing each set in `counterparty_alias_sets` into a single row.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `issuer_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *receiver* before counting anything as revenue, because a null issuer alone does not make a paid invoice income:
     - **Receiver is the own-company identity** → a bill the workspace *paid*, not revenue it earned. Counting it would inflate every total on the page. Leave it out entirely.
     - **Receiver is an external company** → genuinely unresolved, and revenue on the balance of evidence. Report it as a labeled row ("unattributed — issuer not recorded") alongside the ranking, so the user can see how much revenue the ranking couldn't place.
     - **Receiver is null too** → nothing places this row. Report it as a separate unsplit line with a count and total, outside the ranking and outside the revenue total.
   - Paid invoices the workspace issued but whose `receiver_company_id` is null are real revenue with an unknown customer: keep them in the revenue total as a single "unattributed customer" row rather than dropping them, and never merge them into a named customer's figure.
   - **Invoices whose issuer and receiver are the same company** are not revenue. Keep them out of the ranking and out of the total, and note them once as a data-quality issue.

7. **Normalize currency.** If results span more than one currency: {{> normalize-currency}}
   - Use its `per_currency` rows for the per-customer figures and its `converted_total` for the ranking, tagged one entry per customer so the ranking is built on converted totals. Report its `converted_total` with those rates, or its `per_currency` breakdown — never a blended total. Build any per-row figure from its `converted` entries, matched back by tag, rather than re-applying rates yourself.
   - `partial: true` means a currency had no rate in Well. Name it and say the total covers the rest, rather than letting a quietly smaller total read as complete.

8. **Sort and limit.** Sort customers descending by total paid revenue. Return the requested count, default top 10.

9. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Who are our best customers?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The time window used (all-time by default), stated explicitly.
- A ranked table: customer name, total paid revenue, currency, and share of total paid revenue across all ranked customers. `well_query_records` ships its own card, and that card renders these rows — so do not restate them in prose. It draws no chart, so the form is yours to judge on its merits: a horizontal bar chart is the natural fit for a comparison across customers, so reach for it when the host supports it and prose alone would read worse. Do not stop to ask table-or-chart first. Back any visual with the exact figures.
- The as-of date the ranking was computed against.
- An explicit one-line caveat: this is realized paid-invoice revenue to date, not a predictive customer-lifetime-value model.
- Whether the picture is complete: which relevant connector categories (invoicing/accounting) are connected versus still missing — read off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own — and whether the workspace's own company is set, read off the own-company hand-off, so the user knows whether this ranking reflects their full revenue history or a partial view gated by what's connected today.
- A one-line pointer to `company-profile` for a deep dive on any single top customer's full relationship history.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 9's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** A Well MCP tool that ships a widget attaches
`_meta.ui.resourceUri` to its result, and the host decides whether to draw it. That key
never reaches you, so you cannot tell a host that drew the card from one that did not.
Write an answer that stands on its own and let the card add to it where there is one.
State the figures in text regardless — you cannot know whether anything drew them. What you must not add is a second rendering of what a card already
shows; where a visual the tool does not draw genuinely reads better, compose one and
style it with the tokens under **Styling a composed view** below.

## Styling a composed view

{{> styling}}

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from the pinned hand-off, and its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off, and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The own company came from the own-company hand-off's `identity_set`, not a value resolved here — and on `resolution: unresolved` the documented fallback ran rather than a guess.
- Duplicate company records were folded upstream, which proposes them for an explicit yes; none were merged silently here, and no `well_update_company`/`well_delete_company` call was made.
- Null-`issuer_company_id` invoices were split on the receiver before counting as revenue: own-company receiver means a bill the workspace paid and was excluded, external receiver reported as a labeled unattributed row, both-null reported as a separate unsplit line outside the revenue total.
- Invoices whose issuer equals their receiver were excluded from the ranking and the total.
- `well_get_schema` was called on `invoices` before querying it, even if it was queried earlier for a different purpose.
- Only invoices with `payment_status: paid` were counted — not `unpaid`/`partial`, which would overstate realized revenue.
- Only invoices where the workspace is **issuer** were counted — receiving invoices would be spend, not revenue.
- Multi-currency results are converted (with rate/date noted) or clearly separated, never blended.
- Every number carries a currency and an as-of date.
- Which connector categories (invoicing/accounting) are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- The "not a predictive lifetime-value model" caveat is present in the output.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"Rank our clients by lifetime value — top 10."

### Expected behavior

Pin the workspace, then check connections, and spot-check that rows have landed; resolve `own_company`, default to an all-time window, pull all `invoices` where this workspace is issuer and `payment_status` is `paid`, sum `grand_total` per customer, sort descending, and present the top 10 with customer name, total paid revenue, currency, share of total, as-of date, and the realized-revenue-not-predictive-CLV caveat.

### Example request

"Who's our biggest customer?" — two separate runs, each against one workspace only: one workspace where a customer paid invoices in EUR and the rest paid in USD, and another workspace where no invoices have been marked `paid` yet.

### Expected behavior

In the multi-currency workspace's run: pass the per-customer totals to normalize-currency tagged by customer and rank on its `converted` entries — reporting the rate and date it used — or report the EUR customer separately rather than adding their total directly into a USD-only ranking. In the zero-paid-invoice workspace's run: state plainly that no realized revenue exists yet (all invoices are unpaid/partial), do not fabricate a ranking, and offer the same fallback link so the user can ask in Well directly.

### Example request

"Who are our best customers?" (workspace whose schema does not expose `workspaces.own_company`, and whose `companies` list holds both "Northwind Trading" and "NORTHWIND TRADING, LTD")

### Expected behavior

Detect in step 4 that `own_company` is unresolved because the field is absent from the schema — not merely null — and ask which company is theirs rather than matching the workspace's name or logo to a `companies` row. Once confirmed, normalize both sides (punctuation folded to spaces, runs collapsed) so `"northwind trading ltd"` and `"northwind trading"` compare as containing one another, and offer the `LTD` record as a candidate alias for confirmation — on the customer side as well as the own-company side, since an unmerged customer alias splits one client across two rows and understates their rank. Then split the null-`issuer_company_id` invoices on the receiver before counting anything as revenue: an own-company receiver means a bill the workspace paid, which is excluded outright, while an external receiver is reported as a labeled unattributed row. Say the confirmation holds for this run only, and link to the Well app to set it permanently.
