# Known issues — audit findings not yet resolved

A dry-run executability audit (2026-07-30) walked this skill gate 0→9 as the executing agent and
raised 23 findings; two later adversarial re-audits raised 11 more (`R1`-`R11`). **All 34 are now
fixed.** They are recorded here rather than left implicit, because this skill's own rule is that a
check it cannot make is *named*, never silently dropped — and that rule applies to the skill's own
defects too.

**Nothing is open.** Recount from the rows below rather than trusting this line — the count is the
first thing that drifts, and two of the eleven re-audit findings were defects introduced by an
earlier fix in this very file. No gate is blocked from running;
gate 1's month-enumeration and close-agreement checks (`SPINE-02`/`SPINE-03`) now degrade to a
self-consistency check and an INCONCLUSIVE respectively, rather than firing red for a tooling
reason on every run.

---

## Blockers — a gate cannot execute as specified

| # | Issue | Effect |
|---|---|---|
| ~~5~~ | **RESOLVED 2026-07-30.** `control-points-einvoicing.md` now enumerates `IPAY-01..16` (16, none blocked) and `EINV-01..36` (36, of which 13 blocked) — 52 control points in six-column tables with a per-row bucket. Gates 7 and 8 are runnable. The unsupported "16 of 20" claim is deleted; real totals head each table. |
| ~~6~~ | **RESOLVED 2026-07-30.** `control-points-core.md` deleted; all 32 `CMP-`/`EXH-` ids mapped to a family equivalent or moved (3 moved to `ING-`). Full equivalence mapping recorded in the commit. |
| ~~7~~ | **RESOLVED 2026-07-30 — every run is COLD.** No store exists or can exist (read-only MCP, no output root). The diff requirement, `SPINE-05` and `BOOK-proof-lost-trend` are deleted and recorded; two checks were salvaged to single-run arms. Originally: every trend/regression/diff check needs a **prior-sweep store that does not exist**: step 8's diff, the day-over-day output, `SPINE-05`, `BOOK-proof-lost-trend`, `RECON-backlog-age-tail`, `ING-category-low-confidence-share`, tolerance 6a and 9's targets, and L1's `cursor_at_stop` resume. |
| ~~8~~ | **RESOLVED.** `SPINE-02`/`SPINE-03` read `CloseReadinessStatus`, which is **not an MCP root** and appears in no root list — confirmed against `schema-facts.md`'s 33 live roots. `SPINE-02` is redefined as a self-consistency check (declared sweep window vs months this run actually produced a result for — no external root needed). `SPINE-03` is now `blocked` / INCONCLUSIVE, never a colour, until a close-state root exists. `sweep-spine.md` A.3's "oldest non-closed month" now states plainly that close status isn't MCP-readable and falls back to a data-presence default when the user hasn't named a month. Gate 1 no longer goes red on every run for a tooling reason. |
| ~~9~~ | **RESOLVED.** `BANK-fx-attached` carries `sev: blocked` and reports "not evaluable — emit INCONCLUSIVE, never a colour" (`control-points-banking.md`). `ING-invoice-direction-coverage` carries `sev: amber (INCONCLUSIVE today)` with the same reasoning (`control-points-ingestion.md`). Neither fires an unearned red. |
| ~~10~~ | **RESOLVED 2026-07-30 by live probe.** Relation predicates work: a positive control returned `totalCount: 213` filtering `invoices` on `document.size`, and `_not: {document: {}}` was accepted and returned 0 (a real finding — no dangling `document_pk`). The `DOC-` family, including the `DOC-07` security control, IS executable. The "no cross-root join" claim was over-conservative; the real limit is **no aggregation** over a related set. See `mcp-surface-limits.md`. |

## Serious — wrong or unstable results

| # | Issue |
|---|---|
| ~~4~~ | **RESOLVED 2026-07-30 — three passes.** First pass removed 8 intra-file duplicates. Second removed 8 cross-file ids against a named canonical: edge currency, edge dangling side, `full`-allocation amount, over-allocation and edge-confidence/provisional-backlog consolidated into the `BOOK-` proof chain (an edge property is owned by the chain that proves the payment); null-`document_pk` into `BOOK-invoice-has-document`; and the dangling-`document_pk` **three-way** into `DOC-02`, which alone carries the live predicate and the `B` term of the two-direction bound. 69 → 61 ids across the three files. Every deletion leaves a cross-reference naming the canonical and any threshold the deleted row carried that the canonical did not, so a superseded threshold cannot be re-added by accident. One suspected pair was **verified NOT a duplicate** and hardened: `RECON-low-confidence-category` (category confidence on `transactions`, floor 0.70) vs `BOOK-edge-confidence-floor` (match confidence on `invoice_transactions`, floor 0.85) — same tolerance, different populations; both now name their population in the row title with a do-not-merge clause. **Third pass (R4) closed both remaining pairs and five more:** `BOOK-document-tenancy` folded into `DOC-07`, and the orphan pair resolved by splitting **on the root rather than the severity** — the two rows were a superset/subset, so merging either direction would have dropped rows. `DOC-08` now owns orphan `documents` in two arms and `GRAPH-orphan-media` owns orphan `media`, which makes the interim `C`-term rule permanent rather than provisional. |
| ~~11~~ | **RESOLVED.** Gate 0's halting condition is now `SPINE-01a` (enumeration only — `well_list_workspaces` returned a set), and the "every workspace produced results" condition is `SPINE-01b` at gate 9, explicitly non-halting (`iteration-protocol.md` § Part C, `sweep-spine.md` A.5). SKILL.md's example 3 matches: an unreachable workspace does not halt the whole sweep. |
| ~~12~~ | **RESOLVED.** `control-points-banking.md` and `control-points-bookkeeping.md` now each carry a `### Measured baseline` pointer to `baseline-2026-07-29.md` with the decay warning restated ("No figure below/in that file is a standing fact") instead of an embedded dated table. Fail-signal columns in both families' control-point tables use structural conditions (`any row`, `any group ≥2`), not baseline counts. |
| ~~14~~ | **RESOLVED.** `BOOK-`, `DOC-`, `EINV-`, `IPAY-` already carried a `bucket` column. `SPINE-` (`sweep-spine.md` A.5) and `ASSUME-` (`latent-assumptions.md`) did not — both now do. Every control-point table declares a bucket. |
| ~~15~~ | **RESOLVED 2026-07-30.** Replaced by `ING-connector-not-enabled-in-scope`, which buckets status via the authoritative `CONNECTOR_STATUS_BUCKET` and filters on `connector.data_domains` intersected with the selected families. A non-financial connector is INFO, never red. |
| ~~16~~ | **RESOLVED.** `sweep-spine.md` A.3 is the single window definition ("oldest non-`closed` month, ascending, capped at 6 months"), and SKILL.md's Inputs section and § The sweep unit both point at it rather than restating a different number. |
| ~~17~~ | **RESOLVED.** `tolerances.md` now states every value is **NORMATIVE as written**: a deployment may override in config, and reading from config when config supplies a value (else from this table) "is the correct behaviour and is never itself a violation." The `RECON-`/`BOOK-` rows citing tolerance §14 no longer sit on a "violation" framing. |
| ~~18~~ | **RESOLVED.** The schema pass is now step 3, before step 4's connector spot-check (the first query) and step 6 (running the gates), which itself now carries a reminder to schema-pass any newly-touched root gate by gate. |
| ~~19~~ | **RESOLVED.** `mcp-surface-limits.md`'s soft-delete bullet pointed at an ambiguous probe; its own later § CORRECTION section (dated 2026-07-30, in the same file) already resolved the ambiguity by probing a root with a **known** mix of present/absent related rows and showing `_not: {relation: {}}` respects `deleted_at IS NULL` + workspace scope server-side. The two sections now cross-reference each other, and `control-points-graph-recon.md`'s top-of-family note states the rule: write dangling-reference checks against the relation, never a bare `_is_null` on the FK column. |
| ~~20~~ | **RESOLVED.** `iteration-protocol.md` B.3 now restricts L3 to the month chain only, explicitly marks the extraction→resolution and dedup→re-count uses non-applicable in a read-only sweep, and reports an inter-round delta as `CHAIN_UNSTABLE` (a scope caveat — "the data moved under the sweep") rather than "a defect regenerates." |
| ~~21~~ | **RESOLVED.** `sweep-spine.md` A.4 states plainly there is no parent/child consolidation, that the earlier intersection rule contradicted the no-merge rule, and that `workspaces` exposes no parent FK to build one from. Report per workspace. |

## Minor

| # | Issue |
|---|---|
| ~~22~~ | **RESOLVED.** `records_url` now carries an explicit rule in SKILL.md's Output requirements: never fabricate one; emit it only against a previously confirmed URL pattern, otherwise omit the field — the same discipline the `<well-app-base-url>` fallback link already used. `<well-app-base-url>` itself stays an unresolved placeholder shared with every other Well skill in this repo (not specific to this one), and this skill is already the most conservative of them about not appending unverified query parameters to it. |
| ~~23~~ | **RESOLVED.** `SPINE-07`'s "permanently amber" failure mode is gone: the control point is explicitly "not applicable — never amber — for a CLI or headless run, which has no picker" (`sweep-spine.md` A.5). A.1's file-path reference to the picker component is retained as grounding context for *why* `SPINE-07` is checkable when a picker is rendered, not as build instructions to a runtime agent. |

---

## Fixed in this revision

- **#1 — the L1 primitive returned `pass` on an empty population.** A workspace with zero cards
  passed all five card checks. Now `total == 0` ⇒ `INCONCLUSIVE` unless the control point declares
  `empty_is_pass: true`. This was the skill's own central failure mode, encoded in its own primitive.
- **#2 — the worked example printed a bare `pass` while three checks were unevaluated**, teaching
  the opposite of the prose rule. Corrected to `pass (partial — 3 not evaluated)`.
- **#3 — `PAGE_BUDGET` had no value anywhere**, while being the sole determinant of `pass` vs
  `SAMPLED`. Set to 20 (~10k rows), per control point. **Superseded by `R11` — do not re-add it.**
  The live API returns `nextCursor: null` on every response, so there is no paging and no budget to
  set. `PAGE_BUDGET` is deleted; `SAMPLED` is now decided by `returned < totalCount` on a single
  request.
- **#13 — how red/amber counts aggregate into a bucket verdict was never stated.** Now: any red ⇒
  `fail`; else any amber ⇒ `pass (with findings)`; else `pass`; plus `(partial — N not evaluated)`
  whenever the bucket holds any INCONCLUSIVE or SAMPLED. The severity floor is a reporting filter
  and never changes a verdict.

---

## Re-audit 2026-07-30 (post-fix adversarial passes) — 11 raised (`R1`–`R11`), 11 closed

Independent passes re-verified every claimed closure rather than trusting the strikethroughs. Two
closures were **false or inert** (`R1`, `R2`, below) and were fixed immediately; nine further defects
(`R3`–`R11`) were raised and are closed in the table beneath them. Two remediation passes on
2026-07-30 did the work — one over the control-point families, one over the spine and protocol files
— and each row records what was **verified in the target file**, not what the fixing agent reported.

**`R1` and `R2` — fixed immediately; both would have made a live run lie:**

- **`R1` — `empty_is_pass` was declared by no control point.** The "an empty population is never a pass"
  fix landed in the L1 primitive and never landed in the ~30 rows whose *passing* state is an empty
  result set. Every clean workspace therefore returned INCONCLUSIVE on all of them and the bucket
  rule stamped `(partial — N not evaluated)` on **every run forever**, making a bare `pass`
  unreachable — the mirror image of the always-pass lie it replaced. The class is now declared in
  `iteration-protocol.md` B.1, together with the inverse class that must **not** declare it.
- **`R2` — the own-company fact contradicted itself across four files.** `schema-facts.md` (authoritative)
  says `own_company_pk` exists and is stripped by the formatter — a read-surface gap — and that a
  `company_origin: counterparty` row is *not* a defect. `mcp-surface-limits.md` and
  `latent-assumptions.md` said the field does not exist and the data is wrong. An agent firing
  `ASSUME-own-company-correct` would have emitted a **red against its own reference file.** Both are
  reframed to schema-facts' wording.

**`R3`–`R11` — all closed:**

| # | resolution |
|---|---|
| ~~R3~~ | **FIXED 2026-07-30.** `BANK-txn-categorized` is deleted; `RECON-txn-uncategorized` is the sole canonical. Same predicate over the same population, and the canonical is a strict superset (it splits by `category_status` **and** `category_source`), so nothing was carried over. A cross-reference at the old position spells out tolerance 9's ladder and marks the flat "any row → red" **superseded, do not re-add**. |
| ~~R4~~ | **FIXED 2026-07-30 — and one of the six was wrong.** `RECON-invoice-missing-document` does **not** exist as a row; it was folded into `BOOK-invoice-has-document` by #4's second pass, so that threshold twin was stale, not live. The five real duplicates are resolved: `BOOK-document-right-kind`→`DOC-04`, `BOOK-document-tenancy`→`DOC-07`, `BANK-txn-ledger-mapped`→`RECON-txn-no-ledger-account` (carrying its `ledger_account_role` arm), `BANK-txn-no-external-id-dup`→`ING-duplicate-transaction-external-id` (carrying its partial-index reporting rule). The orphan pair was a **superset/subset, not an equality** — merging as specified would have dropped rows — so it is split by root instead: `DOC-08` owns orphan `documents` in two arms (receipt-capable + `size > 1024`, red, the `C` term; everything else amber storage debt), and `GRAPH-orphan-documents-and-media` is renamed **`GRAPH-orphan-media`**, narrowed to `media` only. This also closes both pairs left open under #4. |
| ~~R5~~ | **FIXED 2026-07-30.** Gate 1 now reads the explicit list `SPINE-02`, `-03`, `-04`, `-06`, `-07` in both `iteration-protocol.md` Part C and `SKILL.md` step 6, which also states why it is a list and not a range: a range is what kept the deleted `SPINE-05` alive and hid `SPINE-07`. `SPINE-07` now runs in a gate. |
| ~~R6~~ | **FIXED.** Two rows were column-misaligned and will parse wrong: `BANK-account-has-currency` and `BOOK-invoice-core-fields` have 7 cells for 6 columns, so `name` reads "complete". Both were introduced by the bucket-column pass. |
| ~~R7~~ | **FIXED 2026-07-30.** The example-2 sentence now reads "...count and example ids — plus `records_url` only where a confirmed URL pattern exists for that root; today none does, so the field is omitted rather than guessed", so the example demonstrates the rule instead of contradicting it. |
| ~~R8~~ | **FIXED 2026-07-30.** The bullet now opens **"No cross-root join in one query — WRONG AS WRITTEN, see § CORRECTION below"** (the same in-place pattern as the soft-delete bullet), carries the live probe result, and restates the real limit: filtering on a related field is one query; **aggregating** over a related set is not. |
| ~~R9~~ | **FIXED 2026-07-30.** `latent-assumptions.md` is clean: "6 rows are failing right now" and "(Live: 3 accounts are `type: other`…)" are replaced by a structural statement plus a pointer to `baseline-2026-07-29.md` and an instruction to re-measure. The decay is proven — uncategorized transactions read 788 on 2026-07-29 and 793 on 2026-07-30. `control-points-graph-recon.md` is now clean too: the `GRAPH-account-ownership-unresolvable` check no longer inlines "currently all 30 live rows", and `RECON-duplicate-account-rows`'s fail signal is the tolerance-8 **condition** (≥2 rows sharing the triple with an identical or null provider `account_id`; or ≥3 rows for one triple created within 24h at a constant interval ±10 min) rather than the observed 24× incident. Both figures survive in `baseline-2026-07-29.md`, which is where dated measurements belong. |
| ~~R10~~ | **FIXED 2026-07-30.** `control-points-banking.md` now says `BANK-` runs at gate 3, behind `ING-` at gate 2, keeping "priority family" only for the rhetorical role. The same defect in `control-points-bookkeeping.md` — "SECOND FAMILY … runs after `BANK-`" against a gate-6 header — was found by the same sweep and fixed with it. |
| ~~R11~~ | **FIXED 2026-07-30.** B.1 now opens with the measured constraint at the point of first contact ("there is no pagination... do not write a cursor loop and do not implement a page budget") and the pseudocode is a **single request** returning `SAMPLED` whenever `returned < totalCount`. `PAGE_BUDGET`, `cursor`, `pages` and `cursor_at_stop` are gone from the loop, the loop ledger and the cold-run section; `SKILL.md`'s example-1 loop proof no longer shows a 4-page exhaustive scan, and `mcp-surface-limits.md`'s "pages to exhaustion" bullet is reconciled. The follow-on `[EXPENSIVE]` markers in `control-points-graph-recon.md` and `control-points-bookkeeping.md` are reconciled too: the marker now means a client-side reduce over a row set one response cannot cover, which is therefore `SAMPLED` by construction whenever `returned < totalCount` — not a paged job with checkpoint/resume, which nothing can implement. |

**Verified clean:** the two gate moves from dedup (open-balance 2→4, sync-coverage 5→2) cross-
reference correctly, and every `ING-` id named in the fold-in notes exists. **No dangling ids** —
re-verified 2026-07-30 after the `R4` renames: `iteration-protocol.md` B.1's `empty_is_pass`
enumeration named `GRAPH-orphan-documents-and-media` and `BOOK-document-tenancy`, both of which `R4`
deleted, and both are corrected. Mentions of a deleted id inside a *fold-in note* ("the former `X`
…") are deliberate history and are not dangling; the test is whether a **live instruction** names an
id that no longer resolves.
