# MCP surface limits and the scope rule

What this sweep CANNOT check, and the rule that stops two different scopes being reported as one
number. Open when a check looks unexpressible or a green needs qualifying.

Verified schema facts live in [`schema-facts.md`](schema-facts.md); dated measurements live in
[`baseline-2026-07-29.md`](baseline-2026-07-29.md). Neither is duplicated here.

---

## SCOPE WARNING — two sets of numbers in this file, both correct

Every count I measured comes from the **MCP, scoped to the 3 workspaces the caller can access**.
A reviewer ran SQL against the **whole production DB**. They differ by ~16×:

| metric | my MCP scope (3 workspaces) | prod-wide SQL |
|---|---|---|
| invoices | 1,517 | **33,753** |
| transactions | 1,904 | **24,925** |
| accounts | 30 | **403** |

**Neither is wrong.** But a sweep must never mix them, and a "verdict" computed at one scope must
never be reported at the other. Every output line must state the scope it was computed over. The
`accounts` gap in particular means my "~24 duplicates of one account" is a finding about *one
workspace*, not a platform-wide rate — and prod-wide, `accounts.ownership` splits
**284 workspace / 61 counterparty / 58 unknown**, so the ownership picture is far better populated
than my 3-workspace sample suggested.

## Known limits of the MCP surface — what this sweep CANNOT check

Recording these is part of the skill's honesty contract: a control point that cannot be
expressed must not be silently dropped, or the sweep implies coverage it does not have.

- **Per-sync record counts and truncation flags — not expressible.**
  `workspace_connector_sync_logs` has no `records_ingested`, `pages_fetched`, or `truncated`
  scalar, and no queryable `metadata` column. So *"partial sync / truncated pagination"*
  cannot be checked directly. Only weak proxies exist: `ING-connector-produced-no-records`,
  or a root's `totalCount` sitting exactly at the ingestion ceiling (5000) or an exact
  page-size multiple. **Recommended schema change — highest value for making this sweep
  honest: promote `records_ingested` and `truncated` to scalar columns on the sync log.**
- **Raw-vs-mapped drop rate — not expressible.** `ConnectorSyncDiagnostic` and
  `ConnectorRawObservation` exist in the backend but are **not among the 33 MCP roots**. The
  most direct measure of a partial sync — provider objects returned vs entities persisted — is
  invisible.
- **Account stated opening date — not expressible.** `accounts` has no `opened_at`. Coverage
  is anchored instead on the earliest `balance_at_from`, a weaker floor: a truncated balance
  series moves the floor along with it.
- **OAuth token expiry — not expressible.** Expiry lives in `workspace_connectors.config`
  (jsonb, not queryable by nested key). The only observable is the derived
  `status _eq need_reconnect`, so the sweep detects an expired credential **after** refresh has
  terminal-failed, never in the warning window before it.
- **Own-company resolution — NO grounded field exists, and the data is currently wrong.**
  `workspaces` has no `own_company` (verified: 14 fields, none of them it). The nearest
  candidates are `companies.entity_kind` and `companies.company_origin` — but live values are
  only `unknown` and `counterparty`, with **no value marking "self"**, and in workspace
  WellappFR the row `"WELL APP INC"` (`canonical_tax_id: FR932035157`, `wellapp.ai`) is
  literally classified **`company_origin: counterparty`** — the workspace's own company tagged
  as a third party. Until a self-marker exists, the payable/receivable split that
  `bills-due`, `accounts-receivable-aging`, `rank-clients-by-ltv` and `company-profile` depend
  on **cannot be verified by this sweep**, and `ING-invoice-direction-coverage` inherits that
  limitation. This is a red-severity gap in the data model, not just in the sweep.
- **Expected connector set — unknowable in-graph.** The sweep can prove *some* source of a
  domain exists, never that *every* source the business uses is connected — there is no
  per-workspace declared connector manifest. Detecting a wholly absent second bank needs an
  external signal; the closest in-graph heuristic (a counterparty IBAN in `payment_means` with
  no matching workspace-owned `accounts` row) is weak.
- **Soft-delete filtering — INCONCLUSIVE, and it gates five control points.** Every root has
  `deleted_at`, so a live child can reference a soft-deleted parent and pass every null check.
  Five `GRAPH-` checks exist purely for that class. Whether the MCP layer *already* filters
  soft-deletes server-side is **unresolved**: probing `invoices` and `accounts` with
  `whereClause {"deleted_at": {"_is_null": false}}` returned `totalCount: 0` on both — which is
  equally consistent with server-side filtering **and** with there simply being no soft-deleted
  rows. Per this skill's own rule, that is INCONCLUSIVE, not a pass. Re-probe against a root
  with a **known** soft-deleted row before trusting any dangling-reference verdict; if MCP does
  filter, those five checks silently degrade into the null checks already covered above.
- **No cross-root join in one query.** Any comparison spanning two roots (currency/amount
  mismatch, items-vs-header, ledger-vs-source) requires fetching both sides and joining
  client-side. Correct but **not atomic** — a mid-sweep sync can make the two sides disagree for
  reasons that are not defects. Sequence against a quiet window, and **re-verify a red before
  reporting it.**
- **Zero violations vs. violations past the page cap.** Without aggregation the sweep cannot
  distinguish the two unless it pages to exhaustion. **Record the page depth reached alongside
  every green** — an unqualified green over a truncated scan is the sweep lying in the same way
  the skills do.
- **Credit-note sign convention is unspecified anywhere.** `document_type_code` exists with UBL
  `380`/`381`/`383` and no skill reads it. `GRAPH-credit-note-sign-unresolved` can detect an
  *inconsistent* convention but cannot tell you which is *correct* — that needs a recorded
  data-model decision (a CHECK constraint on sign per code, or a documented invariant), then the
  four aggregating skills must filter or negate. **A sweep reporting "convention consistent"
  while all four skills ignore the code entirely is a green on a broken aggregation.**
- **No `paid_date` on invoices.** `last_payment_allocation_date` is an allocation timestamp, not
  a settlement date. A "payment recorded before the invoice was issued" check is expressible
  only for invoices that already carry an edge — i.e. the ones least likely to be broken.
- **No home/reporting currency on `workspaces`** (confirmed across its 14 fields).
  `invoices.accounting_currency` is per-invoice, so FX-coverage cannot know which pairs are
  *required* without inferring a home currency. **Record which inference was used**, or the same
  graph passes one day and fails the next.
- **Unverified field paths — resolve at runtime, never hardcode.** The 12 skills state field
  paths only for `invoices`, `companies`, `workspaces`, `transactions`, `invoice_transactions`,
  `accounts`, `account_balances`, `exchange_rates`, `workspace_connectors`,
  `workspace_connector_sync_logs`. For `invoice_items`, `journal_entries`, `journals`,
  `ledger_accounts`, `people`, `media`, `documents`, `categories`, `tax_rates`, `payment_means`,
  `invoice_payment_means`, `cards`, `checks` **no skill names a single field.** The `*_pk`
  convention suggests the names, but each must come from `well_get_schema(root)` at sweep time —
  **a hardcoded guess emits a false red the day a connector changes shape, which is worse than
  not running the check.**
- **`journal_entries` may carry no source FK at all.** If `well_get_schema` shows none, the
  ledger↔source reconciliation collapses to a population-count comparison, which detects
  *absence* but never *mis-posting*. State which of the two you ran.
- **Duplicate-identity keys are thin.** Dedup should key on `canonical_tax_id`,
  `domain_normalized`, `canonical_legal_name`, and `registry_name` + `establishment_no` rather
  than display name — but across 1,281 live companies `canonical_tax_id` and
  `domain_normalized` are frequently null (populated mainly on Qonto-sourced rows), so
  name-based fallback is unavoidable and will produce false pairs. Report duplicate clusters as
  candidates for review, never as confirmed duplicates.
