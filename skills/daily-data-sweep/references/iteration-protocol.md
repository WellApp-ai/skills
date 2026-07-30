# Iteration protocol and gate order

The L1/L2/L3 loops, the counting primitive, the loop ledger, and the full gate table with per-gate consequences. Open BEFORE running any control point.

---

## Every run is cold. No state carries between runs.

**There is no prior-sweep store, and there will not be one until someone builds it.** This skill is
read-only over an MCP with no output root: it has nowhere to write a result, so it has nothing to read
on the next run. A sweep run therefore begins with zero knowledge of any earlier run.

The binding consequences, which the rest of this file and the control-point families are written to:

- **No check may compare against a previous sweep.** Day-over-day diffs, "new red since last time",
  regression alarms on a settled month, and "rising across sweeps" are not deferred features — they are
  unevaluable, and a control point that needs one is not a control point. Anything of that shape has
  been deleted rather than left to fire vacuously.
- **A trend must live inside the swept window.** "More than 25 `classifier_failed` in the trailing
  7 days" is legitimate: the 7 days are rows in the data this run reads. "Down to under 100 within
  30 days" is not: it names a future run.
- **Every threshold is a single-run threshold** — see `tolerances.md`.
- **`cursor_at_stop` is reported, not resumed.** It documents how deep this run scanned. The next run
  restarts from the beginning, because it has no way to learn where this one stopped.
- **No month can be labelled from history.** A month is described by what this run found in it, never
  by whether it was swept before — see `sweep-spine.md` A.2.

This is a property of the deployment, not a design preference. If a store is ever added, these rules
are what would need revisiting; until then, treating the sweep as stateful is the single fastest way
to make it lie.

---

# PART B — THE ITERATION PROTOCOL: how a check proves it was complete AND exhaustive

This is the part that makes the skill's own promise honest. **A control point that cannot prove it
examined every object is not a passing control point — it is a sample.** Three loop kinds, each with
an explicit termination condition and a completeness proof.

### B.1 Loop L1 — page to exhaustion (per control point)

`well_query_records` has **no aggregation** and a **500-row page cap**, and pagination state is not
persisted anywhere. So every count, every group-by, every set-difference is client-side paging.

```
loop L1(control, root, filter):
    cursor    := null
    pages     := 0
    examined  := 0
    hits      := []
    total     := first_response.totalCount     # captured once, on page 1
    repeat:
        page      := well_query_records(root, fields, filter, limit=500, cursor)
        hits      += page.rows matching the predicate
        examined  += page.rows.length
        pages     += 1
        cursor    := page.nextCursor
    until cursor == null OR pages >= PAGE_BUDGET   # PAGE_BUDGET = 20 (~10k rows), per control point

    if total == 0:                # <- EMPTY POPULATION, NOT A CLEAN ONE
        verdict := INCONCLUSIVE   # unless the control point sets empty_is_pass: true
    else if cursor != null:       # budget exhausted before the data did
        verdict := SAMPLED        # <- NEVER "pass"
    else if examined < total:
        verdict := INCONCLUSIVE   # rows vanished mid-loop; a sync wrote during the sweep
    else:
        verdict := pass / fail on hits
    record(control, verdict, examined, total, pages, cursor_at_stop)
```

Three rules that are not optional:

- **An empty population is not a clean one.** `total == 0` means the check had nothing to examine,
  not that everything examined was fine. A workspace with zero cards must not "pass" the five
  card checks; a month with no transactions must not "pass" every reconciliation check. `total == 0`
  is `INCONCLUSIVE` unless the control point explicitly declares `empty_is_pass: true` (only
  correct where absence IS the passing state — e.g. "no duplicate accounts exist").
- **`empty_is_pass: true` — the absence-is-pass class.** A control point whose *passing* state IS an
  empty result set must declare this, or the rule above turns every clean workspace into
  `INCONCLUSIVE` and a bare `pass` becomes unreachable — the mirror image of the lie the rule fixes.
  **Every duplicate-, collision-, dangling-, orphan- and leak-detection control point is in this
  class**, because finding nothing is the correct outcome. Concretely, `empty_is_pass: true` applies
  to every row whose name or check begins *no duplicate*, *not duplicated*, *dangling*, *orphan*,
  *island*, *collision*, *cross-workspace*, *tenancy*, *unposted*, *never*, or *no ... exists* —
  including (non-exhaustively) `RECON-duplicate-account-rows`, `RECON-duplicate-payment-candidates`,
  `GRAPH-duplicate-invoice-identity`, `GRAPH-company-identity-fragmentation`,
  `GRAPH-orphan-documents-and-media`, `GRAPH-payment-means-island`,
  `GRAPH-invoice-transaction-dangling-side`, `GRAPH-invoice-document-pk-dangling`,
  `ING-duplicate-transaction-external-id`, `ING-duplicate-invoice-number`,
  `ING-duplicate-account-cross-connector`, `BANK-txn-no-external-id-dup`,
  `BANK-txn-no-cross-connector-dup`, `BOOK-edge-dangling`, `BOOK-document-tenancy`, `DOC-02`,
  `DOC-07`, `DOC-08`, `IPAY-16`, `EINV-02`, `EINV-11`.
  **The inverse class must NOT declare it**: a check asserting something *should exist* — a balance,
  a category, a payment means, a document — is INCONCLUSIVE on an empty population, never a pass,
  because it had nothing to examine.
- **`SAMPLED` is not `pass`.** A truncated scan reports `SAMPLED` with the page depth reached. An
  unqualified green over a truncated scan is the sweep lying in exactly the way the 12 skills do.
- **`examined < total` means INCONCLUSIVE, not pass.** The two reads are not a consistent snapshot;
  a concurrent sync makes the set move under the loop. Do not paper over it.
- **Record `cursor_at_stop` as scan-depth evidence, not as a resume point.** It states where this
  run's scan ended, which is what makes a `SAMPLED` verdict auditable — a reader can see whether the
  loop stopped 2 pages in or 20. It does not carry to the next run (every run is cold), so a
  truncated scan is truncated again next time; the honest fix is a narrower filter, not a resume.

### B.2 Loop L2 — fan out per object (the completeness loop)

Many control points are defined **per object**, not per table: *every* account has a current
balance; *every* connector produced rows; *every* card has an owner; *every* month has a posting.
The failure mode is subtle and common: you fetch a page of children and check the parents you
happened to see, which silently redefines "every" as "every one I fetched".

```
loop L2(control, parents, child_check):
    parent_set := L1(enumerate parents)          # exhaustively FIRST — never inferred from children
    if parent_set.verdict != pass:
        return INCONCLUSIVE                      # an unknown parent set cannot yield an "every" claim
    for each parent in parent_set:
        result[parent] := child_check(parent)    # itself an L1 loop
    unchecked := parent_set - keys(result)
    if unchecked is non-empty:
        return INCONCLUSIVE(unchecked)           # name them; do not average them away
    return aggregate(result)
```

**The rule: enumerate the parent set to exhaustion before checking any child.** A parent that was
never checked is named in the output, never folded into a percentage. This is what turns
"88% of accounts have a current balance" — a statement about a sample — into "3 of 30 accounts have
no current balance: `<ids>`" — a statement about the population.

Applies to: accounts → balances/transactions; connectors → ingested rows; invoices → line items,
documents, payment means; cards → owners; workspaces → months; months → journal entries; companies →
tax identity.

### B.3 Loop L3 — converge (loop until dry)

Some checks generate work whose completion creates *new* checkable objects. Extracting an IBAN from
a label resolves a counterparty, which creates a company that then needs FR tax identity. Deduping
accounts changes what "duplicate" means for the next pass. A single pass under-reports.

```
loop L3(month_chain_sweep, max_rounds = 3):
    round := 0
    prev  := null
    repeat:
        result := month_chain_sweep()      # the month chain ONLY — never the full control-point set
        round  += 1
        if result.findings == prev.findings:   break     # converged: dry
        if round >= max_rounds:                break     # budget
        prev := result
    if round >= max_rounds and not converged:
        flag CHAIN_UNSTABLE(rounds, delta)                # see below — read as concurrency, not defect
```

**L3 has exactly one applicable use: the month chain.** January's verdict changes February's, so the
chain has to be re-walked until the verdicts stop moving. That re-walk is genuine and cheap — it
re-derives per-month verdicts from findings already collected, in memory.

The two other uses this loop was originally written for are **non-applicable in a read-only sweep**:

| former use | why it cannot apply |
|---|---|
| extraction → resolution → identity | the sweep never extracts an IBAN or resolves a counterparty, so no new company appears between rounds and no round-2 identity check exists |
| dedup → re-count | the sweep never dedupes, so "duplicate" means the same thing in round 2 as in round 1 |

Both are write-path behaviours. **This skill is detect-only**, so nothing changes *because of* the
sweep, and re-running either simply re-reads the same rows for the same answer.

**Cost rule — not optional.** L3 must never re-run the full control-point set. A round is a re-derivation
of the month chain from findings already in hand; at ~180 control points per month, a naive third round
would triple the entire sweep's query cost to restate verdicts it could have recomputed for free.

**An inter-round delta means the workspace is syncing, not that a defect is regenerating.** In a
detect-only sweep the only thing that can change a count between two rounds is a concurrent write from
outside — a sync landing rows mid-sweep, which `mcp-surface-limits.md` says to expect. So a non-convergent
chain is reported as `CHAIN_UNSTABLE`, meaning *the data moved under the sweep, verdicts are a moving
snapshot* — the same condition L1 already reports as `examined < total`. It is a scope caveat on the
run, **not** a finding about a writer, and it must never be phrased as "a defect regenerates as fast as
it is measured": nothing in a read-only sweep can regenerate anything.

### B.4 The loop ledger — what every control point must emit

Non-negotiable, because it is what distinguishes this sweep from an impression:

| field | why |
|---|---|
| `verdict` | `pass` / `fail` / `inconclusive` / `sampled` — four values, never two |
| `examined` / `total` | the completeness proof; equal means exhaustive |
| `pages`, `cursor_at_stop` | proof of scan depth — how deep this run got, so a `SAMPLED` is auditable. Not a resume point (every run is cold) |
| `scope` | workspace id + month + the family — never a bare number (§ SCOPE WARNING) |
| `parents_unchecked` | for L2: the named objects the loop never reached |
| `rounds`, `converged` | for L3 (month chain only); `CHAIN_UNSTABLE` when it did not converge |

---

# PART C — GATE ORDER: the sequence, and what each red does to the next gate

Gates run in order. **A red at gate N does not stop the sweep — it re-labels every later gate**, because
depth findings computed under a breadth failure are scoped, not clean.

| gate | family | if red → |
|---|---|---|
| 0 | **Scope** — workspace enumeration succeeded (`SPINE-01a`), MCP reachable | **HALT.** A sweep that could not even list its subjects never ran, and a sweep that could not run is a FAILED sweep, never a passing one. |
| 1 | **Spine** — months enumerated, picker agreement (`SPINE-02..06`) | month set is untrusted → every later gate reports "scope uncertain" |
| 2 | **Ingestion / connectors** (`ING-`, `BANK-` exhaustive) | every later gate is labelled *"scoped to the sources that were connected"* |
| 3 | **Banking data** (`BANK-` complete) | **charts must not render** — cash/trend/burn/breakdown/FX all blocked |
| 4 | **Entity graph** (`GRAPH-`) | counterparty and logo layers untrusted; category/vendor charts degraded |
| 5 | **Reconciliation** (`RECON-`) | period is not close-ready; the month cannot leave `not_ready` |
| 6 | **Bookkeeping proof** (`BOOK-`, `DOC-`) | audit evidence incomplete; a compliant-looking invoice may have no receipt |
| 7 | **Invoice banking linkage** (`IPAY-`) | payments must be keyed by hand; reconciliation stays manual |
| 8 | **E-invoicing** (`EINV-`) | the month cannot be **declared**, even if it can be closed |
| 9 | **Latent assumptions** (`ASSUME-`), **completion** (`SPINE-01b`) | the other gates may be green *vacuously* — run this to find out. `SPINE-01b` red does **not** halt: the sweep has already finished, so the correct action is to name the workspaces that produced no results and scope the verdict to the rest |

Gate 9 last on purpose: it is the gate that audits the other gates. A green sweep with a red gate 9
means the greens are unverified, not verified.

**Why enumeration and completion are two different gates.** Gate 0 can only halt on something it can
actually evaluate at gate 0. Whether every workspace was *swept* is knowable only after gate 9 has
run, so a single control point covering both would ask gate 0 to evaluate the outcome of the whole
sweep and halt on it — a condition that is always unknown when it is tested, which is why the worked
example that does not halt on an unreachable workspace is right and the old wording was wrong. So:

- `SPINE-01a` — **enumeration succeeded**: `well_list_workspaces` returned a workspace set. Gate 0,
  **halting**. Without a subject list there is no sweep to scope.
- `SPINE-01b` — **every enumerated workspace produced results**: the set from gate 0 vs the set with
  results. Gate 9, **non-halting, red**, naming the missing workspaces. A skipped workspace must never
  read as clean, but discovering one at the end is a scope finding, not a reason to discard the run.


---

## MEASURED REALITY — corrections from the first live execution (2026-07-30)

The loop design above was written against the tool's *documented* contract. Executing it against
the deployed MCP contradicts that contract in four ways. **These findings override the pseudocode.**

### 1. There is no pagination. `nextCursor` is always `null`.

Measured: `well_query_records` on `transactions` with `whereClause {category_key: {_is_null: true}}`
returned `totalCount: 793`, `returned: 545`, **`nextCursor: null`** — and at `limit: 5` returned
`10` rows with `nextCursor: null` again. There is no cursor to follow and no offset parameter.

**Consequence: the L1 page-to-exhaustion loop cannot be implemented.** `examined == total` is
unreachable for any root holding more rows than one response returns.

**Therefore, the binding rule:** whenever `returned < totalCount`, the control point's verdict is
**`SAMPLED`** — never `pass`, and never `fail` on absence. Report `returned`/`totalCount` on every
such line. A control point may only return `pass` when `returned == totalCount` in a single
response. Do not describe a scan as exhaustive that the API cannot make exhaustive.

### 2. `limit` is applied PER WORKSPACE, not globally.

Measured: `limit: 5` returned 10 rows — five from `c3f54fe3` and five from `1c5c706f`. A request
for N rows across an authorized set of W workspaces can return up to N×W.

**Consequence:** never treat `returned` as the number you asked for, and never compute a rate from
`returned / limit`. Any client-side dedup or grouping must first partition by `workspace_id`.

### 3. `totalCount` and `rows` have DIFFERENT scopes in the same response.

`totalCount: 793` is the count across all authorized workspaces, while `rows` is capped per
workspace. So a single response mixes a global count with a partial, per-workspace row set.

**Consequence:** this is the scope-mixing error the sweep exists to catch, occurring inside the tool
itself. Never divide a per-workspace row count by `totalCount`. To get a per-workspace count, filter
the query to one workspace and read `totalCount` from that response.

### 4. Field selection does not control payload size.

Measured: requesting 2 fields returned 9 keys per row (~1,150 bytes/row) — composite columns
(`composite_logo_name`, `composite_avatar_fullname`, `composite_connector_logo_name`, `workspace_id`)
are injected automatically and cannot be suppressed.

**Consequence:** a 500-row request produced 627,187 characters and exceeded the response limit
outright. Budget ~1.2 KB per row. Keep `limit` low and read `totalCount` for counting; fetch rows
only when you need example ids for a finding.

### The counting idiom that actually works

- **To count:** `limit: 1` + read `totalCount`. Cheap, exact, and the only reliable count.
- **To get examples:** `limit: 5`, accept up to 5×W rows, partition by `workspace_id`.
- **To count per workspace:** one query per workspace, each reading its own `totalCount`.
- **Never** attempt a full-set scan, a client-side sum over all rows, or a cross-root join by paging
  — none of them terminate.
