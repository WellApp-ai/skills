# Known issues — audit findings not yet resolved

A dry-run executability audit (2026-07-30) walked this skill gate 0→9 as the executing agent and
raised 23 findings. **Four are fixed** (the verdict-computation path — see the end of this file).
**Nineteen remain open.** They are recorded here rather than left implicit, because this skill's own
rule is that a check it cannot make is *named*, never silently dropped — and that rule applies to
the skill's own defects too.

**Read this before trusting a verdict.** Gates 1, 6, 7 and 8 are not fully runnable as written. (Gate 6 was cleared on 2026-07-30 — see #10.)

---

## Blockers — a gate cannot execute as specified

| # | Issue | Effect |
|---|---|---|
| ~~5~~ | **RESOLVED 2026-07-30.** `control-points-einvoicing.md` now enumerates `IPAY-01..16` (16, none blocked) and `EINV-01..36` (36, of which 13 blocked) — 52 control points in six-column tables with a per-row bucket. Gates 7 and 8 are runnable. The unsupported "16 of 20" claim is deleted; real totals head each table. | fixed |
| ~~6~~ | **RESOLVED 2026-07-30.** `control-points-core.md` deleted; all 32 `CMP-`/`EXH-` ids mapped to a family equivalent or moved (3 moved to `ING-`). Full equivalence mapping recorded in the commit. | fixed |
| ~~7~~ | **RESOLVED 2026-07-30 — every run is COLD.** No store exists or can exist (read-only MCP, no output root). The diff requirement, `SPINE-05` and `BOOK-proof-lost-trend` are deleted and recorded; two checks were salvaged to single-run arms. Originally: every trend/regression/diff check needs a **prior-sweep store that does not exist**: step 8's diff, the day-over-day output, `SPINE-05`, `BOOK-proof-lost-trend`, `RECON-backlog-age-tail`, `ING-category-low-confidence-share`, tolerance 6a and 9's targets, and L1's `cursor_at_stop` resume. | Four control points can never fire, and the month-state model is unresolvable on run 1 — every month is `UNSWEPT` forever. Either name a store or declare every run cold. |
| 8 | `SPINE-02`/`SPINE-03` read `CloseReadinessStatus`, which is **not an MCP root** and appears in no root list. Both are red. | Gate 1 goes red on every run for a tooling reason, which per the gate table re-labels every later gate "scope uncertain". The sweep can never produce an unqualified verdict. |
| 9 | `BANK-fx-attached` is stamped red while the same file states it **cannot be evaluated** (no workspace-currency field to compare against). Same pattern in `ING-invoice-direction-coverage`. | An agent reading top-down emits a red it has no ground for. Correct verdict is INCONCLUSIVE. |
| ~~10~~ | **RESOLVED 2026-07-30 by live probe.** Relation predicates work: a positive control returned `totalCount: 213` filtering `invoices` on `document.size`, and `_not: {document: {}}` was accepted and returned 0 (a real finding — no dangling `document_pk`). The `DOC-` family, including the `DOC-07` security control, IS executable. The "no cross-root join" claim was over-conservative; the real limit is **no aggregation** over a related set. See `mcp-surface-limits.md`. | fixed |

## Serious — wrong or unstable results

| # | Issue |
|---|---|
| 4 | **REDUCED, not closed.** 8 intra-file duplicates removed with a named canonical each (the biggest, `GRAPH-sync-freshness-and-log-coverage`, bundled five predicates into one red on one population — the main driver of the ~4× inflated red count). Cross-file `GRAPH-`/`RECON-` vs `BOOK-` overlaps remain. Originally: the same population is checked by 3–5 control points with contradicting thresholds and no precedence rule.** Uncategorized transactions: five ids, four incompatible severity rules. Sync staleness: amber at 24h, red at 26h, red at 26h. Hung sync: three verdicts for one condition. Null booking date: red, pass and amber for the same row. Confidence floor: 0.70 vs 0.6. Second-order: the headline red count is inflated ~4× (six failing balance rows are counted by four different ids) with no dedup rule. |
| 11 | Gate 0's "HALT on red" is circular — `SPINE-01` includes "and swept", knowable only after gate 9 — and example 3 contradicts it by not halting. Split into enumeration (gate 0, halting) and completion (gate 9, non-halting). |
| 12 | The dated baseline tables are **duplicated into `control-points-banking.md` and `-bookkeeping.md` with the decay warning stripped**, and the numbers embedded in *fail signal* columns. An agent sent to the family file has no signal they are historical. |
| 14 | "Every control point declares its bucket" is unsatisfiable for ~50 of them: `BOOK-`, `DOC-`, `SPINE-`, `ASSUME-`, `EINV-` tables have no bucket column. |
| ~~15~~ | **RESOLVED 2026-07-30.** Replaced by `ING-connector-not-enabled-in-scope`, which buckets status via the authoritative `CONNECTOR_STATUS_BUCKET` and filters on `connector.data_domains` intersected with the selected families. A non-financial connector is INFO, never red. | fixed |
| 16 | The sweep window is defined twice, incompatibly: "trailing 3 full months" (Inputs) vs "ascending from the oldest non-closed month", unbounded (spine). Example 2 matches neither. Needs one default and one cap. |
| 17 | Tolerances are "proposed defaults" that "belong in config, not code" — and no config exists. Tolerance 14 says hardcoding is a violation, so four `RECON-`/`BOOK-` reds are either violations or silently unrun. |
| 18 | The schema pass (step 5) is ordered **after** the first query (step 3), so the skill violates its own "most important rule" two steps before stating it. Move it before any query. |
| 19 | Soft-delete gives two verdicts depending on which file you opened: `graph-recon.md` lists five runnable checks; `mcp-surface-limits.md` says the same class is INCONCLUSIVE and gated on a probe that cannot be performed read-only. |
| 20 | L3 convergence fires `NOT_CONVERGED` on ordinary sync noise. In a detect-only sweep nothing changes *because of* the sweep, so an inter-round delta means "the workspace is syncing", not "a defect regenerates". Restrict L3 to the month chain. |
| 21 | Parent/child "intersection" consolidation contradicts "never merge verdicts across workspaces", and no parent FK is identified on `workspaces`. |

## Minor

| # | Issue |
|---|---|
| 22 | `records_url` is a required output with no definition, no exposing root and no construction rule; `<well-app-base-url>` is never given a value. |
| 23 | `sweep-spine.md` A.1 is component build instructions delivered to a runtime agent, and makes `SPINE-07` permanently amber until unrelated code merges. |

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
