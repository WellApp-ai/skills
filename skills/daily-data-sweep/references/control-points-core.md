# Core control points — CMP- and EXH-

The two generic families: CMP- (depth) and EXH- (breadth), plus the duplicate-ingestion pair and the counting primitive.

---

## Control points — COMPLETE (depth)

Grounded in the live schema. `→` names the skill(s) that break or lie if the check fails.

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `CMP-balance-verified` | Balance snapshots pass verification | `account_balances` where `verification_error _eq true`; also `verified_at _is_null` | any row | red | cash-position, cash-balance-trend, runway-calculator, fx-exposure |
| `CMP-balance-diff-match` | Calculated vs bank-reported diff agree | `account_balances.calculated_balance_diff` vs `.expected_balance_diff` | any material delta | red | cash-position, cash-balance-trend |
| `CMP-balance-verify-fresh` | Verification actually ran recently | `account_balances.verification_last_run_at` older than the lookback | stale/never | amber | all cash skills |
| `CMP-txn-categorized` | Transactions carry a category | `transactions` where `category_key _is_null`, split by `category_status` (`classifier_failed` / `classifier_abstained` / `null` = never attempted) | any row; treat the three statuses as distinct defects | red | expense-breakdown, runway-calculator |
| `CMP-txn-category-confidence` | Categories are confident enough | `transactions.category_confidence` `_lt 0.70` (tolerance 10) with `category_source` = classifier | below floor | amber | expense-breakdown |
| `CMP-txn-booking-date` | Transactions have a booking date | `transactions` where `booking_date _is_null` | any row | red | cash-balance-trend (window bucketing), bills-due |
| `CMP-invoice-core-fields` | Invoices have the fields skills read | `invoices` where any of `grand_total` / `local_currency` / `issue_date` / `due_date` `_is_null` | any row | red | accounts-receivable-aging, bills-due, rank-clients-by-ltv |
| `CMP-invoice-counterparty` | Invoices resolve to a company | `invoices` where `issuer_pk _is_null` or `receiver_pk _is_null` | any row | red | company-profile, rank-clients-by-ltv, accounts-receivable-aging |
| `CMP-invoice-items-sum` | Line items reconcile to totals | `invoices.items_total` + `.tax_total` vs `.grand_total`; `invoice_items` present | mismatch | red | expense-breakdown, missing-receipts |
| `CMP-invoice-paid-consistent` | Paid amount and status agree | `invoices.paid_amount` / `.balance_due` / `.payment_status` / `.status` mutually consistent | contradiction | red | accounts-receivable-aging, bills-due |
| `CMP-fx-rate-present` | Converted amounts have a rate | `invoices` where `local_currency` ≠ `accounting_currency` and `exchange_rate_pk _is_null` | any row | red | fx-exposure, cash-position (consolidated) |
| `CMP-receipt-attached` | Expenses have a source document | `invoices.document_pk _is_null` / no `media` | any row | amber | missing-receipts |
| `CMP-sync-no-error` | Last sync per connector succeeded | `workspace_connector_sync_logs` latest per `workspace_connector_pk`: `status`, `error _is_null`, `completed_at` | failed or never completed | red | every skill reading that source |
| `CMP-sync-fresh` | Last successful sync within 24h | `workspace_connector_sync_logs.completed_at` vs now | older than window | amber | all |
| `CMP-sync-not-hung` | No sync stuck in progress | `status _eq in_progress` with old `started_at` / large `duration_ms` | hung run | amber | all — results are partial while true |
| `CMP-account-has-currency` | Every account states its currency | `accounts` where `currency _is_null` (seen live with `type _eq other`) | any row | red | cash-position, cash-balance-trend, fx-exposure — a currency-less balance cannot be summed or converted |
| `CMP-account-owns-connector` | Accounts link to their connector | `accounts.workspace_connector_pk _is_null` | any row | amber | ingestion attribution; "which bank is this?" is unanswerable |

### The one that matters most today: duplicate ingestion

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `CMP-account-not-duplicated` | One real account, one row | group `accounts` by (`account_name`, `currency`, `iban`/`account_number`, source connector); also compare `created_at` spacing for a regular cadence | more than one live row per real account, **especially one per sync interval** | **red — highest severity in this skill** | cash-position, cash-balance-trend, runway-calculator, fx-exposure — every one of them **multiplies cash by the duplicate factor** |
| `CMP-account-not-cross-connector-dup` | Same account not ingested twice via two connectors | same real account reachable from two different `workspace_connectors` (e.g. a direct provider connector AND an aggregator) | duplicate pair | red | all cash skills — double-counted balance |

This is not hypothetical. See § Provenance: **24 duplicate rows of a single bank account are
live in production right now**, created on an hourly cadence. Any cash figure summing
`accounts` today is overstated by roughly that factor. This control point exists because the
sweep's job is to catch exactly this before a human quotes the number.

### Counting primitive — read this before implementing any control point

`well_query_records` has **no aggregation** — no `group by`, `count(distinct)`, `min`, `max`.
Therefore:

- **A "count"** means `well_query_records({ root, fields:[…], limit:1, whereClause })` and
  reading the returned **`totalCount`**.
- **An extremum** means `orderBy <field> <dir>, limit 1`.
- **Every duplicate, continuity, and share check** requires paging the full set client-side via
  `nextCursor` against a **500-row page cap**. These are the expensive checks — scope them to
  a trailing window, and `log` what was skipped rather than silently truncating.
- The sweep **cannot distinguish "fetched every page" from "stopped early"** — pagination state
  is not persisted to any queryable root. State the pages actually read.

### Grounded status vocabularies

Never treat "not enabled" as a binary — both intermediate states are live in production.

- `workspace_connector_sync_logs.status` = `scheduled | in_progress | success | error`
- `workspace_connectors.status` = `enabled | disabled | to_configure | processing | error |
  need_reconnect | suspended | degraded`

## Control points — EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `EXH-connector-configured` | No connector left unconfigured | `workspace_connectors.status` in (`to_configure`, `degraded`, anything ≠ `enabled`) | any row | red | every skill reading that source |
| `EXH-connector-never-synced` | Every enabled connector has synced once | enabled `workspace_connectors` with zero `workspace_connector_sync_logs` | any row | red | all |
| `EXH-recommended-connected` | Recommended sources are connected | `well_list_connectors` where `is_preselected` or high `match_score` and not `is_connected` | any row + `install_url` | amber | runway-calculator, cash-position (understated cash) |
| `EXH-bank-has-accounts` | Every bank connector yields accounts | enabled bank `workspace_connectors` with no `accounts` | any row | red | cash-position, cash-balance-trend |
| `EXH-account-has-balances` | Every account has balance history | `accounts` with zero `account_balances` rows | any row | red | cash-position, cash-balance-trend, runway-calculator |
| `EXH-balance-series-continuous` | No holes in the balance time series | per account, gaps in `account_balances.balance_at_to` across the window | any missing period | red | cash-balance-trend (a gap fakes a trend), runway-calculator |
| `EXH-balance-series-depth` | Enough history to trend at all | accounts with exactly one `account_balances` row | any row | amber | cash-balance-trend — must refuse, not infer direction |
| `EXH-txn-coverage-window` | Transactions span the whole window | earliest `transactions.booking_date` per account vs window start / account open date | truncated coverage | red | expense-breakdown, runway-calculator (burn understated) |
| `EXH-no-empty-entity-class` | No root a skill needs is empty | count per root: `invoices`, `transactions`, `accounts`, `companies`, `categories`, `exchange_rates`, `journal_entries` | zero where a connector should populate it | red | the skill(s) reading that root |
| `EXH-currency-rate-coverage` | Every live currency has a rate | distinct currencies in `accounts` / `invoices` vs `exchange_rates` | uncovered currency | red | fx-exposure, consolidated cash |
| `EXH-ledger-posted` | Accounting graph covers the period | periods with `transactions`/`invoices` but no `journal_entries` | unposted period | amber | any close/statement use |
| `EXH-recon-backlog-bounded` | Reconciliation backlog isn't growing | `transactions` with no `invoice_transactions` link, aged beyond tolerance | growing backlog | amber | payment-invoice-lookup |
| `EXH-workspace-covered` | Every workspace was actually swept | workspaces enumerated vs workspaces with results | any skipped | red | all — a skipped workspace must never read as clean |
| `EXH-no-duplicate-identity` | One counterparty, one company | `companies` sharing a normalized name / email / registration id | duplicate cluster | amber | rank-clients-by-ltv, company-profile (LTV split across duplicates) |

