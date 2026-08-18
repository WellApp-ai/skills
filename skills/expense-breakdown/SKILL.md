---
name: expense-breakdown
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

- Which workspace to use (if they manage more than one in Well).
- How many top categories/vendors to show — default to 5 of each. The category breakdown's window is not user-configurable (see Tooling) — it is always the latest closed month.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — resolve which workspace to query.
- `well_get_cost_structure` — the category breakdown (which expense categories consume the most cash) for the latest closed month. Same deterministic computation the Well app's canvas cost-structure chart renders — a 4-rung fallback ladder (ledger account → transaction category → transaction type → "Uncategorised"), never LLM-estimated. Call this directly; do not re-derive categories yourself from raw `account_balances`/`ledger_accounts`/`transactions` reads. It has no window parameter — it always answers for the latest closed month, not a user-chosen quarter/range.
- `well_query_records` — read `workspace_connectors` (data-presence check), `workspaces` (for `own_company`), `companies` (to fold in duplicate records of the own company), `invoices` (for the accounts-payable half of this skill, which `well_get_cost_structure` does not cover), and `exchange_rates`.
- `well_get_schema` — call this before querying `invoices`/`workspaces`; field names and semantics are workspace/connector-dependent, never assume them. Note that no MCP tool writes to `workspaces` — `own_company` is read-only from this skill, so it can be confirmed for a run but never persisted.
- `well_list_connectors` — surface install links when the workspace lacks data.
- Well's OAuth / Dynamic Client Registration (DCR) flow — if no Well MCP connection exists yet, most hosts trigger this automatically when the Well MCP server is added (it exposes standard OAuth discovery + DCR, no manual client secret needed). If your host exposes a dedicated `authenticate` tool for the Well connector, call that instead.

**Never fetch the underlying financial data from a third-party provider directly.** Every number in this skill's answer comes from `well_get_cost_structure` and `well_query_records` — Well's own synced, normalized financial graph. Do not call `well_invoke_connector_tool`, and do not call any provider-specific tool (Pennylane, Qonto, QuickBooks, Xero, …) to pull ledger lines, transactions, or invoices yourself, even when such a tool is listed as available. Well has already synced and normalized this data; bypassing it produces figures that disagree with what the Well app itself shows the user.

## Workflow

1. **Confirm the MCP server is configured.** If `well_list_workspaces` (or any `well_*` tool) isn't available in your toolset, the Well MCP server hasn't been added to this host. Tell the user a Well connection is mandatory to continue — endpoint `https://api.wellapp.ai/v1/mcp` — because Well is where their financial data is aggregated securely to compute a real spend breakdown; without it there's nothing to break down. Stop until it's there; don't estimate from assumptions.

2. **Confirm the account.** Attempt `well_list_workspaces()`.
   - If the call fails with an auth error, no Well MCP connection exists yet — start the Well connector's OAuth/DCR flow (via the host's connector authentication, or the Well connector's `authenticate` tool if present). The moment that flow returns, immediately retry `well_list_workspaces()` yourself in the same turn and continue — don't stop to ask the user to confirm they've logged in or wait for a new message.
   - If it returns one workspace, use it. If more than one workspace exists, ask the user which one to use, and use that single workspace for the rest of this skill. Never query or merge data across multiple workspaces in one run.

3. **Verify the workspace has enough data.** Query `workspace_connectors` (fields: `status`, `connector.name`, `connector.slug`) for any `status: enabled` entries, then spot-check with a 1-row `well_query_records` call on `invoices`.
   - If no connector is enabled, call `well_list_connectors()` and present the top 2-3 `install_url` links (banking and accounting connectors first), and stop here until one is connected — there is nothing to break down yet. Once a connector shows as connected, immediately re-run this check yourself and continue through the rest of the workflow — don't wait to be re-prompted or ask the user to restate the request.
   - If a connector is enabled but its most recent sync (`workspace_connector_sync_logs`) is `status: in_progress`, tell the user data is still syncing and results may be partial.

4. **Get the category breakdown.** Call `well_get_cost_structure()`. It returns `entries` (`category`, `amount`, `pct`, sorted by amount descending), `currency`, and `rung` (which grouping actually produced these categories — `ledger_account`, `category_normalized`, `transaction_type`, or `uncategorised`) for the latest closed month.
   - If the user asked for a different window ("this quarter", "last 3 months"), say plainly that the category breakdown only covers the latest closed month today, rather than silently substituting or fabricating a wider range.
   - If `hints` are present (e.g. a coverage caveat about uncategorized spend), disclose them alongside the ranking rather than presenting it as unconditionally complete.
   - If the call errors or returns no entries, treat this the same as step 9's fallback below.

5. **Resolve `own_company` — never infer it.** Call `well_get_schema({ root: "workspaces" })`, then read `workspaces.own_company` on the resolved workspace. Treat all three of these as **unresolved**, not just the null case:
   - the relation is `null`;
   - the field is **absent from the schema entirely** — some workspaces don't expose it, and an absent field is not permission to work around it;
   - it resolves to more than one plausible company.

   When unresolved, ask the user which company in Well is theirs and use their answer **for this run only**. Never infer it from the workspace's name, title, logo, slug, or email domain — a workspace named after its owner is a coincidence, not a record, and a wrong pick silently swaps payables for receivables. No MCP tool can persist `own_company`; if the user wants it set permanently, point them at their workspace in the Well app (`<well-app-base-url>/workspaces/<workspace_id>`), where the own-company picker writes it, and say plainly that until then every run will ask again. If the user declines to confirm, skip the payable/receivable split and report gross unpaid invoices instead, labeled as unsplit.

6. **Fold in duplicate company records.** One legal entity often has several `companies` rows, differing only by a legal-form prefix or suffix (`EI-`, `SARL`, `SAS`, `SA`, `Ltd`, `GmbH`), punctuation, or accents. Once `own_company` is resolved, query `companies` and compare each name against it after normalizing both sides identically: Unicode NFD, strip combining marks, lowercase, trim. Treat a pair as a candidate alias when **either** normalized name contains the other — containment is directional, so test both ways (`"ei-da silva marly joao"` contains `"da silva marly joao"`, but not the reverse; testing one direction only misses the alias). Candidates are *proposed*, never merged silently: list them, take an explicit yes, then treat the confirmed set as one identity for every `own_company` comparison in this run. Mention the duplicate as a data-quality issue worth fixing in Well — do not call `well_update_company`/`well_delete_company` to merge records yourself.

7. **Get the biggest accounts payable.** Call `well_get_schema({ root: "invoices" })` (always, even if queried earlier in the session for a different purpose — field behavior varies by connector). Query `invoices` where `receiver_company_id` matches the confirmed own-company identity set and `payment_status` is `unpaid` or `partial`, `orderBy: { field: "grand_total", direction: "desc" }`, limited to the requested count. Include `issuer.name`, `grand_total`, `balance_due`, `local_currency`, `due_date`.
   - **`payment_status` is authoritative** for whether money is still owed. Lifecycle `status` is a separate dimension, and some connectors emit rows carrying `status: paid` alongside `payment_status: unpaid` — that combination is normal for those sources, not a data fault. Filter on `payment_status`; note the mismatch once in a clause if it's widespread, but do not discredit the whole payables section over it.
   - **Don't let an equality filter hide rows.** A filter on `receiver_company_id` silently drops invoices where it is `null`. Query that bucket separately and rank it *inside* the main table as a labeled row ("unattributed — counterparty not recorded"), not as a footnote: an unattributed bill can easily outrank everything else, and burying the largest item under the table makes the ranking wrong. Handle invoices whose issuer and receiver are the same company the same way — surface them labeled, don't drop them.

8. **Normalize currency.** If results span more than one `local_currency`, either convert to one base currency via the `exchange_rates` root or report totals per currency — never blend currencies silently.

9. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "Where does my money go?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- Which month the category breakdown covers (the latest closed month — say so explicitly if the user asked for a different window) and which connector(s)/sync the accounts-payable numbers came from.
- Top expense categories with amount, currency, and share of total spend (`entries[].pct` from `well_get_cost_structure`, straight from the tool — not recomputed). This is a comparison across categories, so lead with a horizontal bar chart and back it with the exact figures; don't stop to ask table-or-chart first.
- Top accounts payable: vendor, amount, currency, due date. Any unattributed or self-referencing invoices belong in this ranking as labeled rows, not in a caveat below it.
- A one-line note that the category breakdown is the same computation the Well app itself renders, not a skill-side estimate, plus any coverage `hints` `well_get_cost_structure` returned (e.g. uncategorized spend). State which grouping actually produced it, straight from `rung`: "by ledger account" (`ledger_account`), "by Well's category" (`category_normalized`), "by transaction type" (`transaction_type`), or "uncategorised" (`uncategorised`) — not the full 4-rung fallback order, just the one the tool reports.
- Whether the picture is complete: which relevant connector categories (banking, accounting) are connected versus still missing, so the user knows whether this reflects their full spend or a partial view gated by what's connected today.
- A one-line pointer to `bills-due` for a date-ordered view of when the biggest payables come due.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 9's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- A Well workspace was resolved unambiguously (not guessed when multiple existed).
- Data presence was checked, not just connector "enabled" status.
- `well_get_schema` was called before querying `invoices`/`workspaces` for the first time.
- Category totals came straight from `well_get_cost_structure`, not re-derived from raw `account_balances`/`ledger_accounts`/`transactions` reads.
- No figure came from `well_invoke_connector_tool` or any provider-specific tool (Pennylane, Qonto, QuickBooks, Xero, …) — all numbers trace back to `well_get_cost_structure` / `well_query_records`.
- The grouping `well_get_cost_structure`'s `rung` field reported was stated as what actually produced the categories. If `rung` is ever absent from the response, fall back to stating the 4-rung fallback order (ledger account → category → transaction type → "Uncategorised") without claiming which one was used, rather than guessing.
- Which connector categories (banking, accounting) are connected versus missing was stated, so the user knows whether the picture is complete or partial.
- If the user asked for a window other than the latest closed month, that limitation was stated plainly rather than silently substituted.
- Any `hints` `well_get_cost_structure` returned (e.g. uncategorized-spend coverage) were disclosed, not presented as if the category ranking were unconditionally complete.
- Accounts payable only includes invoices where the workspace is the receiver, not the issuer.
- `own_company` was read, not inferred. If it was null, absent from the schema, or ambiguous, the user was asked — it was never derived from the workspace's name, logo, slug, or email domain, and an absent field was not treated as license to guess.
- Duplicate company records (legal-form prefixes/suffixes, punctuation, accents) were checked with two-directional normalized containment and confirmed with the user before being folded into the own-company identity — not merged silently, and not missed by testing containment one way only.
- Invoices with a null `receiver_company_id`, or with issuer equal to receiver, were surfaced as labeled rows ranked inside the payables table — not dropped by the equality filter, and not demoted to a footnote below it.
- Unpaid status came from `payment_status`, not lifecycle `status`. A `status: paid` / `payment_status: unpaid` combination was treated as normal connector behavior, not as grounds for discrediting the payables section.
- Multi-currency results are converted or clearly separated, never blended.
- Every number carries a currency and an as-of date.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"Where is our money actually going, and what are the biggest bills we still owe?"

### Expected behavior

Resolve the workspace, confirm at least one connector has synced data, call `well_get_cost_structure()` for the top 5 expense categories (latest closed month), pull the top 5 unpaid payable invoices sorted by amount, and present both as a short labeled summary with currency and as-of date. If the workspace has no connected data source, respond with install links instead of numbers.

### Example request

"Where did our money go this quarter?"

### Expected behavior

Call `well_get_cost_structure()`, then tell the user plainly that the category breakdown covers only the latest closed month today (not a full quarter), present that month's ranking, and offer to run it again for each month in the quarter if they want the fuller picture.

### Example request

"What are the biggest bills I owe?" (asked on a workspace whose schema does not expose `workspaces.own_company` at all, and whose `companies` list holds both "DA SILVA MARLY JOAO" and "EI-DA SILVA MARLY JOAO")

### Expected behavior

Detect in step 5 that the field is absent — not merely null — and ask which company is theirs rather than matching the workspace's name or logo to a `companies` row. Once confirmed, normalize and compare both directions, notice that `"ei-da silva marly joao"` contains `"da silva marly joao"`, and offer the `EI-` record as a candidate alias for confirmation instead of quietly excluding its bills. Query payables against the confirmed pair, pull the null-`receiver_company_id` invoices as their own labeled rows, and rank everything in one table — so a €2,680 unattributed bill sits at the top where it belongs rather than in a caveat under a table whose largest row is €2,647. Filter on `payment_status`, and don't hedge the section because rows also carry `status: paid`.

### Example request

"We just connected our bank — what's eating our cash?"

### Expected behavior

Check `workspace_connector_sync_logs`; if the sync is still `in_progress`, tell the user results are partial/pending rather than presenting a misleadingly confident number.
