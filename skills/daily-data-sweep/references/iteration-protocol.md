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
- **Scan depth is reported, not resumed.** The `limit` used and the `returned`/`totalCount` pair
  document how much of the population this run saw. The next run restarts from the beginning — it has
  no way to learn where this one stopped, and there is no cursor to stop at (`nextCursor` is always
  null; see B.1).
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

### B.1 Loop L1 — one request, honestly bounded (per control point)

**READ THIS BEFORE THE LOOP — measured 2026-07-30: there is no pagination.** `well_query_records`
returns **`nextCursor: null` on every response**, at every `limit`, and there is no offset parameter
(the measurement is in § MEASURED REALITY below). There is nothing to page through, so **do not write
a cursor loop and do not implement a page budget** — a cursor loop against a null cursor terminates
after one iteration and then silently reports that one response as an exhaustive scan. `L1` is
therefore a **single request**, and its whole job is deciding honestly whether that one response saw
the population or only part of it.

`well_query_records` also has **no aggregation** and caps rows per response (and per workspace — see
MEASURED REALITY §2). So every count, group-by and set-difference is client-side over what one
response returned, which is exactly why the `SAMPLED` verdict below is not optional.

```
loop L1(control, root, filter):
    # WHICH SHAPE? This is the first decision, and it decides the verdict.
    #   SERVER-SIDE  — the defect predicate is expressible in the whereClause.
    #                  totalCount IS the finding: exact, exhaustive, no scan needed.
    #   CLIENT-SIDE  — the predicate needs a reduce over returned rows (group-by,
    #                  cluster, sum). Only these can be truncated.

    if control.predicate_is_server_side:
        resp  := well_query_records(root, fields, whereClause=defect_predicate, limit: 1)
        found := resp.totalCount              # EXACT — this is the whole population of defects
        if found == 0:
            verdict := empty_verdict(control)  # see the three declared classes below
        else:
            verdict := fail                    # count is exact; fetch rows only for example ids,
                                               # and label THOSE sampled, never the count
    else:
        resp     := well_query_records(root, fields, filter, limit)   # ONE call — no cursor, no pages
        total    := resp.totalCount     # across ALL authorized workspaces (MEASURED REALITY §3)
        examined := resp.returned       # capped per workspace, so examined <= total, often <<
        hits     := resp.rows matching the predicate
        if total == 0:
            verdict := empty_verdict(control)
        else if hits is non-empty:
            verdict := fail             # a hit found in a partial scan is still a real defect
        else if examined < total:       # scanned everything we could reach, found nothing
            verdict := SAMPLED          # <- absence over a partial scan proves nothing
        else:
            verdict := pass
    record(control, verdict, examined, total, scan_depth)   # scan_depth = the limit this run used

empty_verdict(control):                 # an empty result means three different things
    if control.empty_is_fail:  return fail          # absence IS the defect
    if control.empty_is_pass:  return pass          # absence IS the passing state
    return INCONCLUSIVE                             # nothing was examined
```

To **count** a population exactly, do not scan it: issue `limit: 1` and read `totalCount`, one query
per workspace. Fetch rows only when a finding needs example ids. Full idiom in § MEASURED REALITY.

**Do not then compare that `returned: 1` against `totalCount` and call the result `SAMPLED`.** The
`limit: 1` idiom is a *counting* call, not a truncated scan — `returned` is 1 by construction. A
server-side-filtered count is an **exact, exhaustive** answer about the defect population, and it
routes to `fail`, into the red count, with the count stated. Only the example ids are sampled.
Conflating the two is how a red becomes a `(partial)`: 793 uncategorized transactions is a `fail`
with an exact count, never `pass (partial — 1 not evaluated)`.

Three rules that are not optional:

- **An empty result means three different things, and the control point must say which.** `total == 0`
  is not self-interpreting: for a duplicate check it is the passing state, for a
  "connector has never synced" check it *is* the defect, and for a card check in a workspace with no
  cards it means nothing was examined. Every control point therefore belongs to exactly one of the
  three classes below. **Membership is a closed enumerated set, never inferred from the id or the
  name.** An earlier revision matched on words in the name (*never*, *unposted*, *orphan*…); that
  matched `ING-connector-never-synced`, whose fail signal is literally `totalCount = 0`, and declaring
  it absence-is-pass made its pass condition identical to its fail condition — a bank connector that
  has never once synced would have reported `pass` while `cash-position` totalled a confident zero.
  Substring matching on names is also forbidden by the repo standard. **Unlisted ⇒ INCONCLUSIVE.**

- **`empty_is_fail: true` — absence IS the defect.** The empty result is the finding, so it must reach
  the red count and never be intercepted as INCONCLUSIVE:
  `ING-connector-never-synced`, `ING-sync-stale-no-recent-success`, `ING-bank-connector-zero-accounts`,
  `ING-account-zero-balance-rows`, `ING-fx-rate-missing-for-live-currency`,
  `ING-no-banking-source-installed`, `ING-no-invoicing-source-installed`,
  `ING-connector-produced-no-records`, `ING-ledger-graph-absent` (amber),
  `GRAPH-entity-class-silently-empty`, `GRAPH-account-open-balance-row-invalid` (zero-open-rows arm),
  `RECON-unposted-period` (zero-entries arm).

- **`empty_is_pass: true` — absence IS the passing state.** Finding nothing is the correct outcome, so
  without this declaration every clean workspace returns INCONCLUSIVE and a bare `pass` becomes
  unreachable — the mirror image of the always-green lie:
  `RECON-duplicate-account-rows`, `RECON-duplicate-payment-candidates`,
  `GRAPH-orphan-media`, `GRAPH-payment-means-island`,
  `GRAPH-journal-entry-unposted-or-dangling`, `GRAPH-ledger-account-tree-broken`,
  `ING-duplicate-transaction-external-id`,
  `ING-duplicate-account-cross-connector`, `BANK-txn-no-cross-connector-dup`,
  `BANK-card-pan-never-raw`, `BOOK-edge-dangling`, `DOC-02`, `DOC-07`, `DOC-08`, `DOC-10`,
  `IPAY-04`, `IPAY-05`, `IPAY-11`, `IPAY-14`, `IPAY-16`, `EINV-02`, `EINV-11`, `EINV-18`, `EINV-19`.

  **`GRAPH-company-identity-fragmentation` is deliberately NOT in this list**, though its collision
  arm looks like it belongs. Its second arm reports the *null rate* of the two strong keys — a
  presence assertion, whose row ends "report the covered share, never a bare green". Declaring it
  absence-is-pass produces exactly the bare green it forbids.

- **Everything else is INCONCLUSIVE on an empty population.** A check asserting something *should
  exist* — a balance, a category, a payment means, a document — had nothing to examine, and that is
  not a pass.

- **Any rename or new control point must sweep these two lists.** They are the only place outside the
  family files that names control points individually, and a stale entry here is silent: it produces
  a plausible verdict, not an error.

- **`SAMPLED` is not `pass`.** A truncated scan reports `SAMPLED` with the scan depth reached. An
  unqualified green over a truncated scan is the sweep lying in exactly the way the 12 skills do.
- **`examined < total` means `SAMPLED`, not pass — and it is the normal case, not an anomaly.**
  With no pagination the API simply cannot return the rest, so any root larger than one response is
  `SAMPLED` by construction. (It also covers the older reading — a concurrent sync moving the set
  under the read — which is equally not a pass. Either way, do not paper over it.)
- **Record the scan depth as evidence, not as a resume point.** State the `limit` used and the
  `returned`/`totalCount` pair, which is what makes a `SAMPLED` verdict auditable. Nothing carries to
  the next run (every run is cold) and there is no cursor to carry anyway, so a truncated scan is
  truncated again next time; the honest fix is a narrower filter, not a resume.

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
| `scan_depth` (the `limit` used) | proof of how much this run saw, so a `SAMPLED` is auditable. Not a resume point — every run is cold, and `nextCursor` is always null, so there is no cursor or page count to record |
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
| 1 | **Spine** — months enumerated, picker agreement (`SPINE-02`, `-03`, `-04`, `-06`, `-07`) | month set is untrusted → every later gate reports "scope uncertain" |
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

**Consequence: a page-to-exhaustion loop cannot be implemented** — which is why B.1 above is a
single request, not a loop. `examined == total` is unreachable for any root holding more rows than
one response returns.

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
