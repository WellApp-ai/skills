---
name: rank-clients-by-ltv
requires: [define-workspace, connect-tools, confirm-my-company, normalize-currency]
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

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- A time window (e.g. "this year", "last quarter") — default to **all-time** since this is a cumulative "to date" ranking, not a period-bound one. State clearly which window was used.
- How many top customers to show — default to 10.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. This skill never calls it directly.
- `well_query_records` — read `invoices`, `workspaces` (for `own_company`), `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session; field names and semantics are workspace/connector-dependent, never assume them.
- `well_list_connectors` — how `connect-tools` surfaces install links. This skill never calls it directly.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Four atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.
- `confirm-my-company` — works out which company in the workspace is the user's own legal entity, folds in its duplicate records, and hands back the `identity_set` that decides which side of an invoice is a payable.
- `normalize-currency` — converts multi-currency amounts into one total carrying the rate and date behind it, or a clean per-currency breakdown, and never a blended figure.

All four ship with the `well-skills` plugin. This skill is also installable on its own. When a brick it needs is absent, the step that needs it says so and stops.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to rank your customers by the revenue they've paid you"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is nothing to rank without a pinned workspace.
   - **If `define-workspace` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [invoicing, accounting]`, `required: []`, `mode: internal_check`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to rank yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the workspace has no invoices synced yet — say so and stop, rather than presenting an empty ranking as a real one.

4. **Resolve your own company — run `confirm-my-company`.** Invoke the `confirm-my-company` skill with the pinned `workspace_id`, `purpose: "to count only the invoices you issued"`, `consequence: "ranks the wrong side of the invoice"`, `fold_counterparties: true`, and `on_decline: "state plainly that the ranking can't isolate this workspace's own paid invoices until it's set"`. That skill owns the three-way unresolved test (the relation is null, the field is absent from the schema entirely, or it resolves to more than one company), the never-infer rule, and the both-direction normalized containment that folds a legal entity's duplicate `companies` rows into one identity. Use its `identity_set` — the own company plus every confirmed alias — for every issuer/receiver comparison below.
   - `resolution: unresolved` means the user declined to confirm. Say plainly that the ranking can't isolate this workspace's own paid invoices until it's set, and stop rather than ranking both sides together.
   - **If `confirm-my-company` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

5. **Resolve the time window.** Default to **all-time** (this is a cumulative "to date" ranking). If the user names a window (e.g. "this year"), use it and filter on `issue_date`. State explicitly which window was used in the output either way.

6. **Query paid revenue by customer.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — this skill relies on `payment_status`, a separate dimension from lifecycle `status`, and field behavior can vary by connector). Query `invoices` where `issuer_company_id` matches the `identity_set` from `confirm-my-company` and `payment_status` is `paid` (optionally filtered on `issue_date` to the resolved window). Include `receiver.name`, `grand_total`, `local_currency`. Group and sum `grand_total` by `receiver_company_id`/`receiver.name`, collapsing each set in `counterparty_alias_sets` into a single row.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `issuer_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *receiver* before counting anything as revenue, because a null issuer alone does not make a paid invoice income:
     - **Receiver is the own-company identity** → a bill the workspace *paid*, not revenue it earned. Counting it would inflate every total on the page. Leave it out entirely.
     - **Receiver is an external company** → genuinely unresolved, and revenue on the balance of evidence. Report it as a labeled row ("unattributed, issuer not recorded") alongside the ranking, so the user can see how much revenue the ranking couldn't place.
     - **Receiver is null too** → nothing places this row. Report it as a separate unsplit line with a count and total, outside the ranking and outside the revenue total.
   - Paid invoices the workspace issued but whose `receiver_company_id` is null are real revenue with an unknown customer: keep them in the revenue total as a single "unattributed customer" row rather than dropping them, and never merge them into a named customer's figure.
   - **Invoices whose issuer and receiver are the same company** are not revenue. Keep them out of the ranking and out of the total, and note them once as a data-quality issue.

7. **Normalize currency — run `normalize-currency`.** If results span more than one currency, invoke the `normalize-currency` skill with the pinned `workspace_id`, the tagged amounts (one tag per customer, so the ranking is built on converted totals), `target_currency` (default: the workspace's base currency), and `as_of` (default today). That skill owns the never-blend invariant, the rate read from `exchange_rates`, the most-recent-rate-at-or-before-`as_of` fallback, and the rule that every converted figure carries the rate and date behind it. Report its `converted_total` with those rates, or its `per_currency` breakdown — never a blended total. Build any per-row figure from its `converted` entries, matched back by tag, rather than re-applying rates yourself.
   - `partial: true` means a currency had no rate in Well. Name it and say the total covers the rest, rather than letting a quietly smaller total read as complete.
   - **If `normalize-currency` isn't installed**, say so and stop: this skill needs it, and `npx skills add wellapp-ai/skills` installs it. Do not do its work here.

8. **Sort and limit.** Sort customers descending by total paid revenue. Return the requested count, default top 10.

9. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Who are our best customers?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- The time window used (all-time by default), stated explicitly.
- A ranked table: customer name, total paid revenue, currency, and share of total paid revenue across all ranked customers. `well_query_records` ships its own card, and that card renders these rows — so do not restate them in prose. It draws no chart, and neither do you: this skill has no tool of its own, so the answer is the table and the prose around it.
- The as-of date the ranking was computed against.
- An explicit one-line caveat: this is realized paid-invoice revenue to date, not a predictive customer-lifetime-value model.
- Whether the picture is complete: which relevant connector categories (invoicing/accounting) are connected versus still missing — read off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own — and whether the workspace's own company is set, read off `confirm-my-company`'s hand-off, so the user knows whether this ranking reflects their full revenue history or a partial view gated by what's connected today.
- A one-line pointer to `company-profile` for a deep dive on any single top customer's full relationship history.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 9's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** This skill has no Well MCP tool of its own, so no card is
drawn for it on any host — the widget-disclosure reasoning the tool-backed skills carry
does not apply here. Answer in prose and a markdown table, and state every figure in the
text. Do not compose a styled visual: Well's own surfaces own how Well data is drawn, and
this answer is not one of them.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off, and its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off, and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The own company came from `confirm-my-company`'s hand-off — its `identity_set`, not a value resolved here — and on `resolution: unresolved` the documented fallback ran rather than a guess.
- Duplicate company records were folded by `confirm-my-company`, which proposes them for an explicit yes; none were merged silently here, and no `well_update_company`/`well_delete_company` call was made.
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

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; resolve `own_company`, default to an all-time window, pull all `invoices` where this workspace is issuer and `payment_status` is `paid`, sum `grand_total` per customer, sort descending, and present the top 10 with customer name, total paid revenue, currency, share of total, as-of date, and the realized-revenue-not-predictive-CLV caveat.

### Example request

"Who's our biggest customer?" — two separate runs, each against one workspace only: one workspace where a customer paid invoices in EUR and the rest paid in USD, and another workspace where no invoices have been marked `paid` yet.

### Expected behavior

In the multi-currency workspace's run: pass the per-customer totals to `normalize-currency` tagged by customer and rank on its `converted` entries — reporting the rate and date it used — or report the EUR customer separately rather than adding their total directly into a USD-only ranking. In the zero-paid-invoice workspace's run: state plainly that no realized revenue exists yet (all invoices are unpaid/partial), do not fabricate a ranking, and offer the same fallback link so the user can ask in Well directly.

### Example request

"Who are our best customers?" (workspace whose schema does not expose `workspaces.own_company`, and whose `companies` list holds both "Northwind Trading" and "NORTHWIND TRADING, LTD")

### Expected behavior

Detect in step 4 that `own_company` is unresolved because the field is absent from the schema — not merely null — and ask which company is theirs rather than matching the workspace's name or logo to a `companies` row. Once confirmed, normalize both sides (punctuation folded to spaces, runs collapsed) so `"northwind trading ltd"` and `"northwind trading"` compare as containing one another, and offer the `LTD` record as a candidate alias for confirmation — on the customer side as well as the own-company side, since an unmerged customer alias splits one client across two rows and understates their rank. Then split the null-`issuer_company_id` invoices on the receiver before counting anything as revenue: an own-company receiver means a bill the workspace paid, which is excluded outright, while an external receiver is reported as a labeled unattributed row. Say the confirmation holds for this run only, and link to the Well app to set it permanently.

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
