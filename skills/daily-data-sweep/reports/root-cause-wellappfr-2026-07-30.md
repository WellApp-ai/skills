# WellappFR Sweep — Root-Cause Analysis
**Date:** 2026-07-30 · **Workspaces:** WellappFR `1c5c706f-fee3-4e5e-9fbc-746132b0647e` (FR) vs. WELL APP INC. `c3f54fe3-6189-4854-a144-6c678f94806e` (US)

## Executive summary

1. The FR entity is not clean — its 314 transactions are **157 real transactions ingested twice** (Qonto MCP + `plaid_qonto_fr`), and 120 of its 671 invoices are cross-source duplicates. True ratio is 551:157, not 671:314.
2. The highest-blast-radius defect is not categorization: **460 of 500 sampled FR invoices sit at `payment_status = 'unknown'` with NULL `balance_due`**, and `bills-due` reports that as "no bills currently due" — a false all-clear against ~434 real payables.
3. `category_status` has no state for "the classifier never ran", so halts and FAILED tasks both render as NULL, and the self-heal sweeper excludes them forever. Real, global, code-grounded.
4. **The first hypothesis for the FR-vs-US categorization gap — that Mercury's missing provider config starves the US rail — was refuted.** It is contradicted by the US data itself. See §2.
5. French e-invoicing (Factur-X/PDP/e-reporting) is **unbuilt, not broken**. Zero implementing code. No regulatory exposure claim is made here beyond that.

---

## 1. What FR proves about US — the natural experiment, and where it breaks

Same code, different connectors. The comparison is genuinely informative on three axes, and misleading on a fourth.

**What it proves.**

| Signal | FR | US | Reading |
|---|---|---|---|
| Classifier decline rate (rows carrying a status / total) | 11.1% (35/314) | 8.8% (141/1,597) | **The classifier, prompt, validator and enqueue path are exonerated.** US is marginally *better*. Do not tune the classifier. |
| `category_status` NULL | 3.5% | 38.1% | 100% of the 3× gap lives here — in rows that **never reached the LLM**, not rows it declined. |
| `ledger_account_pk` NULL | 100% | 100% | Identical on both rails → ledger assignment is not connector-dependent. It is downstream of the `auto_write` branch (`transaction-category.service.ts:130-141`), which a halted row never reaches. |
| Accounts with NULL currency | 0/3 | 63/66 | Qonto pins `account.currency` to `$v.currency` (`apps/api/src/mcps/qonto/slot-mappings.json:48`); the US rail's equivalent is unpinned. This one *is* a mapping-config difference, and it is verified. |

The enqueue path is source-agnostic — `TransactionSubscriber.afterFlush` pushes every CREATE-changeset transaction regardless of connector (`apps/api/src/database/subscribers/transaction.subscriber.ts:96`, enqueued at `:162`, comment explicitly "Plaid, MCP, manual all flow through this same afterFlush"). US rows **got** tasks. The tasks terminated without writing a status. That is the finding.

**Where the experiment breaks: the first hypothesis was wrong.**

The initial explanation — that `mercury-mcp` ships with no `apps/api/src/mcps/mercury-mcp/` directory, therefore its JSONata mapping never fills `description`/counterparty, therefore US transactions are born featureless and halt on `insufficient_features` — **does not survive the US data**:

- 989 of 1,597 US rows (62%) **did** clear the sufficiency gate. A JSONata mapping is generated per (connector, target model, tool) and applied uniformly to every row that tool returns. An unmapped slot is all-or-nothing: it would starve ~100% of that tool's transactions, not 38%. A 38/62 split is the signature of row-level payload variance or a mixed population, not a missing provider config.
- "Exactly one code path leaves `category_status` NULL" is false. There are at least six: halts on `transaction_not_found` (`transaction-category-enrichment.service.ts:62`), `user_category_protected` (`:92`), `insufficient_features` (`:106`), `category_catalog_empty` (`:113`); `writeClassifierDecision` returning `skipped/protected_category` for a RULE-sourced row without assigning status (`transaction-category.service.ts:87-100`); and a task that **throws**, marked FAILED at `worker.service.ts:353` — likewise NULL, likewise permanently excluded.
- Nothing in the code establishes that US transactions originate from `mercury-mcp` or FR's from `qonto`. Both were assumed, and the whole FR-is-good half rested on that assumption.
- The absence of `mcps/<slug>/` is the **norm**, not a misconfiguration: `Migration20260601150143` bulk-seeds a large marketplace catalogue, only 12 providers have a provider directory (13 dirs total under `apps/api/src/mcps`, not the 23 originally claimed), and `loadProviderHints` explicitly returns `undefined` for the no-file case (`sync-config.service.ts:63`).

**Corrected reading of the experiment:** FR's better categorization number is *not yet explained*. What the two workspaces jointly prove is that the terminal-state modelling gap is real and global; the *cause of the 608 US NULLs* requires one query nobody ran — group them by their enrichment task's `status` and `output->'halt'->>'code'`. Until that runs, FAILED-task exhaustion is at least as good an explanation as thin payloads.

---

## 2. Findings ranked by blast radius

### F1 — Connector-synced invoices are permanently `payment_status = 'unknown'`; `bills-due` emits a false all-clear
**Classification: broken.** Confidence: high (code + live data, independently reproduced).

Two holes, no third writer:

1. `invoiceStatusRecomputeTargets.set(...)` occurs **only** inside the `invoice_transaction` target-model branch — `apps/api/src/services/connector.service.ts:2978`. The `invoice` branch constructs `new Invoice()` at `:1366` and never assigns `payment_status`, `paid_amount`, or `balance_due`. An invoice synced without a settlement link is never enqueued for recompute.
2. The hourly backstop cannot rescue it: `apps/api/src/services/invoice-status-recompute-sweeper.service.ts:181` requires `EXISTS (SELECT 1 FROM core_api.invoice_transactions it WHERE it.invoice_pk = i.pk …)`. Zero-link invoices are excluded by construction.

So the row keeps the entity default `PaymentStatusEnum.UNKNOWN` (`apps/api/src/database/entities/Invoice.ts:167`) instead of the `UNPAID` the decision table would produce for `paid.eq(0)` (`invoice-status-recompute.service.ts:363`). The feature flag is not the cause — `FEATURE_FLAGS.invoiceStatusRecomputeWrite = true` (`feature-flags.const.ts:57`).

Live FR data, 500-row sample: `unknown` 460, `paid` 39, `partial` 1; `balance_due` NULL on exactly those 460. `bills-due` filters `payment_status in (unpaid, partial)` and is instructed at `bills-due/SKILL.md:113` to report an empty result as "no bills currently due (not an error, not a guess)". That is a **false all-clear against ~434 genuinely unpaid payables** (the other 26 have `grand_total <= 0` and would halt at `grand_total_invalid` even if recompute ran).

**Scope correction:** two writers *do* enqueue unconditionally — `invoice.service.ts:282` (`createInvoice`) and `extract-persistence.service.ts:785` (post-extraction). The gap is specific to the connector-sync write path — which is 100% of WellappFR's 671 invoices.

**Blast radius:** every MCP-synced invoice in every workspace with no matched settlement. WELL APP INC's 634 invoices have the same shape. Downstream: `bills-due`, `accounts-receivable-aging`, `expense-breakdown`, `fx-exposure`, and `daily-data-sweep` — the skill explicitly meant to catch this, and which currently will not.

**Fix (on-sync path):**
- (a) Populate `invoiceStatusRecomputeTargets` for every invoice persisted in the `invoice` target-model branch of `connector.service.ts`, not only inside the `invoice_transaction` branch.
- (b) Relax the sweeper predicate at `invoice-status-recompute-sweeper.service.ts:181` to `(EXISTS(...) OR i.payment_status = 'unknown')`. This is the acceptable residual shape per CLAUDE.md: idempotent, gated by the existing per-pass cap, **pure arithmetic on existing links — zero LLM calls**. Roll out and watch one pass.

---

### F2 — `category_status` has no terminal state for "the classifier never ran", and the self-heal predicate is one-shot
**Classification: broken (missing state modelling + non-retrying backstop).** Confidence: high on mechanism, **unknown on which outcome dominates**.

- `writeClassifierDecision` is the only assigner of `category_status` (`transaction-category.service.ts:74`, `:110`, `:123` — confirmed as the only three assignment sites repo-wide) and sits strictly downstream of `classify()`.
- Six upstream paths terminate before it, all leaving NULL (enumerated in §1).
- `processTransactionCategory` sets `task.status = COMPLETED` even for a halt (`worker.service.ts:870`); a throw is marked FAILED (`worker.service.ts:353`).
- `findUncategorizedNeverEnqueued` (`apps/api/src/database/repositories/transaction.repository.ts:41`) excludes any row with **any** non-deleted `TRANSACTION_CATEGORY` task — its own docstring says "FAILED included". The subscriber fires only on CREATE, so a later enriching sync-UPDATE never re-fires it.

Net: one terminal outcome — of six kinds, indistinguishable in the data — retires a transaction from categorization **forever**. `TransactionCategoryStatusEnum.PENDING`, `UNCATEGORIZED` and `LEGACY_UNMAPPED` are declared and never assigned; that enum-side gap is this same wiring hole seen from the other end.

The sweeper is not the bottleneck: caps are 500 rows / 500 LLM enqueues per 30-minute pass (`categorization-sweeper.service.ts:42/49/63`), draining 1,597 rows in ~2h. There is no per-workspace quota or cost ceiling anywhere in the path.

**Fix (on-write path, no backfill):**
- (a) Assign a status on every pre-classify exit. Use the already-declared `PENDING`, or add `INSUFFICIENT_EVIDENCE` / `HALTED`, written from the halt branch in `transaction-category-enrichment.service.ts:106` or persisted by `processTransactionCategory` from the halt result. This alone converts an invisible failure into a queryable one.
- (b) Widen `findUncategorizedNeverEnqueued` to re-admit a row whose newest task halted **and whose evidence has since materially changed** (`remittance IS NOT NULL OR either payment-means leg IS NOT NULL`). Rows still featureless stay excluded, so the sweep converges and no LLM spend goes to rows that would halt again. Do **not** run a one-shot classifier pass over the 608 US rows — CLAUDE.md forbids LLM-per-row backfills over historical data outright.
- (c) Before either: run the diagnostic query (§4).

---

### F3 — Dual-rail duplication: 157 transactions ingested twice, ~120 excess invoice rows
**Classification: broken (dedup key).** Confidence: high, independently reproduced against live data.

- Transactions: 157 from slug `qonto` (MCP) + 157 from `plaid_qonto_fr`, both spanning 2025-09-09 → 2026-07; 97 distinct days, 50 with byte-identical per-day counts on both rails. `|amount| + currency` multiset matches **157/157**; greedy pairing within ±3 days matches 157/157.
- **Why dedup misses it — two independent reasons, not one.** The Plaid rail stores `executed_at` date-only (all 157 at 00:00:00) while the Qonto MCP rail stores full timestamps, so exact-timestamp pairing is 0/242. *And* the Qonto MCP rail stores all 157 amounts **positive** (sign dropped) while Plaid preserves sign (145 negative), so exact signed-amount pairing finds only 12/157. Any dedup keyed on signed amount **or** exact timestamp fails.
- Invoices: 671 = 440 pennylane + 231 qonto. 87 duplicate groups on `(grand_total, currency, issue_date)`, 120 excess rows, **109 of that excess cross-source Pennylane↔Qonto on the same supplier bill** (e.g. ANTHROPIC PBC 100.55 USD 2026-03-10 on both rails). Qonto declares `invoice` as a supported target (`packages/mcp-generator/configs/qonto.yaml:53`) and Pennylane re-exports the same supplier invoices it ingested from Qonto.

**Blast radius:** any workspace holding a native MCP bank connector *and* its Plaid mirror — confirmed on Qonto (FR), same shape on Mercury (US). Double-counts transaction volume → corrupts `runway-calculator` burn, `cash-balance-trend`, and every per-month count. Invoice duplication inflates payables ~18% and generalises to the whole FR beachhead configuration (accounting connector + the bank that feeds it).

**Fix:** extend the entity dedup rule in `apps/api/src/services/reconciliation/dedup-resolver.ts` to key on `(workspace, account, date-truncated executed_at, |amount|, currency)`; invoice rule on `(workspace, receiver, issue_date, grand_total, currency)` with vendor reference as tiebreak, preferring the accounting-rail survivor. Separately fix the Qonto MCP **sign loss** at the mapping layer — that is its own ingestion defect. Entity-rules changes are covered by boot-time `validateEntityRules()`, so they require the clean-DB boot test from CLAUDE.md before pushing.

---

### F4 — No AR side exists, and no surface says so
**Classification: mixed — misconfiguration (Stripe DEGRADED) + broken (silent no-match).** Confidence: high.

- All 671 FR invoices have `receiver = "WellappFR"`; **zero** have `issuer = WellappFR`. Pennylane declares both `customer_invoices:readonly` (`pennylane.yaml:13`) and `supplier_invoices:readonly` (`:19`) plus both sub-resources — only the purchase side materialised. The "full accounting ledger inflates the ratio" hypothesis fails: a full ledger carries AR.
- Stripe is DEGRADED and declares `[company, invoice, transaction, payment_means]` (`stripe.yaml:31`) — it is the rail that would supply both the missing AR side and the missing card charges (many invoice numbers are Stripe receipt ids; those charges are absent from the 157).
- Only 66 `invoice_transactions` exist for 671 invoices (9.8%). The matcher's no-match branches log-and-`return []` with no task, no flag, no review tier — `reconciliation/worker.service.ts:788` (transaction-anchored, logs) and `:934` (invoice-anchored, no log at all). 605 invoices are silently unmatched.
- 104 invoices (15.5%) can never match by construction: 83 predate bank coverage (2025-09-09) and 21 have NULL `issue_date`. The candidate window is `coalesce(executed_at::date, booking_date, value_date, requested_execution_date::date) ± 90 days` (`candidate.service.ts:240`), short-circuited on a missing anchor at `:199`. `MAX_MATCHER_CANDIDATES = 500` (`:36`) is not binding — the gap is missing transactions, not a truncated candidate set.

`accounts-receivable-aging` correctly returns zero here, but zero is an artefact of Stripe never connecting, not of nobody owing money — and the skill has no way to distinguish the two.

**Fix:** connect Stripe/PayPal/Wise; and add a coverage-caveat step to both `bills-due` and `accounts-receivable-aging` — when a connector declaring `invoice` is degraded/`to_configure`, or when `payment_status='unknown'` exceeds a threshold, report the gap instead of a clean zero. `bills-due/SKILL.md:113` currently mandates the opposite.

---

### F5 — French e-invoicing is unbuilt
**Classification: unbuilt.** Confidence: high. Roadmap, not repair. No existing behaviour is wrong.

Well's `Invoice` is a commercial/accounting model, not an EN 16931 semantic model:

- `document_type_code` is the only e-invoicing-shaped structured field (`Invoice.ts:79`), over `DocumentTypeCodeEnum` which does carry the UN/CEFACT 1001 subset 380/381/383/384/386 (`document-type-code.const.ts:2`). For Pennylane it is pinned `{"null": true}` with the rationale "Pennylane has no UBL/Peppol document type code" (`pennylane.yaml:410`, `:447`) — **by design, not by defect**. It *is* populated on the document-extraction rail (`extract-persistence.service.ts:1862-1866`, defaulting to 380), so the null is Pennylane-specific.
- No per-rate VAT breakdown (BG-23). `tax_total` is a single `decimal(12,2)` (`Invoice.ts:91`); the closest thing is per-line `tax_rate`/`tax_category`/`tax_scheme` (`InvoiceItem.ts:68`). Notably, a breakdown **is** extracted (`invoice-extraction-schema.ts:193 tax_breakdowns`) and then **discarded** — grepping outside `services/extract/` returns zero persistence hits.
- No UNTDID 4461 payment-means code: `InvoicePaymentMeans.payment_type` is free-text `varchar(50)` (`InvoicePaymentMeans.ts:38`). BT-81 has no typed home.
- Party legal identity is one slot — `tax_id_value` + `tax_id_type` (`Company.ts:100`), plus `registered_value`/`registry_name` (`:119`). BT-30 and BT-31 need distinct values, and `Invoice.issuer/receiver` are FKs to **mutable** Company rows (`Invoice.ts:119-123`) — no identifier snapshot as-issued. For Pennylane the link resolves by display name, not SIREN/VAT: "Pennylane supplier invoice carries supplier_name but no tax_id" (`mcp-entity-schemas.const.ts:136`). (The generic schema *does* define `issuer_tax_id_*`/`receiver_tax_id_*` as FK-resolution inputs at `:112/:136` — they are simply unpinned for Pennylane and never persisted onto the invoice.)
- **0 documents is structural, on two independent levels.** (a) Pennylane's `getCustomerInvoiceAppendices`/`getSupplierInvoiceAppendices` are parent-scoped sub-resources the tool selector cannot consume — "## document target — NOT SUPPORTED on Pennylane (intentional)" (`pennylane.yaml:1006`). (b) The generic connector document rail has **no vocabulary for a file body** for any provider: `documentEntitySchema` slots are filename/path/type/size/document_type/external_id, with no content/bytes/download_url/checksum (`mcp-entity-schemas.const.ts:568`), and the persister hardcodes `bucket = "mcp-sync"` with no HTTP fetch and no GCS write (`connector.service.ts:2761`, `:2809`). Well *can* store bytes — via the human multipart rail `/v1/documents` → GCS — just never via connector sync.
- Zero PDP/Chorus Pro/Factur-X/e-reporting code exists. Repo-wide search for `siret|siren|factur-x|chorus|peppol|EN 16931|UNTDID|4461|CII|ZUGFeRD|UBL|CrossIndustry` returns only two COMING_SOON catalog rows (`seed.ts:1807` Factur-X, `:1817` FatturaPA), a migration enum literal, describe strings, and two incidental billing-meter comments.

**Not overstated:** Well *does* implement one French statutory export — FEC gapless legal sequencing under art. A47 A-1 LPF (`ledger-export.service.ts:72`). That is a different obligation and does not mitigate the e-invoicing gap, but "no French compliance at all" would be wrong.

**Honest framing:** Well is a read-side financial graph over invoices, not an e-invoicing issuance/exchange platform. If asked today to emit Factur-X, route through a PDP, or produce an e-reporting extract, no code path exists. The ordered build, if it becomes in-scope: freeze party identifiers on the invoice → add a per-rate VAT breakdown table (the extractor already produces the data) → replace `payment_type` with a UNTDID 4461 enum in a shared constants file → derive `document_type_code` Well-side → unblock document bytes (parent-iterated sub-resource fan-out, named as the blocker at `pennylane.yaml:1014`, or a byte-fetch stage) → only then a PDP adapter and PDF/A-3 generator. Do not backfill the 671 existing invoices.

---

## 3. Classification split

| # | Finding | Class | Wrong number today, or absent capability? |
|---|---|---|---|
| F1 | Zero-link invoices stuck `unknown`; false all-clear | **broken** | Wrong number today — and the worst kind: a confident zero |
| F2 | No terminal state for "classifier never ran"; one-shot self-heal | **broken** | Wrong number today (uncategorized %) + absent observability |
| F3 | Dual-rail transaction + cross-source invoice duplication | **broken** | Wrong number today (2× transactions, +18% payables) |
| F3b | Qonto MCP drops the amount sign | **broken** | Wrong number today; also defeats F3's fix if unaddressed |
| F4a | Stripe DEGRADED → no AR, missing card charges | **misconfiguration** | Missing data; the zero is real but meaningless |
| F4b | Matcher no-match is silent (no task/flag/tier) | **broken** | Absent capability — nothing proactively surfaces 605 unmatched invoices |
| F5 | FR e-invoicing (Factur-X/PDP/e-reporting) | **unbuilt** | Absent capability. No defect. |
| — | 671:314 "2.1 invoices per transaction" as the headline | **measurement-error** | Both sides mis-measured; true deduped ratio 551:157 = 3.5:1 |
| — | Mercury-missing-config as cause of US categorization gap | **refuted** | See §1; the original hypothesis was wrong |
| — | 100% `ledger_account_pk` NULL on both rails | **expected-shape** given F2 | Downstream of the `auto_write` branch a halted row never reaches |

---

## 4. Hypotheses needing verification — unevidenced, do not act on these yet

1. **What the 608 US `category_status` NULLs actually are.** Never measured. Required query: group those rows by their `enrichment_tasks.status` and `output->'halt'->>'code'`. Until it runs, `insufficient_features` halts, FAILED-task exhaustion, and still-PENDING are all live candidates. **This is the single highest-value next action** and it is a read-only query.
2. **The connector attribution itself.** That US transactions come from `mercury-mcp` and FR's from `qonto` was assumed, never shown, and the FR half of the natural experiment rests on it entirely.
3. **Why 62% of US rows cleared the sufficiency gate while 38% did not.** If it is not a mapping defect (it cannot be, uniformly), it is row-level payload variance or a mixed population — multiple connectors, or multiple mapping versions over time. Unknown.
4. **Whether WELL APP INC. shares F1.** 634 invoices, same dual-rail shape, so almost certainly — but its `payment_status` distribution was not sampled.
5. **Whether `mercury-mcp` genuinely warrants a provider config.** Having no `mcps/<slug>/` dir is the norm (12 of N seeded providers have one). Whether a bank connector carrying `transaction` in its sync targets *should* be held to a higher bar than a marketplace connector is a product decision, not an established defect. If yes, the enable-time gate below is the right shape.

---

## 5. What this means for the sweep skill

The sweep is currently blind to exactly the class of defect it exists to catch.

1. **Never present a payables or receivables total without a coverage denominator.** `daily-data-sweep` must count `payment_status = 'unknown'` and refuse to emit a total above a threshold. `bills-due/SKILL.md:113` currently instructs the opposite — an empty result must be reported as *unknown coverage*, not "no bills due". Same for `accounts-receivable-aging`: a zero when a connector declaring `invoice` is DEGRADED is not a finding, it is a gap.
2. **Add three control points, all cheap read-only queries:**
   - transactions grouped by `category_status IS NULL` × newest task `status` × `halt.code`, **grouped by connector** — this one query turns F2 from a two-workspace forensic exercise into a dashboard row;
   - per-workspace duplicate detection on `(account, date, |amount|, currency)` across connector slugs — would have caught F3 on day one;
   - invoice count with zero `invoice_transactions` links, and invoice count with `issuer = own_company` (an AR side of exactly zero is a red flag, not a clean bill).
3. **Distinguish "clean" from "not measured."** FR looked like the healthy arm of the experiment. It is running at 2× on transactions, +18% on payables, and a false all-clear on ~434 bills. A sweep that reports EXHAUSTIVE on this workspace is wrong, and it currently would.
4. **Add an enable-time gate for connectors carrying `transaction` in sync targets** — mirroring the `validateEntityRules()` boot fail-fast — and surface unconfigured providers on the existing `/v1/backoffice/self-heal/*` surface. Contingent on hypothesis 5.
5. **Acceptance test is a fresh workspace, not patched history** (CLAUDE.md). Create a clean FR workspace, connect Qonto MCP + Qonto-via-Plaid + Pennylane + Stripe, run one sync, then assert: (a) ~157 transactions, not ~314; (b) no `(grand_total, currency, issue_date)` collisions across sources; (c) `payment_status='unknown'` near zero; (d) `bills-due` returns a non-trivial payables list; (e) at least one invoice has `issuer = own_company`.