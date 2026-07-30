# Entity graph and reconciliation — GRAPH-, RECON-

Gates 4 and 5. Cross-root join families; both share the non-atomicity caveat — re-verify a red before reporting it.

---

## Control points — ENTITY GRAPH (`GRAPH-`)

Contributed by the financial-graph review. **Every check here filters `deleted_at IS NULL` on
every root traversed, on both sides of every join** — see the soft-delete caveat in § Known
limits.

### `GRAPH-` COMPLETE (depth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `GRAPH-credit-note-sign-unresolved` | Credit notes not sign-distinguished | group `invoices` by `document_type_code` (UBL `380` invoice / `381` credit note / `383` debit note); check the sign convention of `grand_total`, `items_total`, `balance_due`, `paid_amount` within each code | null or non-UBL code; a `381` whose `grand_total` is positive while `380` is also positive; mixed convention within `381` | red | **not one of the 12 skills mentions `document_type_code`** — yet expense-breakdown, bills-due, accounts-receivable-aging and rank-clients-by-ltv all sum across the invoice population. If `381` is stored positive, every credit note **inflates** AP and AR instead of reducing them, and a refunded customer is credited twice. A silent systematic overstatement in four skills at once |
| `GRAPH-journal-entry-unbalanced` | Debits ≠ credits | group `journal_entries` by parent journal; sum debit vs credit side. **Resolve the parent FK and amount fields via `well_get_schema` — no skill exposes them; do not hardcode** | sides differ by > 0.01; or a group with exactly one line (half-posted) | red | expense-breakdown and runway prefer the ledger *because it's authoritative*. An unbalanced entry makes the preferred path **less** trustworthy than the fallback it overrides, and neither skill can detect the inversion |
| `GRAPH-journal-entry-unposted-or-dangling` | Entry not posted to a journal/ledger account | `journal_entries` where the journal or ledger-account FK is null, or points at an absent / soft-deleted row | any row | red | invisible to every ledger aggregation while still existing — ledger spend under-reports against the same period's transactions with no error surfaced |
| `GRAPH-invoice-items-vs-header-totals` | Line items don't sum to the header | group `invoice_items` by parent invoice; compare line sum vs `items_total`, line tax vs `tax_total`; check the accounting-side triplet independently of the local one | difference > 0.01; non-zero `grand_total` with zero live items; the two triplets diverge | amber | **what a header-internal check cannot see**: the header can balance perfectly while line detail is missing or contradictory. `draft-invoice` accepts `totals` and `line_items` as *independent* inputs, so divergence is structurally possible on every write |
| `GRAPH-invoice-transaction-currency-mismatch` | Payment match crosses currencies | per `invoice_transactions` edge compare `invoices.local_currency` vs `transactions.instructed_amount.currency`; accept `accounting_currency` only when `exchange_rate_pk` resolves live | neither currency matches; or they differ and `exchange_rate_pk` is null/dangling | red | payment-invoice-lookup asserts settlement of that invoice — a EUR payment bound to a USD invoice makes the assertion false, and fx-exposure counts the same money under two currencies |
| `GRAPH-invoice-transaction-amount-mismatch` | `full` allocation with unequal amounts | edges where `allocation_type = full` and abs(txn amount − `grand_total`) > 0.01; separately, summed edge amounts exceeding `grand_total`; and `paid_amount` disagreeing with the edge sum | any of the three sets | red | the invoice reads as settled while a residual exists, so it **drops out of AR-aging and bills-due entirely**. A header-only `paid_amount`/`balance_due` check can't catch it — those fields were written from the same bad edge |
| `GRAPH-invoice-transaction-dangling-side` | Edge points at an absent/deleted row | per edge, confirm both the `invoices` and `transactions` sides resolve live | either side unresolvable | red | payment-invoice-lookup handles a *missing* edge ("no match on file") but has **no branch** for an edge that exists and resolves to nothing — it reports a match it cannot display, or errors mid-answer |
| `GRAPH-invoice-document-pk-dangling` | `document_pk` resolves to nothing | `invoices` where `document_pk` is non-null but the `documents` row is absent / soft-deleted | any row | amber | missing-receipts tests the relation for **null** — a populated pointer to a deleted document **passes**. The invoice reads as documented, compliance reports zero gaps, the receipt does not exist. **A false green is worse than the gap the skill was written to find** |
| `GRAPH-account-ownership-unresolvable` | Account provenance unestablished | `accounts` where `workspace_connector_pk _is_null` (**currently all 30 live rows**) cross-checked against `ownership`; flag rows where `ownership` is also null/unknown | both null | red | cash-position and cash-balance-trend must count only workspace-owned accounts. With the connector FK null across the board, **`ownership` is the only discriminator left** — if it's unset too, a counterparty account can be summed into cash and runway inherits the inflated numerator |
| `GRAPH-account-open-balance-row-invalid` | Missing or duplicated current snapshot | count live `account_balances` per account where `balance_at_to _is_null true` | zero open rows, **or two or more** | red | zero → the account contributes nothing to cash; duplicate open rows → **the same balance counted twice**. Both produce a plausible number with no error raised |
| `GRAPH-transaction-uncategorized` | No category assigned | `transactions` with a null category link (resolve the FK via `well_get_schema` — the `categories` root exists but no skill verifies the FK) | any row; amber < 10% of window, red above | red | expense-breakdown's primary answer *is* spend by category; uncategorized rows vanish or dominate an "other" bucket |
| `GRAPH-transaction-counterparty-unresolved` | No resolvable counterparty | `transactions` where both `debtor_payment_means` and `creditor_payment_means` are null, plus means resolving to no live company/person/account | any row | amber | payment-invoice-lookup must list unmatched payments "with counterparty if resolvable", and company-profile reaches transaction history *only* through this chain — a broken link hides a vendor's payment history while the 360 view still renders complete |
| `GRAPH-person-not-linked-to-company` | Unaffiliated people | `people` with a null company FK or one pointing at an absent/deleted company | any row, reported as a share | amber | an unreachable island: the row exists, no skill can route to it, and the profile it should enrich reports no contacts |
| `GRAPH-company-no-contact-channel` | No contact channel on file | `companies` with zero live `emails`, `phones` and `web_links` | any company that was an `issuer_pk`/`receiver_pk` in the last 12 months; amber for dormant | amber | company-profile must return channels as a first-class section, and any follow-up on AR/AP output has no address to send to |

### `GRAPH-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `GRAPH-entity-class-silently-empty` | Root empty despite an enabled connector | `limit: 1` probe per root, cross-referenced with enabled `workspace_connectors` + `connector.slug` | banking enabled with `accounts`/`transactions` empty; invoicing enabled with `invoices`/`companies` empty; either with `journals` empty | red | **this control point IS every skill's "data presence, not connector status" gate — run once centrally instead of twelve times inconsistently** |
| `GRAPH-company-identity-fragmentation` | Duplicates **and** unusable dedup keys | collisions on non-null `canonical_tax_id`, on `domain_normalized`, on (`canonical_registry`, `registry_country`, `establishment_no`), and on normalized `canonical_legal_name`; **plus report the null rate of the two strong keys** | any strong-key collision; **or** a null rate high enough that strong keys cover only a minority | red | two failures, one root. Collisions mis-rank LTV and stall company-profile. But **the null rate is the more serious finding**: where both strong keys are null, dedup falls back to legal name, so non-fragmentation cannot be asserted for that slice. **Report the covered share, never a bare green** |
| `GRAPH-duplicate-invoice-identity` | Same invoice ingested twice | collisions on (`issuer_pk`, `invoice_number`, `document_type_code`) and (`issuer_pk`, `reference_number`, `grand_total`, `issue_date`); **segment by `source_workspace_connector_pk`** | more than one live row per group | red | distinct from duplicate *company* identity — counterparty clean, invoice doubled. The connector segmentation is what tells you whether one connector re-ingested or two connectors reported the same document |
| `GRAPH-ledger-coverage-vs-source` | Ledger coverage vs invoices/transactions | counts of `ledger_accounts`, `journals`, `journal_entries` vs `invoices`/`transactions` over the window | ledger roots at zero while sources are populated; or a populated window with no entries posting from it | red | the output says "ledger-based" while half the period is unposted — the skill flags an approximation **it cannot know it is making** |
| `GRAPH-journal-period-continuity` | Month with source activity, no posting | bucket `journal_entries` by month over 12 months vs the same month's transactions/invoices | any month with sources and zero entries; any gap between populated months | amber | runway averages over ledger movement — an unposted month **shrinks the divisor silently, making runway look longer** for a data reason that never appears in the answer |
| `GRAPH-ledger-account-tree-broken` | Chart of accounts orphaned | `ledger_accounts` whose parent FK is absent/deleted; plus accounts with zero posting entries | any orphan subtree | amber | children's totals never roll up into any reported parent, so **the presented categories sum to less than total spend with no residual line to show it** |
| `GRAPH-orphan-documents-and-media` | Files attached to nothing | live `documents` / `media` with no live parent | any orphan — most sharply when missing-receipts *simultaneously* reports invoices with no document | amber | an orphan file is a receipt Well **already holds and reports as missing**: a false compliance gap. Paired with `GRAPH-invoice-document-pk-dangling`, the two directions bound the real attachment error rate — **neither alone does** |
| `GRAPH-payment-means-island` | Instruments linked to nothing | `payment_means`, `invoice_payment_means`, `cards`, `checks` with no live owner | any island row | amber | the upstream cause of `GRAPH-transaction-counterparty-unresolved`. Companies have no direct FK to transactions — the only route is through `payment_means`, so **one island instrument hides many payments at once** |
| `GRAPH-sync-freshness-and-log-coverage` | Syncs stale or unlogged | latest `status` + `completed_at` per enabled connector; flag enabled connectors with zero logs; cross-check the distinct `invoices.source_workspace_connector_pk` set for connectors that log but write nothing | no log row; `completed_at` older than cadence; `in_progress` past normal duration; success with zero rows | red | all twelve skills read this root to say "still syncing, results may be partial" — an unlogged connector makes that warning impossible, so all twelve present stale data under a **false as-of date** |

### A principle worth keeping

The graph review deliberately authored **no invariants** on `blueprint_runs`, `tasks`,
`billing_events`, `chat_conversations`, `memberships`, `locations`, `subscription`,
`override_version`, `billing_context` — no skill breaks or lies if they drift. **A red nobody
can act on trains the operator to ignore the sweep.** Apply that test to every control point
added later.

## Control points — RECONCILIATION & CLOSE (`RECON-`)

Contributed by the reconciliation review. `[EXPENSIVE]` = requires client-side paging at the
500-row cap; budget as a paged job with checkpoint/resume, on a slower cadence than the cheap
`totalCount` checks.

**Windowing rule for every check below:** window on
`COALESCE(booking_date, value_date, executed_at)` — **never on `booking_date` alone.** It is
nullable in production, and filtering on a nullable column excludes exactly the rows most likely
to be defective, so the sweep's blind spot becomes its clean bill of health.

### `RECON-` COMPLETE (depth)

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `RECON-txn-no-invoice-link` | Unmatched transactions | in-window `transactions` with no `invoice_transactions` row | older than the 2-business-day grace | red |
| `RECON-invoice-no-txn-link` | Invoice settled outside the graph | in-window `invoices` with no edge | `payment_status` paid/partial or `paid_amount > 0` with zero edges | red |
| `RECON-paid-invoice-no-payment` | Paid with no cash movement | `payment_status: paid`, no edge; `last_payment_allocation_date` populated with no edge is the stronger signal | any row | red |
| `RECON-paid-amount-vs-allocation` | `paid_amount` ≠ matched cash `[EXPENSIVE]` | sum matched txn amounts per invoice vs `paid_amount` | gap > tolerance §14 | red |
| `RECON-partial-allocation-shortfall` | Allocations short of total `[EXPENSIVE]` | allocation sum vs `grand_total`, gated on `paid` | sum < total beyond tolerance | red |
| `RECON-overallocated-invoice` | Allocations exceed total `[EXPENSIVE]` | same sum, opposite direction | sum > total + tolerance | red |
| `RECON-invoice-totals-drift` | `items_total + tax_total` ≠ `grand_total` `[EXPENSIVE]` | compare per invoice; **compare on absolute value per `document_type_code`** — 381/383 may carry opposite signs | gap > 0.01 in `local_currency` | red |
| `RECON-balance-due-status-drift` | `balance_due` contradicts `payment_status` `[EXPENSIVE]` | `balance_due = 0` with unpaid/partial; `> 0` with paid; or `paid_amount + balance_due ≠ grand_total` | any row | red |
| `RECON-provisional-match-backlog` | Unconfirmed LLM matches | `invoice_transactions` with `edge_status: provisional` or `confidence < 0.85` | older than 10 business days | amber |
| `RECON-invoice-missing-document` | No receipt attached | `invoices.document_pk _is_null` in-window | past the 5-business-day receipt grace | amber |
| `RECON-txn-missing-document` | Transaction with no receipt | many-to-many — **resolve the relation name via `well_get_schema`, do not hardcode** | past the 5-business-day grace | amber |
| `RECON-txn-uncategorized` | No category | `category_key _is_null`, **split by `category_status` and `category_source`** | per-cause ladder §9 | §9 |
| `RECON-low-confidence-category` | Below the trust floor | `category_key` non-null, `category_confidence < 0.70`, `category_source` = classifier not human | older than 10 business days, or > 5% of period spend by value | amber |
| `RECON-duplicate-payment-candidates` | Same amount, counterparty, near dates `[EXPENSIVE]` | cluster on amount+currency+counterparty means within 3 calendar days | ≥2 in cluster **plus a corroborator** §4 | red |
| `RECON-balance-verification-failure` | Balance self-verification failing | `verification_error _eq true`, read `calculated_` vs `expected_balance_diff` | dual threshold §6b | red |
| `RECON-journal-unbalanced` | Journal doesn't balance `[EXPENSIVE]` | group `journal_entries` by journal/period, debits vs credits. **Field names unverified — start from `well_get_schema`** | non-zero net beyond 0.01 | red |
| `RECON-fx-rate-missing-or-stale` | Conversion on a stale/absent rate | cross-currency invoices: `exchange_rate_pk` populated and its `rate_date` inside the window | null rate, or `rate_date` > 4 days before the txn date | red |
| `RECON-failed-automation-run` | Failed run left work half-done | `blueprint_runs` / `tasks` in failed states. **Status vocabularies unverified — schema-read first** | any failed run with no successful re-run after it | red |

`RECON-failed-automation-run` is the worst case *for the sweep itself*: every downstream skill
reads a partially-written period as a complete one, with no signal that it is short.

### `RECON-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `RECON-duplicate-account-rows` | Sync inserting instead of upserting | cluster `accounts` on `account_name` + `currency` + owning connector; compare provider id and the `created_at` cadence | §8 — the live 24× "Compte principal" case | red |
| `RECON-unposted-period` | Period has transactions, no entries | per month: `transactions` count vs `journal_entries` count | txns > 0 and entries = 0 for a period ending before the close cutoff §13 | red |
| `RECON-txn-no-ledger-account` | Transaction cannot post | `transactions.ledger_account_pk _is_null` past the close cutoff | any row | red |
| `RECON-account-never-reconciled` | An account excluded entirely | per workspace-owned account, in-window txn count vs how many carry an edge | **0% match rate across the whole window** | red |
| `RECON-account-current-balance-missing` | No open balance row | per account, `balance_at_to _is_null`, newest first | no open row, or `balance_at_from` older than 48h | red |
| `RECON-ledger-account-period-coverage` | Expense account with no period balance | expense `ledger_accounts` joined to `account_balances` | no row in a period that has transactions | amber |
| `RECON-sync-coverage-gap` | Enabled but silently not syncing | latest sync log per enabled connector | failed, `completed_at` > 26h, or `in_progress` > 3h | red |
| `RECON-backlog-age-tail` | Unswept tail beyond the window | oldest item per queue, `orderBy` asc limit 1 | oldest > 30 days, or any queue's count growing 3 sweeps running | amber |

`RECON-txn-no-ledger-account` is the subtle one: a transaction with no ledger account cannot
post, so `RECON-unposted-period` reads **green** while the period is structurally incomplete —
a breadth gap masquerading as depth.

`RECON-account-never-reconciled` matters because cash-position totals the account while
expense-breakdown never explains its spend. **A per-account 0% match rate is an excluded bucket,
not a coincidence.**
