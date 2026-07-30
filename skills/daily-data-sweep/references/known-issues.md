# Known issues — audit findings not yet resolved

A dry-run executability audit (2026-07-30) walked this skill gate 0→9 as the executing agent and
raised 23 findings. **Four are fixed** (the verdict-computation path — see the end of this file).
**Nineteen remain open.** They are recorded here rather than left implicit, because this skill's own
rule is that a check it cannot make is *named*, never silently dropped — and that rule applies to
the skill's own defects too.

**Read this before trusting a verdict.** Gates 1, 6, 7 and 8 are not fully runnable as written.

---

## Blockers — a gate cannot execute as specified

| # | Issue | Effect |
|---|---|---|
| 5 | `IPAY-` has **zero** enumerable control points and `EINV-` has two; `control-points-einvoicing.md` is prose plus measurement tables. The "16 of 20 buildable" claim never lists the 20. | **Gates 7 and 8 cannot be run.** The "90 control points" in the examples is also fiction — enumerable ids total ~180, so any coverage percentage is meaningless. |
| 6 | The `CMP-` and `EXH-` families (31 control points) are assigned to **no gate**. The gate table never names them. | 31 checks have no execution point. Either they are a legacy layer superseded by the per-family tables — in which case delete them, which also largely dissolves #4 — or the agent chooses. Undecided. |
| 7 | Every trend/regression/diff check needs a **prior-sweep store that does not exist**: step 8's diff, the day-over-day output, `SPINE-05`, `BOOK-proof-lost-trend`, `RECON-backlog-age-tail`, `ING-category-low-confidence-share`, tolerance 6a and 9's targets, and L1's `cursor_at_stop` resume. | Four control points can never fire, and the month-state model is unresolvable on run 1 — every month is `UNSWEPT` forever. Either name a store or declare every run cold. |
| 8 | `SPINE-02`/`SPINE-03` read `CloseReadinessStatus`, which is **not an MCP root** and appears in no root list. Both are red. | Gate 1 goes red on every run for a tooling reason, which per the gate table re-labels every later gate "scope uncertain". The sweep can never produce an unqualified verdict. |
| 9 | `BANK-fx-attached` is stamped red while the same file states it **cannot be evaluated** (no workspace-currency field to compare against). Same pattern in `ING-invoice-direction-coverage`. | An agent reading top-down emits a red it has no ground for. Correct verdict is INCONCLUSIVE. |
| 10 | `DOC-02/04/07/08/10` use nested-relation `whereClause`s, contradicting the stated "no cross-root join in one query" limit. `DOC-07` is a **security** control. | Either all of gate 6's `DOC-` family is unexecutable, or the join caveats elsewhere are over-conservative. One probe settles it; until then a security control may silently never run. |

## Serious — wrong or unstable results

| # | Issue |
|---|---|
| 4 | **The same population is checked by 3–5 control points with contradicting thresholds and no precedence rule.** Uncategorized transactions: five ids, four incompatible severity rules. Sync staleness: amber at 24h, red at 26h, red at 26h. Hung sync: three verdicts for one condition. Null booking date: red, pass and amber for the same row. Confidence floor: 0.70 vs 0.6. Second-order: the headline red count is inflated ~4× (six failing balance rows are counted by four different ids) with no dedup rule. |
| 11 | Gate 0's "HALT on red" is circular — `SPINE-01` includes "and swept", knowable only after gate 9 — and example 3 contradicts it by not halting. Split into enumeration (gate 0, halting) and completion (gate 9, non-halting). |
| 12 | The dated baseline tables are **duplicated into `control-points-banking.md` and `-bookkeeping.md` with the decay warning stripped**, and the numbers embedded in *fail signal* columns. An agent sent to the family file has no signal they are historical. |
| 14 | "Every control point declares its bucket" is unsatisfiable for ~50 of them: `BOOK-`, `DOC-`, `SPINE-`, `ASSUME-`, `EINV-` tables have no bucket column. |
| 15 | `EXH-connector-configured` fires red on **any** non-`enabled` connector, so a CRM in `to_configure` permanently scopes the banking verdict. (Partly mitigated by the status-bucket fix, but the control point itself still carries no domain filter.) |
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
