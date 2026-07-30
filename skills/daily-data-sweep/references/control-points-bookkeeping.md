# Bookkeeping proof chain — BOOK-

Gate 6. Proof-of-payment, the disposition gap, company identity across the proof, the `confirmed` trap.

---

## SECOND FAMILY — bookkeeping proof-of-payment chain (`BOOK-`)

Runs after `BANK-`. Once a transaction is categorized it must carry a **proof of payment** —
normally an invoice — with the document attached, both counterparties identified, at least one of
them matching the transaction's own counterparty, e-invoicing-valid line items with VAT and FX,
and any banking details on the invoice linked to a real account or payment means.

### The governing principle: absence ≠ decision

**"No invoice found yet" and "no invoice is required" must never look identical in the data.**
Today they do — and that is the single most important gap in this family. A `not_required` /
`lost` disposition belongs **on the link between invoice and payment**, so that a swept, decided
transaction is distinguishable from an unswept one. See § the disposition gap below.

### Live audit — all 3 workspaces, probed 2026-07-29

| what | measured | verdict |
|---|---|---|
| invoices, total | **1,517** | baseline |
| invoices with **no document attached** (`document_pk IS NULL`) | **1,304 = 86.0%** | 🔴 the audit-evidence leg is essentially absent |
| `invoice_transactions` proof links, total | **252** | — |
| transactions with a proof link | **252 of 1,904 ≈ 13.2%** | 🔴 87% of cash movement has no proof and no disposition |
| edges by `match_method` | **100% `llm_matched`** | 🔴 no human-confirmed match exists |
| edges by `edge_status` | **100% `confirmed`** | 🔴 see below — `confirmed` does not mean reviewed |
| edges by `allocation_type` / `is_partial` | **100% `full` / `false`** | 🟡 partial payments either don't occur or aren't modelled in practice |
| edge `confidence` range | **0.85 – 1.0** | 🟡 nothing below 0.85 is being written |

**The `confirmed` trap.** Every one of the 252 edges is `edge_status: confirmed` **and**
`match_method: llm_matched`. So `confirmed` here means *the LLM was confident*, **not** *a human
verified it*. Any control point that treats `confirmed` as reviewed — including the
`RECON-provisional-match-backlog` check earlier in this file — reads **green while 100% of
reconciliation rests on unreviewed model output.** The sweep must therefore report
`confirmed AND llm_matched AND no human actor` as its own amber class, and the model needs a
distinct human-confirmation marker (see § Known limits — there is no audit-trail root).

### Corrections to this family

**My disposition proposal was wrong about WHERE.** I said the disposition belongs "on the link
between invoice and payment". It cannot: **`invoice_transactions.invoice_pk` is NOT NULL**, so a
row cannot exist to say *there is no invoice* — you would need a sentinel invoice, which is the
null-object anti-pattern and would corrupt every `invoices` aggregate and the AR/AP posting path.

The obligation to hold proof belongs to the **transaction**; the link is the *satisfaction* of
that obligation. So `proof_status` goes on `transactions`, and `invoice_transactions` stays purely
positive evidence — mirroring the `category_*` provenance pattern already on that entity
(`category_source` / `category_status` / `category_confidence`), so reviewers know the shape and
the CHECK-constraint precedent exists.

**`documents` CAN prove file integrity — my "pending schema read" resolves to buildable.**
`documents` has 20 columns including **`size` (NOT NULL)**, **`type` (NOT NULL, the MIME field)**,
and **`content_checksum`** (SHA-256 over *metadata-stripped* content — PDF `/Info`/dates/`/ID`
removed, JPEG APP/COM stripped, PNG text chunks stripped), plus `processing_status` /
`processing_stage` / `processing_error`. So zero-byte detection, wrong-MIME detection, and
*content-identity* duplicate detection are all expressible today. Because the checksum is
metadata-stripped, it catches **the same invoice re-uploaded under a different filename and used
to discharge a second obligation** — a duplicate-proof check, not merely an integrity one.

**`media` is NOT the document store** — `media_type` is `avatar | logo | banner` only, and it has
no size, MIME, or checksum. Any proof-of-payment check written against `media` is checking the
wrong table. All document integrity routes through `documents`.

**`transaction_documents` allows at most ONE active document per transaction** (partial unique on
`transaction_pk WHERE deleted_at IS NULL`). So "one transaction proving multiple invoices" must go
through multiple `invoice_transactions` edges — correct shape — but it also means a transaction
whose single slot holds a bank-statement PDF **cannot also hold the supplier invoice**.

**Refining the `confirmed` trap.** `edge_status` is `confirmed | provisional` and **defaults to
`confirmed`** — and `provisional` is documented as the 0.55–0.85 review tier that is *"filtered
out of downstream pipes until a human confirms"*. So my "100% confirmed" finding is sharper than
I stated: the review tier **is never being used**. Likewise `match_method` includes
**`human_approved`** as a value, and **zero rows carry it**. Proof-of-payment is a downstream
pipe, so the correct floor is not a new confidence number — it is honouring the existing contract:
only `edge_status = 'confirmed'` counts as proof, and a `provisional` edge must never satisfy it.

**A blocker on the duplicate-payment check.** `allocation_type` (`full | partial | overpayment |
fee_deduction`, default `full`) coexists with a **legacy `is_partial` boolean carrying a TODO to
remove it** — two fields encoding overlapping truth, able to disagree. Because both default to
"full/not-partial", a legacy instalment set is **indistinguishable from a duplicate payment**.
Retiring `is_partial` is the prerequisite for running the duplicate-payment check at the severity
it deserves (real money leaving twice).

### The disposition gap — a concrete schema proposal

`invoice_transactions` has 20 fields: `accounting_amount`, `accounting_currency`,
`allocation_type`, `amount`, `confidence`, `created_at`, `currency`, `deleted_at`, `edge_status`,
`exchange_rate_pk`, `invoice_pk`, `invoice_transaction_id`, `is_partial`, `match_method`, `pk`,
`reasoning`, `subscription_pk`, `transaction_pk`, `updated_at`, `workspace_pk`.

**None of them can express "no invoice required" or "invoice lost"** — and both FKs (`invoice_pk`,
`transaction_pk`) are structurally required for a row to exist at all, so a decision *about a
transaction with no invoice* has nowhere to live.

What the model needs, stated concretely:

- a **typed disposition** on the transaction side of the proof relation —
  `proof_status: matched | not_required | lost | pending` as an enum, plus
  `proof_status_reason` (free text) and `proof_status_set_by` / `proof_status_set_at` so a
  decision is attributable.
- It cannot live only on `invoice_transactions`, because the interesting cases have no invoice.
  Either add it to `transactions`, or allow a nullable `invoice_pk` on the link row.

Until it exists, `BOOK-txn-proof-decided` below is **unbuildable**, and the sweep can only report
gross "no proof link" counts without distinguishing a backlog from a completed judgement.

### `BOOK-` control points

Confirmed: `invoice_transactions` carries a **per-edge `amount` + `currency` + `accounting_amount`
+ `accounting_currency` + `exchange_rate_pk`** — so over-allocation and cross-currency match
checks ARE expressible (this corrects an earlier reviewer who reported no per-edge amount).

#### Proof of payment

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BOOK-txn-has-proof` | Categorized transaction has a proof link | `transactions` with `category_key` non-null and no `invoice_transactions` row | any past the grace window; **live ≈87% of transactions** | red |
| `BOOK-txn-proof-decided` | Undecided vs decided-no-invoice | disposition enum ≠ null | **UNBUILDABLE today — no field** | red (blocked) |
| `BOOK-proof-not-required-misuse` | `not_required` on a row that needs one | disposition `not_required` where `flow_kind`/`category_key` implies a supplier invoice | any | amber |
| `BOOK-proof-lost-trend` | `lost` share rising | disposition `lost` count, sweep over sweep | rising 3 sweeps running | amber |
| `BOOK-edge-not-human-confirmed` | Reconciliation is all model output | `edge_status: confirmed` **and** `match_method: llm_matched` with no human actor | **live 252/252** | amber |
| `BOOK-edge-confidence-floor` | Low-confidence matches surfaced | `confidence < 0.85` | any unreviewed | amber |
| `BOOK-edge-amount-agrees` | Edge amount matches the invoice | `allocation_type: full` and abs(`amount` − invoice `grand_total`) > tolerance §14 | any | red |
| `BOOK-edge-overallocated` | Allocations exceed the invoice | sum of live edge `amount` per `invoice_pk` > `grand_total` + tolerance | any | red |
| `BOOK-edge-currency-consistent` | Cross-currency edge has a rate | edge `currency` ≠ invoice `local_currency` and `exchange_rate_pk IS NULL` | any | red |
| `BOOK-edge-dangling` | Edge points at a dead row | `invoice_pk` or `transaction_pk` resolving to absent/soft-deleted | any | red |

#### Company identity across the proof

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BOOK-invoice-both-parties` | Issuer and receiver both identified | `invoices.issuer_pk` or `receiver_pk` null | any; **live: issuer null observed on a Pennylane invoice** | red |
| `BOOK-party-matches-txn-counterparty` | One invoice side IS the transaction's counterparty | resolve txn counterparty via `debtor_/creditor_payment_means` → `payment_means.company_pk`; assert it equals `issuer_pk` **or** `receiver_pk` | neither side matches | red |
| `BOOK-party-match-unverifiable` | Counterparty unresolvable, so the above can't run | txn counterparty null → check is INCONCLUSIVE, never pass | any | red |

#### Document attachment

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BOOK-invoice-has-document` | Document attached | `invoices.document_pk IS NULL` | **live 1,304/1,517 = 86%** | red |
| `BOOK-document-resolves` | Not a phantom attachment | `document_pk` non-null resolving to absent/soft-deleted | any | red |
| `BOOK-document-has-content` | File is real, not a 0-byte placeholder | needs a size/checksum/mime field on `documents`/`media` | **pending schema read** | red |
| `BOOK-document-right-kind` | Mime is a document kind that can be a receipt | **typed exact-match allow-list of mime types — never a substring test on a filename** | any outside the list | amber |
| `BOOK-document-tenancy` | Document belongs to this workspace | document's workspace ≠ invoice's workspace | any | red |
