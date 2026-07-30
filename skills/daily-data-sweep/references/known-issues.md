# Known issues — audit findings not yet resolved

A dry-run executability audit (2026-07-30) walked this skill gate 0→9 as the executing agent and
raised 23 findings. **Twenty-two are fixed.** They are recorded here rather than left implicit,
because this skill's own rule is that a check it cannot make is *named*, never silently dropped —
and that rule applies to the skill's own defects too.

**One remains open: #4, reduced but not closed** — see below. No gate is blocked from running;
gate 1's month-enumeration and close-agreement checks (`SPINE-02`/`SPINE-03`) now degrade to a
self-consistency check and an INCONCLUSIVE respectively, rather than firing red for a tooling
reason on every run.

---

## Blockers — a gate cannot execute as specified

| # | Issue | Effect |
|---|---|---|
| ~~5~~ | **RESOLVED 2026-07-30.** `control-points-einvoicing.md` now enumerates `IPAY-01..16` (16, none blocked) and `EINV-01..36` (36, of which 13 blocked) — 52 control points in six-column tables with a per-row bucket. Gates 7 and 8 are runnable. The unsupported "16 of 20" claim is deleted; real totals head each table. | fixed |
| ~~6~~ | **RESOLVED 2026-07-30.** `control-points-core.md` deleted; all 32 `CMP-`/`EXH-` ids mapped to a family equivalent or moved (3 moved to `ING-`). Full equivalence mapping recorded in the commit. | fixed |
| ~~7~~ | **RESOLVED 2026-07-30 — every run is COLD.** No store exists or can exist (read-only MCP, no output root). The diff requirement, `SPINE-05` and `BOOK-proof-lost-trend` are deleted and recorded; two checks were salvaged to single-run arms. Originally: every trend/regression/diff check needs a **prior-sweep store that does not exist**: step 8's diff, the day-over-day output, `SPINE-05`, `BOOK-proof-lost-trend`, `RECON-backlog-age-tail`, `ING-category-low-confidence-share`, tolerance 6a and 9's targets, and L1's `cursor_at_stop` resume. | fixed |
| ~~8~~ | **RESOLVED.** `SPINE-02`/`SPINE-03` read `CloseReadinessStatus`, which is **not an MCP root** and appears in no root list — confirmed against `schema-facts.md`'s 33 live roots. `SPINE-02` is redefined as a self-consistency check (declared sweep window vs months this run actually produced a result for — no external root needed). `SPINE-03` is now `blocked` / INCONCLUSIVE, never a colour, until a close-state root exists. `sweep-spine.md` A.3's "oldest non-closed month" now states plainly that close status isn't MCP-readable and falls back to a data-presence default when the user hasn't named a month. Gate 1 no longer goes red on every run for a tooling reason. | fixed |
| ~~9~~ | **RESOLVED.** `BANK-fx-attached` carries `sev: blocked` and reports "not evaluable — emit INCONCLUSIVE, never a colour" (`control-points-banking.md`). `ING-invoice-direction-coverage` carries `sev: amber (INCONCLUSIVE today)` with the same reasoning (`control-points-ingestion.md`). Neither fires an unearned red. | fixed |
| ~~10~~ | **RESOLVED 2026-07-30 by live probe.** Relation predicates work: a positive control returned `totalCount: 213` filtering `invoices` on `document.size`, and `_not: {document: {}}` was accepted and returned 0 (a real finding — no dangling `document_pk`). The `DOC-` family, including the `DOC-07` security control, IS executable. The "no cross-root join" claim was over-conservative; the real limit is **no aggregation** over a related set. See `mcp-surface-limits.md`. | fixed |

## Serious — wrong or unstable results

| # | Issue |
|---|---|
| 4 | **REDUCED, not closed.** 8 intra-file duplicates removed with a named canonical each (the biggest, `GRAPH-sync-freshness-and-log-coverage`, bundled five predicates into one red on one population — the main driver of the ~4× inflated red count). **Cross-file `GRAPH-`/`BOOK-`/`DOC-` overlaps remain**, concretely: an invoice/transaction edge pointing at a dead row is checked once by `BOOK-edge-dangling` (gate 6) and again by `GRAPH-invoice-transaction-dangling-side` (gate 4); a dangling `invoices.document_pk` is checked by `BOOK-document-resolves` (gate 6), `GRAPH-invoice-document-pk-dangling` (gate 4) **and** `DOC-02` (gate 6) — three control points, one population. None of the three trios carry a "canonical, others removed" note the way the `ING-`/`RECON-`/`GRAPH-` families do elsewhere. Originally: the same population is checked by 3–5 control points with contradicting thresholds and no precedence rule — uncategorized transactions: five ids, four incompatible severity rules; sync staleness: amber at 24h, red at 26h, red at 26h; hung sync: three verdicts for one condition; null booking date: red, pass and amber for the same row; confidence floor: 0.70 vs 0.6; the headline red count inflated ~4× (six failing balance rows counted by four different ids) with no dedup rule. |
| ~~11~~ | **RESOLVED.** Gate 0's halting condition is now `SPINE-01a` (enumeration only — `well_list_workspaces` returned a set), and the "every workspace produced results" condition is `SPINE-01b` at gate 9, explicitly non-halting (`iteration-protocol.md` § Part C, `sweep-spine.md` A.5). SKILL.md's example 3 matches: an unreachable workspace does not halt the whole sweep. | fixed |
| ~~12~~ | **RESOLVED.** `control-points-banking.md` and `control-points-bookkeeping.md` now each carry a `### Measured baseline` pointer to `baseline-2026-07-29.md` with the decay warning restated ("No figure below/in that file is a standing fact") instead of an embedded dated table. Fail-signal columns in both families' control-point tables use structural conditions (`any row`, `any group ≥2`), not baseline counts. | fixed |
| ~~14~~ | **RESOLVED.** `BOOK-`, `DOC-`, `EINV-`, `IPAY-` already carried a `bucket` column. `SPINE-` (`sweep-spine.md` A.5) and `ASSUME-` (`latent-assumptions.md`) did not — both now do. Every control-point table declares a bucket. | fixed |
| ~~15~~ | **RESOLVED 2026-07-30.** Replaced by `ING-connector-not-enabled-in-scope`, which buckets status via the authoritative `CONNECTOR_STATUS_BUCKET` and filters on `connector.data_domains` intersected with the selected families. A non-financial connector is INFO, never red. | fixed |
| ~~16~~ | **RESOLVED.** `sweep-spine.md` A.3 is the single window definition ("oldest non-`closed` month, ascending, capped at 6 months"), and SKILL.md's Inputs section and § The sweep unit both point at it rather than restating a different number. | fixed |
| ~~17~~ | **RESOLVED.** `tolerances.md` now states every value is **NORMATIVE as written**: a deployment may override in config, and reading from config when config supplies a value (else from this table) "is the correct behaviour and is never itself a violation." The `RECON-`/`BOOK-` rows citing tolerance §14 no longer sit on a "violation" framing. | fixed |
| ~~18~~ | **RESOLVED.** The schema pass is now step 3, before step 4's connector spot-check (the first query) and step 6 (running the gates), which itself now carries a reminder to schema-pass any newly-touched root gate by gate. | fixed |
| ~~19~~ | **RESOLVED.** `mcp-surface-limits.md`'s soft-delete bullet pointed at an ambiguous probe; its own later § CORRECTION section (dated 2026-07-30, in the same file) already resolved the ambiguity by probing a root with a **known** mix of present/absent related rows and showing `_not: {relation: {}}` respects `deleted_at IS NULL` + workspace scope server-side. The two sections now cross-reference each other, and `control-points-graph-recon.md`'s top-of-family note states the rule: write dangling-reference checks against the relation, never a bare `_is_null` on the FK column. | fixed |
| ~~20~~ | **RESOLVED.** `iteration-protocol.md` B.3 now restricts L3 to the month chain only, explicitly marks the extraction→resolution and dedup→re-count uses non-applicable in a read-only sweep, and reports an inter-round delta as `CHAIN_UNSTABLE` (a scope caveat — "the data moved under the sweep") rather than "a defect regenerates." | fixed |
| ~~21~~ | **RESOLVED.** `sweep-spine.md` A.4 states plainly there is no parent/child consolidation, that the earlier intersection rule contradicted the no-merge rule, and that `workspaces` exposes no parent FK to build one from. Report per workspace. | fixed |

## Minor

| # | Issue |
|---|---|
| ~~22~~ | **RESOLVED.** `records_url` now carries an explicit rule in SKILL.md's Output requirements: never fabricate one; emit it only against a previously confirmed URL pattern, otherwise omit the field — the same discipline the `<well-app-base-url>` fallback link already used. `<well-app-base-url>` itself stays an unresolved placeholder shared with every other Well skill in this repo (not specific to this one), and this skill is already the most conservative of them about not appending unverified query parameters to it. | fixed |
| ~~23~~ | **RESOLVED.** `SPINE-07`'s "permanently amber" failure mode is gone: the control point is explicitly "not applicable — never amber — for a CLI or headless run, which has no picker" (`sweep-spine.md` A.5). A.1's file-path reference to the picker component is retained as grounding context for *why* `SPINE-07` is checkable when a picker is rendered, not as build instructions to a runtime agent. | fixed |

---

## Fixed in this revision

- **#1 — the L1 primitive returned `pass` on an empty population.** A workspace with zero cards
  passed all five card checks. Now `total == 0` ⇒ `INCONCLUSIVE` unless the control point declares
  `empty_is_pass: true`. This was the skill's own central failure mode, encoded in its own primitive.
- **#2 — the worked example printed a bare `pass` while three checks were unevaluated**, teaching
  the opposite of the prose rule. Corrected to `pass (partial — 3 not evaluated)`.
- **#3 — `PAGE_BUDGET` had no value anywhere**, while being the sole determinant of `pass` vs
  `SAMPLED`. Set to 20 (~10k rows), per control point.
- **#13 — how red/amber counts aggregate into a bucket verdict was never stated.** Now: any red ⇒
  `fail`; else any amber ⇒ `pass (with findings)`; else `pass`; plus `(partial — N not evaluated)`
  whenever the bucket holds any INCONCLUSIVE or SAMPLED. The severity floor is a reporting filter
  and never changes a verdict.

---

## Re-audit 2026-07-30 (post-fix adversarial pass) — 2 blockers fixed, 9 open

An independent pass re-verified every claimed closure rather than trusting the strikethroughs. Two
closures were **false or inert** and are now fixed; nine further defects remain open.

**Fixed immediately (both would have made a live run lie):**

- **`empty_is_pass` was declared by no control point.** The "an empty population is never a pass"
  fix landed in the L1 primitive and never landed in the ~30 rows whose *passing* state is an empty
  result set. Every clean workspace therefore returned INCONCLUSIVE on all of them and the bucket
  rule stamped `(partial — N not evaluated)` on **every run forever**, making a bare `pass`
  unreachable — the mirror image of the always-pass lie it replaced. The class is now declared in
  `iteration-protocol.md` B.1, together with the inverse class that must **not** declare it.
- **The own-company fact contradicted itself across four files.** `schema-facts.md` (authoritative)
  says `own_company_pk` exists and is stripped by the formatter — a read-surface gap — and that a
  `company_origin: counterparty` row is *not* a defect. `mcp-surface-limits.md` and
  `latent-assumptions.md` said the field does not exist and the data is wrong. An agent firing
  `ASSUME-own-company-correct` would have emitted a **red against its own reference file.** Both are
  reframed to schema-facts' wording.

**Open after this pass:**

| # | severity | issue |
|---|---|---|
| R3 | high | A fourth uncategorized control point survived dedup: `BANK-txn-categorized` (gate 3, "any row → red") contradicts tolerance 9's per-cause ladder, on the largest population in the sweep. Both dedup notes claim `RECON-txn-uncategorized` is the only canonical. |
| R4 | high | Six more undeclared cross-file duplicates, none in #4's list — incl. three **threshold twins** changed in one file and not the other: `BOOK-invoice-has-document` (red) vs `RECON-invoice-missing-document` (amber); `BOOK-document-right-kind` (amber) vs `DOC-04` (red); `BANK-txn-ledger-mapped` (any row) vs `RECON-txn-no-ledger-account` (only past the close cutoff). |
| R5 | medium | Gate 1 is labelled `SPINE-02..06` — a range including the deleted `SPINE-05` and excluding `SPINE-07`, which is defined but runs in no gate. Should read `SPINE-02, -03, -04, -06, -07`. |
| R6 | medium | Two rows are column-misaligned and will parse wrong: `BANK-account-has-currency` and `BOOK-invoice-core-fields` have 7 cells for 6 columns, so `name` reads "complete". Both were introduced by the bucket-column pass. |
| R7 | medium | `records_url` has a "never fabricate one" rule at `SKILL.md:302`, but the worked example at `:407` still lists it unconditionally — the example teaches the opposite of the rule, which is exactly the #2 failure mode. |
| R8 | low | The "No cross-root join in one query" bullet is unedited while the CORRECTION below it calls it wrong. Strike it in place, as the soft-delete bullet was. |
| R9 | low | The #12 dated-measurement class survives in two files the fixing agent did not own: `control-points-graph-recon.md` and `latent-assumptions.md`. |
| R10 | low | `control-points-banking.md` says `BANK-` is "the first family the sweep runs" while the gate table puts it at gate 3, behind `ING-`. |
| R11 | low | The L1 pseudocode and `PAGE_BUDGET` are dead — overridden 160 lines later by MEASURED REALITY. An agent reading B.1 first implements a cursor loop against `nextCursor: null`. |

**Verified clean:** the two gate moves from dedup (open-balance 2→4, sync-coverage 5→2) cross-
reference correctly, and every `ING-` id named in the fold-in notes exists. No dangling ids.
