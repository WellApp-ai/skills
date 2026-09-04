---
name: categorize-counterparties
description: Raise category coverage on the counterparties behind one Well workspace's spend by rendering Well's counterparties card, where every pick saves itself, and hand off a typed coverage result. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "so every vendor behind the month's spend carries a category"
  periods: "March 2026"
---

The counterparties card is the categorization tool — not you. One `well_list_counterparties` call renders the card; every row it lists carries a category select fed by Well's shared catalog; each pick the user makes in a row's select writes that company's category immediately, through the card's own `well_update_company` call; and the card's Continue button is how the user hands the turn back when they are done. Your whole job on this path is one read, the three lines below, then the turn ends. Propose nothing and confirm nothing unless the user explicitly asks you to propose. Call each tool once per step, and never re-call one to check progress or count picks — the card shows its own saves.

The workspace is already pinned — pass its `workspace_id` explicitly on every call; do not re-resolve it here. `well_list_counterparties` absent from your toolset → say this Well server does not expose it yet, hand off `resolution: unavailable`, stop. Never rebuild the list from `well_query_records` on `companies` and `transactions`: a hand-joined list is a different computation and would misreport coverage.

Pass exactly one scope, never both — `uncategorized_only` alongside a period the caller gave you would silently answer a wider question than the one asked:
- `periods: [{ calendar_year, calendar_month }, …]`, at most 12, from the `define-period` hand-off{{#if periods}} (this run works on {{periods}}){{/if}}. It holds only the counterparties whose invoices that month is still MISSING, and lists one row per counterparty per month, so `row_count` can exceed the distinct `total_count`.
- `uncategorized_only: true` when the caller passed no period — workspace-wide, the first 50 rows against the real `total_count`, and no amounts or month fields at all.

Resync `periods` from `well_list_workspaces`' `session.selected_periods` only when THIS conversation's click or typed choice wrote them. A pin or a selection another conversation left is a leftover: ignore it, never announce it — "your session still has June 2026 selected" is forbidden phrasing.

Call `well_list_counterparties` once, with `workspace_id` and that one scope, and pass on its `hints` — the coverage bound, the row cap, a truncated catalog, and a FAILED catalog read, on which the card renders no pickers at all, so say the categories are managed in the Well app rather than point at a select that is not on screen. When every row already carries a category, or the result holds no rows, the server attaches no card: say so in one sentence, hand off `resolution: unchanged` with `coverage_before` as read, expect no card, wait for nothing, and give a calling flow control back in the same turn.

Otherwise point at the card and end the turn on it, in at most four plain sentences:
- One coverage line, shaped by the scope. On `periods`: `categorized_count` out of `row_count`, naming that denominator for what it is — the counterparties whose invoices the month is still missing — never the distinct `total_count`; plus the biggest uncategorized counterparty by `base_total_amount` (a `null` amount is "amount unavailable", never converted, never summed across currencies). On `uncategorized_only`: the uncategorized `total_count` alone — how many carry no category, never how many exist — with the 50-row read cap beside it, and no biggest row, since that scope carries no amounts. Build no ratio the read does not hold, and state the card's own 12-row display cap either way, so your denominator and the footer's don't read as a contradiction. Fold the connector disclosure into the same line — the list holds only the counterparties the connected tools brought in — naming the bank side only from a `bank_state` the caller passed, pointing at `connect-tools` when it is missing or in error; with none, say the connected side is unconfirmed, since this read carries no connector field.
- One line on what this changes: what Well knows about the vendors, not which invoices are missing{{#if purpose}} — "{{purpose}}"{{/if}}.
- One card line: choosing a category in a row's select saves it immediately, so a pick needs no submit, and Continue is how the user hands the turn back when they are done.
- Nothing else. No proposal list, no per-row commentary, no "shall I apply", no restated rows, no re-read to report a delta.

Propose only when the user explicitly asks ("propose categories for me", "which category would you pick?"). A low coverage figure, a big row count, or the user's silence is not a request. In that mode only, read the catalog once — `well_query_records({ root: "categories", whereClause: { category_type: { _eq: "company" } } })`, the single exception to the read ban below; it renders a second card, which is expected here. Work from that catalog plus the rows' `name` and `domain`, nothing else. Propose at most 20 rows at a time — the company, its spend, one catalog category by name — ordered by spend on `periods`, left in the read's own order on `uncategorized_only`, which quotes no spend. Leave out any row you cannot place from its name and domain alone and say you have no catalog match for it; never guess, never invent a category outside the catalog. Ask in one line whether to apply, and stop. On the user's yes, call `well_update_company({ workspace_id, company_id, category_ids })` once per confirmed company. **`category_ids` is a replace-set, not an append** — to add a category to a company that already carries one, send the existing ids plus the new one. Honor a partial yes exactly, record declines under `skipped_by_user`, and never retry a failed write: a retried write is a second replace-set, so report that company's error and keep the rest. Then defer back to the card for the remaining rows, and queue no second batch unless asked again.

Never call `well_get_entity` or `well_get_schema`. On the card path make no read beyond the one `well_list_counterparties` call — no row enrichment, no side lookup, no catalog fetch: every extra widget-bearing call renders an unwanted card. Never call `well_invoke_connector_tool`, any other create / update / delete tool, or any close, lock, or posting tool. On a transient read failure, retry once; on a second failure substitute no hand-built list — give the user `<well-app-base-url>/workspaces/<workspace_id>`, where Well shows and edits the same categories.

Emit the hand-off, kept for the caller and never printed as a block:

```yaml
workspace_id: <uuid>
scope: periods | uncategorized_only
coverage_before: <categorized_count out of row_count on periods; the uncategorized total_count alone on uncategorized_only>
resolution: rendered | updated | unchanged | read_only | unavailable
changed: [{ company_id, category }, …]   # proposal pass only
skipped_by_user: [<company_id>, …]       # proposal pass only
```

`rendered` is the card on screen with picks saving as they are made; `updated` is a proposal pass that wrote at least one confirmed row; `unchanged` is nothing to categorize or every proposal declined; `read_only` is a `well_update_company` carrying no `category_ids`, caught before any proposal.

Verify before moving on: exactly one `well_list_counterparties` call ran, with `workspace_id` and one scope — never both, never a re-read to check progress; no `well_get_entity`, no `well_get_schema`, no other read on the card path, and `well_query_records` only in the proposal mode on the `categories` root filtered to `category_type: "company"`; the card path ended the turn at the coverage line, the what-it-changes line and the card line, with no proposals and no confirmation question; the coverage figure matched the scope, named the `periods` denominator for what it is, carried both caps, and read every `null` amount as "amount unavailable"; a bank side was named only from a `bank_state` the caller passed; every proposed category came from the catalog by `category_id`, no write went out without a yes, `category_ids` went as a replace-set, and no failed write was retried; no leftover session pin or period selection was reused or mentioned; the answer claimed no retrieval improvement and never called a gap list thin.
