# Ingestion control points — ING-

Gate 2. Connector and sync health, complete and exhaustive. A red here re-labels every later gate as scoped.

---

## Control points — INGESTION / SYNC (`ING-`)

Contributed by the ingestion-domain review. These sit *upstream* of the tables above: if an
`ING-` red fails, treat the corresponding `CMP-`/`EXH-` results as scoped, not clean.

### `ING-` COMPLETE (depth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `ING-connector-never-synced` | Enabled connector, no successful sync | per enabled connector, `workspace_connector_sync_logs` where `workspace_connector_pk _eq <pk>` and `status _eq success` | `totalCount = 0` while `created_at _lt now-2h` | red | every skill treats `status: enabled` as data presence → cash-position totals a confident zero |
| `ING-sync-stale-no-recent-success` | No successful sync in 26h | `status _eq success`, `completed_at _gte now-26h`; plus `orderBy completed_at desc limit 1` for the true age | `totalCount = 0` and last success > 26h old | red | runway-calculator computes on last week's cash |
| `ING-sync-last-attempt-errored` | Latest attempt errored | latest log per connector: `status`, `error`, `completed_at`, `duration_ms` | latest `status _eq error` | red | connector still reads `enabled`, so cash-balance-trend trends a truncated series uncaveated |
| `ING-sync-stuck-in-progress` | Sync hung | `status _eq in_progress`, `started_at _lt now-2h`, `completed_at _is_null true` | any row | red | every answer becomes permanently "partial" or quietly wrong |
| `ING-sync-scheduled-never-dispatched` | Scheduled sync never started | `status _eq scheduled`, `created_at _lt now-1h`, `started_at _is_null true`; read `cloud_task_id`, `trigger_type` | any row | amber | Cloud-Task handshake dropped — freshness plateaus while **no error is ever recorded** |
| `ING-connector-needs-reconnect` | Credentials expired/revoked | `status _in [need_reconnect, error, suspended]` | any row | red | missing-receipts and payment-invoice-lookup return clean bills of health for periods never pulled |
| `ING-connector-degraded` | Connector degraded | `status _eq degraded`, read `installed_capabilities`, `updated_at` | any row | amber | `degraded` is neither enabled nor an error, so every skill's presence check **skips the connector entirely** and its records simply never appear |
| `ING-connector-stuck-provisioning` | Stalled mid-install | `status _in [to_configure, processing]` and `created_at _lt now-24h` | any row | amber | user believes it's connected; expense-breakdown silently falls back to invoice approximation |
| `ING-bank-connector-zero-accounts` | Bank connected, zero accounts | `accounts` filtered to that connector and `ownership _eq workspace` | `totalCount = 0` despite ≥1 `success` sync | red | cash-position totals nothing; runway has no numerator |
| `ING-account-zero-balance-rows` | Account with no snapshot | `account_balances` per workspace-owned account | `totalCount = 0` | red | account silently dropped from the total |
| `ING-account-no-open-balance-row` | Missing current-period row | `account_balances` where `balance_at_to _is_null true`, `orderBy balance_at_from desc` | none, while closed rows exist | red | cash-position needs the open row; else it reads a stale closed period as "current" |
| `ING-balance-verification-never-run` | Balances never verified | `verified_at _is_null true` (or `verification_last_run_at _is_null true`) and `created_at _lt now-48h` | any row | amber | **absence of `verification_error=true` is not evidence of correctness** — unverified and verified-clean are otherwise indistinguishable |
| `ING-balance-verification-stale` | Verification predates the data | compare `verification_last_run_at` to the newest `transactions.executed_at` for that balance | verification older | amber | a pass from two weeks ago says nothing about two weeks of rows since |
| `ING-balance-series-continuity-break` | Gap between adjacent periods | page per account `orderBy balance_at_from asc`; compare each `balance_at_to` to next `balance_at_from`, and `closing_booked` to next `opening_booked` | any mismatch | red | **`verification_error` validates *within* a period and cannot see a missing period *between* two clean ones** — exactly what cash-balance-trend reports as a real business trend |
| `ING-transaction-not-attached-to-balance` | Transactions orphaned from any period | `transactions` where `account_balance _is_null true` in-window | any row / rising share | amber | an orphaned txn is excluded from the diff, so the period verifies clean while the row is unaccounted for |
| `ING-transaction-booking-date-missing` | Booking date absent | `transactions` where `booking_date _is_null true` in-window, vs window total | share above provider baseline | amber | bucketing silently falls back to `executed_at`, so the same outflow lands in a different month than the ledger |
| `ING-duplicate-transaction-external-id` | Same source txn ingested twice | page `transaction_external_id`, `workspace_connector`, `executed_at`, `instructed_amount`; group on (connector, external_id) | any tuple > 1 with null `deleted_at` — a partial unique index exists, so a hit means it was bypassed or the id is null | red | double-counted outflow inflates burn → runway under-reported, category double-charged |
| `ING-duplicate-invoice-number` | Same invoice twice | page `invoice_number`, `grand_total`, `local_currency`, `issue_date`, `issuer.name`; group on (number, issuer) | count > 1 for non-null number | red | bills-due shows the bill twice; rank-clients-by-ltv inflates LTV |
| `ING-document-processing-stalled` | Extraction stuck or errored | `documents`: `processing_status`, `processing_stage`, `processing_error`, `uploaded_at _lt now-6h` | any non-terminal-success | amber | missing-receipts reports a *receipt* gap that is really an *extraction* gap → wrong remediation |
| `ING-fx-rate-missing-for-live-currency` | Live currency has no rate | distinct currencies from `accounts.currency`, `invoices.local_currency`, `transactions.instructed_amount.currency`; per non-home currency `exchange_rates` where `source_currency _eq <cur>`, `rate_date _gte now-7d` | `totalCount = 0` | red | fx-exposure must abandon; others blend or split silently |
| `ING-category-classifier-failures` | Classifier failed or abstained | `transactions.category_status _in [classifier_failed, classifier_abstained]` in-window, vs window total | `classifier_failed` > **2%**, or failed+abstained+null > **10%** | amber | reshapes which category ranks first; **failed is a pipeline defect, abstained is an honest refusal — different remediation, never one number** |
| `ING-category-low-confidence-share` | Weak-confidence categories | `category_confidence _lt 0.6` with `category_key` non-null, plus `category_source` distribution | rising share across sweeps | amber | these *look* categorized to expense-breakdown, which surfaces no confidence at all — the least visible category failure |

To extend this family, add a row with the same six columns and a bucket declaration. A control
point without a named root, field path and fail signal is not a control point — it reports
INCONCLUSIVE and is named as such, per the sweep's own rule.

### `ING-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `ING-no-banking-source-installed` | No banking connector at all | `workspace_connectors.status _in [enabled, degraded]` joined to `connector.category_id` / `connector.data_domains`, cross-referenced against the `connectors` catalog | zero banking-domain connector | red | cash-position, cash-balance-trend, runway-calculator, fx-exposure all halt and present install links |
| `ING-no-invoicing-source-installed` | No invoicing/accounting connector | same shape, invoicing/accounting category | zero | red | **six of twelve skills** degrade to install prompts |
| `ING-data-domain-coverage-gap` | Installed set misses a domain | union of `connector.data_domains` vs the domains the 12 skills read (bank, invoicing, accounting/ledger, email/document) | any required domain absent | amber | expense-breakdown silently downgrades from ledger to invoice approximation |
| `ING-capability-surface-not-fully-granted` | Scopes narrower than provider surface | `installed_capabilities`: `available_tools` vs `unavailable_tools` / `granted_scopes` | `unavailable_tools` non-empty | amber | a whole record class is unreachable; payment-invoice-lookup finds no match for payments never fetchable |
| `ING-capability-snapshot-stale` | Capability snapshot predates syncs | `installed_capabilities.captured_at` vs latest `success.completed_at` | captured_at materially older | amber | advertises tools that now fail |
| `ING-single-balance-snapshot-only` | Only one balance point | `account_balances` per account | `totalCount = 1` for an account older than 48h | amber | cash-balance-trend must refuse; if it doesn't, it fabricates a direction from one snapshot |
| `ING-balance-period-cadence-gaps` | Missing days/months in series | page per account; derive modal period length, scan for longer intervals | interval > 1.5× modal, or fewer periods than the window implies | red | the stated window overstates real coverage |
| `ING-transaction-window-shorter-than-balance-window` | Txn history starts after balances | earliest `transactions.executed_at` vs earliest `account_balances.balance_at_from` per account | txn floor later by > one period | red | runway averages burn over a window that partly predates any transaction data → **under-reports burn, over-reports runway** |
| `ING-invoice-direction-coverage` | Only one side of the invoice graph | `invoices` totals where own company is `receiver` vs `issuer` | one side 0 while the other is non-zero | amber | payables-only empties AR-aging and LTV; receivables-only empties bills-due — **each reads to the user as "you're all caught up"** |
| `ING-fx-rate-date-coverage` | Rate series sparse across window | `exchange_rates` per currency between window bounds; page, count distinct `rate_date` | far fewer dates than business days, or max `rate_date` > 3 days old | amber | fx-exposure falls back to the last rate ≤ as-of date; sparse series makes every historical conversion drift |
| `ING-category-catalog-coverage` | Category catalog thin/absent | `categories` per `category_type` vs distinct `transactions.category_normalized` | zero for a referenced type, or catalog << observed set | amber | groups against a vocabulary that doesn't exist → distinct spend collapses into "other" |
| `ING-connector-produced-no-records` | Synced fine, ingested nothing | per connector with a `success` log, count `accounts`, `transactions`, `invoices`, `documents` | all four zero | red | **the most dangerous state**: `enabled` + `success` reads as healthy, every presence check passes, and the answer is empty |
| `ING-ledger-graph-absent` | No ledger accounts or entries | `ledger_accounts` and `journal_entries` totals | both 0 while a bookkeeping connector is installed | amber | expense-breakdown and runway prefer the ledger; without it the answers stop matching Well's own statements |

Extend as above. An exhaustiveness check must state the population it enumerates, or it cannot
support an "every X" claim — see the L2 loop in `iteration-protocol.md`.
