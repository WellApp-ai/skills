# E-invoicing and invoice banking — EINV-, IPAY-

Gates 7 and 8. Invoice and line-item VAT/FX, the FR/FEC material, and invoice-to-account/payment-means linkage.

**Enumerable totals:** `IPAY-` = **16 control points, of which 0 blocked**. `EINV-` = **36 control
points, of which 13 blocked**. Total **52, of which 13 blocked**. A `blocked` control point is one
the model cannot express at all; it reports `INCONCLUSIVE` and is **never** reported as a pass. It is
listed rather than omitted because an omitted row reads as "checked and clean".

Every row carries its `bucket`: **complete** = the rows that exist carry the fields they must carry
(depth); **exhaustive** = the population is fully and singly enumerated (breadth — integrity,
duplicates, tenancy, coverage).

---

#### FR e-invoicing — not implemented; build on the FEC instead

There is **no e-invoicing issuance, validation, or reporting module** in the repo. `Factur-X` is a
connector catalog slug, not a format. `DocumentTypeCodeEnum` is genuine UNTDID 1001 (380/381/383,
plus `SELF_BILLING_INVOICE = "389"`), and that is the only real EN16931 artifact.

**The only FR legal required-field list the repo codifies is the FEC** — 18 mandatory columns per
BOI-CF-IOR-60-40-20 (`coa-export.serializer.ts:7-26`). Two of them are exactly the
company-completeness check requested, and they are **buildable today with no new columns**:

- `CompAuxNum` ← `journal_entry_lines.auxiliary_account.account_number`
- `CompAuxLib` ← `journal_entry_lines.auxiliary_account.name`, falling back to
  `journal_entry_lines.company.name`

Both are written with `?? ""`, so **the serializer silently ships FEC rows with empty
counterparty identity** — a real, currently-unguarded control point (`EINV-20`). Six further FEC
columns are **hard-coded empty** (`EcritureLet`, `DateLet`, `ValidDate`, `Montantdevise`, `Idevise`)
even though the file's own comment says FEC requires the foreign amount alongside the currency
(`EINV-21`).

**The structural hazard for any FR control point:** a SIREN can legitimately live in
`companies.tax_id_value` (with `tax_id_type = SIREN`) **or** in `companies.registered_value`
(with `registry_country = FR`). No functional dependency pins it to one attribute, so **no single
predicate can express "this company has a SIREN"** — every check must be a disjunction over both
columns until the model designates a canonical home (`EINV-22`). Also: **no checksum validation
exists anywhere** (SIREN/SIRET Luhn, TVA mod-97), so a structurally-valid-but-fake `123456789`
passes everything (`EINV-23`).

Unbuildable FR requirements (no field exists) are enumerated as `EINV-25`..`EINV-36`, not dropped:
party electronic routing address (PPF/PDP), ISO 6523 scheme id for the party legal id, SIRET
establishment number as its own attribute, invoice-level VAT breakdown rows (BG-23 — **the extractor
already produces the right shape and it is discarded**), VAT exemption reason, share capital,
preceding-invoice reference for credit notes, and e-reporting transmission status. NAF/APE is
**fetched from `recherche-entreprises` and thrown away** — the cheapest gap to close.

#### Invoice banking details — the chain, and where it breaks (`IPAY-`)

**Definitive:** `invoices` has **zero banking columns** (only `payment_status` and
`last_payment_allocation_date`). `invoice_payment_means` is a **pure join table with no banking
identifier at all** — 10 columns: `pk, id, invoice_pk, payment_means_pk, amount, payment_date,
payment_type, created_at, updated_at, deleted_at`. So an invoice's banking detail is **either**
normalized down a 3-hop chain **or unrecoverable from the relational model** (surviving only inside
the source document blob):

`invoices.pk → invoice_payment_means.invoice_pk → .payment_means_pk → payment_means.account_pk →
accounts.{iban, bic, account_number, routing_number, sort_code}`, with card and cheque branches via
`payment_means.card_pk` / `.check_pk`.

### Measured baseline

**Prod-wide measurements** (whole DB, not the 3-workspace MCP scope), **measured 2026-07-29** —
see `baseline-2026-07-29.md`, which carries its own day-over-day proof that these figures decay.
Re-measure rather than quoting them. They establish the *shape* of the defect, which is what the
control points below are written against; the counts themselves are evidence, never a fail signal.

| what | measured | verdict |
|---|---|---|
| invoices with ≥1 `invoice_payment_means` row | **851 of 33,753 = 2.52%** | 🔴 97.5% must be keyed by hand |
| `payment_means` with **no account, no card, no check** | **7,809 of 8,653 = 90.2%** | 🔴 an instrument-less husk expresses nothing payable — it is a name |
| `invoice_payment_means` with `payment_means_pk` NULL | **103 = 8.9%** | 🔴 a row asserting payment means that names none |
| `invoice_payment_means.payment_type` NULL | **1,159 of 1,159 = 100%** | 🔴 free-text `varchar(50)` — while the correct enum already exists (below) |
| transactions with an IBAN-shaped token in `remittance` | **3,108 = 12.5% of 24,925** | — |
| distinct (workspace, IBAN) pairs in labels **matching no `accounts.iban`** | **888 of 902 = 98.4%** | 🔴 effectively zero extraction |
| accounts with neither IBAN nor account_number | **239 of 403 = 59.3%** | 🔴 unlinkable by any strong key |
| same IBAN on accounts in **>1 workspace** | **9 distinct IBANs** | 🟠 tenancy smell — unambiguous defect only when both sides claim `workspace` ownership |
| same IBAN duplicated **within** one workspace | **3** | 🔴 the account dedup rule was meant to eliminate these |

**Three structural defects behind those numbers:**

1. **`payment_means_type_enum` exists in the DB and is orphaned** — created by two migrations
   (`'iban','local','card','digital_wallet','cash','check','crypto','other'`) and **used by no
   column anywhere**. Instrument kind is instead inferred from which FK is non-null, and
   `invoice_payment_means.payment_type` is untyped free text. A typed enum sitting unused next to a
   free-text column is a direct violation of the structured-data standard (`IPAY-13`).
2. **Ownership is asserted, never derived.** `invoice-payment-means.service.ts` hardcodes
   `ownership: COUNTERPARTY` on **every** account it creates, with no evidence test. Pay the
   workspace's own IBAN instead of the supplier's and the money never leaves; pay a supplier IBAN
   mislabelled `workspace` and a reconciliation rule may auto-net it as an internal transfer.
   Ownership should be **derived from provenance** (`source_workspace_connector_pk` non-null ⇒ the
   workspace's own bank feed ⇒ `WORKSPACE`) (`IPAY-06`).
3. **No IBAN checksum validator exists anywhere** — zero hits for `mod97` / `validateIban` /
   `isValidIban`. Only two *shape* regexes, and **they contradict each other**: the DB CHECK
   (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$`) vs `VALIDATION_PATTERNS.IBAN`
   (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$`), so a value can pass one and fail the
   other. ISO 7064 mod-97-10 is a 12-line function; without it a single transposed digit becomes a
   permanent, silently-wrong **natural key** (`AccountRepository.findByNaturalKey` treats IBAN as
   the durable key) and a misdirected payment (`IPAY-08`, `IPAY-09`).

**The linkage identity key, ranked — with explicit refusals.** Rank 1: checksum-valid
`upper(trim(iban))` + `workspace_pk` → auto-link (an *unvalidated* IBAN is not a rank-1 key, it is a
rank-1-shaped string). Rank 2: `account_number` + `bic` / `routing_number` / `sort_code`, all exact
→ auto-link. Rank 3: bare `account_number`, or a checksum-**failed** IBAN → **flag, do not link**.
Rank 4: `cards.last_four_digits` + `expiration_date` + `brand`, only within one holder scope and
only when exactly one candidate. Rank 5: `checks.cmc7` → auto-link. **Rank 6: name similarity →
REFUSE to auto-link**, advisory hint to a human only, weight 0.0 — per the structured-data mandate.

**Four hard stops where the sweep must refuse rather than guess:** no checksum-valid IBAN and no
(number + bic/routing/sort) pair (the 239 identifier-less accounts, `IPAY-15`); an ownership conflict
with the payment direction (**misdirected payment is worse than an unlinked field**, `IPAY-06`); any
cross-workspace candidate, even on exact IBAN match (`IPAY-11`, `IPAY-14`); and multiple
checksum-valid candidates in scope (the 3 within-workspace duplicates prove rank-1 is not
single-valued, `IPAY-16` — dedupe first, then link).

**Highest-leverage single fix in this whole family:** extract IBANs from
`transactions.remittance` and resolve them through the existing
`PaymentMeansRepository.findByAccountIban`. **888 unmatched (workspace, IBAN) pairs are 888
counterparties resolvable with a rank-1 key already sitting in the database** (`IPAY-12`).

### `IPAY-` control points — 16 total, of which 0 blocked

**Scope caveat, and it must survive into the report.** Every figure quoted in the *fail signal*
column below is **prod-wide** (the whole DB, 33,753 invoices / 8,653 payment means / 24,925
transactions / 403 accounts), measured 2026-07-29. It is **not** the 3-workspace MCP scope that gates
1–6 run in. A gate-7 run through MCP will produce different denominators; the two are not
comparable, and a per-workspace result must never be reported against a prod-wide baseline.

| id | bucket | name | check | fail signal | sev |
|---|---|---|---|---|---|
| `IPAY-01` | complete | Payable invoice names a payment means | `invoices` (`deleted_at IS NULL`, `payment_status` ≠ paid-in-full, i.e. the invoice still carries payment instructions) with **zero** live `invoice_payment_means` rows on `invoice_pk` | any; **prod-wide 32,902 of 33,753 = 97.5% have no means row at all** | red |
| `IPAY-02` | complete | A means row names a means | `invoice_payment_means.payment_means_pk _is_null` (`deleted_at IS NULL`) | any; **prod-wide 103 = 8.9%** — a row asserting payment means that names none | red |
| `IPAY-03` | complete | Payment means carries an instrument | `payment_means` with `account_pk`, `card_pk` **and** `check_pk` all null | any; **prod-wide 7,809 of 8,653 = 90.2%** — an instrument-less husk is a name, not something payable | red |
| `IPAY-04` | exhaustive | Means FK resolves to a live row | `invoice_payment_means.payment_means_pk` non-null but resolving to **no** `payment_means` row, or to one with `deleted_at IS NOT NULL` | any — a dangling or soft-deleted FK reads as linked and pays nothing | red |
| `IPAY-05` | exhaustive | Hop 3 of the chain closes | `payment_means.account_pk` non-null but resolving to no live `accounts` row; **and** an IBAN carried anywhere on the means/invoice path with no matching `accounts.iban` in the same workspace | any — the 3-hop chain `invoices → invoice_payment_means → payment_means → accounts` breaking at hop 3 | red |
| `IPAY-06` | complete | Ownership is derived, not asserted | `accounts.ownership` on accounts created by `invoice-payment-means.service.ts`: `ownership = COUNTERPARTY` while `source_workspace_connector_pk` is non-null (⇒ the workspace's own bank feed ⇒ should be `WORKSPACE`); and any account whose `ownership` contradicts the payment direction of the invoice referencing it | any; **service hardcodes `COUNTERPARTY` on every extracted account with no evidence test** — a direction conflict is a **misdirected payment**, worse than an unlinked field | red |
| `IPAY-07` | complete | IBAN and BIC travel together | `accounts` with `iban` non-null and `bic` null, and `accounts` with `bic` non-null and `iban` null | any — a half-pair is not a rank-2 key and cannot route a payment | amber |
| `IPAY-08` | complete | IBAN passes ISO 7064 mod-97-10 | every non-null `accounts.iban` in scope, checksum computed **by the sweep** — **no validator exists in the repo** (zero hits for `mod97` / `validateIban` / `isValidIban`) | any IBAN failing mod-97; a checksum-failed IBAN is **rank 3 → flag, never auto-link**, because `AccountRepository.findByNaturalKey` treats IBAN as the durable natural key | red |
| `IPAY-09` | complete | The two shape regexes agree | every `accounts.iban` tested against **both** the DB CHECK (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$`) and `VALIDATION_PATTERNS.IBAN` (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$`) | any value passing one and failing the other — the two patterns **contradict each other**, so "valid" is undefined until one is canonical | red |
| `IPAY-10` | complete | Card-paid invoice names the card | `invoice_payment_means` whose invoice settled by card (`payment_type`/instrument indicating card, or the linked `payment_means` reached via a card branch) where `payment_means.card_pk _is_null` | any — the card branch of the chain is asserted and empty | red |
| `IPAY-11` | exhaustive | An IBAN belongs to one tenant | group live `accounts` by `upper(trim(iban))`, count distinct `workspace_pk` | any group with >1 workspace; **prod-wide 9 distinct IBANs** — a tenancy smell, escalating to red only when **both** sides claim `ownership = WORKSPACE` | amber |
| `IPAY-12` | exhaustive | Label IBANs are extracted and resolved | IBAN-shaped tokens in `transactions.remittance.unstructured` (**prod-wide 3,108 = 12.5% of 24,925**), reduced to distinct (`workspace_pk`, IBAN) pairs, each resolved against `accounts.iban` / `payment_means` via `PaymentMeansRepository.findByAccountIban` | pairs matching nothing; **prod-wide 888 of 902 = 98.4%** — effectively zero extraction, and 888 counterparties resolvable with a rank-1 key already in the DB | red |
| `IPAY-13` | complete | Instrument kind is typed, not free text | `invoice_payment_means.payment_type` (`varchar(50)`, untyped) null-rate; **and** whether any column anywhere uses `payment_means_type_enum` (`'iban','local','card','digital_wallet','cash','check','crypto','other'`) | **prod-wide 1,159 of 1,159 = 100% NULL** while the correct enum exists in the DB **and is used by no column** — a typed enum sitting unused beside a free-text column violates the structured-data standard | red |
| `IPAY-14` | exhaustive | The invoice→means chain never crosses a tenant | at each hop, `invoices.workspace_pk` = `payment_means.workspace_pk` = `accounts.workspace_pk` (`invoice_payment_means` carries no workspace column, so the join must be anchored on `invoices`) | any hop where the workspaces differ — **any cross-workspace candidate is a hard stop, even on an exact IBAN match** | red |
| `IPAY-15` | complete | Account has at least one strong identifier | `accounts` with `iban` null **and** `account_number` null | any; **prod-wide 239 of 403 = 59.3%** — unlinkable by any strong key, and a hard stop for the linker | red |
| `IPAY-16` | exhaustive | Rank-1 key is single-valued in a workspace | group live `accounts` by (`workspace_pk`, `upper(trim(iban))`), count rows | any group ≥2; **prod-wide 3** — the account dedup rule was meant to eliminate these, and their existence proves rank-1 is not single-valued: **dedupe first, then link** | red |

#### E-invoicing, line items, VAT, FX (`EINV-`)

**🔴 The control to build first: `applied_tax_rate_pk` is a denormalized copy of a jsonb key, and
the posting path reads the jsonb.** There are **three** competing per-line VAT-rate
representations: `invoice_items.tax_rate` (bare decimal), `applied_tax_rate_pk` (FK to
`tax_rates`), and `accounting_classification->'taxResolution'->>'taxRatePk'` (jsonb). The journal
builder trusts **the jsonb**; the FK is stamped from the same value at persist time by two separate
writers with **no constraint keeping them equal**. Any writer touching the jsonb without
re-stamping the FK desynchronizes them and **no reader would notice**. `EINV-09`
(`applied_tax_rate_pk ≠ jsonb taxRatePk`) is the only control that can detect the schema silently
lying to the posting path.

**Other findings that change control design:**

- **`invoices.shadow_from_receipt` exists** (bool, default false) — a row synthesized from a payment
  receipt rather than a real bill. **A shadow invoice is not a legal invoice and must never be
  declared** (`EINV-18`). Cheap and important.
- **`extract.service.ts:1021-1033` silently overwrites `items_total = grand_total − tax_total` on
  mismatch.** The repair **destroys the evidence** the header-arithmetic control needs — so that
  control must record the *pre-repair* delta, or it is permanently green over a self-healed lie
  (`EINV-05`).
- **Per-line FX is modelled and dead.** `invoice_items.accounting_unit_price` and
  `accounting_line_total` exist and **have no writer anywhere** — always NULL. That is *worse than
  unrepresentable*, because a reader can reasonably read NULL as "same currency". Conversion is
  header-only (three totals + `accounting_currency` + rate). This is why `EINV-24` is `blocked`
  with a distinct reason from the four no-field rows.
- **A latent type bug in any naive control**: the three `accounting_*` totals are typed `string` in
  the entity while `grand_total`/`items_total`/`tax_total` are typed `number`. Same DB type,
  different TS type — an implicit comparison compares `"1234.00"` to `1234` **as strings**
  (`EINV-13` must coerce to number before comparing).
- **`invoice_number` is nullable and its index is NON-unique**, despite a comment claiming an
  import-time uniqueness check. There is **no invoice-number allocator at all** — while a proven
  gapless one exists for journal entries (`LegalSequenceCounter` + row-locked `allocateNext`, so a
  rollback never burns a number). **Directly reusable; cheapest high-value fix on the list**
  (`EINV-01`, `EINV-02`).
- **`invoice_items` has NO `workspace_pk`** — tenant scope is reachable only by joining `invoices`.
  Every EINV control must carry that join or **it leaks across workspaces** (`EINV-19`). Add the
  denormalized column *before* building the suite, not after.
- `issue_date` is a `timestamp`, not a `date` — a tax point is a calendar date, so this invites TZ
  drift at period boundaries (`EINV-15`). And `reference_number` is **semantically overloaded**: the
  extractor writes the *invoice number* there, not the buyer reference — two different BTs in one
  column (`EINV-16`).
- Rounding tolerance: **`max(0.01 × n_lines, 0.02)`, capped at 0.05** — each line contributes at
  most a half-cent. **Do not reuse** the existing `invoice_status_tolerance_abs = 0.50`; that band
  is for payment matching and is far too loose for VAT.
- Credit notes (381) are stored with **positive** amounts, reversal expressed by *routing* not sign
  — so a negative 381 is a **double negation**, and a negative 380 is an invoice masquerading as a
  credit note. Both are checkable (`EINV-04`).
- `tax_rates` is uniquely keyed on `(workspace, name)`, **not** on `(workspace, rate, country,
  effective_from)` — so two rows can carry FR 20% with different ledger accounts and **nothing picks
  a winner** (`EINV-11`). Nothing in the codebase filters on
  `effective_from`/`effective_to`/`is_active`, so expect real hits on the out-of-period-rate control
  (`EINV-12`).

**The worst gap on the whole list — no supply/delivery/performance date.** Only `issue_date` and
`due_date` exist. FR requires the delivery or completion date whenever it differs from the issue
date, **and it is the VAT tax point that decides which declaration period the operation falls in**.
`invoice_items.period_start/end` is a service period, per-line and nullable — not a delivery date.
**Consequence: Well cannot place a VAT operation in the correct declaration period from invoice data
alone** (`EINV-29`, blocked).

**Self-invoicing (autofacturation) — the structural blocker.** `document_type_code = 389` exists and
**nothing branches on it** beyond generic routing. Well has exactly two party slots, `issuer_pk` and
`receiver_pk`, and **no third role for "issued by B in the name of A"** (EN16931 BG-10/BG-11, the FR
*mandataire*). No mandate entity, no mandate reference (`EINV-36`, blocked). And because
sale-vs-purchase polarity is derived by comparing issuer/receiver to the own company, **a self-billed
purchase will be read as a sale** unless 389 is special-cased — untested today, and checkable
(`EINV-17`). The payment leg of e-reporting is closer to buildable (`payment_status`, `paid_amount`,
`last_payment_allocation_date`, the `invoice_transactions` link), but note
`last_payment_allocation_date` is an *allocation* timestamp, a proxy for the encaissement date, not
the date itself.

**Recommended fix order:** per-rate breakdown table → exemption
reason + reverse-charge mention (both cheap columns) → supply date → invoice-number allocator →
preceding-invoice reference.

### `EINV-` control points — 36 total, of which 13 blocked (`EINV-24`..`EINV-36`)

**Two scope rules bind every row.** (1) `invoice_items` has **no `workspace_pk`**, so every
line-level check MUST be anchored on a join to `invoices.workspace_pk` — an unanchored line query
leaks across tenants. (2) The arithmetic rows use the VAT rounding tolerance
`max(0.01 × n_lines, 0.02)` capped at `0.05`, **never** `invoice_status_tolerance_abs = 0.50`.

Unlike the `IPAY-` table, these rows carry **no live measurement** — the family has not been probed.
An unprobed row is `INCONCLUSIVE` on first run, not a pass.

| id | bucket | name | check | fail signal | sev |
|---|---|---|---|---|---|
| `EINV-01` | complete | Invoice carries a number | `invoices.invoice_number _is_null` (live rows in scope) | any — the column is nullable and there is **no allocator at all**, while a gapless one exists for journal entries (`LegalSequenceCounter.allocateNext`) | red |
| `EINV-02` | exhaustive | Invoice number is unique per issuer | group live `invoices` by (`workspace_pk`, `issuer_pk`, `invoice_number`), count rows | any group ≥2 — the index is **NON-unique** despite a comment claiming an import-time uniqueness check | red |
| `EINV-03` | complete | Document type is a real UNTDID 1001 code | `invoices.document_type_code` null, or not in `DocumentTypeCodeEnum` (380/381/383/389) | any — this enum is the only genuine EN16931 artifact in the repo; an off-enum value cannot be declared | red |
| `EINV-04` | complete | Sign polarity matches the document type | `document_type_code = 381` (credit note) with a **negative** `grand_total`; and `document_type_code = 380` with a negative `grand_total` | any — credit notes are stored **positive** with reversal expressed by *routing*, so a negative 381 is a **double negation** and a negative 380 is an invoice masquerading as a credit note | red |
| `EINV-05` | complete | Header arithmetic holds, pre-repair | `abs(grand_total − tax_total − items_total)` > tolerance, evaluated on the **pre-repair** values captured at extraction | any — `extract.service.ts:1021-1033` silently overwrites `items_total = grand_total − tax_total` on mismatch, **destroying the evidence**; read post-repair and this control is permanently green over a self-healed lie | red |
| `EINV-06` | complete | Lines reconcile to the header | `Σ invoice_items.line_total` vs `invoices.items_total`, and `Σ` per-line tax vs `invoices.tax_total`, both within tolerance (join anchored on `invoices.workspace_pk`) | delta > `max(0.01 × n_lines, 0.02)` capped at `0.05` | red |
| `EINV-07` | complete | Every line carries a VAT rate | `invoice_items.tax_rate _is_null` | any — no rate means the line cannot enter a VAT return | red |
| `EINV-08` | exhaustive | The rate FK resolves | `invoice_items.applied_tax_rate_pk` null, or resolving to no live `tax_rates` row | any — a dangling rate FK silently drops the line's ledger mapping | red |
| `EINV-09` | complete | **The FK and the jsonb agree** | `invoice_items.applied_tax_rate_pk` ≠ `accounting_classification->'taxResolution'->>'taxRatePk'` | any — **the posting path reads the jsonb** while the FK is stamped separately by two writers with **no constraint keeping them equal**; this is the only control that detects the schema lying to the journal builder. **Build this first.** | red |
| `EINV-10` | complete | The third representation agrees too | `invoice_items.tax_rate` (bare decimal) ≠ `tax_rates.rate` of the row referenced by `applied_tax_rate_pk` | any — three competing per-line rate representations, none constrained to each other | red |
| `EINV-11` | exhaustive | One rate wins per (rate, country) | group live `tax_rates` by (`workspace_pk`, `rate`, `country`), count rows and distinct ledger accounts | any group ≥2 with differing ledger accounts — uniqueness is on `(workspace, name)`, **not** `(workspace, rate, country, effective_from)`, so **nothing picks a winner** | red |
| `EINV-12` | complete | The rate applies on the tax point | referenced `tax_rates.effective_from` / `.effective_to` / `.is_active` vs the invoice's `issue_date` | any rate applied outside its period or while inactive — **nothing in the codebase filters on these columns, so expect real hits** | red |
| `EINV-13` | complete | Header FX is internally consistent | `accounting_grand_total` vs `grand_total` × the rate on `exchange_rate_pk`, **coerced to number on both sides** | delta > tolerance. **Type trap:** the three `accounting_*` totals are typed `string` in the entity while `grand_total`/`items_total`/`tax_total` are `number` — an implicit comparison compares `"1234.00"` to `1234` **as strings** and never fires | red |
| `EINV-14` | complete | A rate exists when currencies differ | `invoices.accounting_currency` ≠ `local_currency` **and** `exchange_rate_pk _is_null` | any — conversion is header-only, so a missing header rate means no conversion exists at all | red |
| `EINV-15` | complete | The tax point is a calendar date | `invoices.issue_date` (a `timestamp`, not a `date`) with a non-zero time component, and rows whose declaration period changes under the workspace timezone | any near a period boundary — a tax point is a calendar date; a timestamp invites TZ drift that moves the operation to the wrong VAT period | amber |
| `EINV-16` | complete | Buyer reference is not the invoice number | `invoices.reference_number` = `invoices.invoice_number` | any — the extractor writes the *invoice number* into `reference_number`, so **two different BTs share one column** and the buyer reference is unrecoverable | amber |
| `EINV-17` | complete | Self-billing does not flip polarity | `invoices.document_type_code = 389` whose derived sale/purchase direction is **sale** | any — polarity is derived by comparing `issuer_pk`/`receiver_pk` to the own company, and **nothing branches on 389**, so a self-billed *purchase* is read as a *sale*. Untested today | red |
| `EINV-18` | exhaustive | A shadow invoice is never declared | `invoices.shadow_from_receipt = true` appearing in any declaration/e-reporting population | any — a row synthesized from a payment receipt is **not a legal invoice**. Cheap and important | red |
| `EINV-19` | exhaustive | Line checks are tenant-anchored | every `invoice_items` row reached by a check must resolve to a parent `invoices` row in the workspace under sweep | any line whose parent `invoices.workspace_pk` differs from the sweep scope — `invoice_items` has **no `workspace_pk`**, so an unanchored query **leaks across workspaces**. Add the denormalized column before building the suite | red |
| `EINV-20` | complete | FEC carries counterparty identity | FEC `CompAuxNum` ← `journal_entry_lines.auxiliary_account.account_number` and `CompAuxLib` ← `auxiliary_account.name` falling back to `company.name`, both empty | any — `coa-export.serializer.ts:7-26` writes both with `?? ""`, so the serializer **silently ships FEC rows with empty counterparty identity**. Two of the 18 BOI-CF-IOR-60-40-20 mandatory columns, buildable today with no new columns | red |
| `EINV-21` | complete | FEC carries the foreign amount | FEC `Montantdevise` / `Idevise` (and `EcritureLet`, `DateLet`, `ValidDate`) on any foreign-currency line | **hard-coded empty in the serializer — no row can pass**, though the file's own comment says FEC requires the foreign amount alongside the currency. Determined by code inspection, not row data | red |
| `EINV-22` | complete | Company has a SIREN | disjunction: `companies.tax_id_value` with `tax_id_type = SIREN` **OR** `companies.registered_value` with `registry_country = FR`; both absent | any — no functional dependency pins SIREN to one attribute, so **no single predicate can express "this company has a SIREN"**; the check must stay a disjunction until the model designates a canonical home | red |
| `EINV-23` | complete | SIREN/SIRET passes its checksum | Luhn on the SIREN/SIRET found by `EINV-22`, and mod-97 on the TVA number, computed **by the sweep** | any failing value — **no checksum validation exists anywhere in the repo**, so a structurally-valid-but-fake `123456789` passes everything today | red |
| `EINV-24` | complete | Per-line FX amounts | `invoice_items.accounting_unit_price` / `.accounting_line_total` | `INCONCLUSIVE — the fields exist and have no writer anywhere` (always NULL). **Worse than absent**: a reader can read NULL as "same currency". Conversion is header-only | blocked |
| `EINV-25` | complete | Per-rate taxable base (BG-23) | — | `INCONCLUSIVE — no field exists`. The extractor **already produces the right shape and it is discarded**. First on the fix order | blocked |
| `EINV-26` | complete | VAT exemption reason (BT-120/121) | — | `INCONCLUSIVE — no field exists`. A cheap column; second on the fix order | blocked |
| `EINV-27` | complete | Reverse-charge mention | — | `INCONCLUSIVE — no field exists`. A cheap column; second on the fix order | blocked |
| `EINV-28` | complete | Preceding-invoice reference (credit note) | — | `INCONCLUSIVE — no field exists`. Without it a 381 cannot be tied to what it reverses | blocked |
| `EINV-29` | complete | Supply / delivery / performance date | — | `INCONCLUSIVE — no field exists`. Only `issue_date` and `due_date`; `invoice_items.period_start/end` is a per-line nullable service period, not a delivery date. **The worst gap on the list: Well cannot place a VAT operation in the correct declaration period from invoice data alone** | blocked |
| `EINV-30` | complete | Party electronic routing address (PPF/PDP) | — | `INCONCLUSIVE — no field exists`. No routing address means no transmission path | blocked |
| `EINV-31` | complete | ISO 6523 scheme id for the party legal id | — | `INCONCLUSIVE — no field exists`. The legal id cannot be qualified by scheme | blocked |
| `EINV-32` | complete | SIRET establishment number as its own attribute | — | `INCONCLUSIVE — no field exists` as a distinct attribute; it survives only inside the SIREN disjunction of `EINV-22` | blocked |
| `EINV-33` | complete | Share capital | — | `INCONCLUSIVE — no field exists`. An FR invoice mandatory mention | blocked |
| `EINV-34` | complete | NAF/APE code persisted | — | `INCONCLUSIVE — no field exists`. It is **fetched from `recherche-entreprises` and thrown away** — the cheapest gap to close | blocked |
| `EINV-35` | exhaustive | E-reporting transmission status | — | `INCONCLUSIVE — no field exists`. The payment leg is closer to buildable (`payment_status`, `paid_amount`, `last_payment_allocation_date`, `invoice_transactions`), but `last_payment_allocation_date` is an *allocation* timestamp — a proxy for the encaissement date, not the date itself | blocked |
| `EINV-36` | complete | Self-billing mandate role (BG-10/BG-11) | — | `INCONCLUSIVE — no field exists`. Well has exactly two party slots, `issuer_pk` and `receiver_pk`, and **no third role for "issued by B in the name of A"** — no mandate entity, no mandate reference | blocked |

### Not covered by this sweep — named, not deferred

**Header-level FX is modelled and checkable**: `invoices` carries `local_currency`,
`accounting_currency`, `exchange_rate_pk` and the `accounting_*` triplet (`EINV-13`, `EINV-14`).

**Per-line VAT and FX are NOT checkable today, and the sweep must say so rather than pass.**
`invoice_items.accounting_unit_price` and `.accounting_line_total` exist and have no writer — they
are always NULL, which is worse than absent because a reader can read NULL as "same currency"
(`EINV-24`). Per-rate taxable base (BG-23), VAT exemption reason (BT-120/121), the reverse-charge
mention, and the preceding-invoice reference for a credit note have no field at all
(`EINV-25`..`EINV-28`).

Each of those reports **INCONCLUSIVE with the reason stated in its row** — never a pass. That is this
skill's own rule: an unexpressible check is named, not silently dropped. It is why all 13 blocked
control points appear as rows above; a missing row would read as "checked and clean".
