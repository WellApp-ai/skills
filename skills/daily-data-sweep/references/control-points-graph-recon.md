# Entity graph and reconciliation — GRAPH-, RECON-

Gates 4 and 5. Cross-root join families; both share the non-atomicity caveat — re-verify a red before reporting it.

**Precedence:** where a severity or threshold below disagrees with `tolerances.md`, **tolerances.md
wins** — the tolerance is the business policy, the row is its restatement.

---

## Control points — ENTITY GRAPH (`GRAPH-`)

**Every check here filters `deleted_at IS NULL` on
every root traversed, on both sides of every join.** For a check that resolves a foreign key
to a **related** root (a dangling-reference check — an FK that is non-null but points at an
absent or soft-deleted row), write the predicate against the **relation**, e.g.
`_not: {relation: {}}`, never a bare `_is_null` on the id column: the relation traversal respects
`deleted_at IS NULL` and workspace scope server-side, while a raw `_is_null` on the FK column
does not see a soft-deleted target at all. Confirmed live — `mcp-surface-limits.md` § CORRECTION.

### `GRAPH-` COMPLETE (depth)

| id | name | check | fail signal | sev | bucket | → |
|---|---|---|---|---|---|---|
| `GRAPH-credit-note-sign-unresolved` | Credit notes not sign-distinguished | group `invoices` by `document_type_code` (UBL `380` invoice / `381` credit note / `383` debit note); check the sign convention of `grand_total`, `items_total`, `balance_due`, `paid_amount` within each code | null or non-UBL code; a `381` whose `grand_total` is positive while `380` is also positive; mixed convention within `381` | red | complete | **not one of the 12 skills mentions `document_type_code`** — yet expense-breakdown, bills-due, accounts-receivable-aging and rank-clients-by-ltv all sum across the invoice population. If `381` is stored positive, every credit note **inflates** AP and AR instead of reducing them, and a refunded customer is credited twice. A silent systematic overstatement in four skills at once |
| `GRAPH-journal-entry-unbalanced` | Debits ≠ credits | group `journal_entries` by parent journal; sum debit vs credit side. **Resolve the parent FK and amount fields via `well_get_schema` — no skill exposes them; do not hardcode** | sides differ by > 0.01; or a group with exactly one line (half-posted) | red | complete | expense-breakdown and runway prefer the ledger *because it's authoritative*. An unbalanced entry makes the preferred path **less** trustworthy than the fallback it overrides, and neither skill can detect the inversion |
| `GRAPH-journal-entry-unposted-or-dangling` | Entry not posted to a journal/ledger account | `journal_entries` where the journal or ledger-account FK is null, or points at an absent / soft-deleted row | any row | red | complete | invisible to every ledger aggregation while still existing — ledger spend under-reports against the same period's transactions with no error surfaced |
| `GRAPH-invoice-items-vs-header-totals` | Line items don't sum to the header | group `invoice_items` by parent invoice; compare line sum vs `items_total`, line tax vs `tax_total`; check the accounting-side triplet independently of the local one | difference > 0.01; non-zero `grand_total` with zero live items; the two triplets diverge | amber | complete | **what a header-internal check cannot see**: the header can balance perfectly while line detail is missing or contradictory. `draft-invoice` accepts `totals` and `line_items` as *independent* inputs, so divergence is structurally possible on every write |
| `GRAPH-account-ownership-unresolvable` | Account provenance unestablished | `accounts` where `workspace_connector_pk _is_null`, cross-checked against `ownership`; flag rows where `ownership` is also null/unknown | both null | red | complete | cash-position and cash-balance-trend must count only workspace-owned accounts. Where the connector FK is null, **`ownership` is the only discriminator left** — if it's unset too, a counterparty account can be summed into cash and runway inherits the inflated numerator |
| `GRAPH-account-open-balance-row-invalid` | Missing, duplicated or stale current snapshot | count live `account_balances` per account where `balance_at_to _is_null true`; `orderBy balance_at_from desc` and age the newest one against tolerance 6a | zero open rows, **or two or more**, **or** an open row whose `balance_at_from` is older than 48h | red | complete | zero → the account contributes nothing to cash; duplicate open rows → **the same balance counted twice**; stale → cash-position reads a closed period as "current". All three produce a plausible number with no error raised. **This is the canonical open-balance control point** — `ING-account-no-open-balance-row` and `RECON-account-current-balance-missing` checked the same population and were folded in here |
| `GRAPH-transaction-counterparty-unresolved` | No resolvable counterparty | `transactions` where both `debtor_payment_means` and `creditor_payment_means` are null, plus means resolving to no live company/person/account | any row | amber | complete | payment-invoice-lookup must list unmatched payments "with counterparty if resolvable", and company-profile reaches transaction history *only* through this chain — a broken link hides a vendor's payment history while the 360 view still renders complete |
| `GRAPH-person-not-linked-to-company` | Unaffiliated people | `people` with a null company FK or one pointing at an absent/deleted company | any row, reported as a share | amber | complete | an unreachable island: the row exists, no skill can route to it, and the profile it should enrich reports no contacts |
| `GRAPH-company-no-contact-channel` | No contact channel on file | `companies` with zero live `emails`, `phones` and `web_links` | any company that was an `issuer_pk`/`receiver_pk` in the last 12 months; amber for dormant | amber | complete | company-profile must return channels as a first-class section, and any follow-up on AR/AP output has no address to send to |

**Invoice↔transaction edge mechanics are not checked here.** Currency, `full`-allocation amount and
dangling sides are properties of the edge, so the proof chain owns them; the gate-4 copies counted
the same edge a second time under a second id. Canonical ids, carrying every threshold and arm the
deleted rows held:

- `GRAPH-invoice-transaction-currency-mismatch` → **`BOOK-edge-currency-consistent`**, which now
  carries the transaction-side comparison against `transactions.instructed_amount.currency`, the
  rule that `accounting_currency` is accepted only when `exchange_rate_pk` resolves **live**, and the
  **dangling** (not merely null) rate arm.
- `GRAPH-invoice-transaction-amount-mismatch`, the `full`-allocation arm → **`BOOK-edge-amount-agrees`**,
  which now carries tolerance §14 spelled out (0.01 same-currency, **0.5% cross-currency**) and the
  transaction-amount arm alongside the edge-`amount` arm. Its warning survives there: the summed-edge
  and `paid_amount` directions belong to `RECON-partial-allocation-shortfall`,
  `RECON-paid-amount-vs-allocation` and `BOOK-edge-overallocated` — checking them together on one row
  counts the same invoice four times.
- `GRAPH-invoice-transaction-dangling-side` → **`BOOK-edge-dangling`**.
- `GRAPH-invoice-document-pk-dangling` → **`DOC-02`**, the definitional row: it holds the live Hasura
  predicate and is the `B` term of the two-direction bound. `BOOK-document-resolves` was a third copy
  of the same population and is removed with it.

The stakes survive on the canonical rows: a EUR payment bound to a USD invoice makes
payment-invoice-lookup's settlement assertion false while fx-exposure counts the same money under two
currencies; a `full` edge hiding a residual **drops the invoice out of AR-aging and bills-due
entirely**, which a header-only `paid_amount`/`balance_due` check cannot catch because those fields
were written from the same bad edge; an edge that exists and resolves to nothing has **no branch** in
payment-invoice-lookup, so it reports a match it cannot display; and a populated pointer to a deleted
document is a **false green — worse than the gap missing-receipts was written to find**.

**Uncategorized transactions are not checked here.** The canonical control point is
`RECON-txn-uncategorized` and its tolerance 9 per-cause ladder. The former
`GRAPH-transaction-uncategorized` row carried a third, incompatible severity rule for the same
population — amber below 10% of the window, red above — **superseded by tolerance 9**; do not
re-add it. Its one durable contribution stands: the category FK on `transactions` must be resolved
via `well_get_schema` (the `categories` root exists, and no skill verifies the FK), so
`RECON-txn-uncategorized` resolves it there rather than assuming `category_key` is the only link.

### `GRAPH-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | bucket | → |
|---|---|---|---|---|---|---|
| `GRAPH-entity-class-silently-empty` | Root empty despite an enabled connector | `limit: 1` probe per root, cross-referenced with enabled `workspace_connectors` + `connector.slug` | banking enabled with `accounts`/`transactions` empty; invoicing enabled with `invoices`/`companies` empty; either with `journals` empty | red | exhaustive | **this control point IS every skill's "data presence, not connector status" gate — run once centrally instead of twelve times inconsistently** |
| `GRAPH-company-identity-fragmentation` | Duplicates **and** unusable dedup keys | collisions on non-null `canonical_tax_id`, on `domain_normalized`, on (`canonical_registry`, `registry_country`, `establishment_no`), and on normalized `canonical_legal_name`; **plus report the null rate of the two strong keys** | any strong-key collision; **or** a null rate high enough that strong keys cover only a minority | red | exhaustive | two failures, one root. Collisions mis-rank LTV and stall company-profile. But **the null rate is the more serious finding**: where both strong keys are null, dedup falls back to legal name, so non-fragmentation cannot be asserted for that slice. **Report the covered share, never a bare green** |
| `GRAPH-duplicate-invoice-identity` | Same invoice ingested twice | collisions on (`issuer_pk`, `invoice_number`, `document_type_code`) and (`issuer_pk`, `reference_number`, `grand_total`, `issue_date`); **segment by `source_workspace_connector_pk`** | more than one live row per group | red | exhaustive | distinct from duplicate *company* identity — counterparty clean, invoice doubled. The connector segmentation is what tells you whether one connector re-ingested or two connectors reported the same document |
| `GRAPH-ledger-coverage-vs-source` | Ledger coverage vs invoices/transactions | counts of `ledger_accounts`, `journals`, `journal_entries` vs `invoices`/`transactions` over the window | ledger roots at zero while sources are populated; or a populated window with no entries posting from it | red | exhaustive | the output says "ledger-based" while half the period is unposted — the skill flags an approximation **it cannot know it is making** |
| `GRAPH-ledger-account-tree-broken` | Chart of accounts orphaned | `ledger_accounts` whose parent FK is absent/deleted; plus accounts with zero posting entries | any orphan subtree | amber | exhaustive | children's totals never roll up into any reported parent, so **the presented categories sum to less than total spend with no residual line to show it** |
| `GRAPH-orphan-media` | Branding assets attached to nothing | live `media` with no live parent. **`media` only** — orphan `documents` are `DOC-08`, which owns both arms of that predicate; see the note below the table | any orphan medium | amber | exhaustive | `media_type` is `avatar`, `logo` or `banner` only, so an orphan medium is stale branding debt, not a lost receipt. It is amber for that reason, and it **must never enter the attachment error rate** — including it inflates the bookkeeping defect count |
| `GRAPH-payment-means-island` | Instruments linked to nothing | `payment_means`, `invoice_payment_means`, `cards`, `checks` with no live owner | any island row | amber | exhaustive | the upstream cause of `GRAPH-transaction-counterparty-unresolved`. Companies have no direct FK to transactions — the only route is through `payment_means`, so **one island instrument hides many payments at once** |

**Orphan *documents* are not checked here.** The canonical control point is `DOC-08`, which owns the
whole orphan-`documents` predicate in two arms — (a) receipt-capable MIME and `size > 1024`, red, and
the `C` term of the two-direction attachment bound; (b) every other orphan document, amber, storage
debt. The former `GRAPH-orphan-documents-and-media` bundled `documents` and `media` into one amber
with no MIME or size filter, which both under-graded the receipt case and let branding assets into an
attachment error rate they have no business in. The split is by root: `documents` → `DOC-08`, `media`
→ `GRAPH-orphan-media` above, so the narrowing costs no coverage. The stake survives on `DOC-08`: an
orphan receipt is a file Well **already holds and reports as missing** — a false compliance gap — and
paired with `DOC-02` the two directions bound the real attachment error rate, which neither alone does.

**Sync freshness and log coverage are not checked here.** The canonical control points are the
`ING-` gate-2 set, which owns each arm separately at the tolerance 7b thresholds:
`ING-sync-stale-no-recent-success` (26h), `ING-sync-stuck-in-progress` (3h),
`ING-sync-last-attempt-errored` (latest `status _eq error`),
`ING-connector-never-synced-breadth` (enabled connector with zero logs) and
`ING-connector-produced-no-records` (success with zero rows, including the distinct
`invoices.source_workspace_connector_pk` cross-check). The former
`GRAPH-sync-freshness-and-log-coverage` bundled all five into one red on the same connector
population, which is the single largest contributor to the inflated red count. The reason it existed
still holds and belongs in the report: all twelve skills read this root to say "still syncing,
results may be partial" — an unlogged connector makes that warning impossible, so all twelve present
stale data under a **false as-of date**.

**Journal period continuity is not checked here.** The canonical control point is
`RECON-unposted-period`, which runs the same monthly `transactions`-vs-`journal_entries` comparison
gated on the tolerance 13 close cutoff (5th business day of M+1) and is red rather than amber. The
former `GRAPH-journal-period-continuity` scanned 12 months at amber with no cutoff gate, so it went
amber on the open period by construction. Its stake stands: an unposted month **shrinks runway's
divisor silently, making runway look longer** for a data reason that never appears in the answer.

### A principle worth keeping

**No invariants** are authored on `blueprint_runs`, `tasks`, `billing_events`,
`chat_conversations`, `memberships`, `locations`, `subscription`, `override_version`,
`billing_context` — no skill breaks or lies if they drift. **A red nobody
can act on trains the operator to ignore the sweep.** Apply that test to every control point
added later.

## Control points — RECONCILIATION & CLOSE (`RECON-`)

`[EXPENSIVE]` = the check needs a **client-side reduce** — a sum, a group-by or a cluster — over a
row set larger than one response can return. **There is no pagination**: `nextCursor` is `null` on
every response at every `limit`, and there is no offset parameter (`iteration-protocol.md` B.1 and
§ MEASURED REALITY 1). So there is nothing to page through and nothing to resume: an `[EXPENSIVE]`
control point is **`SAMPLED` by construction whenever `returned < totalCount`**, and that is the
normal case, not an anomaly. Two honest options, in order: **narrow the filter** — by month, by
connector, by `document_type_code` — until one response covers the population and the reduce is
complete; or report **`SAMPLED` with the `returned`/`totalCount` pair**, which is what makes the
verdict auditable. Never a bare `pass`. These still belong on a **slower cadence** than the cheap
`totalCount` probes, because each one costs a full row fetch rather than a count.

**Windowing rule for every check below:** window on
`COALESCE(booking_date, value_date, executed_at)` — **never on `booking_date` alone.** It is
nullable in production, and filtering on a nullable column excludes exactly the rows most likely
to be defective, so the sweep's blind spot becomes its clean bill of health.

### `RECON-` COMPLETE (depth)

| id | name | check | fail signal | sev | bucket |
|---|---|---|---|---|---|
| `RECON-txn-no-invoice-link` | Unmatched transactions | in-window `transactions` with no `invoice_transactions` row | older than the 2-business-day grace | red | complete |
| `RECON-invoice-no-txn-link` | Invoice settled outside the graph | in-window `invoices` with no edge | `payment_status` paid/partial or `paid_amount > 0` with zero edges | red | complete |
| `RECON-paid-invoice-no-payment` | Paid with no cash movement | `payment_status: paid`, no edge; `last_payment_allocation_date` populated with no edge is the stronger signal | any row | red | complete |
| `RECON-paid-amount-vs-allocation` | `paid_amount` ≠ matched cash `[EXPENSIVE]` | sum matched txn amounts per invoice vs `paid_amount` | gap > tolerance §14 | red | complete |
| `RECON-partial-allocation-shortfall` | Allocations short of total `[EXPENSIVE]` | allocation sum vs `grand_total`, **gated on `payment_status: paid`** — the gate is what keeps it here rather than in the proof chain. The ungated opposite direction is `BOOK-edge-overallocated` | sum < total beyond tolerance §14 | red | complete |
| `RECON-invoice-totals-drift` | `items_total + tax_total` ≠ `grand_total` `[EXPENSIVE]` | compare per invoice; **compare on absolute value per `document_type_code`** — 381/383 may carry opposite signs. Header-internal only; line-items-vs-header is `GRAPH-invoice-items-vs-header-totals` | gap > 0.01 in `local_currency` | red | complete |
| `RECON-balance-due-status-drift` | `balance_due` contradicts `payment_status` `[EXPENSIVE]` | `balance_due = 0` with unpaid/partial; `> 0` with paid; or `paid_amount + balance_due ≠ grand_total` | any row | red | complete |
| `RECON-txn-missing-document` | Transaction with no receipt | many-to-many — **resolve the relation name via `well_get_schema`, do not hardcode** | past the 5-business-day grace | amber | complete |
| `RECON-txn-uncategorized` | No category — **the one canonical uncategorized control point** | `category_key _is_null`, **split by `category_status` and `category_source`**; resolve the category FK via `well_get_schema` rather than assuming `category_key` is the only link | per-cause ladder §9 | §9 | complete |
| `RECON-low-confidence-category` | Below the **category** trust floor — **transactions, not edges** | `category_key` non-null, `category_confidence < 0.70` (tolerance 10), `category_source` = classifier not human. **Not a duplicate of `BOOK-edge-confidence-floor`**: this is the classifier's confidence in a category on `transactions`; that one is the matcher's confidence on an `invoice_transactions` edge, floor 0.85. Tolerance 10 governs both floors, which makes them *read* alike — they watch different populations and different fields, so do not merge them | older than 10 business days, or > 5% of period spend by value | amber | complete |
| `RECON-duplicate-payment-candidates` | Same amount, counterparty, near dates `[EXPENSIVE]` | cluster on amount+currency+counterparty means within 3 calendar days | ≥2 in cluster **plus a corroborator** §4 | red | complete |
| `RECON-balance-verification-failure` | Balance self-verification failing | `verification_error _eq true`, read `calculated_` vs `expected_balance_diff` | dual threshold §6b | red | complete |
| `RECON-fx-rate-missing-or-stale` | Conversion on a stale/absent rate | cross-currency invoices: `exchange_rate_pk` populated and its `rate_date` inside the window | null rate, or `rate_date` more than tolerance 5's 4 calendar days before the txn date | red | complete |
| `RECON-failed-automation-run` | Failed run left work half-done | `blueprint_runs` / `tasks` in failed states. **Status vocabularies unverified — schema-read first** | any failed run with no successful re-run after it | red | complete |

`RECON-failed-automation-run` is the worst case *for the sweep itself*: every downstream skill
reads a partially-written period as a complete one, with no signal that it is short.

**Allocation over-run, edge-match confidence and the missing-document gap are not checked here.**
All three are properties of the proof chain, and each was carried by a second id in this family at a
different severity or grace:

- `RECON-overallocated-invoice` → **`BOOK-edge-overallocated`** — the same sum over the same edge
  population in the same direction. The `[EXPENSIVE]` marker moves with it: the sum is a client-side
  reduce, not a `totalCount` probe, so it is `SAMPLED` by construction unless the filter is narrowed
  until one response covers the edge population.
- `RECON-provisional-match-backlog` → **`BOOK-edge-confidence-floor`**, which now carries the
  `edge_status: provisional` arm, tolerance 10's 0.85 match floor and the 10-business-day age gate.
  Read it with the `confirmed` trap documented alongside it: `edge_status` defaults to `confirmed`,
  so an empty provisional backlog can mean the review tier is unused rather than clear.
- `RECON-invoice-missing-document` → **`BOOK-invoice-has-document`**, which now carries the in-window
  scoping. Its grace is the differentiated `DOC-` ladder, which supersedes the flat 5-business-day
  receipt grace and the flat amber this row carried: 3 business days after `issue_date` by default;
  **5 calendar days and red from the first occurrence** for card/expense receipts above the €25 FR
  simplified-invoice VAT threshold; 10 days and **amber** for transfer-settled supplier invoices. The
  transaction side stays here as `RECON-txn-missing-document` — a different population.

**Journal balance is not checked here.** The canonical control point is
`GRAPH-journal-entry-unbalanced`, which runs the same debit-vs-credit comparison at the same 0.01
threshold and additionally catches the half-posted single-line group. The former
`RECON-journal-unbalanced` checked the same population; its caveat is preserved on the `GRAPH-` row —
the parent FK and amount fields are exposed by no skill and must come from `well_get_schema`, never
hardcoded.

### `RECON-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | bucket |
|---|---|---|---|---|---|
| `RECON-duplicate-account-rows` | Sync inserting instead of upserting **within one connector** | cluster `accounts` on `account_name` + `currency` + owning connector; compare provider id and the `created_at` cadence. The **cross-connector** pair is `ING-duplicate-account-cross-connector`, which this clustering structurally cannot see | tolerance §8: ≥2 rows share the triple **and** (identical provider `account_id` **or** `account_id` null on ≥2); or the cadence corroborator alone — ≥3 rows for one triple created within 24h at a constant interval ±10 min | red | exhaustive |
| `RECON-unposted-period` | Period has transactions, no entries — **the one canonical posting-continuity control point** | per month: `transactions` count vs `journal_entries` count | txns > 0 and entries = 0 for a period ending before the close cutoff §13 | red | exhaustive |
| `RECON-txn-no-ledger-account` | Transaction cannot post — **the one canonical ledger-mapping control point** | `transactions.ledger_account_pk _is_null` past the close cutoff §13; **plus `ledger_account_role` consistency on the rows that do carry a ledger account** (the arm carried over from `BANK-txn-ledger-mapped`, folded in here) | any row | red | exhaustive |
| `RECON-account-never-reconciled` | An account excluded entirely | per workspace-owned account, in-window txn count vs how many carry an edge | **0% match rate across the whole window** | red | exhaustive |
| `RECON-ledger-account-period-coverage` | Expense account with no period balance | expense `ledger_accounts` joined to `account_balances` | no row in a period that has transactions | amber | exhaustive |
| `RECON-backlog-age-tail` | Unswept tail beyond the window | oldest item per queue, `orderBy` asc `limit 1` — a single-run extremum, no prior sweep required | oldest > 30 days | amber | exhaustive |

**Sync coverage and the missing open balance row are not checked here.** `RECON-sync-coverage-gap`
applied the same three predicates as `ING-sync-last-attempt-errored`,
`ING-sync-stale-no-recent-success` (26h) and `ING-sync-stuck-in-progress` (3h) to the same connector
population — one red per connector instead of three, counted once at gate 2.
`RECON-account-current-balance-missing` is folded into
`GRAPH-account-open-balance-row-invalid`, which now carries its 48h tolerance 6a staleness arm
alongside the zero and duplicate directions.

**Ledger mapping is not checked at gate 3.** `BANK-txn-ledger-mapped` applied the same
`ledger_account_pk _is_null` predicate to the same population **ungated**, firing red on any row —
so it went red on the open period by construction, which tolerance 13 exists to prevent. It is
removed in favour of `RECON-txn-no-ledger-account` above, which carries its `ledger_account_role`
consistency arm.

`RECON-txn-no-ledger-account` is the subtle one: a transaction with no ledger account cannot
post, so `RECON-unposted-period` reads **green** while the period is structurally incomplete —
a breadth gap masquerading as depth.

`RECON-account-never-reconciled` matters because cash-position totals the account while
expense-breakdown never explains its spend. **A per-account 0% match rate is an excluded bucket,
not a coincidence.**
