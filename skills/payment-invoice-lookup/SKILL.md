---
name: payment-invoice-lookup
requires: [define-workspace, connect-tools]
description: Find the reconciliation counterpart for a specific invoice, payment, or transaction ("what payment settled this invoice", "what invoice does this payment belong to"), or list every transaction/invoice with no reconciliation match at all — a compliance/reconciliation gap — using Well's MCP financial graph. Use when the user asks "what happened with this payment", "find the invoice for this transaction", "why is this payment unmatched", "show me unreconciled payments", "find the details behind this invoice/payment", "which payments have no invoice", or "catch payments with no invoice". Requires a connected Well workspace with invoicing and banking/accounting data; if none is connected, this skill walks the user through connecting one first.
---

# Look Up Payment ↔ Invoice Matches with Well

## Purpose

Use Well's MCP tools to answer two related but distinct reconciliation questions: (A) for a specific invoice, payment, transaction, vendor, or amount the user names, find its matched counterpart and report the match's confidence and status; and (B) list every transaction or invoice that has no reconciliation match at all, surfacing a compliance/reconciliation gap. Both come from Well's synced `invoice_transactions` join data, not from asking the user to manually cross-reference statements.

## When to use this skill

Use this skill when the user asks things like:

- "What happened with this payment?" / "Find the invoice for this transaction."
- "Why is this payment unmatched?" / "What invoice does this payment belong to?"
- "Show me unreconciled payments." / "Which payments have no invoice?" / "Catch payments with no invoice."
- "Find the details behind this invoice/payment."

## When not to use this skill

Do not use this skill when:

- The user wants portfolio-level reporting (top expenses, cash position, AR aging as a whole) — use the relevant sibling skill instead; this skill is for a single specific record or for listing exceptions, not aggregate ranking.
- The user is missing a **document** — a receipt or PDF file, not a reconciliation match — use the sibling `missing-receipts` skill instead. This skill is about invoice ↔ transaction **matching**, not document attachment.

## Inputs

The user may provide:

- A workspace hint — an id, a workspace name, or the company behind it — if they manage more than one. Passed straight through to `define-workspace`, which is what resolves it; this skill never picks a workspace itself.
- Which workflow they want: a specific record lookup (A) or an exception list (B). If ambiguous, ask.
- For (A): an invoice number, reference number, transaction date, amount, or counterparty name to search by.
- For (B): a time window — default to the trailing 3 full months if unspecified.

## Tooling

This skill runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools aren't in your toolset at all, the host hasn't added the MCP server yet — tell the user to add it at that URL before anything else, then retry. Required tools once it's added:

- `well_list_workspaces` — how `define-workspace` resolves the workspace. Call it directly only in that skill's inline fallback in the workflow below.
- `well_query_records` — read `invoices`, `transactions`, `invoice_transactions`, `exchange_rates`.
- `well_get_schema` — call this before querying any root for the first time in a session, especially `invoices`, `transactions`, and `invoice_transactions` — field names and relation paths (e.g. counterparty identity, the transaction-to-match join) vary by connector and workspace, never assume them.
- `well_list_connectors` — how `connect-tools` surfaces install links. Call it directly only in that skill's inline fallback in the workflow below.
- Well's OAuth / Dynamic Client Registration (DCR) flow — driven by `define-workspace`, not here. Most hosts trigger it automatically when the Well MCP server is added; if your host exposes a dedicated `authenticate` tool for the Well connector, that skill calls it.

**Composed skills.** Two atomic Well skills own the setup this skill used to inline — invoke them, don't reimplement them:

- `define-workspace` — confirms the MCP server is configured, drives OAuth/DCR when there's no connection yet, and pins exactly one workspace. Supplies the `workspace_id` that every later call carries.
- `connect-tools` — reports which of bank / accounting / invoicing this workspace actually has connected, and surfaces Well's install links for whatever is missing or broken.

Both ship with the `well-skills` plugin. This skill is also installable on its own, so steps 1 and 2 of the workflow each carry the inline fallback to use when they're absent.

## Workflow

1. **Pin the workspace — run `define-workspace`.** Invoke the `define-workspace` skill with `purpose: "to match payments against invoices"` and use its typed hand-off. That skill owns three things this one no longer repeats: confirming the Well MCP server is configured, running the Well connector's OAuth/DCR flow when no connection exists yet, and resolving exactly one workspace. Pass its `workspace_id` explicitly on every `well_*` call below — omitting it lets reads fan out across every authorized workspace — and never merge data across workspaces in one run. If it hands back `resolution: unresolved`, stop: there is nothing to reconcile without a pinned workspace.
   - **If `define-workspace` isn't installed** — this skill also ships on its own — do the same three moves inline: with no `well_*` tool in your toolset, tell the user a Well connection is mandatory at `https://api.wellapp.ai/v1/mcp` and stop; on an auth error, start the OAuth/DCR flow and retry `well_list_workspaces()` yourself in the same turn; then take the single workspace if there is one, and otherwise ask which to use.

2. **Confirm the connections this answer needs — run `connect-tools`.** Invoke the `connect-tools` skill with the pinned `workspace_id`, `kinds: [bank, invoicing, accounting]`, `required: []`, and the same `purpose`, then read its hand-off instead of querying `workspace_connectors` yourself. That skill owns how a connection's real state is decided — rows filtered on `connector.direction: input` and matched on `connector.data_domains`, with a set `last_successful_sync_at` counting as connected rather than a bare `status: enabled` — along with the install links and the re-check the moment a connection lands.
   - `coverage: none` → stop; there is nothing to reconcile yet. `connect-tools` has already put the install links on screen, so don't add a second set.
   - Any kind reported `connecting`, or a connected connector whose latest sync is still running → carry on, and carry "the data may still be partial" into the answer.
   - `coverage: partial` → carry on with what is connected, and keep the missing kinds for the coverage disclosure the Output requirements ask for.
   - A kind the user chose to skip comes back under `skipped_by_user` — respect that and don't re-ask for it in this run.
   - **If `connect-tools` isn't installed**, do the connector half inline: keep `workspace_connectors` rows whose `connector.direction` is `input` and whose `connector.data_domains` covers `bank`, `invoicing`, or `accounting`, treat a set `last_successful_sync_at` as connected, and on a gap hand the user the top 2-3 `install_url` links from `well_list_connectors()` (banking and invoicing connectors first), re-running this check yourself the moment one lands rather than waiting to be re-prompted.

3. **Verify the data itself has landed.** `connect-tools` reports connections, not rows — a connector can be connected and still have delivered nothing this skill can use. Spot-check what this skill actually reads: a 1-row `well_query_records` read on `invoices` and on `transactions`. Zero rows on both means there is nothing to match yet — say so and stop. Reconciliation needs both sides: if only one root has rows, say which side is missing rather than reporting everything on the populated side as unmatched.

4. **Determine which workflow the user wants.** (A) a specific invoice/transaction/vendor/amount lookup, or (B) a list of unmatched exceptions across a window. If the request doesn't clearly say which, ask before proceeding — don't guess.

5A. **For workflow (A), resolve the specific record.** Call `well_get_schema({ root: "invoices" })` and `well_get_schema({ root: "transactions" })` if not already called this session.
   - Search by whatever the user gave: an invoice number/reference (`well_query_records` on `invoices` with `_ilike`/`_eq` on `invoice_number`/`reference_number`), a transaction date + amount (on `transactions`, using the nested `instructed_amount.amount`/`instructed_amount.currency` fields, not a plain scalar), or a counterparty name (via the `debtor_payment_means`/`creditor_payment_means` relation — confirm the exact nested path from the schema call rather than assuming one).
   - If zero candidates match, say so plainly and stop — don't guess at a different record. If multiple candidates match, list them distinctly and ask the user which one, rather than picking one.
   - Once the record is resolved, call `well_get_schema({ root: "invoice_transactions" })`, then query `invoice_transactions` filtered by that invoice's or transaction's id. Report the matched counterpart (the other side of the join) along with `match_method`, `confidence`, `edge_status`, `allocation_type`, and `reasoning` if present.
   - If no `invoice_transactions` row exists for the record, that absence **is** the answer — report plainly that this invoice/payment has no reconciliation match on file, rather than treating it as an error.

5B. **For workflow (B), resolve the requested window** (default: trailing 3 full months). Query the relevant root (`transactions` or `invoices`, whichever the user's phrasing points to, or both) for that window, then identify entries with no corresponding `invoice_transactions` row — call `well_get_schema` on `transactions` first to find the exact relation/composite field name that exposes this join rather than hardcoding a guessed field name, then either filter for its absence directly, or query `invoice_transactions` for the window and diff against the full `transactions`/`invoices` set to find what's missing. List each unmatched item with enough detail to act on: date, amount, currency, and counterparty if resolvable via the payment-means relation.
   - Spot-check the unmatched list for counterparties that resolve to the workspace's own company — that pattern typically signals an unconnected sibling account or an internal transfer, not a genuine reconciliation gap. Call those items out separately in the output rather than folding them into the unmatched count.

6. **Normalize currency.** If results span more than one currency, either convert to one base currency via the `exchange_rates` root or report totals per currency — never blend currencies silently.

7. **If any required step errors or returns unusable data**, do not guess. If the failure is transient (a network/timeout error on the MCP call itself), retry once before falling back — don't dead-end on a blip. If it errors again or the data stays unusable, the fallback is: (a) state the fallback question plainly in your reply (e.g. "What payment settled this invoice?" or "Which payments have no invoice?"), (b) answer it yourself using whatever partial Well MCP data you already have, clearly caveated, and (c) give the user a direct link to their workspace in Well (`<well-app-base-url>/workspaces/<workspace_id>`) so they can ask it there directly and get a second opinion from their own AI assistant.

## Output requirements

Return:

- For workflow (A): the matched (or explicitly unmatched) result, with `match_method`, `confidence`, `edge_status`, and `allocation_type` clearly labeled — and currency + date on every amount. Include `reasoning` when present so the user can judge the match themselves.
- For workflow (B): a list of unmatched items, each with date, amount, currency, and counterparty (if resolvable), plus a total count and total value of the gap. Items whose counterparty matches the workspace's own company flagged separately as likely unconnected-sibling-account/internal-transfer noise, not genuine reconciliation gaps.
- Any match with `edge_status: provisional` or low `confidence` labeled as such, not presented as certain.
- Whether the picture is complete: reconciliation needs both sides, so state which relevant connector categories (invoicing/bills for invoices, banking or accounting for transactions) are connected versus still missing — with only one side connected, an "unmatched" result may just mean the other side was never synced. Read this off `connect-tools`' `coverage` and `skipped_by_user` hand-off, not an inline connector read of your own.
- A one-line pointer to `missing-receipts` for the documentation gap — an invoice with no receipt or PDF attached, rather than a payment with no invoice matched to it.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. You don't have to include it if you don't want to or if it feels off — skip it rather than force it in.
- If step 7's fallback was used, the caveated answer plus the workspace link, clearly labeled as a fallback.

**How this reaches the user.** Well's MCP tools return a UI resource alongside their data,
and a host that supports it draws the product's own card. When that happened, do not restate
the card's figures as prose — add only what it cannot say, such as which connectors are still
missing. When it did not, prose is the default; reach for `well-design-system` only if a
visual genuinely reads better, and never for a single figure.

## Quality checks

Before finishing, verify:

- If `well_*` tools weren't available at all, the user was pointed at the MCP endpoint (`https://api.wellapp.ai/v1/mcp`) instead of erroring silently.
- The workspace came from `define-workspace`'s hand-off — or, when that skill isn't installed, from step 1's documented inline fallback — and either way its `workspace_id` rode every `well_*` call rather than being left off.
- Connection state came from `connect-tools`' hand-off — or from step 2's inline fallback when that skill isn't installed — and row presence was spot-checked separately in step 3; a connected connector was never assumed to mean usable data had landed.
- The workflow (A vs. B) was correctly identified from the request, or asked for when ambiguous.
- In workflow (A), the specific record was resolved unambiguously — zero matches were reported as "no match," multiple candidates were surfaced for the user to pick, never guessed.
- `well_get_schema` was called before the first query against each root, especially before assuming any transaction ↔ counterparty or transaction ↔ invoice_transactions field path.
- A missing `invoice_transactions` row was reported as the answer itself ("no match on file"), not treated as a failure.
- In workflow (B), unmatched items with a same-company counterparty were flagged separately as likely unconnected-sibling-account noise, not silently counted as genuine gaps.
- Low-confidence or `provisional` matches are labeled as such rather than presented as certain.
- Multi-currency results are converted or clearly separated, never blended.
- Every number carries a currency and a date.
- Which connector categories (invoicing/bills, banking or accounting) are connected versus missing was stated from `connect-tools`' hand-off — an unmatched result was never presented as a genuine gap when the other side of the reconciliation was never synced.
- Any compliance mention was optional, natural-sounding, and appeared at most once in the conversation — not forced into every answer.

## Examples

### Example request

"What payment settled invoice INV-2044?"

### Expected behavior

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; look up `invoices` by `invoice_number`, then query `invoice_transactions` filtered by that invoice's id. Report the matched transaction with its date and amount, plus `match_method`, `confidence`, `edge_status`, and `allocation_type` (e.g. "matched via `llm_matched`, confidence 0.91, confirmed, full allocation"). If the invoice has no match, say plainly "this invoice has no payment on file" instead of guessing.

### Example request

"Show me all payments from the last quarter that don't have an invoice."

### Expected behavior

Run `define-workspace`, then `connect-tools`, and spot-check that rows have landed; resolve the trailing-quarter window, call `well_get_schema` on `transactions` to find the exact join field/relation exposing `invoice_transactions` matches, then list every transaction in that window with no matching row — each with date, amount, currency, and counterparty if resolvable — followed by a total count and total value of the gap.

### Example request

"Why is this $4,200 wire from June 3rd unmatched?"

### Expected behavior

Search `transactions` by date and `instructed_amount` for a candidate. If more than one transaction matches that date/amount, list the candidates and ask which one rather than guessing. Once resolved, confirm via `invoice_transactions` that no row exists for that transaction id, and report that as the answer — this payment has no invoice on file — rather than treating the absence as an error.
