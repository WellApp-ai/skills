---
name: expense-breakdown
requires: [define-workspace, connect-tools]
description: Break down where a company's money goes using Well's MCP financial graph — top expense categories and the largest outstanding accounts payable, backed by ledger and invoice data rather than guesswork. Use when the user asks "where does my money go", "what are we spending on", "biggest expenses", "top vendors I owe", "expense category breakdown", or "outstanding bills". Requires a connected Well workspace with at least one banking or accounting connector; if none is connected, this skill walks the user through connecting one first.
---

# See Where Your Money Goes with Well

## Purpose

Use Well's MCP tools to answer "where is our money going?" with two grounded views: which expense categories consume the most cash, and which unpaid bills (accounts payable) are the biggest. Both come from Well's synced financial graph, not from asking the user to export a spreadsheet.

## When to use this skill

Use this skill when the user asks things like:

- "Where does our money go?" / "What are we spending on?"
- "What are our biggest expense categories?"
- "What are the biggest bills we owe?" / "biggest accounts payable" / "top unpaid vendors"
- "Give me a spend breakdown" for a connected Well workspace

## When not to use this skill

Do not use this skill when:

- The user wants a runway/cash-remaining answer — use the `runway-calculator` skill instead.
- The user wants a raw transaction export, not a categorized breakdown — a plain `well_query_records` call on `transactions` is enough.
- The user wants bills sorted by *due date* for cash-flow planning, not ranked by amount — use the `bills-due` skill instead.
- The user wants a deep dive on one specific vendor (full contact info, full history) — use the `company-profile` skill instead.
- No Well MCP connection is available and the user does not want to set one up — say so instead of guessing at numbers.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- How many top categories/vendors to show — default to 5 of each. The category breakdown's window is not user-configurable (see Tooling) — it is always the latest closed month.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_get_cost_structure` — the category breakdown (which expense categories consume the most cash) for the latest closed month. Same deterministic computation the Well app's canvas cost-structure chart renders — a 4-rung fallback ladder (ledger account → transaction category → transaction type → "Uncategorised"), never LLM-estimated. Call this directly; do not re-derive categories yourself from raw `account_balances`/`ledger_accounts`/`transactions` reads. It has no window parameter — it always answers for the latest closed month, not a user-chosen quarter/range.
- `well_query_records` — read `workspaces` (for `own_company`), `companies` (to fold in duplicate records of the own company), `invoices` (for the accounts-payable half of this skill, which `well_get_cost_structure` does not cover), and `exchange_rates`.
- `well_get_schema` — call this before querying `invoices`/`workspaces`; field names and semantics are workspace/connector-dependent, never assume them. Note that no MCP tool writes to `workspaces` — `own_company` is read-only from this skill, so it can be confirmed for a run but never persisted.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

**Never fetch the underlying financial data from a third-party provider directly.** Every number in this skill's answer comes from `well_get_cost_structure` and `well_query_records` — Well's own synced, normalized financial graph. Do not call `well_invoke_connector_tool`, and do not call any provider-specific tool (Pennylane, Qonto, QuickBooks, Xero, …) to pull ledger lines, transactions, or invoices yourself, even when such a tool is listed as available. Well has already synced and normalized this data; bypassing it produces figures that disagree with what the Well app itself shows the user.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to break down where your money goes"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is nothing to break down without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank, accounting, invoicing]`, `required: []`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to break down yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank`, `accounting`, or `invoicing`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (banking and accounting connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices`. Zero rows means the accounts-payable half of this skill has nothing to rank — say so and report the category breakdown alone rather than presenting an empty payables table as a paid-up one.

4. **Get the category breakdown.** Call `well_get_cost_structure()`. It returns `entries` (`category`, `amount`, `pct`, sorted by amount descending), `currency`, and `rung` (which grouping actually produced these categories — `ledger_account`, `category_normalized`, `transaction_type`, or `uncategorised`) for the latest closed month.
   - If the user asked for a different window ("this quarter", "last 3 months"), say plainly that the category breakdown only covers the latest closed month today, rather than silently substituting or fabricating a wider range.
   - If `hints` are present (e.g. a coverage caveat about uncategorized spend), disclose them alongside the ranking rather than presenting it as unconditionally complete.
   - If the call errors or returns no entries, treat this the same as step 9's fallback below.

5. **Resolve `own_company` — never infer it.** Call `well_get_schema({ root: "workspaces" })`, then read `workspaces.own_company` on the resolved workspace. Treat all three of these as **unresolved**, not just the null case:
   - the relation is `null`;
   - the field is **absent from the schema entirely** — some workspaces don't expose it, and an absent field is not permission to work around it;
   - it resolves to more than one plausible company.

   When unresolved, ask the user which company in Well is theirs and use their answer **for this run only**. Never infer it from the workspace's name, title, logo, slug, or email domain — a workspace named after its owner is a coincidence, not a record, and a wrong pick silently swaps payables for receivables. No MCP tool can persist `own_company`; if the user wants it set permanently, point them at their workspace in the Well app (`<well-app-base-url>/workspaces/<workspace_id>`), where the own-company picker writes it, and say plainly that until then every run will ask again. If the user declines to confirm, skip the payable/receivable split and report gross unpaid invoices instead, labeled as unsplit.

6. **Fold in duplicate company records.** One legal entity often has several `companies` rows, differing only by a legal-form prefix or suffix (`EI-`, `SARL`, `SAS`, `SA`, `Ltd`, `GmbH`), punctuation, or accents. Once `own_company` is resolved, query `companies` and compare each name against it after normalizing both sides identically: Unicode NFD, strip combining marks, lowercase, replace every punctuation or separator character (`,` `.` `-` `&` `'` `"` `/`) with a single space, collapse runs of whitespace to one, then trim. The punctuation step is not optional: without it `ACME, LTD` and `ACME LTD` normalize to `acme, ltd` and `acme ltd`, neither contains the other, and the alias is never even proposed. Treat a pair as a candidate alias when **either** normalized name contains the other — containment is directional, so test both ways (`"ei-da silva marly joao"` contains `"da silva marly joao"`, but not the reverse; testing one direction only misses the alias). Candidates are *proposed*, never merged silently: list them, take an explicit yes, then treat the confirmed set as one identity for every `own_company` comparison in this run. Mention the duplicate as a data-quality issue worth fixing in Well — do not call `well_update_company`/`well_delete_company` to merge records yourself.

7. **Get the biggest accounts payable.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — field behavior varies by connector). Query `invoices` where `receiver_company_id` matches the confirmed own-company identity set and `payment_status` is `unpaid` or `partial`, `orderBy: { field: "grand_total", direction: "desc" }`, limited to the requested count. Include `issuer.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`.
   - **`payment_status` is authoritative** for whether money is still owed. Lifecycle `status` is a separate dimension, and some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid` — that combination is normal for those sources, not a data fault. Filter on `payment_status`; note the mismatch once in a clause if it's widespread, but do not discredit the whole payables section over it.
   - **Don't let an equality filter hide rows — and don't over-collect either.** A filter on `receiver_company_id` silently drops invoices where it is `null`. Query that bucket separately, then split it on the *issuer* before reporting anything, because a null receiver alone does not make a row a bill:
     - **Issuer is the own-company identity** → this is an invoice the workspace *issued* that lost its receiver. It is a receivable, not a payable. Leave it out of this skill entirely and point the user at `accounts-receivable-aging`.
     - **Issuer is an external company** → genuinely unresolved, and a bill on the balance of evidence. Rank it *inside* the main table as a labeled row ("unattributed — receiver not recorded"), not as a footnote: an unattributed bill can easily outrank everything else, and burying the largest item under the table makes the ranking wrong.
     - **Issuer is null too** → nothing places this row on either side. Report it as a separate unsplit line carrying a count and total, and never fold it into the payable headline.
   - **Invoices whose issuer and receiver are the same company** are neither a vendor bill nor a cash outflow. Keep them out of the payable total and note them once as a data-quality issue worth fixing in Well.

8. **Normalize currency.** If results span more than one `local_currency`, either convert to one base currency via the `exchange_rates` root or report totals per currency — never blend currencies silently.

9. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Where does my money go?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Which month the category breakdown covers (the latest closed month — say so explicitly if the user asked for a different window) and which connector(s)/sync the accounts-payable numbers came from.
- Top expense categories with amount, currency, and share of total spend (`entries[].pct` from `well_get_cost_structure`, straight from the tool — not recomputed). This is a comparison across categories, so lead with a horizontal bar chart and back it with the exact figures; don't stop to ask table-or-chart first.
- Top accounts payable: vendor, amount, currency, due date. Any unattributed or self-referencing invoices belong in this ranking as labeled rows, not in a caveat below it.
- A one-line note that the category breakdown is the same computation the Well app itself renders, not a skill-side estimate, plus any coverage `hints` `well_get_cost_structure` returned (e.g. uncategorized spend). State which grouping actually produced it, straight from `rung`: "by ledger account" (`ledger_account`), "by Well's category" (`category_normalized`), "by transaction type" (`transaction_type`), or "uncategorised" (`uncategorised`) — not the full 4-rung fallback order, just the one the tool reports.
- Whether the picture is complete: which relevant connector categories (banking, accounting) are connected versus still missing, so the user knows whether this reflects their full spend or a partial view gated by what's connected today. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `bills-due` for a date-ordered view of when the biggest payables come due.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 9's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- `well_get_schema` was called before querying `invoices`/`workspaces` for the first time.
- Category totals came straight from `well_get_cost_structure`, not re-derived from raw `account_balances`/`ledger_accounts`/`transactions` reads.
- No figure came from `well_invoke_connector_tool` or any provider-specific tool (Pennylane, Qonto, QuickBooks, Xero, …) — all numbers trace back to `well_get_cost_structure` / `well_query_records`.
- The grouping `well_get_cost_structure`'s `rung` field reported was stated as what actually produced the categories. If `rung` is ever absent from the response, fall back to stating the 4-rung fallback order (ledger account → category → transaction type → "Uncategorised") without claiming which one was used, rather than guessing.
- Which connector categories (banking, accounting) are connected versus missing was stated from `connect-tools`' hand-off, so the user knows whether the picture is complete or partial.
- If the user asked for a window other than the latest closed month, that limitation was stated plainly rather than silently substituted.
- Any `hints` `well_get_cost_structure` returned (e.g. uncategorized-spend coverage) were disclosed, not presented as if the category ranking were unconditionally complete.
- Accounts payable only includes invoices where the workspace is the receiver, not the issuer.
- `own_company` was read, not inferred. If it was null, absent from the schema, or ambiguous, the user was asked — it was never derived from the workspace's name, logo, slug, or email domain, and an absent field was not treated as license to guess.
- Duplicate company records (legal-form prefixes/suffixes, punctuation, accents) were checked with two-directional normalized containment and confirmed with the user before being folded into the own-company identity — not merged silently, and not missed by testing containment one way only.
- Null-`receiver_company_id` invoices were split on the issuer before reporting: own-company issuer routed to receivables and excluded, external issuer ranked in the table as a labeled row, both-null reported as a separate unsplit line. None of them entered the payable headline unexamined.
- Invoices whose issuer equals their receiver were kept out of the payable total and noted once, not ranked as bills.
- Unpaid status came from `payment_status`, not lifecycle `status`. A `status: paid` / `payment_status: unpaid` combination was treated as normal connector behavior, not as grounds for discrediting the payables section.
- Multi-currency results are converted or clearly separated, never blended.
- Every number carries a currency and an as-of date.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"Where is our money actually going, and what are the biggest bills we still owe?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; call `well_get_cost_structure()` for the top 5 expense categories (latest closed month), pull the top 5 unpaid payable invoices sorted by amount, and present both as a short labeled summary with currency and as-of date. If the workspace has no connected data source, respond with install links instead of numbers.

### Example request

"Where did our money go this quarter?"

### Expected behavior

Call `well_get_cost_structure()`, then tell the user plainly that the category breakdown covers only the latest closed month today (not a full quarter), present that month's ranking, and offer to run it again for each month in the quarter if they want the fuller picture.

### Example request

"What are the biggest bills I owe?" (asked on a workspace whose schema does not expose `workspaces.own_company` at all, and whose `companies` list holds both "DA SILVA MARLY JOAO" and "EI-DA SILVA MARLY JOAO")

### Expected behavior

Detect in step 5 that the field is absent — not merely null — and ask which company is theirs rather than matching the workspace's name or logo to a `companies` row. Once confirmed, normalize and compare both directions, notice that `"ei-da silva marly joao"` contains `"da silva marly joao"`, and offer the `EI-` record as a candidate alias for confirmation instead of quietly excluding its bills. Query payables against the confirmed pair, then pull the null-`receiver_company_id` invoices and split them on the issuer: an external issuer makes it a bill, so rank it in the table as a labeled row — a €2,680 unattributed bill belongs at the top, not in a caveat under a table whose largest row is €2,647 — while an own-company issuer makes it a stray receivable that must stay out of the payable total entirely. Filter on `payment_status`, and don't hedge the section because rows also carry `status: paid`.

### Example request

"We just connected our bank — what's eating our cash?"

### Expected behavior

Check `workspace_connector_sync_logs`; if the sync is still `in_progress`, tell the user results are partial/pending rather than presenting a misleadingly confident number.
