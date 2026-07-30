# Banking control points — BANK-

Gate 3. Chart-readiness: transactions, counterparty, cards, FX, source-side defects, the duplicate surface, the burn/runway blocker. A red here blocks every chart.

---

## PRIORITY FAMILY — banking data must be chart-ready (`BANK-`)

This is the **first family the sweep runs**, and the reason the skill exists: before any chart
renders (cash position, cash trend, burn/runway, expense breakdown, FX exposure), the banking
data behind it must be complete AND exhaustive. Scope is **every workspace the caller can
access**, reported per workspace, never merged.

### Live audit — all 3 workspaces, probed 2026-07-29

Run against Maxime (`2b18112f`), WELL APP INC. (`c3f54fe3`), WellappFR (`1c5c706f`). These are
measured, same-moment counts — not estimates. **The verdict today is: charts must not render.**

| what | measured | verdict |
|---|---|---|
| transactions, total | **1,904** | baseline |
| uncategorized (`category_key IS NULL`) | **788 = 41.4%** | 🔴 every category chart is wrong by construction |
| **ledger mapping** (`ledger_account_pk IS NULL`) | **1,904 = 100%** | 🔴 **not one transaction is mapped to a ledger account** |
| no payment means at all (both FKs null) | **155 = 8.1%** | 🔴 counterparty unresolvable for those rows |
| cards, total | **4** | — |
| cards with `anonymized_pan` | **0 of 4** | 🔴 the field exists and is never populated |
| cards with an owner (`company_pk` / `people_pk`) | **0 of 4** | 🔴 orphan cards |
| `transactions.foreign_exchange` populated | **0 in every sample, incl. USD rows** | 🔴 no FX attached at transaction level |
| `exchange_rates` catalogue | **76,260 rows**, source `ExchangeRate-API`, `rate_date` = yesterday, EUR-based both directions, `workspace_pk: null` (global) | ✅ the rates exist — nothing consumes them |
| `transactions.scheme` | **null on every sampled row** | 🔴 card transactions are **not identifiable by scheme** |
| accounts | **30**, of which **~24 duplicate one account** on an hourly cadence; **3** with `currency: null`; `workspace_connector_pk` null on **all 30** | 🔴 cash summed ~24× |
| balance verification | **6** rows `verification_error = true`, `verified_at` null on all 6 | 🔴 |
| journal entries | 117 (Xero + Pennylane), **none in the third workspace** | 🟡 |

**Five defects here are each independently sufficient to make a cash or burn chart wrong.** The
duplicate accounts multiply cash; the 100% null ledger mapping empties the ledger path; 41%
uncategorized guts the category chart; the missing FX attachment silently mixes USD and EUR; the
6 unverified balances are off by known amounts.

### Two structural findings from the live probe

**1. The same real payment is ingested twice, with opposite signs.** WellappFR has both a direct
`qonto` connector and a `plaid_ins_137879` ("Qonto (FR)") connector on the same account. Observed
pairs:

- Malakoff Humanis retirement: `qonto` → `{amount: +2150.32, EUR}`; `plaid_ins_137879` →
  `{amount: -2150.32, EUR}` — same remittance, same day.
- GoCardless: `qonto` → `+0.01`; `plaid_ins_137879` → `-0.01`.

Depending on how a chart aggregates, this either **nets to zero** (hiding real spend) or
**double-counts** (inflating it). `transaction_external_id` will not catch it — the two
connectors mint different ids for the same movement. The identity key must be
(amount magnitude, currency, date, normalized remittance), segmented by account.

**2. The label already contains the identifiers nobody extracts.**
`transactions.remittance.unstructured` carries, in plain text:

```
"RETRAITE - MALAKOFF HUMANIS - 202606M - SIRET 99091585200018 - G0338946975"
"Malakoff Humanis - … - IBAN: FR7630004008280001223932276"
```

**A French SIRET and a full IBAN are sitting in the label, unextracted** — while
`GRAPH-transaction-counterparty-unresolved` reports the counterparty as unknown and the FR
e-invoicing control points report the company as incomplete. The extraction that would fix
counterparty mapping, bank→company mapping, and FR tax identity **already has its input**. Same
for the card case: `cards.last_four_digits` is populated (1332, 1099, 5179, 2024) while
`anonymized_pan` is null — so partial extraction is happening and stopping short.

### `BANK-` control points

Confirmed field shapes: `instructed_amount` / `settlement_amount` =
`{"amount": <number>, "currency": "<ISO>"}`. `remittance` = `{"unstructured": "<label>"}`.
`account_balances.foreign_exchange` = `[{currency_rate, currency_pair, currency_rate_source,
currency_rate_at}]`. `payment_means` = 14 fields (`account_pk`, `card_pk`, `check_pk`,
`company_pk`, `people_pk`, `name`, `payment_means_external_id`, …). `cards` = 16 fields
(`anonymized_pan`, `last_four_digits`, `brand`, `cardholder_name`, `type`, `expiration_date`,
`company_pk`, `people_pk`, …).

#### Transactions complete

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-txn-categorized` | Every transaction categorized | `transactions.category_key _is_null`, split by `category_status` | any; **live 788/1904 = 41.4%** | red |
| `BANK-txn-category-resolves` | Category is a live catalogue entry | `category_key` resolves to a live `categories` row; also check `category_taxonomy_version` is uniform | dangling key, or mixed taxonomy versions in one chart window | red |
| `BANK-txn-amount-nonzero` | Amount is real | `instructed_amount.amount` null **or `= 0`** | any; **live: a `{amount: 0, EUR}` Reddit Ads row exists** | red |
| `BANK-txn-amount-currency` | Amount carries a currency | `instructed_amount.currency` null | any | red |
| `BANK-txn-date-present` | Datable | `booking_date IS NULL` **and** `value_date IS NULL` **and** `executed_at IS NULL`; window on `COALESCE` of the three | any | red |
| `BANK-txn-ledger-mapped` | Mapped to a ledger account | `ledger_account_pk _is_null`, and `ledger_account_role` consistency | any; **live 1904/1904 = 100%** | red |
| `BANK-txn-no-cross-connector-dup` | Same movement not ingested twice | group by (abs(`instructed_amount.amount`), currency, date, normalized `remittance.unstructured`) across **different** `source_workspace_connector_pk` on the same account | any group ≥2; **live: confirmed on Qonto direct vs Plaid Qonto** | red |
| `BANK-txn-no-external-id-dup` | No re-ingestion within a connector | (`source_workspace_connector_pk`, `transaction_external_id`) collisions | any | red |

#### Counterparty, bank and logos

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-txn-has-payment-means` | Attached to a payment means | both `debtor_payment_means_pk` and `creditor_payment_means_pk` null | any; **live 155/1904 = 8.1%** | red |
| `BANK-txn-counterparty-company` | Resolves to a company | means → `payment_means.company_pk`; null, or resolves only to `people_pk` | any | red |
| `BANK-txn-siret-iban-unextracted` | Identifier present in label, not extracted | `remittance.unstructured` matches a SIRET (14 digits) or IBAN pattern **while** the counterparty company is unresolved or lacks `canonical_tax_id` | any; **live: confirmed** | red |
| `BANK-account-bank-company` | Account maps to its bank | `accounts.bank_company_pk _is_null` | any | red |
| `BANK-company-has-logo` | Logo available for charting | `companies.primary_media _is_null` for any company appearing as a transaction counterparty or an account's bank | any | amber |
| `BANK-logo-enrichment-ran` | Distinguish "no logo" from "never tried" | `primary_media` null **and** no enrichment attempt recorded | any | amber |

#### Cards and payment means

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-card-pan-anonymized` | Card carries an anonymized PAN | `cards.anonymized_pan _is_null` | any; **live 4/4 null while `last_four_digits` IS populated** | red |
| `BANK-card-pan-never-raw` | PAN is never stored raw | `anonymized_pan` matching a full unmasked PAN pattern (13–19 consecutive digits, Luhn-valid) | any | **red — treat as a compliance incident, not a data defect** |
| `BANK-card-owned` | Card has an owner | `cards.company_pk` and `people_pk` both null | any; **live 4/4** | red |
| `BANK-card-metadata` | Card is identifiable | `brand`, `type`, `cardholder_name`, `expiration_date` null | any | amber |
| `BANK-card-txn-identifiable` | Card transactions can be found at all | `transactions.scheme` null population-wide → **scheme cannot classify card spend**; fall back to `payment_means.card_pk` non-null, else label markers | scheme null on >90% of rows; **live: null on every sampled row** | red |

#### FX

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-fx-attached` | FX attached on non-local currency | `instructed_amount.currency` ≠ workspace currency **and** `foreign_exchange _is_null` | any; **live: 0 rows populated, incl. USD** | red |
| `BANK-fx-rate-exists` | A rate exists for the pair and date | `exchange_rates` where `source_currency`/`target_currency` match and `rate_date <=` txn date, within 4 days (§5) | none found | red |
| `BANK-fx-rate-source` | Provenance recorded | `foreign_exchange[].currency_rate_source` missing | any | amber |
| `BANK-fx-one-rate-per-pair-day` | No two rates for one pair/day | duplicate (`source_currency`, `target_currency`, `rate_date`) with differing `rate` | any | amber |

#### Source-side defects the sweep can only report, never fix

Five findings where the sweep is correct to go red **and the fix is a writer, not a check**.
Reporting these as data-quality items would send someone hunting for bad rows when the cause is
missing code.

| finding | evidence | consequence |
|---|---|---|
| **`transactions.foreign_exchange` has NO writer** | zero writers anywhere in `apps/api/src` — not Plaid, not `connector.service.ts`, not any slot mapping. Meanwhile `field-metadata-resolver.ts:559-563` wires a `composite_fx_rate` display cell onto transactions | the FX column in Records renders a field **nothing populates**. `BANK-fx-attached` is 100%-red by construction. Every multi-currency total converts at read-time spot with nothing recorded on the row — the chart is not wrong, it is **unauditable**: re-run next month and the same historical transaction converts differently |
| **`cards.anonymized_pan` has NO writer** | only 3 references: the entity declaration, and a dedup rule at `entity-rules.ts:240` matching `{col: "anonymized_pan", op: "exact"}` | **that dedup rule can never fire.** It silently degrades to `last4 + expiration + holder` — and expiration and holder are **both null** on every Plaid-minted card, so **no card dedup rule can fire at all**. One real card splits across N rows |
| **Card extraction is Plaid-only and is substring guessing** | `extractCardLastFourDigits`, `plaid.service.ts:1360-1407`, called only at `:1665` and `:1913`. Takes **every isolated 4-digit run** in the label and returns the last one. **No requirement that the label contain any card marker** — no `CB`, `CARTE`, `VISA`, `POS` | "STORE 4021", a year, or an order number **mints a `cards` row**. No confidence is computed or stored. Every non-Plaid connector does no extraction at all. This is precisely the substring branching the repo standard forbids |
| **The structured card marker exists and is never set** | `TransactionTypeEnum` includes `CARD_PAYMENT`, but Plaid writes `type: isDebit ? PAYMENT : DEPOSIT` (`plaid.service.ts:1650`) — **on the very same row where it extracted a card last-four 15 lines later** | card spend is **not selectable by `type`**, and `transaction_scheme_enum` has no card member either. Any "card transactions" control point reads green **vacuously**. Query gotcha: enum values are prose — filter on `"Credit/debit card transactions"`, not `"CARD_PAYMENT"` |
| **`category_key` does not reference the `categories` root** | `categories` has only `name` + `category_type` and no `key` column. The transaction taxonomy is a **code-side catalog** — 47 keys in `transaction-category.const.ts`, `TAXONOMY_VERSION = 1` | "dangling category" is a **set-membership check against the 47 shipped keys**, not a join. A chart joining `category_key → categories.name` returns **empty, not wrong-but-plausible** |

#### Where duplicates actually live

`idx_transactions_connector_external_id_unique` is **partial**: it covers
`(workspace_pk, source_workspace_connector_pk, transaction_external_id)` only
`WHERE deleted_at IS NULL AND transaction_external_id IS NOT NULL AND TRIM(...) <> '' AND
source_workspace_connector_pk IS NOT NULL`.

So a collision **within** those predicates is structurally impossible — if the sweep finds one,
the index is missing. **The duplicate risk surface is the rows the index does not reach:** null or
blank `transaction_external_id`, or null `source_workspace_connector_pk`. Report *that* count, not
the structurally-zero collision count. And cross-connector id reuse is classified `review`, not
`duplicate` — never auto-merge it.

#### The hard blocker for burn and runway

`flow_kind` (`supplier_payment | customer_receipt | same_entity_transfer |
intercompany_transfer | payroll | tax | bank_fee | standalone_bank_line | unknown`) is the **only
structured direction signal**. When transfers are not discriminable, moving €100k from current to
savings reads as **€100k of burn AND €100k of inflow**. Runway does not get slightly worse — **it
can invert sign**: a treasury sweep reads as catastrophic burn, an intercompany top-up reads as
revenue and runway prints as infinite. This alone must **hard-block** the render.
`services/canvas/_transfer-discriminator.ts` already handles it at query layer, so the failure
mode is any chart built **outside** that service.

Related: `accounts.ownership` defaults to `UNKNOWN` on historical rows. A both-sides-`OWN` or
neither-side-`OWN` check **passes vacuously** while `UNKNOWN` dominates — so gate the direction
check behind an ownership-classified check, or it is a false green.

#### Workspace currency and fiscal period — read-surface gap, not a schema gap

`workspaces` has exactly 14 fields and **none of them is an accounting currency, a legal form, or
a fiscal-period boundary.** So:

- `BANK-fx-attached` cannot be evaluated as specified — "non-local currency" has **no local
  currency to compare against** — unless the value lives in `workspaces.object` (jsonb).
- Any fiscal-period-bounded chart has **no statutory period to bound it to**. A legal-form →
  fiscal-year mapping needs `companies.business_type`, which in turn needs the own-company link
  that also does not exist.

Both are recorded as schema gaps rather than guessed. **Do not infer the workspace currency from
the most common transaction currency** — that is exactly the guessing the repo standard forbids,
and it would flip as soon as one large foreign payment lands.
