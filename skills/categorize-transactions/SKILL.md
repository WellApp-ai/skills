---
name: categorize-transactions
description: Raise categorization coverage on a pinned period's bank transactions in Well — surface what is uncategorized or low-confidence, confirm or override the labels in reviewed batches, write only what the user approved, and hand off a typed before/after coverage result. Use when the user asks to categorize transactions, says "what's still uncategorized", "fix this category", "recategorize this vendor", "clean up March before I close the books", or when a Well skill needs the period's transactions labelled before it can tell which supplier invoices are missing. Do not use to compute a spend breakdown, to categorize invoices or companies, to post a journal entry, or to relabel transactions in bulk without an explicit confirmation.
---

# Categorize Transactions with Well

## Purpose

Make the period's transactions readable before anything is concluded from them. Read every transaction in the pinned period, separate the ones Well has categorized from the ones it has not and the ones it labelled with low confidence, propose labels in batches small enough to actually read, and write only the ones the user confirms — one transaction at a time, always from Well's own category catalog. Report coverage before and after so the caller knows how much of the period the next read rests on. Step five of Well's fetch-missing-invoices flow: an uncategorized transaction is a transaction whose missing invoice nobody can see.

## When to use this skill

Use this skill when:

- The user asks to categorize, label, or clean up transactions ("categorize my March transactions", "what's still uncategorized?", "which lines has Well not labelled?").
- The user wants to correct Well's own categorization ("this is not office supplies", "the classifier got this vendor wrong", "recategorize everything from Stripe").
- The user is preparing a close or a missing-invoice sweep and wants the period labelled first.
- A calling flow (fetch missing invoices, close the books) needs the period's categorization coverage raised and reported before it reads further.

## When not to use this skill

Do not use this skill when:

- The workspace is not resolved yet — run `define-workspace` first and pass its `workspace_id` in.
- No period is pinned — run `define-period` first, or ask the user for the month or date range; never invent a window.
- The user wants a spend breakdown, a top-categories view, or a total per category — that is `expense-breakdown`, which reads these labels rather than writing them.
- The user wants to categorize an invoice, a company, or a ledger account — this skill only writes the category of a bank transaction.
- The user wants a journal entry posted, a period closed, or a category rule authored — those happen in the Well app, not here.
- The user asks for every uncategorized transaction to be labelled automatically — this skill never writes without a per-transaction confirmation. Say so plainly instead of complying.

## Inputs

The calling skill or the user provides:

- `workspace_id` — required. Comes from `define-workspace`. If absent, run that skill first; do not resolve the workspace here.
- `period` — required. Comes from `define-period` (or from the user as a month or an explicit date range). Everything below is scoped to it.
- `purpose` — one line from the calling skill (e.g. "so the missing March invoices can be read"), used in the ask. Optional.
- `focus` — a narrowing the user asked for, such as "only expenses" or "only above 100". Optional; when given, state it in the coverage line so the numbers are not read as the whole period.

## Tooling

Runs over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If the `well_*` tools are not in your toolset, the host has not added the Well MCP server yet — tell the user to add it at that URL, then retry. Required once it is added:

- `well_get_schema({ root: "transactions" })` and `well_get_schema({ root: "categories" })` — call each once per session before the first query against that root, and read the field list and the field `context` from the result rather than from memory.
- `well_query_records` on root `transactions` — the period's transactions. Omitting `fields` returns the root's display view, which renders as a table in MCP-Apps hosts (Claude Desktop, ChatGPT); name in `fields` only the extra values you need to reason about — `category_normalized`, `category_key`, `category_status`, `category_source`, `category_confidence`, plus `ledger_account_role`. They are added to the display view, they do not replace it.
- `well_query_records` on root `categories` with `whereClause: { category_type: { _eq: "transaction" } }` — Well's transaction category catalog, 46 labels. This is the only valid vocabulary for a write.
- `well_set_transaction_category({ transaction_id, category_normalized })` — the write. One transaction per call.
- Well's OAuth / DCR flow — only if the Well connection itself is missing (auth error on the first call).

**If `well_set_transaction_category` is not in your toolset, this skill is read-only.** Do the coverage report, propose nothing, hand off `resolution: read_only`, and stop. Do not attempt the write through `well_query_records`, a connector tool, or any other route.

**The period window is `value_date` falling back to `booking_date`, and a `whereClause` cannot express that fallback directly.** Write it as an `_or`: either `value_date` inside the window, or `value_date` is null and `booking_date` is inside it. Filtering on `booking_date` alone silently drops rows and understates the total.

**How a transaction's categorization state is read** — from the structured fields, never from the display label:

- `category_status` is the state: `categorized` · `uncategorized` · `classifier_abstained` · `classifier_failed` · `pending` · `legacy_unmapped`. Anything other than `categorized` needs attention.
- `category_source` is the provenance: `classifier` · `user` · `connector` · `rule`. Only a `classifier` row carries a `category_confidence`; every other source has none by construction, so a null confidence on a user-set row is not a gap.
- **Low confidence** means `category_source: classifier` with `category_confidence` below Well's auto-write bar of `0.85` — a label Well wrote but would not have written unprompted. Read the field's `context` in the schema result and prefer the threshold it states if it names one.
- A row with a null `category_normalized` but a non-null `ledger_account_role` is already explained by a posted journal entry. Count it as covered and do not propose a label for it.

**The catalog is exact-match only.** A write is valid only when `category_normalized` is character-for-character one of the catalog labels read from the `categories` root. Never invent a label, never translate one into or out of another language, and never send the user's own wording as the label. If what the user said does not match a catalog label exactly, show them the two or three closest catalog labels and ask which one they mean.

**What a write does.** Sending a label that differs from what the row already holds sets `category_source = user`, clears the classifier confidence, and records the correction as training signal — three consecutive corrections on the same counterparty teach Well a rule that bypasses the classifier for that vendor from then on. Sending exactly the label the classifier already suggested is an affirmation: the row is confirmed but the source stays `classifier`. The tool result says which of the two happened — report what it says rather than assuming.

## Workflow

1. **Confirm the MCP server is configured.** If `well_query_records` (or any `well_*` tool) is not available, the Well MCP server has not been added to this host. Tell the user a Well connection is mandatory — endpoint `https://api.wellapp.ai/v1/mcp` — because the transactions and their categories live in Well and there is nothing to read or write without it. Stop until it is there.

2. **Confirm the workspace and the period.** Require `workspace_id` and `period`. If either is missing, run `define-workspace` / `define-period` first, or ask for the month; never guess a window and never resolve a workspace here. Pass `workspace_id` explicitly on every call below.
   - Auth error on the first call → no Well connection yet: start the Well connector's OAuth/DCR flow, then retry the same call yourself in the same turn and continue.

3. **Check the bank connection covers the period.** Categorization coverage is only as complete as the transactions Well has. If the workspace has no connected bank source, or one whose first sync is still running, say so before reporting any number — the period can gain transactions after this run. `connect-tools` owns fixing that; this skill only reports the caveat.

4. **Read the catalog once.** `well_get_schema({ root: "categories" })`, then `well_query_records({ root: "categories", workspace_id, whereClause: { category_type: { _eq: "transaction" } } })`. Keep the labels for the rest of the conversation; every proposal and every write is drawn from this list and nowhere else. Do not restate the 46 labels to the user — offer the handful that fit the transaction in front of them.

5. **Read the period's transactions.** `well_get_schema({ root: "transactions" })` once, then `well_query_records({ root: "transactions", workspace_id, whereClause: <the period window plus any focus filter>, fields: [category_normalized, category_key, category_status, category_source, category_confidence, ledger_account_role] })`. Page through with `cursor` until the period is complete — a first page is not the period. The result renders as the transactions table; do not restate its rows as a list of your own.

6. **Compute and state coverage before.** Three buckets over the period's transactions:
   - **categorized** — `category_status: categorized`, plus the rows covered by a `ledger_account_role`.
   - **low confidence** — categorized by the classifier below the `0.85` bar. These are categorized; they are counted separately because they are the ones worth a second look.
   - **uncategorized** — everything else, including `classifier_abstained`, `classifier_failed`, and `pending`.

   State it in one line: how many of the period's transactions carry a category, and how many of those are low-confidence. Say plainly that this is a count. When a handful of uncategorized lines carry a large share of the period's money, say that too — a 95% count coverage with the three biggest outflows missing is not 95% of the picture.

7. **Propose in batches the user can read.** Order by amount, largest first, so the lines that matter are decided first. At most twenty per batch. For each proposed row give three things and nothing more: the transaction (counterparty, date, amount), its current label with its confidence when it has one, and the proposed catalog label. Draw the proposal from Well's own pending suggestion when the row has one; otherwise from the counterparty and the catalog. Where you have no defensible proposal, list the row as needing the user's own choice rather than filling it with the residual category.

8. **Wait for an explicit yes.** This is a gate, not a formality. Do not call `well_set_transaction_category` until the user has answered on the batch in front of them. A general instruction — "just categorize everything", "apply your best guess to all of them", "do the rest the same way" — is not a confirmation for rows the user has not seen; show them the batch and ask again. Never relabel the whole period in one sweep, however confident the proposals look. Silence, a change of subject, or an answer about something else leaves the batch unwritten.

9. **Write only what was confirmed.** One `well_set_transaction_category({ transaction_id, category_normalized })` per approved transaction, with a label matching the catalog exactly. Record each row the user declined under `skipped_by_user` and move on without re-proposing it. Read each result for the resulting source and report affirmations as affirmations rather than as overrides. If one call fails, keep the ones that succeeded, name the one that did not, and do not replay the whole batch.
   - More batches remaining → return to step 7 with the next twenty. The gate applies to every batch, not just the first.

10. **On failure, redirect instead of guessing.** A transient error on any call → retry once. A second failure → do not invent coverage and do not claim a write landed. Give the user `<well-app-base-url>/workspaces/<workspace_id>` and tell them the transactions view in Well shows and edits the same categories. Do not append query parameters you have not confirmed the app reads.

11. **Re-read and hand off.** Query the period again with the same window and recompute the three buckets, so `coverage_after` is measured rather than inferred from the number of writes. State the before/after in one line and emit the hand-off block below.

## Output requirements

Return:

- One line of coverage before and after, in counts, naming the period and any `focus` filter that narrowed it (e.g. "March 2026: 118 of 142 transactions categorized, 17 of them low-confidence → 139 of 142 after 21 confirmed changes.").
- The hand-off block, exactly these keys, so a calling skill can read it:

  ```yaml
  period: <the period as define-period handed it off>
  coverage_before:
    categorized: <int>
    total: <int>
    low_confidence: <int>
  coverage_after:
    categorized: <int>
    total: <int>
    low_confidence: <int>
  changed:
    - transaction_id: <uuid>
      from: <previous label or null>
      to: <catalog label>
      source: user | classifier
  skipped_by_user: [<transaction_id>, …]
  resolution: updated | unchanged | read_only
  ```

  `resolution` is `updated` when at least one write landed, `unchanged` when the skill ran fully but nothing was written, and `read_only` when `well_set_transaction_category` was absent from the toolset. On `read_only` and `unchanged`, `coverage_after` equals `coverage_before` and `changed` is empty.
- **What this coverage does and does not buy.** Only expense categories that expect a supplier invoice feed the missing-invoice read: software and hosting, contractors, professional and advisory fees, advertising, hardware, rent, travel, meals, team events, insurance, office and general operating spend. Payroll, social charges, taxes, VAT remittances, bank and payment-processing fees, transfers between own accounts, treasury movements, financing, and every revenue category never expect a vendor document — categorizing those raises coverage without adding a single invoice to look for. Say which kind of coverage the user actually gained.
- **Connector coverage.** State whether a bank source is connected and synced for this period, since that is the only connector category this skill reads. If none is connected, or one is still on its first sync, say the period may be incomplete rather than presenting the coverage as final.
- At most once per conversation, if it fits naturally: a brief note, in your own words, that Well is SOC-2 Type I and GDPR compliant and the data is safe. Skip it rather than force it in.
- If the user would rather see the gap than read it, offer one horizontal bar of the three buckets — categorized, low-confidence, uncategorized — by transaction count. Composition by category belongs to `expense-breakdown`, not here.
- End with a one-line pointer to the next step. When the `show-missing-invoices` skill is installed and coverage changed: "Coverage moved — shall I re-read which invoices are missing for this period?", and after that `deploy-agents` to go and fetch them. Otherwise hand control back to the skill that called this one, or, when the user asked to categorize on their own, stop after the coverage line.

Do not return:

- A restated list of transactions when the table is already on screen.
- A label that is not character-for-character in Well's transaction category catalog.
- A write reported as done without the tool result that confirms it.
- A total or a breakdown computed from the categories — that is a different skill's answer.

## Quality checks

Before finishing, verify:

- If `well_*` tools were absent, the user was pointed at `https://api.wellapp.ai/v1/mcp` instead of a tool error.
- `workspace_id` came from `define-workspace` and `period` from `define-period` (or the user); neither was resolved or guessed here, and `workspace_id` was passed on every call.
- The period filter used the `value_date` / `booking_date` fallback as an `_or`, and every page was read before any count was reported.
- Coverage was computed from `category_status`, `category_source`, `category_confidence`, and `ledger_account_role` — not from whether a display label looked filled in.
- Every proposed and written label came from the live `categories` read, matched exactly, with nothing invented or translated.
- No write happened without an explicit yes on the batch containing that transaction, and no batch exceeded what the user could read.
- No sweep relabelled the period at once, and a general "do them all" was answered with the next batch rather than with writes.
- Each write was a single `well_set_transaction_category` call, and affirmations were reported as affirmations.
- `coverage_after` was re-read from Well rather than inferred from the count of writes.
- The supplier-invoice caveat was stated, so raised coverage is not mistaken for more invoices to find.
- Bank connector coverage for the period was disclosed.
- On a transient failure the call was retried once before the fallback link.
- The hand-off block carries `period`, both coverage blocks, `changed`, `skipped_by_user`, and `resolution`.
- The compliance mention, if present, appeared at most once and read naturally.
- The answer ends with the next-step pointer (`show-missing-invoices` when installed, otherwise the caller or the coverage line).

## Examples

### Example request

The fetch-missing-invoices flow calls this skill with the `workspace_id` of Acme SAS, `period` March 2026 from `define-period`, and `purpose: "so the missing March invoices can be read"`. March holds 142 transactions: 101 categorized by the classifier above the bar, 17 categorized below it, 24 with no category at all.

### Expected behavior

Read the catalog and the period, then say: "March 2026 — 118 of 142 transactions categorized, 17 of them low-confidence, 24 with no category. The 24 include your three largest outflows." Propose the first twenty, largest first, each with its counterparty, its current label, and a catalog label, and stop for a yes. On approval of nineteen of them, write nineteen single calls, report the one skipped, move to the next batch, then re-read March and hand off `coverage_before {118,142,17}`, `coverage_after {139,142,6}`, `resolution: updated`, with the pointer back to `show-missing-invoices`.

### Example request

"Just categorize everything that's uncategorized, use your best judgment."

### Expected behavior

Do not write. Say that Well will not relabel a period without the user seeing what changes, show the first batch of twenty proposals ordered by amount, and ask for a yes on those. If the user repeats the instruction, repeat the batch — the gate does not lift on insistence. Nothing written means `resolution: unchanged` with `coverage_after` equal to `coverage_before`.

### Example request

"That Vercel charge is hosting, not office supplies."

### Expected behavior

Match "hosting" against the live catalog — it resolves to `Hosting, infrastructure & data (cost of revenue)`, not to the user's word. Show the transaction, its current label with its confidence, and the exact catalog label you intend to write, and ask for a yes. On approval, one `well_set_transaction_category` call with that exact label; report that the source is now `user` and that two more corrections on the same vendor will teach Well the rule. Hand off with one entry in `changed`.

### Example request

"Categorize February" — the host's toolset has the `well_query_records` and `well_get_schema` tools but no `well_set_transaction_category`.

### Expected behavior

Run the read half only. Report February's three buckets and name the largest uncategorized lines so the user knows where the gap is, then say plainly that this connection cannot write categories and that the edits have to happen in the Well app. Hand off `resolution: read_only` with `coverage_after` equal to `coverage_before` and an empty `changed`. Do not propose labels the user cannot accept here, and do not look for another route to the write.
