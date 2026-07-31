# Latent assumptions — ASSUME-

Gate 9, which audits the other gates. What the 12 published skills assume but none verify. A red here means the greens are unverified, not verified.

---

## Latent gaps — what the 12 skills ASSUME but never verify (`ASSUME-`)

From a full reverse-reading of all 12 published skills against the live schema. **This is the
most valuable table in this file.** Every entry below is assumed by at least one skill's
arithmetic and verified by *none* of them — so when one fails, no skill refuses. It answers
confidently, cites a real as-of date, and is wrong. That is precisely the failure class a daily
sweep exists to catch, and it is invisible from inside any single skill.

Ordered by blast radius. **Groundable today** = expressible with existing fields, zero schema
change.

| id | bucket | the assumption | assumed by | why it's dangerous | groundable today? |
|---|---|---|---|---|---|
| `ASSUME-balance-verification-unread` | complete | That the balance you read passed verification | cash-position, cash-balance-trend, fx-exposure, runway-calculator | **The single worst one.** `account_balances` carries six verification fields and **not one of the 12 skills mentions any of them.** Every cash figure is read off `closing_booked` with zero regard for whether that balance failed verification, was never verified, or fails to tie to its own movement — then divided by burn to produce a runway headline. Verification failures are live in production; for the measured count as of a stated date see `baseline-2026-07-29.md`, and re-measure rather than quoting it — that figure decays. | ✅ yes — pure read the skills never make |
| `ASSUME-booking-date-not-null` | complete | That every transaction has a date | runway-calculator, payment-invoice-lookup, missing-receipts, expense-breakdown | `booking_date` is nullable in production and **no skill names any transaction date field at all** — the window filter is treated as self-evident. Null-dated rows drop from every windowed query without a trace, understating outflow and therefore **overstating runway — the failure direction that most flatters the number and is least likely to be questioned.** | ✅ yes |
| `ASSUME-payment-status-ties-to-balance` | complete | That `paid ⇒ balance_due = 0` | rank-clients-by-ltv, accounts-receivable-aging, bills-due, fx-exposure, expense-breakdown | LTV counts `paid` and sums `grand_total`; AR/AP count `unpaid`/`partial` and sum `balance_due`. Nothing checks the invariant. A drifted pair **overstates revenue and understates receivables in the same workspace at the same time**, so the two reports disagree and neither flags it. | ✅ yes |
| `ASSUME-classifier-healthy` | complete | That categorization succeeded before ranking categories | expense-breakdown | `category_status` has live `classifier_failed` / `classifier_abstained` / null, and `category_confidence` exists — the skill reads none of them. A failed window yields a skewed breakdown presented as the answer to the skill's own headline question. Low-confidence guesses are indistinguishable from confident ones in the output. | ✅ yes (needs a named threshold) |
| `ASSUME-fx-rate-fresh` | complete | That "most recent rate at or before as-of" is recent | fx-exposure (red) + 8 skills' conversion paths | The skill forbids future/arbitrary rates but **sets no upper bound on age**. A six-month-old rate satisfies the rule, is cited honestly with its `rate_date`, and is materially wrong — the skill's own quality check is **fully passed by a bad answer**. | ✅ yes (needs a max-age constant) |
| `ASSUME-invoice-not-duplicated` | exhaustive | That each bill appears once | bills-due, expense-breakdown, accounts-receivable-aging | Both AP skills sum with no uniqueness check. The same bill ingested from a bank connector *and* an accounting connector doubles the cumulative-outflow total that `bills-due` exists to produce. | ✅ yes (`invoice_number` within issuer) |
| `ASSUME-degraded-connector-visible` | exhaustive | That a stopped feed is noticed | all 11 read skills | Every skill tests for `enabled` only. A connector that *was* feeding and has since gone `degraded` still has rows (so the data-presence spot-check passes), the feed has stopped, and **no skill says so** — while the staleness caveat depends on a `completed_at` a degraded connector may simply stop writing. | ✅ yes |
| `ASSUME-accounts-type-is-cash` | complete | That every owned account is cash | cash-position, runway-calculator, fx-exposure | Skills check *ownership* but never account **kind**. A credit-card, loan, or investment account lands inside "total cash on hand" and flows into runway's numerator. Accounts carrying `type: other` with a null currency exist in production; for the measured count as of a stated date see `baseline-2026-07-29.md`, and re-measure rather than quoting it. Needs a structured allow-list of `accounts.type` values — an exact-match record, **not a substring test on the type label**. | ✅ field exists; classification decision open |
| `ASSUME-own-company-correct` | complete | That the workspace's own company is right, not merely non-null | accounts-receivable-aging, bills-due, rank-clients-by-ltv, expense-breakdown, company-profile, fx-exposure | A wrong own-company **inverts payables and receivables** — AR-aging lists your own bills as customer debt, LTV ranks your vendors as best customers — with no null to trip on. **`own_company_pk` is not exposed on the MCP surface** (verified: 14 fields). And a company row tagged `company_origin: counterparty` is NOT evidence of a defect — origin is per-company and cannot express per-workspace self-ness. See `schema-facts.md` (authoritative). This control point is INCONCLUSIVE on the MCP surface, never red. | ❌ needs a self-marker + provenance (`own_company_source` / `confirmed_at`) |
| `ASSUME-no-duplicate-counterparty` | exhaustive | That one real counterparty is one row | rank-clients-by-ltv, company-profile, accounts-receivable-aging, expense-breakdown | Duplicates **split** per-company totals, dropping a top customer down the ranking or off it, and hide half the relationship in the 360 view. `company-profile` catches *query-time* ambiguity; the ranking skills never search by name, so they never even see it. | ❌ needs `duplicate_of` / a uniqueness axis; live keys are frequently null |
| `ASSUME-document-is-a-real-receipt` | complete | That a non-null document is a valid receipt | missing-receipts | The entire compliance verdict is `document IS NOT NULL`. Nothing verifies the document has content, is a receipt, or belongs to that invoice. A workspace where every invoice has an empty or wrong-kind attachment gets **a clean bill of health — the exact opposite of the skill's purpose.** | ❌ needs a document type + byte-size/checksum field |
| `ASSUME-ledger-expense-filter-exists` | complete | That "expense-type ledger accounts" is a filter someone can write | expense-breakdown, runway-calculator | Both skills instruct joining `ledger_accounts` for expense-type accounts and **no skill names the field carrying that type.** The *preferred* path for both the spend breakdown and the burn rate rests on a filter nobody has identified — any implementation is guessing, the exact failure `well_get_schema` was mandated to prevent. | ❌ needs the account-class field name + enum |
| `ASSUME-allocations-dont-over-allocate` | complete | That payments allocated to an invoice sum to ≤ its total | payment-invoice-lookup | Over-allocation surfaces as a `confirmed` match with high `confidence` — **the reconciliation error most likely to be trusted.** The skill names `match_method`, `confidence`, `edge_status`, `allocation_type` — none carries a number. | ❌ needs a per-edge allocated amount |
| `ASSUME-rows-belong-to-this-workspace` | exhaustive | That returned rows are actually this workspace's | all 12 skills | No skill asserts tenancy on a single returned row; all 12 delegate scoping to the server. A scoping regression surfaces as **another workspace's financials presented with full confidence and a valid as-of date** — the highest-severity failure in the set, and the only one with no in-skill tripwire whatsoever. | ❌ needs a tenant key on returned rows of every read root |

### Sweep ordering that follows from this

The **first wave** of the daily sweep should be the seven groundable-today rows above
(`ASSUME-balance-verification-unread`, `-booking-date-not-null`,
`-payment-status-ties-to-balance`, `-classifier-healthy`, `-fx-rate-fresh`,
`-invoice-not-duplicated`, `-degraded-connector-visible`). They need **no schema change** — they
are reads the skills simply never make, which makes them the highest-leverage checks in the
entire file.

The remaining six are **schema asks**. Escalate two first:
`ASSUME-rows-belong-to-this-workspace` (a cross-workspace leak is a data-integrity violation
with no tripwire anywhere) and `ASSUME-ledger-expense-filter-exists` (the preferred path of two
skills rests on a filter nobody has named).

### The most-shared precondition — make it control point #1

**Data presence, not connector status** breaks **11 of the 12 skills** (all but `draft-invoice`,
which writes). Every read skill's workflow spot-checks a root for actual rows, and every one
stops and hands over `install_url` links when it's empty. All 11 state it in *identical words*
in their Quality checks — *"Data presence was checked, not just connector `enabled` status."*
That shared phrasing is the tell: the skills were written knowing status and presence diverge in
production. The live `degraded` value proves the divergence has a third state none of them model.

Ordering after it: workspace resolvable (12 skills, but an auth gate not a data-quality one) →
data presence (11) → connector enabled / not-degraded / sync terminal (11 each, cheaper but
weaker) → FX pair coverage (1 red + 8 amber, the widest *silent* degradation) → invoice money
fields / party ids (7 / 6, the invoice-arithmetic core).

### Coverage note

Of the 33 live roots, **`billing_events` is read by no published skill at all.** Nothing in the
suite can answer a subscription or billing-state question. Not a bug — a coverage gap worth a
decision.
