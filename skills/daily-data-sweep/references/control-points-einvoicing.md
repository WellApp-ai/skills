# E-invoicing and invoice banking — EINV-, IPAY-

Gates 7 and 8. Invoice and line-item VAT/FX, the FR/FEC material, and invoice-to-account/payment-means linkage.

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
counterparty identity** — a real, currently-unguarded control point. Six further FEC columns are
**hard-coded empty** (`EcritureLet`, `DateLet`, `ValidDate`, `Montantdevise`, `Idevise`) even
though the file's own comment says FEC requires the foreign amount alongside the currency.

**The structural hazard for any FR control point:** a SIREN can legitimately live in
`companies.tax_id_value` (with `tax_id_type = SIREN`) **or** in `companies.registered_value`
(with `registry_country = FR`). No functional dependency pins it to one attribute, so **no single
predicate can express "this company has a SIREN"** — every check must be a disjunction over both
columns until the model designates a canonical home. Also: **no checksum validation exists
anywhere** (SIREN/SIRET Luhn, TVA mod-97), so a structurally-valid-but-fake `123456789` passes
everything.

Unbuildable FR requirements (no field exists): party electronic routing address (PPF/PDP),
ISO 6523 scheme id for the party legal id, SIRET establishment number as its own attribute,
invoice-level VAT breakdown rows (BG-23 — **the extractor already produces the right shape and it
is discarded**), VAT exemption reason, share capital, preceding-invoice reference for credit
notes, and e-reporting transmission status. NAF/APE is **fetched from
`recherche-entreprises` and thrown away** — the cheapest gap to close.

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

**Prod-wide measurements** (whole DB, not my 3-workspace scope):

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
   free-text column is a direct violation of the structured-data standard.
2. **Ownership is asserted, never derived.** `invoice-payment-means.service.ts` hardcodes
   `ownership: COUNTERPARTY` on **every** account it creates, with no evidence test. Pay the
   workspace's own IBAN instead of the supplier's and the money never leaves; pay a supplier IBAN
   mislabelled `workspace` and a reconciliation rule may auto-net it as an internal transfer.
   Ownership should be **derived from provenance** (`source_workspace_connector_pk` non-null ⇒ the
   workspace's own bank feed ⇒ `WORKSPACE`).
3. **No IBAN checksum validator exists anywhere** — zero hits for `mod97` / `validateIban` /
   `isValidIban`. Only two *shape* regexes, and **they contradict each other**: the DB CHECK
   (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$`) vs `VALIDATION_PATTERNS.IBAN`
   (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$`), so a value can pass one and fail the
   other. ISO 7064 mod-97-10 is a 12-line function; without it a single transposed digit becomes a
   permanent, silently-wrong **natural key** (`AccountRepository.findByNaturalKey` treats IBAN as
   the durable key) and a misdirected payment.

**The linkage identity key, ranked — with explicit refusals.** Rank 1: checksum-valid
`upper(trim(iban))` + `workspace_pk` → auto-link (an *unvalidated* IBAN is not a rank-1 key, it is a
rank-1-shaped string). Rank 2: `account_number` + `bic` / `routing_number` / `sort_code`, all exact
→ auto-link. Rank 3: bare `account_number`, or a checksum-**failed** IBAN → **flag, do not link**.
Rank 4: `cards.last_four_digits` + `expiration_date` + `brand`, only within one holder scope and
only when exactly one candidate. Rank 5: `checks.cmc7` → auto-link. **Rank 6: name similarity →
REFUSE to auto-link**, advisory hint to a human only, weight 0.0 — per the structured-data mandate.

**Four hard stops where the sweep must refuse rather than guess:** no checksum-valid IBAN and no
(number + bic/routing/sort) pair (the 239 identifier-less accounts); an ownership conflict with the
payment direction (**misdirected payment is worse than an unlinked field**); any cross-workspace
candidate, even on exact IBAN match; and multiple checksum-valid candidates in scope (the 3
within-workspace duplicates prove rank-1 is not single-valued — dedupe first, then link).

**Highest-leverage single fix in this whole family:** extract IBANs from
`transactions.remittance` and resolve them through the existing
`PaymentMeansRepository.findByAccountIban`. **888 unmatched (workspace, IBAN) pairs are 888
counterparties resolvable with a rank-1 key already sitting in the database.**

#### E-invoicing, line items, VAT, FX (`EINV-`)

**16 of 20 controls are buildable today. The 4 that are not are exactly the four a French tax audit
asks about first:** per-rate taxable base, exemption reason, reverse-charge mention, and
preceding-invoice reference.

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
  declared** (`EINV-18`). Cheap and important; I had missed this field entirely.
- **`extract.service.ts:1021-1033` silently overwrites `items_total = grand_total − tax_total` on
  mismatch.** The repair **destroys the evidence** the header-arithmetic control needs — so that
  control must record the *pre-repair* delta, or it is permanently green over a self-healed lie.
- **Per-line FX is modelled and dead.** `invoice_items.accounting_unit_price` and
  `accounting_line_total` exist and **have no writer anywhere** — always NULL. That is *worse than
  unrepresentable*, because a reader can reasonably read NULL as "same currency". Conversion is
  header-only (three totals + `accounting_currency` + rate).
- **A latent type bug in any naive control**: the three `accounting_*` totals are typed `string` in
  the entity while `grand_total`/`items_total`/`tax_total` are typed `number`. Same DB type,
  different TS type — an implicit comparison compares `"1234.00"` to `1234` **as strings**.
- **`invoice_number` is nullable and its index is NON-unique**, despite a comment claiming an
  import-time uniqueness check. There is **no invoice-number allocator at all** — while a proven
  gapless one exists for journal entries (`LegalSequenceCounter` + row-locked `allocateNext`, so a
  rollback never burns a number). **Directly reusable; cheapest high-value fix on the list.**
- **`invoice_items` has NO `workspace_pk`** — tenant scope is reachable only by joining `invoices`.
  Every EINV control must carry that join or **it leaks across workspaces**. Add the denormalized
  column *before* building the suite, not after.
- `issue_date` is a `timestamp`, not a `date` — a tax point is a calendar date, so this invites TZ
  drift at period boundaries. And `reference_number` is **semantically overloaded**: the extractor
  writes the *invoice number* there, not the buyer reference (two different BTs in one column).
- Rounding tolerance: **`max(0.01 × n_lines, 0.02)`, capped at 0.05** — each line contributes at
  most a half-cent. **Do not reuse** the existing `invoice_status_tolerance_abs = 0.50`; that band
  is for payment matching and is far too loose for VAT.
- Credit notes (381) are stored with **positive** amounts, reversal expressed by *routing* not sign
  — so a negative 381 is a **double negation**, and a negative 380 is an invoice masquerading as a
  credit note. Both are checkable.
- `tax_rates` is uniquely keyed on `(workspace, name)`, **not** on `(workspace, rate, country,
  effective_from)` — so two rows can carry FR 20% with different ledger accounts and **nothing picks
  a winner**. Nothing in the codebase filters on `effective_from`/`effective_to`/`is_active`, so
  expect real hits on the out-of-period-rate control.

**The worst gap on the whole list — no supply/delivery/performance date.** Only `issue_date` and
`due_date` exist. FR requires the delivery or completion date whenever it differs from the issue
date, **and it is the VAT tax point that decides which declaration period the operation falls in**.
`invoice_items.period_start/end` is a service period, per-line and nullable — not a delivery date.
**Consequence: Well cannot place a VAT operation in the correct declaration period from invoice data
alone.**

**Self-invoicing (autofacturation) — the structural blocker.** `document_type_code = 389` exists and
**nothing branches on it** beyond generic routing. Well has exactly two party slots, `issuer_pk` and
`receiver_pk`, and **no third role for "issued by B in the name of A"** (EN16931 BG-10/BG-11, the FR
*mandataire*). No mandate entity, no mandate reference. And because sale-vs-purchase polarity is
derived by comparing issuer/receiver to the own company, **a self-billed purchase will be read as a
sale** unless 389 is special-cased — untested today. The payment leg of e-reporting is closer to
buildable (`payment_status`, `paid_amount`, `last_payment_allocation_date`, the
`invoice_transactions` link), but note `last_payment_allocation_date` is an *allocation* timestamp,
a proxy for the encaissement date, not the date itself.

**Recommended fix order** (from the reviewer, and I agree): per-rate breakdown table → exemption
reason + reverse-charge mention (both cheap columns) → supply date → invoice-number allocator →
preceding-invoice reference.

### Not covered by this sweep — named, not deferred

**Header-level FX is modelled and checkable**: `invoices` carries `local_currency`,
`accounting_currency`, `exchange_rate_pk` and the `accounting_*` triplet.

**Per-line VAT and FX are NOT checkable today, and the sweep must say so rather than pass.**
`invoice_items.accounting_unit_price` and `.accounting_line_total` exist and have no writer — they
are always NULL, which is worse than absent because a reader can read NULL as "same currency".
Per-rate taxable base (BG-23), VAT exemption reason (BT-120/121), the reverse-charge mention, and
the preceding-invoice reference for a credit note have no field at all.

Any control point over those five reports **INCONCLUSIVE with the reason "no field exists"** — it
is never reported as a pass. That is this skill's own rule: an unexpressible check is named, not
silently dropped.
