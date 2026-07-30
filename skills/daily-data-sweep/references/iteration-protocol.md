# Iteration protocol and gate order

The L1/L2/L3 loops, the counting primitive, the loop ledger, and the full gate table with per-gate consequences. Open BEFORE running any control point.

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
    until cursor == null OR pages >= PAGE_BUDGET

    if cursor != null:            # budget exhausted before the data did
        verdict := SAMPLED        # <- NEVER "pass"
    else if examined < total:
        verdict := INCONCLUSIVE   # rows vanished mid-loop; a sync wrote during the sweep
    else:
        verdict := pass / fail on hits
    record(control, verdict, examined, total, pages, cursor_at_stop)
```

Three rules that are not optional:

- **`SAMPLED` is not `pass`.** A truncated scan reports `SAMPLED` with the page depth reached. An
  unqualified green over a truncated scan is the sweep lying in exactly the way the 12 skills do.
- **`examined < total` means INCONCLUSIVE, not pass.** The two reads are not a consistent snapshot;
  a concurrent sync makes the set move under the loop. Do not paper over it.
- **Record `cursor_at_stop`** so the next run resumes instead of restarting. At the current scale
  (1,904 transactions ≈ 4 pages) exhaustion is cheap; at 24,925 prod-wide it is 50 pages per control
  and resumability stops being optional.

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
loop L3(sweep, max_rounds = 3):
    round := 0
    prev  := null
    repeat:
        result := sweep()
        round  += 1
        if result.findings == prev.findings:   break     # converged: dry
        if round >= max_rounds:                break     # budget
        prev := result
    if round >= max_rounds and not converged:
        flag NOT_CONVERGED                                # the sweep is chasing its own tail
```

Use L3 for: the month chain (fixing January changes February's verdict), extraction→resolution→
identity, and dedup→re-count. **Do not** use L3 for anything that writes — this skill is detect-only,
so convergence here means *the finding set stabilised*, never *the data got fixed*.

`NOT_CONVERGED` is itself a finding: it means a defect regenerates as fast as it is measured, which
points at a writer, not at rows.

### B.4 The loop ledger — what every control point must emit

Non-negotiable, because it is what distinguishes this sweep from an impression:

| field | why |
|---|---|
| `verdict` | `pass` / `fail` / `inconclusive` / `sampled` — four values, never two |
| `examined` / `total` | the completeness proof; equal means exhaustive |
| `pages`, `cursor_at_stop` | resumability, and proof of scan depth |
| `scope` | workspace id + month + the family — never a bare number (§ SCOPE WARNING) |
| `parents_unchecked` | for L2: the named objects the loop never reached |
| `rounds`, `converged` | for L3 |

---

# PART C — GATE ORDER: the sequence, and what each red does to the next gate

Gates run in order. **A red at gate N does not stop the sweep — it re-labels every later gate**, because
depth findings computed under a breadth failure are scoped, not clean.

| gate | family | if red → |
|---|---|---|
| 0 | **Scope** — workspaces enumerated (`SPINE-01`), MCP reachable | **HALT.** A sweep that could not run is a FAILED sweep, never a passing one. |
| 1 | **Spine** — months enumerated, picker agreement (`SPINE-02..06`) | month set is untrusted → every later gate reports "scope uncertain" |
| 2 | **Ingestion / connectors** (`ING-`, `BANK-` exhaustive) | every later gate is labelled *"scoped to the sources that were connected"* |
| 3 | **Banking data** (`BANK-` complete) | **charts must not render** — cash/trend/burn/breakdown/FX all blocked |
| 4 | **Entity graph** (`GRAPH-`) | counterparty and logo layers untrusted; category/vendor charts degraded |
| 5 | **Reconciliation** (`RECON-`) | period is not close-ready; the month cannot leave `not_ready` |
| 6 | **Bookkeeping proof** (`BOOK-`, `DOC-`) | audit evidence incomplete; a compliant-looking invoice may have no receipt |
| 7 | **Invoice banking linkage** (`IPAY-`) | payments must be keyed by hand; reconciliation stays manual |
| 8 | **E-invoicing** (`EINV-`) | the month cannot be **declared**, even if it can be closed |
| 9 | **Latent assumptions** (`ASSUME-`) | the other gates may be green *vacuously* — run this to find out |

Gate 9 last on purpose: it is the gate that audits the other gates. A green sweep with a red gate 9
means the greens are unverified, not verified.

