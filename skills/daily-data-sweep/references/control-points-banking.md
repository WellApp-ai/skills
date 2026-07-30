# Banking control points — BANK-

Gate 3. Chart-readiness: transactions, counterparty, cards, FX, source-side defects, the duplicate surface, the burn/runway blocker. A red here blocks every chart.

---

## PRIORITY FAMILY — banking data must be chart-ready (`BANK-`)

This is the **first family the sweep runs**, and the reason the skill exists: before any chart
renders (cash position, cash trend, burn/runway, expense breakdown, FX exposure), the banking
data behind it must be complete AND exhaustive. Scope is **every workspace the caller can
access**, reported per workspace, never merged.

### Measured baseline

Measured baseline (dated, re-probe before citing): [`baseline-2026-07-29.md`](baseline-2026-07-29.md).
No figure below is a standing fact. Evidence that these numbers move: uncategorized transactions
were **788** on 2026-07-29 and **793** on 2026-07-30 — one day, and the count changed.

### Two structural findings — structural, not counted

Both were observed on 2026-07-29 (see the baseline). They are recorded here because the *shape* of
the defect is what a control point is written against — the counts belong in the baseline file.

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

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BANK-txn-categorized` | Every transaction categorized | complete | `transactions.category_key _is_null`, split by `category_status` | any row | red |
| `BANK-txn-category-resolves` | Category is a live catalogue entry | complete | `category_key` is a **member of the 47 shipped keys** in `transaction-category.const.ts` — set membership, **not** a join, because `categories` has no `key` column (see § source-side defects); also check `category_taxonomy_version` is uniform | key outside the shipped set, or mixed taxonomy versions in one chart window | red |
| `BANK-txn-amount-nonzero` | Amount is real | complete | `instructed_amount.amount` null **or `= 0`** | any row | red |
| `BANK-txn-amount-currency` | Amount carries a currency | complete | `instructed_amount.currency` null | any | red |
| `BANK-account-has-currency` | complete | Every account states its currency | `accounts` where `currency _is_null` | any row | red | cash-position, cash-balance-trend, fx-exposure — a currency-less balance cannot be summed or converted |
| `BANK-txn-date-present` | Datable | complete | `booking_date IS NULL` **and** `value_date IS NULL` **and** `executed_at IS NULL`; window on `COALESCE` of the three | any | red |
| `BANK-txn-ledger-mapped` | Mapped to a ledger account | complete | `ledger_account_pk _is_null`, and `ledger_account_role` consistency | any row | red |
| `BANK-txn-no-cross-connector-dup` | Same movement not ingested twice | complete | group by (abs(`instructed_amount.amount`), currency, date, normalized `remittance.unstructured`) across **different** `source_workspace_connector_pk` on the same account | any group ≥2 | red |
| `BANK-txn-no-external-id-dup` | No re-ingestion within a connector | complete | (`source_workspace_connector_pk`, `transaction_external_id`) collisions | any | red |

#### Counterparty, bank and logos

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BANK-txn-has-payment-means` | Attached to a payment means | complete | both `debtor_payment_means_pk` and `creditor_payment_means_pk` null | any row | red |
| `BANK-txn-counterparty-company` | Resolves to a company | complete | means → `payment_means.company_pk`; null, or resolves only to `people_pk` | any | red |
| `BANK-txn-siret-iban-unextracted` | Identifier present in label, not extracted | complete | `remittance.unstructured` matches a SIRET (14 digits) or IBAN pattern **while** the counterparty company is unresolved or lacks `canonical_tax_id` | any row | red |
| `BANK-account-bank-company` | Account maps to its bank | complete | `accounts.bank_company_pk _is_null` | any | red |
| `BANK-company-has-logo` | Logo available for charting | complete | `companies.primary_media _is_null` for any company appearing as a transaction counterparty or an account's bank | any | amber |
| `BANK-logo-enrichment-ran` | Distinguish "no logo" from "never tried" | complete | `primary_media` null **and** no enrichment attempt recorded | any | amber |

#### Cards and payment means

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BANK-card-pan-anonymized` | Card carries an anonymized PAN | complete | `cards.anonymized_pan _is_null` | any row | red |
| `BANK-card-pan-never-raw` | PAN is never stored raw | complete | `anonymized_pan` matching a full unmasked PAN pattern (13–19 consecutive digits, Luhn-valid) | any | **red — treat as a compliance incident, not a data defect** |
| `BANK-card-owned` | Card has an owner | complete | `cards.company_pk` and `people_pk` both null | any row | red |
| `BANK-card-metadata` | Card is identifiable | complete | `brand`, `type`, `cardholder_name`, `expiration_date` null | any | amber |
| `BANK-card-txn-identifiable` | Card transactions can be found at all | exhaustive | `transactions.scheme` null population-wide → **scheme cannot classify card spend**; fall back to `payment_means.card_pk` non-null, else label markers | scheme null on >90% of rows | red |

#### FX

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BANK-fx-attached` | FX attached on non-local currency | complete | **INCONCLUSIVE — no workspace currency field on the MCP surface.** As specified: `instructed_amount.currency` ≠ workspace currency **and** `foreign_exchange _is_null`. `workspaces` exposes 14 fields and none is an accounting currency; `workspace_accounting_settings.base_currency` exists in the DB but is **not a read root**. Never substitute the most common transaction currency | not evaluable — emit `INCONCLUSIVE`, never a colour | blocked |
| `BANK-fx-rate-exists` | A rate exists for the pair and date | complete | **INCONCLUSIVE — the pair has no target side on the MCP surface.** As specified: `exchange_rates` where `source_currency`/`target_currency` match and `rate_date <=` txn date, within 4 days (§5). The target currency is the workspace currency (unreadable, above), and the row's own `foreign_exchange.currency_pair` has no writer (§ source-side defects) | not evaluable — emit `INCONCLUSIVE`, never a colour | blocked |
| `BANK-fx-rate-source` | Provenance recorded | complete | `foreign_exchange[].currency_rate_source` missing, on **`account_balances`** — the only root where `foreign_exchange` is populated. On `transactions` the field has no writer, so the same query reads red vacuously; that is the source-side finding below, not this control point | any row | amber |
| `BANK-fx-one-rate-per-pair-day` | No two rates for one pair/day | complete | duplicate (`source_currency`, `target_currency`, `rate_date`) with differing `rate` | any | amber |

#### Source-side defects the sweep can only report, never fix

Five findings where the sweep is correct to go red **and the fix is a writer, not a check**.
Reporting these as data-quality items would send someone hunting for bad rows when the cause is
missing code.

| finding | evidence | consequence |
|---|---|---|
| **`transactions.foreign_exchange` has NO writer** | zero writers anywhere in `apps/api/src` — not Plaid, not `connector.service.ts`, not any slot mapping. Meanwhile `field-metadata-resolver.ts:559-563` wires a `composite_fx_rate` display cell onto transactions | the FX column in Records renders a field **nothing populates**. This is why `BANK-fx-attached` is `blocked` rather than red — the defect is real but it surfaces *here*, as a missing writer, not as a colour on a control point that has no workspace currency to compare against. Every multi-currency total converts at read-time spot with nothing recorded on the row — the chart is not wrong, it is **unauditable**: re-run next month and the same historical transaction converts differently |
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

- `BANK-fx-attached` and `BANK-fx-rate-exists` are therefore `blocked` / `INCONCLUSIVE` in the table
  above: "non-local currency" has **no local currency to compare against**. If the value turns out to
  live in `workspaces.object` (jsonb), or `workspace_accounting_settings.base_currency` becomes a read
  root, both graduate to evaluable — until then neither may emit a colour.
- Any fiscal-period-bounded chart has **no statutory period to bound it to**. A legal-form →
  fiscal-year mapping needs `companies.business_type`, which in turn needs the own-company link
  that also does not exist.

Both are recorded as schema gaps rather than guessed. **Do not infer the workspace currency from
the most common transaction currency** — that is exactly the guessing the repo standard forbids,
and it would flip as soon as one large foreign payment lands.
