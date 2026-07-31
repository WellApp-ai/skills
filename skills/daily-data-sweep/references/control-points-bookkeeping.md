# Bookkeeping proof chain — BOOK-

Gate 6. Proof-of-payment, the disposition gap, company identity across the proof, the `confirmed` trap.

---

## Bookkeeping proof-of-payment chain (`BOOK-`)

Runs at **gate 6**, behind `ING-` (2), `BANK-` (3), `GRAPH-` (4) and `RECON-` (5) — the proof chain
presumes the transactions and the edges beneath it have already been checked. Once a transaction is
categorized it must carry a **proof of payment** —
normally an invoice — with the document attached, both counterparties identified, at least one of
them matching the transaction's own counterparty, e-invoicing-valid line items with VAT and FX,
and any banking details on the invoice linked to a real account or payment means.

### The governing principle: absence ≠ decision

**"No invoice found yet" and "no invoice is required" must never look identical in the data.**
Today they do — and that is the single most important gap in this family. A `not_required` /
`lost` disposition belongs **on the transaction**, so that a swept, decided transaction is
distinguishable from an unswept one. See § the disposition gap below.

### Measured baseline

Measured baseline (dated, re-probe before citing): [`baseline-2026-07-29.md`](baseline-2026-07-29.md).
No figure in that file is a standing fact; the numbers move day over day.

### The `confirmed` trap

`edge_status` defaults to `confirmed`, and `match_method` can be `llm_matched` **or**
`human_approved`. So an edge that is `confirmed` **and** `llm_matched` **and** carries no human actor
means *the model was confident* — **not** *a human verified it*. Any control point that treats
`confirmed` as reviewed — including the `BOOK-edge-confidence-floor` backlog check — reads **green while
reconciliation rests on unreviewed model output.** The sweep must therefore report
`confirmed AND llm_matched AND no human actor` as its own amber class, and the model needs a distinct
human-confirmation marker (see § Known limits — there is no audit-trail root).

Whether that condition currently holds for all, some, or none of the edges is a **measurement** —
read it from the baseline file, or re-probe. It is not a property of the schema.

### Schema constraints that shape this family

**The disposition cannot live on the link:** **`invoice_transactions.invoice_pk` is NOT NULL**, so
a row cannot exist to say *there is no invoice* — that would require a sentinel invoice, which is the
null-object anti-pattern and would corrupt every `invoices` aggregate and the AR/AP posting path.

The obligation to hold proof belongs to the **transaction**; the link is the *satisfaction* of
that obligation. So `proof_status` goes on `transactions`, and `invoice_transactions` stays purely
positive evidence — mirroring the `category_*` provenance pattern already on that entity
(`category_source` / `category_status` / `category_confidence`), so reviewers know the shape and
the CHECK-constraint precedent exists.

**`documents` CAN prove file integrity — the check is buildable today.**
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

**The `confirmed` trap, precisely.** `edge_status` is `confirmed | provisional` and **defaults to
`confirmed`** — and `provisional` is documented as the 0.55–0.85 review tier that is *"filtered
out of downstream pipes until a human confirms"*. Because `confirmed` is the default, a workspace in
which no edge carries `provisional` and none carries `match_method: human_approved` is a workspace
where **the review tier is not being used at all** — and that is what the baseline recorded. Measure
it, do not assume it. Proof-of-payment is a downstream pipe, so the correct floor is not a new
confidence number — it is honouring the existing contract: only `edge_status = 'confirmed'` counts as
proof, and a `provisional` edge must never satisfy it.

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
checks ARE expressible.

#### Proof of payment

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BOOK-txn-has-proof` | Categorized transaction has a proof link | complete | `transactions` with `category_key` non-null and no `invoice_transactions` row | any row past the grace window | red |
| `BOOK-txn-proof-decided` | Undecided vs decided-no-invoice | complete | **INCONCLUSIVE — no disposition field exists.** As specified: disposition enum ≠ null. Neither `transactions` nor `invoice_transactions` carries one (§ the disposition gap) | not evaluable — emit `INCONCLUSIVE`, never a colour | blocked |
| `BOOK-proof-not-required-misuse` | `not_required` on a row that needs one | complete | **INCONCLUSIVE — depends on the missing disposition field.** As specified: disposition `not_required` where `flow_kind`/`category_key` implies a supplier invoice | not evaluable — emit `INCONCLUSIVE`, never a colour | blocked |
| `BOOK-edge-not-human-confirmed` | Reconciliation is all model output | complete | `edge_status: confirmed` **and** `match_method: llm_matched` with no human actor | any edge | amber |
| `BOOK-edge-confidence-floor` | Unconfirmed and low-confidence matches — **edges, not categories** | complete | `invoice_transactions` with `edge_status: provisional` **or** `confidence < 0.85` (tolerance 10's match floor). **Not a duplicate of `RECON-low-confidence-category`**: that one is the classifier's `category_confidence` on `transactions` at a 0.70 floor. Tolerance 10 governs both floors, which makes them read alike; the populations and the fields differ, so do not merge them | any unreviewed; the backlog arm past 10 business days | amber |
| `BOOK-edge-amount-agrees` | Edge amount matches the invoice | complete | `allocation_type: full` and abs(`amount` − invoice `grand_total`) > tolerance §14 (**0.01 same-currency, 0.5% cross-currency**); run the same comparison against the **transaction's own amount**, which can diverge from the edge `amount` on a `full` allocation. **This row owns the `full`-allocation arm only** — the summed-edge and `paid_amount` directions belong to `BOOK-edge-overallocated`, `RECON-partial-allocation-shortfall` and `RECON-paid-amount-vs-allocation`; re-checking them here counts the same invoice four times | any edge in the `full` set | red |
| `BOOK-edge-overallocated` | Allocations exceed the invoice `[EXPENSIVE]` | complete | sum of live edge `amount` per `invoice_pk` > `grand_total` + tolerance §14. A client-side reduce over the edge set — **there is no pagination**, so this is `SAMPLED` by construction whenever `returned < totalCount`; narrow the filter until one response covers the edge population, else report `SAMPLED` with the `returned`/`totalCount` pair, never a bare pass (`[EXPENSIVE]`, see `control-points-graph-recon.md`). The opposite direction, gated on `payment_status: paid`, is `RECON-partial-allocation-shortfall` | any | red |
| `BOOK-edge-currency-consistent` | Cross-currency edge has a live rate | complete | compare edge `currency` and `invoices.local_currency` against `transactions.instructed_amount.currency`; accept `accounting_currency` **only when `exchange_rate_pk` resolves live** | neither currency matches; or they differ and `exchange_rate_pk` is null **or dangling** | red |
| `BOOK-edge-dangling` | Edge points at a dead row | complete | `invoice_pk` or `transaction_pk` resolving to absent/soft-deleted. Write the predicate against the **relation** (`_not: {invoice: {}}`), never a bare `_is_null` on the FK column — only the relation traversal sees a soft-deleted target | any | red |

**Five edge rows above are the canonical form of a check that a second family also carried.**
`GRAPH-invoice-transaction-currency-mismatch`, `GRAPH-invoice-transaction-amount-mismatch` (its
`full` arm), `GRAPH-invoice-transaction-dangling-side`, `RECON-overallocated-invoice` and
`RECON-provisional-match-backlog` are removed in favour of `BOOK-edge-currency-consistent`,
`BOOK-edge-amount-agrees`, `BOOK-edge-dangling`, `BOOK-edge-overallocated` and
`BOOK-edge-confidence-floor` respectively — an edge property is owned by the proof chain, and every
threshold and secondary arm the removed rows carried is folded into the rows above. Why it matters
in the report: a `full` edge hiding a residual **drops the invoice out of AR-aging and bills-due
entirely**, and a header-only `paid_amount`/`balance_due` check cannot catch it because those fields
were written from the same bad edge; a EUR payment bound to a USD invoice makes
payment-invoice-lookup's settlement assertion false while fx-exposure counts the money under two
currencies; and payment-invoice-lookup has **no branch** for an edge that exists and resolves to
nothing — it reports a match it cannot display.

**Removed: `BOOK-proof-lost-trend`** (`lost` share rising, sweep over sweep). Deleted rather than
marked blocked. **Every sweep run is cold** — the MCP is read-only and exposes no output root, so no
prior-sweep state exists or can be written, and a cross-run comparison can never fire. Holding it as
a permanent `INCONCLUSIVE` would be worse than removing it: a check that returns the same
INCONCLUSIVE forever is indistinguishable from a disabled one, and it inflates the not-evaluated
count that stamps `(partial — N not evaluated)` on a bucket verdict — making a fully-checked month
read as degraded. It is named here because this skill's rule is that a check it cannot make is
declared, never silently dropped. A trend on `lost` becomes buildable only once both a disposition
field (§ the disposition gap) and a sweep-result store exist.

#### Company identity across the proof

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BOOK-invoice-both-parties` | Issuer and receiver both identified | complete | `invoices.issuer_pk` or `receiver_pk` null | any row | red |
| `BOOK-invoice-core-fields` | Invoices carry the fields the skills read | complete | `invoices` where any of `grand_total` / `local_currency` / `issue_date` / `due_date` `_is_null` | any row | red |
| `BOOK-party-matches-txn-counterparty` | One invoice side IS the transaction's counterparty | complete | resolve txn counterparty via `debtor_/creditor_payment_means` → `payment_means.company_pk`; assert it equals `issuer_pk` **or** `receiver_pk`. **Rows whose counterparty does not resolve are excluded and returned as `INCONCLUSIVE`, never as pass** — they are counted by `BOOK-party-match-unverifiable` | neither side matches, on a row where the counterparty *did* resolve | red |
| `BOOK-party-match-unverifiable` | Size of the population the above cannot judge | complete | txn counterparty null. This control point **is** evaluable — it counts the unevaluable rows; it is the check above that returns `INCONCLUSIVE` for them | any row | red |

#### Document attachment

| id | name | bucket | check | fail signal | sev |
|---|---|---|---|---|---|
| `BOOK-invoice-has-document` | Document attached, segmented by source domain | complete | Enumerate every in-window invoice with `source_workspace_connector.connector.data_domains`, then apply the exact three-bucket precedence in `schema-facts.md`: **document-producing**, **non-document-producing**, **unknown**. Within each bucket count all invoices (`N_bucket`) and rows where `document_pk IS NULL` (`A_bucket`). A **populated but dangling** pointer is `DOC-02`, a different defect. Never match a connector name, slug, or category to guess document capability | only `A_document-producing`, past the grace window on the differentiated `DOC-` ladder: 3 business days after `issue_date` by default; **5 calendar days and red from the first occurrence** for card/expense receipts above the €25 FR simplified-invoice VAT threshold; 10 days for transfer-settled supplier invoices. Compute severity share against `N_document-producing`, never all invoices. `N_document-producing = 0` is `INCONCLUSIVE`, not pass. Non-document-producing is INFO; unknown is INCONCLUSIVE; neither may turn red | red / amber only inside document-producing; INFO non-document-producing; INCONCLUSIVE unknown |
| `BOOK-document-has-content` | File is **recorded**, not a 0-byte placeholder | complete | `documents.size < 1024` or `content_checksum IS NULL`. A green here means "content recorded", **never** "file retrievable" — `bucket`/`path` are unvalidated strings (see `control-points-documents.md`) | any row | red |

The report always prints all three `{ missing, denominator }` pairs. A global
`document_pk IS NULL / all invoices` percentage is forbidden: accounting-ledger rows can dominate
that denominator and manufacture a permanent red. “Expected” non-document-producing rows still
carry the explicit PDF/VAT-evidence capability caveat from `schema-facts.md`; they are not a clean
bill of health.

**`BOOK-document-resolves` is removed; the canonical is `DOC-02`.** The same population — an invoice
whose `document_pk` is populated while the `documents` row is absent or soft-deleted — was carried by
three ids across three gates (`BOOK-document-resolves`, `GRAPH-invoice-document-pk-dangling`, `DOC-02`).
`DOC-02` survives because it is the definitional row: it holds the live Hasura predicate and it is the
`B` term of the two-direction bound in `control-points-documents.md`, which nothing else can supply.
Severity is red, as `BOOK-document-resolves` had it — the amber the `GRAPH-` copy carried is
superseded. `BOOK-invoice-has-document` above is the *null* direction and stays here; `DOC-02` is the
*dangling* direction.

**Two more document rows are removed; the canonicals are `DOC-04` and `DOC-07`.** Attachment
integrity is owned by the `DOC-` family, and both rows here restated a `DOC-` predicate over the
same population at a severity `DOC-` had already superseded.

- **`BOOK-document-right-kind` → `DOC-04`.** The same typed exact-match MIME allow-list, derived
  from the same `ACCEPTED_DOCUMENT_FORMATS` const, over the same attached-document population. The
  **amber this row carried is superseded by `DOC-04`'s red** — a MIME that cannot be evidence is a
  structural defect, not a hygiene note, and it is a `B` term of the two-direction bound in
  `control-points-documents.md`, which an amber would not justify. `DOC-04` already carries the
  never-`_like`-on-`filename` rule (filename is user-updatable, `type` is not) and the separate
  `application/octet-stream` finding, so nothing is lost.
- **`BOOK-document-tenancy` → `DOC-07`.** The same cross-workspace attachment, both red, differing
  only in which side's workspace was named — this row said "document's workspace ≠ invoice's
  workspace", `DOC-07` writes the live Hasura predicate against the workspace under audit. The
  invoice-side wording is carried onto `DOC-07`. This is a **security** control, not a bookkeeping
  one: because the `invoices` RLS filter is an `_or` over the invoice's workspace and the
  *document's* workspace, a cross-workspace attachment widens the read surface, which is why the
  canonical is `exhaustive` and must run in every workspace rather than only the one under audit.
