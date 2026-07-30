# Ingestion control points — ING-

Gate 2. Connector and sync health, complete and exhaustive. A red here re-labels every later gate as scoped.

**Precedence:** where a severity or threshold below disagrees with `tolerances.md`, **tolerances.md
wins** — the tolerance is the business policy, the row is its restatement.

---

## Control points — INGESTION / SYNC (`ING-`)

These sit *upstream* of every other family: if an `ING-` red fires, treat the corresponding
`BANK-` / `BOOK-` / `GRAPH-` / `RECON-` results as scoped, not clean.

### `ING-` COMPLETE (depth)

| id | name | check | fail signal | sev | bucket | → |
|---|---|---|---|---|---|---|
| `ING-connector-never-synced` | Enabled connector, no successful sync | per enabled connector, `workspace_connector_sync_logs` where `workspace_connector_pk _eq <pk>` and `status _eq success` | `totalCount = 0` while `created_at _lt now-2h` | red | complete | every skill treats `status: enabled` as data presence → cash-position totals a confident zero |
| `ING-sync-stale-no-recent-success` | No successful sync in 26h | `status _eq success`, `completed_at _gte now-26h`; plus `orderBy completed_at desc limit 1` for the true age | `totalCount = 0` and last success > 26h old | red | complete | runway-calculator computes on last week's cash |
| `ING-sync-last-attempt-errored` | Latest attempt errored | latest log per connector: `status`, `error`, `completed_at`, `duration_ms` | latest `status _eq error` | red | complete | connector still reads `enabled`, so cash-balance-trend trends a truncated series uncaveated |
| `ING-sync-stuck-in-progress` | Sync hung | `status _eq in_progress`, `completed_at _is_null true`, `started_at` age per tolerance 7b: **≤ 3h → suppress the COMPLETE bucket** for that connector's roots and report "sweep deferred — sync in progress"; **> 3h → hung** | any row with `started_at _lt now-3h` | red (≤3h: suppressed, not a defect) | complete | every answer becomes permanently "partial" or quietly wrong |
| `ING-sync-scheduled-never-dispatched` | Scheduled sync never started | `status _eq scheduled`, `created_at _lt now-1h`, `started_at _is_null true`; read `cloud_task_id`, `trigger_type` | any row | amber | complete | Cloud-Task handshake dropped — freshness plateaus while **no error is ever recorded** |
| `ING-connector-needs-reconnect` | Credentials expired/revoked | `status _in [need_reconnect, error, suspended]` | any row | red | complete | missing-receipts and payment-invoice-lookup return clean bills of health for periods never pulled |
| `ING-connector-degraded` | Connector degraded | `status _eq degraded`, read `installed_capabilities`, `updated_at` | any row | amber | complete | `degraded` is neither enabled nor an error, so every skill's presence check **skips the connector entirely** and its records simply never appear |
| `ING-connector-stuck-provisioning` | Stalled mid-install | `status _in [to_configure, processing]` and `created_at _lt now-24h` | any row | amber | complete | user believes it's connected; expense-breakdown silently falls back to invoice approximation |
| `ING-bank-connector-zero-accounts` | Bank connected, zero accounts | `accounts` filtered to that connector and `ownership _eq workspace` | `totalCount = 0` despite ≥1 `success` sync | red | complete | cash-position totals nothing; runway has no numerator |
| `ING-account-zero-balance-rows` | Account with no snapshot | `account_balances` per workspace-owned account | `totalCount = 0` | red | complete | account silently dropped from the total |
| `ING-balance-verification-never-run` | Balances never verified | `verified_at _is_null true` (or `verification_last_run_at _is_null true`) and `created_at _lt now-48h` | any row | amber | complete | **absence of `verification_error=true` is not evidence of correctness** — unverified and verified-clean are otherwise indistinguishable |
| `ING-balance-verification-stale` | Verification predates the data | compare `verification_last_run_at` to the newest `transactions.executed_at` for that balance | verification older | amber | complete | a pass from two weeks ago says nothing about two weeks of rows since |
| `ING-balance-series-continuity-break` | Gap between adjacent periods | page per account `orderBy balance_at_from asc`; compare each `balance_at_to` to next `balance_at_from`, and `closing_booked` to next `opening_booked` | any mismatch | red | complete | **`verification_error` validates *within* a period and cannot see a missing period *between* two clean ones** — exactly what cash-balance-trend reports as a real business trend |
| `ING-transaction-not-attached-to-balance` | Transactions orphaned from any period | `transactions` where `account_balance _is_null true` in-window, against the in-window total | any row; report the share of the swept period | amber | complete | an orphaned txn is excluded from the diff, so the period verifies clean while the row is unaccounted for |
| `ING-transaction-booking-date-missing` | Booking date absent | `transactions` where `booking_date _is_null true` in-window, vs window total | share above provider baseline; tolerance 11 puts the tripwire at **> 10%** of the period | amber | complete | bucketing silently falls back to `executed_at`, so the same outflow lands in a different month than the ledger |
| `ING-duplicate-transaction-external-id` | Same source txn ingested twice | page `transaction_external_id`, `workspace_connector`, `executed_at`, `instructed_amount`; group on (connector, external_id) | any tuple > 1 with null `deleted_at` — a partial unique index exists, so a hit means it was bypassed or the id is null | red | complete | double-counted outflow inflates burn → runway under-reported, category double-charged |
| `ING-duplicate-invoice-number` | Same invoice twice | page `invoice_number`, `grand_total`, `local_currency`, `issue_date`, `issuer.name`; group on (number, issuer) | count > 1 for non-null number | red | complete | bills-due shows the bill twice; rank-clients-by-ltv inflates LTV |
| `ING-duplicate-account-cross-connector` | Same account not ingested twice via two connectors | the same real account reachable from two different `workspace_connectors` (e.g. a direct provider connector **and** an aggregator); match on provider `account_id` / IBAN / `account_number` first, on (`account_name`, `currency`) only as a corroborator per tolerance 8 | duplicate pair across distinct `workspace_connector_pk` | red | complete | every cash skill double-counts the balance. **`RECON-duplicate-account-rows` clusters *within* an owning connector and structurally cannot see this pair** |
| `ING-document-processing-stalled` | Extraction stuck or errored | `documents`: `processing_status`, `processing_stage`, `processing_error`, `uploaded_at _lt now-6h` | any non-terminal-success | amber | complete | missing-receipts reports a *receipt* gap that is really an *extraction* gap → wrong remediation |
| `ING-fx-rate-missing-for-live-currency` | Live currency has no rate | distinct currencies from `accounts.currency`, `invoices.local_currency`, `transactions.instructed_amount.currency`; per non-home currency `exchange_rates` where `source_currency _eq <cur>`, `rate_date _gte now-7d` | `totalCount = 0` | red | complete | fx-exposure must abandon; others blend or split silently |
| `ING-category-low-confidence-share` | Weak-confidence categories | `category_confidence _lt 0.70` (tolerance 10's review floor) with `category_key` non-null, plus `category_source` distribution; denominator is the categorized rows **of the swept period**, not of all time | share of swept-period categorized rows below the floor **> 5% by value or > 100 rows** — a within-run share, measured against the period being swept | amber | complete | these *look* categorized to expense-breakdown, which surfaces no confidence at all — the least visible category failure |

**Uncategorized transactions are not checked here.** The canonical control point is
`RECON-txn-uncategorized`, which runs the per-cause ladder in tolerance 9 (`classifier_failed` →
red, `classifier_abstained` → amber, `category_status` null → red, plus the aggregate value/count
ladder and the trailing-7-day `classifier_failed` trend). The former
`ING-category-classifier-failures` row applied its own share thresholds — `classifier_failed`
> 2%, failed+abstained+null > 10% — **superseded by tolerance 9**; do not re-add them. The
distinction that row existed to protect still holds and is carried by §9: **failed is a pipeline
defect, abstained is an honest refusal — different remediation, never one number.**

**The missing open balance row is not checked here.** The canonical control point is
`GRAPH-account-open-balance-row-invalid`, which covers both directions (zero open rows **and** two
or more) plus the tolerance 6a staleness arm. The former `ING-account-no-open-balance-row` checked
only the zero direction on the same population.

**Every fail signal in this file is single-run.** The sweep holds no prior-sweep state — the MCP
surface is read-only and there is no output root to write one — so a cross-run comparison is not a
strict check, it is an unrunnable one. `ING-category-low-confidence-share`'s 5%-by-value / 100-row
rung mirrors tolerance 9's amber rung deliberately, so the low-confidence backlog and the
uncategorized backlog escalate on the same scale rather than on two invented ones; per the
precedence rule above, a value in `tolerances.md` overrides it.

To extend this family, add a row with the same seven columns, including an explicit `bucket`. A
control point without a named root, field path, fail signal and bucket is not a control point — it
reports INCONCLUSIVE and is named as such, per the sweep's own rule.

### `ING-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | bucket | → |
|---|---|---|---|---|---|---|
| `ING-connector-not-enabled-in-scope` | Every **in-scope** connector is feeding | enumerate all `workspace_connectors`; bucket `status` by the authoritative `CONNECTOR_STATUS_BUCKET` table in `schema-facts.md` (healthy/syncing: `enabled`, `processing`; errored: `degraded`, `error`, `need_reconnect`, `suspended`; not participating: `to_configure`, `disabled`). **Then filter by domain**: resolve `connector.data_domains` / `category_id` and keep only connectors whose domains intersect the data domains of the control-point families selected for this run (banking → `ING-`/`BANK-`; invoicing + accounting/ledger → `RECON-`/`BOOK-`/`EINV-`/`IPAY-`; email/document → `DOC-`) | **red** only for an in-scope connector in the errored bucket; **amber** for an in-scope connector in the not-participating bucket; **INFO, never red** for any connector with no domain intersection — a CRM in `to_configure` must not scope the banking verdict | red / amber / INFO per the fail signal | exhaustive | every skill reading that source. This row is the **enumeration** check — it asserts the whole connector population was classified. Its red population is the same rows the per-status `ING-` COMPLETE rows report, so **count the defect once**: severity is owned by the per-status rows, breadth by this one |
| `ING-connector-never-synced-breadth` | Every enabled connector has synced at least once | enabled `workspace_connectors` with zero `workspace_connector_sync_logs` of any status | any row | red | exhaustive | all — distinct from `ING-connector-never-synced` (no *successful* sync): zero logs at all means the scheduler never fired, a different fix |
| `ING-recommended-source-not-connected` | Recommended sources are connected | `well_list_connectors` where `is_preselected _eq true` or a high `match_score`, and `is_connected _eq false`; report `install_url` | any row | amber | exhaustive | runway-calculator, cash-position — **understated cash**, which reads to the user as a business fact rather than a missing connection |
| `ING-no-banking-source-installed` | No banking connector at all | `workspace_connectors.status _in [enabled, degraded]` joined to `connector.category_id` / `connector.data_domains`, cross-referenced against the `connectors` catalog | zero banking-domain connector | red | exhaustive | cash-position, cash-balance-trend, runway-calculator, fx-exposure all halt and present install links |
| `ING-no-invoicing-source-installed` | No invoicing/accounting connector | same shape, invoicing/accounting category | zero | red | exhaustive | **six of twelve skills** degrade to install prompts |
| `ING-data-domain-coverage-gap` | Installed set misses a domain | union of `connector.data_domains` vs the domains the 12 skills read (bank, invoicing, accounting/ledger, email/document) | any required domain absent | amber | exhaustive | expense-breakdown silently downgrades from ledger to invoice approximation |
| `ING-capability-surface-not-fully-granted` | Scopes narrower than provider surface | `installed_capabilities`: `available_tools` vs `unavailable_tools` / `granted_scopes` | `unavailable_tools` non-empty | amber | exhaustive | a whole record class is unreachable; payment-invoice-lookup finds no match for payments never fetchable |
| `ING-capability-snapshot-stale` | Capability snapshot predates syncs | `installed_capabilities.captured_at` vs latest `success.completed_at` | captured_at materially older | amber | exhaustive | advertises tools that now fail |
| `ING-single-balance-snapshot-only` | Only one balance point | `account_balances` per account | `totalCount = 1` for an account older than 48h | amber | exhaustive | cash-balance-trend must refuse; if it doesn't, it fabricates a direction from one snapshot |
| `ING-balance-period-cadence-gaps` | Missing days/months in series | page per account; derive modal period length, scan for longer intervals. Tolerance 16: a non-publishing weekend/bank holiday is **not** a hole | interval > 1.5× modal, or fewer periods than the window implies | red | exhaustive | the stated window overstates real coverage |
| `ING-transaction-window-shorter-than-balance-window` | Txn history starts after the window it is read over | per account, earliest `transactions.executed_at` compared against **both** the earliest `account_balances.balance_at_from` **and** the sweep window start / account open date | txn floor later than either reference by > one period | red | exhaustive | runway averages burn over a window that partly predates any transaction data → **under-reports burn, over-reports runway**; expense-breakdown reports a truncated period as a full one |
| `ING-invoice-direction-coverage` | Only one side of the invoice graph | `invoices` totals where own company is `receiver` vs `issuer`. **`workspaces.own_company_pk` is stripped from the MCP read surface (`schema-facts.md`), so "own company" cannot be resolved read-only** — report INCONCLUSIVE until it can, never a red | one side 0 while the other is non-zero | amber (INCONCLUSIVE today) | exhaustive | payables-only empties AR-aging and LTV; receivables-only empties bills-due — **each reads to the user as "you're all caught up"** |
| `ING-fx-rate-date-coverage` | Rate series sparse across window | `exchange_rates` per currency between window bounds; page, count distinct `rate_date` | far fewer dates than business days, or max `rate_date` older than tolerance 5's **4 calendar days** | amber | exhaustive | fx-exposure falls back to the last rate ≤ as-of date; sparse series makes every historical conversion drift |
| `ING-category-catalog-coverage` | Category catalog thin/absent | `categories` per `category_type` vs distinct `transactions.category_normalized` | zero for a referenced type, or catalog << observed set | amber | exhaustive | groups against a vocabulary that doesn't exist → distinct spend collapses into "other" |
| `ING-connector-produced-no-records` | Synced fine, ingested nothing | per connector with a `success` log, count `accounts`, `transactions`, `invoices`, `documents`; cross-check the distinct `invoices.source_workspace_connector_pk` set for connectors that log but write nothing | all four zero | red | exhaustive | **the most dangerous state**: `enabled` + `success` reads as healthy, every presence check passes, and the answer is empty |
| `ING-ledger-graph-absent` | No ledger accounts or entries | `ledger_accounts` and `journal_entries` totals | both 0 while a bookkeeping connector is installed | amber | exhaustive | expense-breakdown and runway prefer the ledger; without it the answers stop matching Well's own statements |

Extend as above. An exhaustiveness check must state the population it enumerates, or it cannot
support an "every X" claim — see the L2 loop in `iteration-protocol.md`.

---

### Counting primitive — see the protocol

Counts come from `totalCount`, extrema from `orderBy` + `limit 1`, and there is **no pagination**
(`nextCursor` is always null), so `returned < totalCount` means `SAMPLED`, never `pass`. The full
measured contract — including that `limit` is applied per workspace and that `totalCount` and `rows`
carry different scopes in one response — is in
[`iteration-protocol.md`](iteration-protocol.md) § MEASURED REALITY. **That file is the single
source; do not restate the rules here or the two will drift.**
