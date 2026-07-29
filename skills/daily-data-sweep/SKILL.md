---
name: daily-data-sweep
description: Run a daily sweep over a Well workspace and report whether its financial data is COMPLETE (what is there is whole, fresh, populated, reconciled) and EXHAUSTIVE (nothing is missing — no unconnected source, no gap period, no uncovered entity). Use when the user asks "is our Well data complete", "run the daily sweep", "data health check", "can I trust the numbers today", "what's missing in Well", "sweep our workspace", or before relying on any other Well skill for a decision. Produces a per-control-point verdict with severity, the failing record ids, and the one action that fixes each failure. Requires a connected Well workspace; reports honestly rather than passing a workspace it could not fully inspect.
---

# Daily Data Sweep — Completeness & Exhaustiveness

> **STATUS: DRAFT v0.2 — ready for your additions.** The two definitions (§ Purpose), ~90
> control points across five families (`CMP-`, `EXH-`, `ING-`, `GRAPH-`, `RECON-`), the 14
> latent-gap `ASSUME-` table, and 16 tolerances with concrete defaults are seeded from the 12
> published Well skills, live Well MCP probes, and a four-expert domain audit (ingestion,
> financial graph, per-skill data contract, reconciliation). Slots marked **`[TO COMPLETE]`**
> are open for your additional control points. § Provenance records what is grounded, what is
> inconclusive, and what is still pending.
>
> **This skill is detect-only.** All 33 MCP roots are query-only, so no control point can
> auto-remediate and none should be written as if it could. The output is an exception queue a
> human works in the Well app.

## Purpose

Every other Well skill answers a financial question. This one answers the question *behind*
them: **can today's numbers be trusted at all?**

A Well answer can be wrong in exactly two ways, and they are not the same failure. This
skill separates them and never conflates them:

### "Data COMPLETE" — depth

> **The records that exist are whole.** For every source that IS connected and every period
> that IS covered, each record is fully populated, internally consistent, verified, fresh,
> and reconciled. Nothing is half-written, unverified, stale, unlinked, or uncategorized.

Completeness is about **the quality of what we have**. It fails silently and it is the
dangerous one: the answer looks confident and is wrong by a specific amount. A balance
snapshot that exists but whose transactions don't sum to it will produce a cash figure that
is precisely, quietly incorrect.

Test: *if I answer from this data, is the number I state the right number?*

### "Data EXHAUSTIVE" — breadth

> **Nothing is missing.** Every source that SHOULD be connected is connected and syncing;
> every entity class the skills read is populated; the time series has no holes; no account,
> currency, counterparty, or period is silently excluded from the surface being reported on.

Exhaustiveness is about **the coverage of what we have**. It fails visibly-in-hindsight: the
answer is correct for the subset it saw and wrong for the business. A runway computed from
one of three bank accounts is arithmetically perfect and materially false.

Test: *is the population I answered over the whole population the user meant?*

### Why both, and why the distinction is load-bearing

| | COMPLETE fails | EXHAUSTIVE fails |
|---|---|---|
| Symptom | Right scope, wrong number | Right number, wrong scope |
| Detectability | Silent — needs a cross-check | Silent — needs a census |
| Example | `account_balances.verification_error = true` → cash off by €1,050 | A second bank connected but `to_configure` → whole account absent from cash-position |
| Remedy shape | Repair / re-verify / re-classify the record | Connect / backfill / widen the window |

A sweep that only checks one of the two gives false confidence. **A control point must
declare which bucket it belongs to** — that declaration is what makes the report actionable,
because the two buckets route to different fixes.

---

# PART A — THE SPINE: sweep month by month

**The sweep unit is `(workspace × month)`.** Not "the workspace", not "the trailing 90 days" — the
month, because that is the unit the business actually closes and the unit the product already
exposes.

### A.1 Reuse the month-picker component — as a SWEEP picker, not a close picker

The sweep's entry surface is the existing month-grid picker
(`apps/web/src/features/chat/components/ai-elements/custom-tags/ai-close-month-picker-tag.tsx`): a
desk-calendar year view, twelve mini month-panels, each day a dot, year navigation, one selectable
month. **That geometry is exactly right for a monthly sweep.** What is wrong for a sweep is its
*content* — it currently says "Close your books".

**So the skill re-labels the card.** The component supplies the shape; the sweep supplies the
meaning. It is a month picker that happens to be used by the close flow today, not a close artefact
the sweep is borrowing.

### What the skill must override

| what | today (hardcoded) | the sweep needs |
|---|---|---|
| Title | `chat.bookkeeping.closeMonthPicker.title` → *"Close your books"* | *"Sweep a month"* |
| Subtitle | `.subtitle` → *"For which month do you want to close your books?"* | *"Which month should I check for complete and exhaustive data?"* |
| Context label | `.context` → *"Closing books for"* | *"Sweeping"* |
| Disabled-month copy | `.monthClosed` → *"{month} is already closed"* · `.monthLocked` → *"{month} can't be closed yet"* | *"{month} was swept and is clean"* · *"{month} has no data to sweep"* |
| Dot grammar | close-readiness (posted / progress / neutral) | **sweep findings per day** — see A.2 |

**Required component change, stated plainly:** `title` and `subtitle` are read from fixed i18n keys
(`ai-close-month-picker-tag.tsx:118, 265-266`) and there are **no props to override them** — the tag
accepts only `year`, `min-year`, `max-year`, `workspace-id`. So the sweep cannot re-label it today.
The change is small and belongs in the component, not in a fork:

- add an optional **`mode`** prop (`"close" | "sweep"`, default `"close"`) that selects the i18n
  namespace — `chat.bookkeeping.closeMonthPicker.*` vs a new `chat.bookkeeping.monthSweepPicker.*`
  block — so copy stays in i18n and is translatable, rather than being passed as raw strings through
  a tag attribute;
- have `mode` also select the state vocabulary and dot semantics (A.2);
- keep everything else — grid, year nav, keyboard, loading-as-locked behaviour — untouched.

**Do not fork the component into `<ai-sweep-month-picker />`.** One logical object, one
implementation, varied by a prop — the density/variant rule. A fork would drift the two calendars
apart within a release.

**Keep the one behaviour that matters most:** the card **does not trust LLM-emitted state.** The LLM
emits only the year bounds; the card fetches its own authoritative snapshot and renders every month
as LOCKED while in flight, so it never shows a spurious selectable state. The sweep variant must
fetch its own month verdicts the same way — the AI writes the *copy*, never the *state*.

### A.2 The sweep's month state — its own vocabulary

Close-readiness is **one input among many**, not the driver. A month can be perfectly closeable and
still fail this sweep (uncategorized spend, no receipts, unlinked IBANs), and a month can be
`not_ready` for reasons the sweep does not own. So the sweep needs its own four states:

| sweep state | meaning | selectable? | what runs |
|---|---|---|---|
| `HAS_FINDINGS` | swept, reds or ambers open | **yes** — the primary target | full sweep; output is the remediation list |
| `UNSWEPT` | never swept, or stale beyond the sweep interval | **yes** | full sweep |
| `CLEAN` | swept, no findings above the reporting floor | yes (re-sweep) | regression subset only — structural checks that must hold forever (tenancy, dangling refs, duplicate identity). **Do not** re-run grace-window or freshness checks on a settled month; they fire on history. A new red here is a **regression alarm**. |
| `EMPTY` | genuinely no data in the period | no | **emptiness sweep only** — assert the month is empty *because nothing happened*, not because a connector never synced. That false-quiet is the most dangerous state in this skill (`SPINE-04`). |

**Day dots carry sweep findings, not posting status.** A day with a red finding, a day with only
ambers, and a clean day are three different dots — which turns the calendar into a heat map of *where
in the month* the data breaks. That is strictly more useful than a close-progress dot, and it is the
same rendering primitive.

**Where close-readiness still belongs:** as a cross-check. If the sweep says a month is `CLEAN` while
close-readiness says `not_ready`, one of the two is wrong — that contradiction is a finding
(`SPINE-03`), not something to reconcile silently.

### A.3 Month ordering — oldest open first

Sweep months in **ascending** order from the oldest non-`closed` month. Rationale: close is a chain.
A defect in an older open month blocks every month after it, so reporting the newest month first
sends the user to fix a symptom. State the chain explicitly in the output: *"March is closeable;
January is `not_ready` — fix January first or the chain stalls."*

### A.4 Multi-workspace

The picker already carries a `workspace-id` prop, stamped by the deterministic close runner for the
**multi-workspace close loop**. The sweep mirrors that exactly: loop workspaces from
`well_list_workspaces`, run the month spine per workspace, and **never merge verdicts across
workspaces** (§ SCOPE WARNING). A parent workspace's consolidated verdict is the *intersection* of
its own and its children's — one child's `not_ready` January makes the parent's January `not_ready`.

### A.5 Spine control points

| id | name | check | sev |
|---|---|---|---|
| `SPINE-01` | Every workspace enumerated and swept | workspaces from `well_list_workspaces` vs workspaces with results | red — a skipped workspace must never read as clean |
| `SPINE-02` | Every month in range enumerated | months from close-readiness for each year in range vs months with results | red |
| `SPINE-03` | **Sweep verdict agrees with close-readiness** | sweep state per month vs `CloseReadinessStatus` | red — `CLEAN` on a `not_ready` month (or findings on a month reported closeable) means one of the two is lying |
| `SPINE-04` | **`EMPTY` is genuine, not false quiet** | month `EMPTY` **and** an enabled connector covering that period exists **and** zero rows ingested | red — the most dangerous state in this skill |
| `SPINE-05` | No regression on a settled month | new red on a `CLEAN` month vs the prior sweep | red |
| `SPINE-06` | Coverage contiguous within the month | a run of no-data days inside an otherwise populated month | amber — coverage gap, distinct from a posting gap |
| `SPINE-07` | Card copy matches the mode it is rendering | picker rendered for a sweep while showing close copy (i.e. `mode` unset/unsupported) | amber — a sweep that asks "close your books?" will be answered as a close, and the user's intent is lost |

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

---

## SCOPE WARNING — two sets of numbers in this file, both correct

Every count I measured comes from the **MCP, scoped to the 3 workspaces the caller can access**.
A reviewer ran SQL against the **whole production DB**. They differ by ~16×:

| metric | my MCP scope (3 workspaces) | prod-wide SQL |
|---|---|---|
| invoices | 1,517 | **33,753** |
| transactions | 1,904 | **24,925** |
| accounts | 30 | **403** |

**Neither is wrong.** But a sweep must never mix them, and a "verdict" computed at one scope must
never be reported at the other. Every output line must state the scope it was computed over. The
`accounts` gap in particular means my "~24 duplicates of one account" is a finding about *one
workspace*, not a platform-wide rate — and prod-wide, `accounts.ownership` splits
**284 workspace / 61 counterparty / 58 unknown**, so the ownership picture is far better populated
than my 3-workspace sample suggested.

## CORRECTIONS — earlier conclusions in this file that were WRONG

Recorded prominently because they were stated confidently and they change the remediation.

**1. `workspaces.own_company_pk` EXISTS.** Earlier sections say own-company identity "does not
exist" and propose adding a `self` value to `company_origin`. **Both are wrong.** The column is
real (`apps/api/src/database/entities/Workspace.ts:64-65`), with an append-only evidence ledger
`workspace_own_company_evidence` carrying typed `source`/`strength`/`decision`/`reason`, and a
fleet metric already computed by `WorkspaceRepository.ownCompanyAnchorRate`
(`GET /v1/backoffice/self-heal/own-company-anchor-rate`). It is **stripped by
`workspace.formatter.ts:57-72`**, which is why `well_get_schema("workspaces")` returns 14 fields.
So "WELL APP INC tagged `company_origin: counterparty`" is **not** the defect — origin is a
per-company column and a company can be self in one workspace and a counterparty in another;
the FK is the correct model. **Do NOT add `self` to `company_origin`.** The real check is
whether `own_company_pk` points at the right row, and the real gap is a **read-surface** gap.

**2. Fiscal period IS built.** `workspace_accounting_settings` carries
`fiscal_year_start_month` (int 1-12, CHECK), `fiscal_year_start_month_source`
(`derived` | `user`), `incorporation_date`, `base_currency`, `country`, and
`accounting_framework`. The legal-form→FYE rule table is real (`FYE_RULES`:
FR/DE/US → calendar, GB → incorporation anniversary, sole traders → calendar), written by
`deriveAndWriteFiscalYearStart`, which never clobbers `source: "user"` and never defaults to
December on underivable input. **`workspace_accounting_settings` is simply not one of the MCP
read roots** — so this too is a read-surface gap, not a schema gap.
Also worth correcting my own framing: a French SAS's *exercice comptable* is **not** statutorily
December — the statuts choose it. So a `derived` FYE on a non-GB jurisdiction is an
**unconfirmed default**, and must ship as "assumed December — confirm?", never as fact.

**3. `match_score` / `is_preselected` / `is_connected` DO exist.** A reviewer reported these
absent from `well_list_connectors` based on the local checkout. **Live MCP contradicts the
source read** — a call right now returns, per connector, `match_score`, `is_connected`,
`is_preselected` alongside `is_matched` / `is_selected`. Example live rows: Stripe
(`category_id: finance`, `match_score: 1`, `is_preselected: true`, **`is_connected: false`**),
same for Postman and Figma; 183 connectors total. **Lesson for this whole skill: the deployed
MCP is ahead of the local checkout, so a repo read is not a substitute for a live probe — and
vice versa.** Where the two disagree, record both and say which you trusted.

### The one unresolved contradiction

I observed `workspace_connectors.status = "degraded"` live (Attio, Xero). A reviewer reports the
native enum as `enabled | disabled | to_configure | processing | error | need_reconnect |
suspended` — **no `degraded`**. Both observations are first-hand. Until reconciled, a sweep must
filter on the **set** of non-`enabled` statuses rather than on `degraded` alone, or it will
silently match nothing while `need_reconnect` and `error` — the two that actually mean "this bank
stopped feeding you" — go unchecked.

## PRIORITY FAMILY — banking data must be chart-ready (`BANK-`)

This is the **first family the sweep runs**, and the reason the skill exists: before any chart
renders (cash position, cash trend, burn/runway, expense breakdown, FX exposure), the banking
data behind it must be complete AND exhaustive. Scope is **every workspace the caller can
access**, reported per workspace, never merged.

### Live audit — all 3 workspaces, probed 2026-07-29

Run against Maxime (`2b18112f`), WELL APP INC. (`c3f54fe3`), WellappFR (`1c5c706f`). These are
measured, same-moment counts — not estimates. **The verdict today is: charts must not render.**

| what | measured | verdict |
|---|---|---|
| transactions, total | **1,904** | baseline |
| uncategorized (`category_key IS NULL`) | **788 = 41.4%** | 🔴 every category chart is wrong by construction |
| **ledger mapping** (`ledger_account_pk IS NULL`) | **1,904 = 100%** | 🔴 **not one transaction is mapped to a ledger account** |
| no payment means at all (both FKs null) | **155 = 8.1%** | 🔴 counterparty unresolvable for those rows |
| cards, total | **4** | — |
| cards with `anonymized_pan` | **0 of 4** | 🔴 the field exists and is never populated |
| cards with an owner (`company_pk` / `people_pk`) | **0 of 4** | 🔴 orphan cards |
| `transactions.foreign_exchange` populated | **0 in every sample, incl. USD rows** | 🔴 no FX attached at transaction level |
| `exchange_rates` catalogue | **76,260 rows**, source `ExchangeRate-API`, `rate_date` = yesterday, EUR-based both directions, `workspace_pk: null` (global) | ✅ the rates exist — nothing consumes them |
| `transactions.scheme` | **null on every sampled row** | 🔴 card transactions are **not identifiable by scheme** |
| accounts | **30**, of which **~24 duplicate one account** on an hourly cadence; **3** with `currency: null`; `workspace_connector_pk` null on **all 30** | 🔴 cash summed ~24× |
| balance verification | **6** rows `verification_error = true`, `verified_at` null on all 6 | 🔴 |
| journal entries | 117 (Xero + Pennylane), **none in the third workspace** | 🟡 |

**Five defects here are each independently sufficient to make a cash or burn chart wrong.** The
duplicate accounts multiply cash; the 100% null ledger mapping empties the ledger path; 41%
uncategorized guts the category chart; the missing FX attachment silently mixes USD and EUR; the
6 unverified balances are off by known amounts.

### Two structural findings from the live probe

**1. The same real payment is ingested twice, with opposite signs.** WellappFR has both a direct
`qonto` connector and a `plaid_ins_137879` ("Qonto (FR)") connector on the same account. Observed
pairs:

- Malakoff Humanis retirement: `qonto` → `{amount: +2150.32, EUR}`; `plaid_ins_137879` →
  `{amount: -2150.32, EUR}` — same remittance, same day.
- GoCardless: `qonto` → `+0.01`; `plaid_ins_137879` → `-0.01`.

Depending on how a chart aggregates, this either **nets to zero** (hiding real spend) or
**double-counts** (inflating it). `transaction_external_id` will not catch it — the two
connectors mint different ids for the same movement. The identity key must be
(amount magnitude, currency, date, normalized remittance), segmented by account.

**2. The label already contains the identifiers nobody extracts.**
`transactions.remittance.unstructured` carries, in plain text:

```
"RETRAITE - MALAKOFF HUMANIS - 202606M - SIRET 99091585200018 - G0338946975"
"Malakoff Humanis - … - IBAN: FR7630004008280001223932276"
```

**A French SIRET and a full IBAN are sitting in the label, unextracted** — while
`GRAPH-transaction-counterparty-unresolved` reports the counterparty as unknown and the FR
e-invoicing control points report the company as incomplete. The extraction that would fix
counterparty mapping, bank→company mapping, and FR tax identity **already has its input**. Same
for the card case: `cards.last_four_digits` is populated (1332, 1099, 5179, 2024) while
`anonymized_pan` is null — so partial extraction is happening and stopping short.

### `BANK-` control points

Confirmed field shapes: `instructed_amount` / `settlement_amount` =
`{"amount": <number>, "currency": "<ISO>"}`. `remittance` = `{"unstructured": "<label>"}`.
`account_balances.foreign_exchange` = `[{currency_rate, currency_pair, currency_rate_source,
currency_rate_at}]`. `payment_means` = 14 fields (`account_pk`, `card_pk`, `check_pk`,
`company_pk`, `people_pk`, `name`, `payment_means_external_id`, …). `cards` = 16 fields
(`anonymized_pan`, `last_four_digits`, `brand`, `cardholder_name`, `type`, `expiration_date`,
`company_pk`, `people_pk`, …).

#### Transactions complete

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-txn-categorized` | Every transaction categorized | `transactions.category_key _is_null`, split by `category_status` | any; **live 788/1904 = 41.4%** | red |
| `BANK-txn-category-resolves` | Category is a live catalogue entry | `category_key` resolves to a live `categories` row; also check `category_taxonomy_version` is uniform | dangling key, or mixed taxonomy versions in one chart window | red |
| `BANK-txn-amount-nonzero` | Amount is real | `instructed_amount.amount` null **or `= 0`** | any; **live: a `{amount: 0, EUR}` Reddit Ads row exists** | red |
| `BANK-txn-amount-currency` | Amount carries a currency | `instructed_amount.currency` null | any | red |
| `BANK-txn-date-present` | Datable | `booking_date IS NULL` **and** `value_date IS NULL` **and** `executed_at IS NULL`; window on `COALESCE` of the three | any | red |
| `BANK-txn-ledger-mapped` | Mapped to a ledger account | `ledger_account_pk _is_null`, and `ledger_account_role` consistency | any; **live 1904/1904 = 100%** | red |
| `BANK-txn-no-cross-connector-dup` | Same movement not ingested twice | group by (abs(`instructed_amount.amount`), currency, date, normalized `remittance.unstructured`) across **different** `source_workspace_connector_pk` on the same account | any group ≥2; **live: confirmed on Qonto direct vs Plaid Qonto** | red |
| `BANK-txn-no-external-id-dup` | No re-ingestion within a connector | (`source_workspace_connector_pk`, `transaction_external_id`) collisions | any | red |

#### Counterparty, bank and logos

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-txn-has-payment-means` | Attached to a payment means | both `debtor_payment_means_pk` and `creditor_payment_means_pk` null | any; **live 155/1904 = 8.1%** | red |
| `BANK-txn-counterparty-company` | Resolves to a company | means → `payment_means.company_pk`; null, or resolves only to `people_pk` | any | red |
| `BANK-txn-siret-iban-unextracted` | Identifier present in label, not extracted | `remittance.unstructured` matches a SIRET (14 digits) or IBAN pattern **while** the counterparty company is unresolved or lacks `canonical_tax_id` | any; **live: confirmed** | red |
| `BANK-account-bank-company` | Account maps to its bank | `accounts.bank_company_pk _is_null` | any | red |
| `BANK-company-has-logo` | Logo available for charting | `companies.primary_media _is_null` for any company appearing as a transaction counterparty or an account's bank | any | amber |
| `BANK-logo-enrichment-ran` | Distinguish "no logo" from "never tried" | `primary_media` null **and** no enrichment attempt recorded | any | amber |

#### Cards and payment means

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-card-pan-anonymized` | Card carries an anonymized PAN | `cards.anonymized_pan _is_null` | any; **live 4/4 null while `last_four_digits` IS populated** | red |
| `BANK-card-pan-never-raw` | PAN is never stored raw | `anonymized_pan` matching a full unmasked PAN pattern (13–19 consecutive digits, Luhn-valid) | any | **red — treat as a compliance incident, not a data defect** |
| `BANK-card-owned` | Card has an owner | `cards.company_pk` and `people_pk` both null | any; **live 4/4** | red |
| `BANK-card-metadata` | Card is identifiable | `brand`, `type`, `cardholder_name`, `expiration_date` null | any | amber |
| `BANK-card-txn-identifiable` | Card transactions can be found at all | `transactions.scheme` null population-wide → **scheme cannot classify card spend**; fall back to `payment_means.card_pk` non-null, else label markers | scheme null on >90% of rows; **live: null on every sampled row** | red |

#### FX

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BANK-fx-attached` | FX attached on non-local currency | `instructed_amount.currency` ≠ workspace currency **and** `foreign_exchange _is_null` | any; **live: 0 rows populated, incl. USD** | red |
| `BANK-fx-rate-exists` | A rate exists for the pair and date | `exchange_rates` where `source_currency`/`target_currency` match and `rate_date <=` txn date, within 4 days (§5) | none found | red |
| `BANK-fx-rate-source` | Provenance recorded | `foreign_exchange[].currency_rate_source` missing | any | amber |
| `BANK-fx-one-rate-per-pair-day` | No two rates for one pair/day | duplicate (`source_currency`, `target_currency`, `rate_date`) with differing `rate` | any | amber |

#### Source-side defects the sweep can only report, never fix

Five findings where the sweep is correct to go red **and the fix is a writer, not a check**.
Reporting these as data-quality items would send someone hunting for bad rows when the cause is
missing code.

| finding | evidence | consequence |
|---|---|---|
| **`transactions.foreign_exchange` has NO writer** | zero writers anywhere in `apps/api/src` — not Plaid, not `connector.service.ts`, not any slot mapping. Meanwhile `field-metadata-resolver.ts:559-563` wires a `composite_fx_rate` display cell onto transactions | the FX column in Records renders a field **nothing populates**. `BANK-fx-attached` is 100%-red by construction. Every multi-currency total converts at read-time spot with nothing recorded on the row — the chart is not wrong, it is **unauditable**: re-run next month and the same historical transaction converts differently |
| **`cards.anonymized_pan` has NO writer** | only 3 references: the entity declaration, and a dedup rule at `entity-rules.ts:240` matching `{col: "anonymized_pan", op: "exact"}` | **that dedup rule can never fire.** It silently degrades to `last4 + expiration + holder` — and expiration and holder are **both null** on every Plaid-minted card, so **no card dedup rule can fire at all**. One real card splits across N rows |
| **Card extraction is Plaid-only and is substring guessing** | `extractCardLastFourDigits`, `plaid.service.ts:1360-1407`, called only at `:1665` and `:1913`. Takes **every isolated 4-digit run** in the label and returns the last one. **No requirement that the label contain any card marker** — no `CB`, `CARTE`, `VISA`, `POS` | "STORE 4021", a year, or an order number **mints a `cards` row**. No confidence is computed or stored. Every non-Plaid connector does no extraction at all. This is precisely the substring branching the repo standard forbids |
| **The structured card marker exists and is never set** | `TransactionTypeEnum` includes `CARD_PAYMENT`, but Plaid writes `type: isDebit ? PAYMENT : DEPOSIT` (`plaid.service.ts:1650`) — **on the very same row where it extracted a card last-four 15 lines later** | card spend is **not selectable by `type`**, and `transaction_scheme_enum` has no card member either. Any "card transactions" control point reads green **vacuously**. Query gotcha: enum values are prose — filter on `"Credit/debit card transactions"`, not `"CARD_PAYMENT"` |
| **`category_key` does not reference the `categories` root** | `categories` has only `name` + `category_type` and no `key` column. The transaction taxonomy is a **code-side catalog** — 47 keys in `transaction-category.const.ts`, `TAXONOMY_VERSION = 1` | "dangling category" is a **set-membership check against the 47 shipped keys**, not a join. A chart joining `category_key → categories.name` returns **empty, not wrong-but-plausible** |

#### Where duplicates actually live

`idx_transactions_connector_external_id_unique` is **partial**: it covers
`(workspace_pk, source_workspace_connector_pk, transaction_external_id)` only
`WHERE deleted_at IS NULL AND transaction_external_id IS NOT NULL AND TRIM(...) <> '' AND
source_workspace_connector_pk IS NOT NULL`.

So a collision **within** those predicates is structurally impossible — if the sweep finds one,
the index is missing. **The duplicate risk surface is the rows the index does not reach:** null or
blank `transaction_external_id`, or null `source_workspace_connector_pk`. Report *that* count, not
the structurally-zero collision count. And cross-connector id reuse is classified `review`, not
`duplicate` — never auto-merge it.

#### The hard blocker for burn and runway

`flow_kind` (`supplier_payment | customer_receipt | same_entity_transfer |
intercompany_transfer | payroll | tax | bank_fee | standalone_bank_line | unknown`) is the **only
structured direction signal**. When transfers are not discriminable, moving €100k from current to
savings reads as **€100k of burn AND €100k of inflow**. Runway does not get slightly worse — **it
can invert sign**: a treasury sweep reads as catastrophic burn, an intercompany top-up reads as
revenue and runway prints as infinite. This alone must **hard-block** the render.
`services/canvas/_transfer-discriminator.ts` already handles it at query layer, so the failure
mode is any chart built **outside** that service.

Related: `accounts.ownership` defaults to `UNKNOWN` on historical rows. A both-sides-`OWN` or
neither-side-`OWN` check **passes vacuously** while `UNKNOWN` dominates — so gate the direction
check behind an ownership-classified check, or it is a false green.

#### FR e-invoicing — not implemented; build on the FEC instead

There is **no e-invoicing issuance, validation, or reporting module** in the repo. `Factur-X` is a
connector catalog slug, not a format. `DocumentTypeCodeEnum` is genuine UNTDID 1001 (380/381/383,
plus `SELF_BILLING_INVOICE = "389"`), and that is the only real EN16931 artifact.

**The only FR legal required-field list the repo codifies is the FEC** — 18 mandatory columns per
BOI-CF-IOR-60-40-20 (`coa-export.serializer.ts:7-26`). Two of them are exactly the
company-completeness check requested, and they are **buildable today with no new columns**:

- `CompAuxNum` ← `journal_entry_lines.auxiliary_account.account_number`
- `CompAuxLib` ← `journal_entry_lines.auxiliary_account.name`, falling back to
  `journal_entry_lines.company.name`

Both are written with `?? ""`, so **the serializer silently ships FEC rows with empty
counterparty identity** — a real, currently-unguarded control point. Six further FEC columns are
**hard-coded empty** (`EcritureLet`, `DateLet`, `ValidDate`, `Montantdevise`, `Idevise`) even
though the file's own comment says FEC requires the foreign amount alongside the currency.

**The structural hazard for any FR control point:** a SIREN can legitimately live in
`companies.tax_id_value` (with `tax_id_type = SIREN`) **or** in `companies.registered_value`
(with `registry_country = FR`). No functional dependency pins it to one attribute, so **no single
predicate can express "this company has a SIREN"** — every check must be a disjunction over both
columns until the model designates a canonical home. Also: **no checksum validation exists
anywhere** (SIREN/SIRET Luhn, TVA mod-97), so a structurally-valid-but-fake `123456789` passes
everything.

Unbuildable FR requirements (no field exists): party electronic routing address (PPF/PDP),
ISO 6523 scheme id for the party legal id, SIRET establishment number as its own attribute,
invoice-level VAT breakdown rows (BG-23 — **the extractor already produces the right shape and it
is discarded**), VAT exemption reason, share capital, preceding-invoice reference for credit
notes, and e-reporting transmission status. NAF/APE is **fetched from
`recherche-entreprises` and thrown away** — the cheapest gap to close.

#### Workspace currency and fiscal period — read-surface gap, not a schema gap

`workspaces` has exactly 14 fields and **none of them is an accounting currency, a legal form, or
a fiscal-period boundary.** So:

- `BANK-fx-attached` cannot be evaluated as specified — "non-local currency" has **no local
  currency to compare against** — unless the value lives in `workspaces.object` (jsonb).
- Any fiscal-period-bounded chart has **no statutory period to bound it to**. A legal-form →
  fiscal-year mapping needs `companies.business_type`, which in turn needs the own-company link
  that also does not exist.

Both are recorded as schema gaps rather than guessed. **Do not infer the workspace currency from
the most common transaction currency** — that is exactly the guessing the repo standard forbids,
and it would flip as soon as one large foreign payment lands.

## SECOND FAMILY — bookkeeping proof-of-payment chain (`BOOK-`)

Runs after `BANK-`. Once a transaction is categorized it must carry a **proof of payment** —
normally an invoice — with the document attached, both counterparties identified, at least one of
them matching the transaction's own counterparty, e-invoicing-valid line items with VAT and FX,
and any banking details on the invoice linked to a real account or payment means.

### The governing principle: absence ≠ decision

**"No invoice found yet" and "no invoice is required" must never look identical in the data.**
Today they do — and that is the single most important gap in this family. A `not_required` /
`lost` disposition belongs **on the link between invoice and payment**, so that a swept, decided
transaction is distinguishable from an unswept one. See § the disposition gap below.

### Live audit — all 3 workspaces, probed 2026-07-29

| what | measured | verdict |
|---|---|---|
| invoices, total | **1,517** | baseline |
| invoices with **no document attached** (`document_pk IS NULL`) | **1,304 = 86.0%** | 🔴 the audit-evidence leg is essentially absent |
| `invoice_transactions` proof links, total | **252** | — |
| transactions with a proof link | **252 of 1,904 ≈ 13.2%** | 🔴 87% of cash movement has no proof and no disposition |
| edges by `match_method` | **100% `llm_matched`** | 🔴 no human-confirmed match exists |
| edges by `edge_status` | **100% `confirmed`** | 🔴 see below — `confirmed` does not mean reviewed |
| edges by `allocation_type` / `is_partial` | **100% `full` / `false`** | 🟡 partial payments either don't occur or aren't modelled in practice |
| edge `confidence` range | **0.85 – 1.0** | 🟡 nothing below 0.85 is being written |

**The `confirmed` trap.** Every one of the 252 edges is `edge_status: confirmed` **and**
`match_method: llm_matched`. So `confirmed` here means *the LLM was confident*, **not** *a human
verified it*. Any control point that treats `confirmed` as reviewed — including the
`RECON-provisional-match-backlog` check earlier in this file — reads **green while 100% of
reconciliation rests on unreviewed model output.** The sweep must therefore report
`confirmed AND llm_matched AND no human actor` as its own amber class, and the model needs a
distinct human-confirmation marker (see § Known limits — there is no audit-trail root).

### Corrections to this family

**My disposition proposal was wrong about WHERE.** I said the disposition belongs "on the link
between invoice and payment". It cannot: **`invoice_transactions.invoice_pk` is NOT NULL**, so a
row cannot exist to say *there is no invoice* — you would need a sentinel invoice, which is the
null-object anti-pattern and would corrupt every `invoices` aggregate and the AR/AP posting path.

The obligation to hold proof belongs to the **transaction**; the link is the *satisfaction* of
that obligation. So `proof_status` goes on `transactions`, and `invoice_transactions` stays purely
positive evidence — mirroring the `category_*` provenance pattern already on that entity
(`category_source` / `category_status` / `category_confidence`), so reviewers know the shape and
the CHECK-constraint precedent exists.

**`documents` CAN prove file integrity — my "pending schema read" resolves to buildable.**
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

**Refining the `confirmed` trap.** `edge_status` is `confirmed | provisional` and **defaults to
`confirmed`** — and `provisional` is documented as the 0.55–0.85 review tier that is *"filtered
out of downstream pipes until a human confirms"*. So my "100% confirmed" finding is sharper than
I stated: the review tier **is never being used**. Likewise `match_method` includes
**`human_approved`** as a value, and **zero rows carry it**. Proof-of-payment is a downstream
pipe, so the correct floor is not a new confidence number — it is honouring the existing contract:
only `edge_status = 'confirmed'` counts as proof, and a `provisional` edge must never satisfy it.

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
checks ARE expressible (this corrects an earlier reviewer who reported no per-edge amount).

#### Proof of payment

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BOOK-txn-has-proof` | Categorized transaction has a proof link | `transactions` with `category_key` non-null and no `invoice_transactions` row | any past the grace window; **live ≈87% of transactions** | red |
| `BOOK-txn-proof-decided` | Undecided vs decided-no-invoice | disposition enum ≠ null | **UNBUILDABLE today — no field** | red (blocked) |
| `BOOK-proof-not-required-misuse` | `not_required` on a row that needs one | disposition `not_required` where `flow_kind`/`category_key` implies a supplier invoice | any | amber |
| `BOOK-proof-lost-trend` | `lost` share rising | disposition `lost` count, sweep over sweep | rising 3 sweeps running | amber |
| `BOOK-edge-not-human-confirmed` | Reconciliation is all model output | `edge_status: confirmed` **and** `match_method: llm_matched` with no human actor | **live 252/252** | amber |
| `BOOK-edge-confidence-floor` | Low-confidence matches surfaced | `confidence < 0.85` | any unreviewed | amber |
| `BOOK-edge-amount-agrees` | Edge amount matches the invoice | `allocation_type: full` and abs(`amount` − invoice `grand_total`) > tolerance §14 | any | red |
| `BOOK-edge-overallocated` | Allocations exceed the invoice | sum of live edge `amount` per `invoice_pk` > `grand_total` + tolerance | any | red |
| `BOOK-edge-currency-consistent` | Cross-currency edge has a rate | edge `currency` ≠ invoice `local_currency` and `exchange_rate_pk IS NULL` | any | red |
| `BOOK-edge-dangling` | Edge points at a dead row | `invoice_pk` or `transaction_pk` resolving to absent/soft-deleted | any | red |

#### Company identity across the proof

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BOOK-invoice-both-parties` | Issuer and receiver both identified | `invoices.issuer_pk` or `receiver_pk` null | any; **live: issuer null observed on a Pennylane invoice** | red |
| `BOOK-party-matches-txn-counterparty` | One invoice side IS the transaction's counterparty | resolve txn counterparty via `debtor_/creditor_payment_means` → `payment_means.company_pk`; assert it equals `issuer_pk` **or** `receiver_pk` | neither side matches | red |
| `BOOK-party-match-unverifiable` | Counterparty unresolvable, so the above can't run | txn counterparty null → check is INCONCLUSIVE, never pass | any | red |

#### Document attachment

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `BOOK-invoice-has-document` | Document attached | `invoices.document_pk IS NULL` | **live 1,304/1,517 = 86%** | red |
| `BOOK-document-resolves` | Not a phantom attachment | `document_pk` non-null resolving to absent/soft-deleted | any | red |
| `BOOK-document-has-content` | File is real, not a 0-byte placeholder | needs a size/checksum/mime field on `documents`/`media` | **pending schema read** | red |
| `BOOK-document-right-kind` | Mime is a document kind that can be a receipt | **typed exact-match allow-list of mime types — never a substring test on a filename** | any outside the list | amber |
| `BOOK-document-tenancy` | Document belongs to this workspace | document's workspace ≠ invoice's workspace | any | red |

#### Invoice banking details — the chain, and where it breaks (`IPAY-`)

**Definitive:** `invoices` has **zero banking columns** (only `payment_status` and
`last_payment_allocation_date`). `invoice_payment_means` is a **pure join table with no banking
identifier at all** — 10 columns: `pk, id, invoice_pk, payment_means_pk, amount, payment_date,
payment_type, created_at, updated_at, deleted_at`. So an invoice's banking detail is **either**
normalized down a 3-hop chain **or unrecoverable from the relational model** (surviving only inside
the source document blob):

`invoices.pk → invoice_payment_means.invoice_pk → .payment_means_pk → payment_means.account_pk →
accounts.{iban, bic, account_number, routing_number, sort_code}`, with card and cheque branches via
`payment_means.card_pk` / `.check_pk`.

**Prod-wide measurements** (whole DB, not my 3-workspace scope):

| what | measured | verdict |
|---|---|---|
| invoices with ≥1 `invoice_payment_means` row | **851 of 33,753 = 2.52%** | 🔴 97.5% must be keyed by hand |
| `payment_means` with **no account, no card, no check** | **7,809 of 8,653 = 90.2%** | 🔴 an instrument-less husk expresses nothing payable — it is a name |
| `invoice_payment_means` with `payment_means_pk` NULL | **103 = 8.9%** | 🔴 a row asserting payment means that names none |
| `invoice_payment_means.payment_type` NULL | **1,159 of 1,159 = 100%** | 🔴 free-text `varchar(50)` — while the correct enum already exists (below) |
| transactions with an IBAN-shaped token in `remittance` | **3,108 = 12.5% of 24,925** | — |
| distinct (workspace, IBAN) pairs in labels **matching no `accounts.iban`** | **888 of 902 = 98.4%** | 🔴 effectively zero extraction |
| accounts with neither IBAN nor account_number | **239 of 403 = 59.3%** | 🔴 unlinkable by any strong key |
| same IBAN on accounts in **>1 workspace** | **9 distinct IBANs** | 🟠 tenancy smell — unambiguous defect only when both sides claim `workspace` ownership |
| same IBAN duplicated **within** one workspace | **3** | 🔴 the account dedup rule was meant to eliminate these |

**Three structural defects behind those numbers:**

1. **`payment_means_type_enum` exists in the DB and is orphaned** — created by two migrations
   (`'iban','local','card','digital_wallet','cash','check','crypto','other'`) and **used by no
   column anywhere**. Instrument kind is instead inferred from which FK is non-null, and
   `invoice_payment_means.payment_type` is untyped free text. A typed enum sitting unused next to a
   free-text column is a direct violation of the structured-data standard.
2. **Ownership is asserted, never derived.** `invoice-payment-means.service.ts` hardcodes
   `ownership: COUNTERPARTY` on **every** account it creates, with no evidence test. Pay the
   workspace's own IBAN instead of the supplier's and the money never leaves; pay a supplier IBAN
   mislabelled `workspace` and a reconciliation rule may auto-net it as an internal transfer.
   Ownership should be **derived from provenance** (`source_workspace_connector_pk` non-null ⇒ the
   workspace's own bank feed ⇒ `WORKSPACE`).
3. **No IBAN checksum validator exists anywhere** — zero hits for `mod97` / `validateIban` /
   `isValidIban`. Only two *shape* regexes, and **they contradict each other**: the DB CHECK
   (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$`) vs `VALIDATION_PATTERNS.IBAN`
   (`^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$`), so a value can pass one and fail the
   other. ISO 7064 mod-97-10 is a 12-line function; without it a single transposed digit becomes a
   permanent, silently-wrong **natural key** (`AccountRepository.findByNaturalKey` treats IBAN as
   the durable key) and a misdirected payment.

**The linkage identity key, ranked — with explicit refusals.** Rank 1: checksum-valid
`upper(trim(iban))` + `workspace_pk` → auto-link (an *unvalidated* IBAN is not a rank-1 key, it is a
rank-1-shaped string). Rank 2: `account_number` + `bic` / `routing_number` / `sort_code`, all exact
→ auto-link. Rank 3: bare `account_number`, or a checksum-**failed** IBAN → **flag, do not link**.
Rank 4: `cards.last_four_digits` + `expiration_date` + `brand`, only within one holder scope and
only when exactly one candidate. Rank 5: `checks.cmc7` → auto-link. **Rank 6: name similarity →
REFUSE to auto-link**, advisory hint to a human only, weight 0.0 — per the structured-data mandate.

**Four hard stops where the sweep must refuse rather than guess:** no checksum-valid IBAN and no
(number + bic/routing/sort) pair (the 239 identifier-less accounts); an ownership conflict with the
payment direction (**misdirected payment is worse than an unlinked field**); any cross-workspace
candidate, even on exact IBAN match; and multiple checksum-valid candidates in scope (the 3
within-workspace duplicates prove rank-1 is not single-valued — dedupe first, then link).

**Highest-leverage single fix in this whole family:** extract IBANs from
`transactions.remittance` and resolve them through the existing
`PaymentMeansRepository.findByAccountIban`. **888 unmatched (workspace, IBAN) pairs are 888
counterparties resolvable with a rank-1 key already sitting in the database.**

#### Document attachment (`DOC-`) — and a tenancy landmine

`documents` has 20 columns, all MCP-readable (Hasura `columns: '*'`), and user-updatable columns
are **only `filename` and `document_type`** — so `size` and `content_checksum` **cannot be faked
by a user**. `processing_status` enum: `pending | extracting | categorized | extracted | skipped |
failed | rejected`.

**Retrievability, answered precisely: "content recorded" ≠ "content retrievable."** `size` (NOT
NULL) and `content_checksum` make a 0-byte phantom mechanically detectable. But `bucket` and `path`
are **unvalidated strings** — nothing in the data layer asserts the GCS object still exists, and
`composite_file_preview_url` is a client-side deep link, not proof of bytes. **A green `size > 0`
must be reported as "file recorded", never "file retrievable."** Byte-level existence needs a
storage-side HEAD sweep outside the MCP.

**🔴 SECURITY, not hygiene: the `invoices` RLS filter is an `_or`.** A row is visible when
`workspace.workspace_id` matches **OR `document.workspace.workspace_id` matches**. So an invoice
owned by workspace B whose document belongs to workspace A **is readable from A**. A
cross-workspace attachment does not merely mislabel evidence — **it widens the read surface**. This
makes the cross-workspace-attachment check a security control that must run in *every* workspace,
not only the one under audit.

| id | name | check | sev |
|---|---|---|---|
| `DOC-02` | **False green** — `document_pk` resolves to nothing | `{"_and":[{"document_pk":{"_is_null":false}},{"_not":{"document":{}}}]}` — the relation inherits the `deleted_at IS NULL` + workspace filter, so a soft-deleted or out-of-scope document returns `document: null` while the FK stays populated | red |
| `DOC-03` | No recorded content | `size < 1024` red; `1024–5120` amber; `content_checksum IS NULL` while `processing_status = extracted` red (the hasher only writes after reading bytes) | red |
| `DOC-04` | MIME cannot be evidence | `type _nin` the typed allow-list, derived from the **existing** `ACCEPTED_DOCUMENT_FORMATS` const — do not invent a second list. `application/octet-stream` is its own finding (the magic-byte middleware should have rewritten it). **Never `_like` on `filename`** — filename is user-updatable, `type` is not | red |
| `DOC-05` | Attached but invoice not extracted from it | `document.processing_status _in [pending, extracting, failed, rejected, skipped]` — split the report: `failed`/`rejected` = unreadable file, the invoice data came from elsewhere (a decorative attachment) | red |
| `DOC-06` | Document type contradicts invoice type | `invoices.document_type_code` ≠ `invoices.document.document_type`, both non-null | amber |
| `DOC-07` | **Cross-workspace attachment** | `{"_not":{"document":{"workspace":{"workspace_id":{"_eq":"<ws>"}}}}}` with `document_pk` non-null | **red — security** |
| `DOC-08` | **Orphan document** — a receipt Well holds, linked to nothing | `_not: {invoices:{}}` AND `_not: {transaction_documents:{}}` AND receipt-capable MIME AND `size > 1024`. Partition by `processing_status`: **`extracted` is the worst** — the pipeline read it and still linked nothing (linker defect) | red |
| `DOC-10` | One document, many invoices | fan-out read off row shape. **Legitimate**: one issuer, one period, distinct numbers (a consolidated statement). **Suspicious**: 2+ distinct issuers (a document cannot evidence two suppliers), or two children sharing issuer+date+total (a duplicate invoice the dedup missed) | red when suspicious |

**The two-direction bound — the formula, and the reporting rule.** Over one period and workspace:

```
A  = invoices with document_pk IS NULL                    (what we report today)
B  = DOC-02 + DOC-03 + DOC-04, deduped by invoice         (the FALSE GREENS)
C  = orphan receipt-capable documents  ·  C* = subset with processing_status = extracted

true_missing_evidence = A + B                    ← not A
recoverable_in_house  = min(A + B, C*)           ← fix the linker
genuinely_absent      = (A + B) − recoverable    ← chase the supplier
```

`A` alone **undercounts by B and mis-attributes blame**: a gap whose file is already in the bucket
is a Well linking defect, yet `A` reports it to the customer as "your supplier never sent a
receipt". `C` alone overstates it (a workspace can hold 500 orphan PDFs and have zero real gaps).
**Reporting rule: never publish `A` without `B` and `C` alongside.** And `C* > 0` while `A > 0` in
the same workspace is *positive proof of a linker defect* — which neither number establishes alone.

**Tolerances:** 3 business days grace after `issue_date` before an unattached invoice counts
(suppress `DOC-01/05/08` inside it; **never** suppress `DOC-02/03/04/07` — those are structural and
time-independent). **Card/expense receipts: 5 calendar days and HIGH from the first occurrence above
the FR simplified-invoice VAT threshold (€25)** — stricter because on card spend the receipt is the
*only* evidence and without it the VAT is not deductible. Supplier invoices settled by transfer: 10
days, amber (the document normally arrives *before* payment, and the transfer leaves an independent
trail). Period share: amber above **2%**, red above **10%**, computed on **`(A+B)/N`, never `A/N`` —
an auditor pulling a 25-item sample hits a defect with ~40% probability at 2% and ~93% at 10%.

**Do NOT count orphan `media` in the attachment error rate** — `media_type` is `avatar|logo|banner`,
so an orphan medium is stale branding debt, not a lost receipt. Including it inflates the
bookkeeping defect count.

**Unreachable, and it is the strongest check that exists:** `document_extractions` and
`document_structured_extractions` carry `invoice_mapped_json`, `evidence_checksum`,
`source_checksum`, `page_count`, `prompt_version`, `quality_flags` — **provenance proving the
invoice fields were derived from *these* bytes.** Neither table is Hasura-tracked nor a read root,
so provenance is invisible to the sweep. Tracking them is the single highest-leverage addition.

#### E-invoicing, line items, VAT, FX (`EINV-`)

**16 of 20 controls are buildable today. The 4 that are not are exactly the four a French tax audit
asks about first:** per-rate taxable base, exemption reason, reverse-charge mention, and
preceding-invoice reference.

**🔴 The control to build first: `applied_tax_rate_pk` is a denormalized copy of a jsonb key, and
the posting path reads the jsonb.** There are **three** competing per-line VAT-rate
representations: `invoice_items.tax_rate` (bare decimal), `applied_tax_rate_pk` (FK to
`tax_rates`), and `accounting_classification->'taxResolution'->>'taxRatePk'` (jsonb). The journal
builder trusts **the jsonb**; the FK is stamped from the same value at persist time by two separate
writers with **no constraint keeping them equal**. Any writer touching the jsonb without
re-stamping the FK desynchronizes them and **no reader would notice**. `EINV-09`
(`applied_tax_rate_pk ≠ jsonb taxRatePk`) is the only control that can detect the schema silently
lying to the posting path.

**Other findings that change control design:**

- **`invoices.shadow_from_receipt` exists** (bool, default false) — a row synthesized from a payment
  receipt rather than a real bill. **A shadow invoice is not a legal invoice and must never be
  declared** (`EINV-18`). Cheap and important; I had missed this field entirely.
- **`extract.service.ts:1021-1033` silently overwrites `items_total = grand_total − tax_total` on
  mismatch.** The repair **destroys the evidence** the header-arithmetic control needs — so that
  control must record the *pre-repair* delta, or it is permanently green over a self-healed lie.
- **Per-line FX is modelled and dead.** `invoice_items.accounting_unit_price` and
  `accounting_line_total` exist and **have no writer anywhere** — always NULL. That is *worse than
  unrepresentable*, because a reader can reasonably read NULL as "same currency". Conversion is
  header-only (three totals + `accounting_currency` + rate).
- **A latent type bug in any naive control**: the three `accounting_*` totals are typed `string` in
  the entity while `grand_total`/`items_total`/`tax_total` are typed `number`. Same DB type,
  different TS type — an implicit comparison compares `"1234.00"` to `1234` **as strings**.
- **`invoice_number` is nullable and its index is NON-unique**, despite a comment claiming an
  import-time uniqueness check. There is **no invoice-number allocator at all** — while a proven
  gapless one exists for journal entries (`LegalSequenceCounter` + row-locked `allocateNext`, so a
  rollback never burns a number). **Directly reusable; cheapest high-value fix on the list.**
- **`invoice_items` has NO `workspace_pk`** — tenant scope is reachable only by joining `invoices`.
  Every EINV control must carry that join or **it leaks across workspaces**. Add the denormalized
  column *before* building the suite, not after.
- `issue_date` is a `timestamp`, not a `date` — a tax point is a calendar date, so this invites TZ
  drift at period boundaries. And `reference_number` is **semantically overloaded**: the extractor
  writes the *invoice number* there, not the buyer reference (two different BTs in one column).
- Rounding tolerance: **`max(0.01 × n_lines, 0.02)`, capped at 0.05** — each line contributes at
  most a half-cent. **Do not reuse** the existing `invoice_status_tolerance_abs = 0.50`; that band
  is for payment matching and is far too loose for VAT.
- Credit notes (381) are stored with **positive** amounts, reversal expressed by *routing* not sign
  — so a negative 381 is a **double negation**, and a negative 380 is an invoice masquerading as a
  credit note. Both are checkable.
- `tax_rates` is uniquely keyed on `(workspace, name)`, **not** on `(workspace, rate, country,
  effective_from)` — so two rows can carry FR 20% with different ledger accounts and **nothing picks
  a winner**. Nothing in the codebase filters on `effective_from`/`effective_to`/`is_active`, so
  expect real hits on the out-of-period-rate control.

**The worst gap on the whole list — no supply/delivery/performance date.** Only `issue_date` and
`due_date` exist. FR requires the delivery or completion date whenever it differs from the issue
date, **and it is the VAT tax point that decides which declaration period the operation falls in**.
`invoice_items.period_start/end` is a service period, per-line and nullable — not a delivery date.
**Consequence: Well cannot place a VAT operation in the correct declaration period from invoice data
alone.**

**Self-invoicing (autofacturation) — the structural blocker.** `document_type_code = 389` exists and
**nothing branches on it** beyond generic routing. Well has exactly two party slots, `issuer_pk` and
`receiver_pk`, and **no third role for "issued by B in the name of A"** (EN16931 BG-10/BG-11, the FR
*mandataire*). No mandate entity, no mandate reference. And because sale-vs-purchase polarity is
derived by comparing issuer/receiver to the own company, **a self-billed purchase will be read as a
sale** unless 389 is special-cased — untested today. The payment leg of e-reporting is closer to
buildable (`payment_status`, `paid_amount`, `last_payment_allocation_date`, the
`invoice_transactions` link), but note `last_payment_allocation_date` is an *allocation* timestamp,
a proxy for the encaissement date, not the date itself.

**Recommended fix order** (from the reviewer, and I agree): per-rate breakdown table → exemption
reason + reverse-charge mention (both cheap columns) → supply date → invoice-number allocator →
preceding-invoice reference.

These are being specified by dedicated reviewers (FR company-level field set, invoice + line-item
rules incl. self-invoicing/autofacturation, and invoice→account/payment-means linkage). Their
tables land here under `EINV-`, `IPAY-`, and the FR company requirements. Confirmed so far:
`invoices` carries `local_currency` / `accounting_currency` / `exchange_rate_pk` and the
`accounting_*` triplet, so **header-level FX is modelled** — whether **per-line** VAT and FX are
representable depends on the `invoice_items` and `tax_rates` field lists, which are still being
read. **`[TO COMPLETE]`**

## When to use this skill

- "Run the daily sweep." / "Is our Well data complete?"
- "Can I trust the numbers today?" / "Data health check."
- "What's missing in Well?" / "Anything broken in our workspace?"
- Automatically, once per day, as the scheduled sweep.
- **As a pre-flight before any high-stakes use of another Well skill** — before a board
  number, an investor update, or a filing, run this first and state its verdict alongside.

## When not to use this skill

- The user wants an actual financial answer (cash, runway, expenses, receivables) — use the
  dedicated skill (`cash-position`, `runway-calculator`, `expense-breakdown`, …). This skill
  reports on *data trustworthiness*, never on the financials themselves. It must not
  volunteer a cash figure.
- The user wants to fix the data — this skill **diagnoses and points**, it does not mutate.
  Route repairs to the owning surface (reconnect a connector, re-run a sync, categorize in
  the app). The one exception is a read-only re-verification if such a tool exists.
- No Well MCP connection is available and the user does not want to set one up — say so
  plainly; a sweep over nothing is not a passing sweep.
- The user asks about a single record ("what happened with this payment?") — that's
  `payment-invoice-lookup`.

## Inputs

The user may provide:

- **Workspace scope** — one workspace, or the parent + all children. Default: every
  authorized workspace, reported separately, since a per-workspace verdict is the useful
  unit. Never silently merge workspaces into one verdict.
- **Lookback window** — how far back coverage checks look. Default: trailing 3 full months
  (matching `cash-balance-trend`'s default), plus a 24h freshness window for sync checks.
- **Severity floor** — report everything (default), or red-only for a terse daily ping.
- **Control-point subset** — e.g. only the ingestion family, for a targeted re-check.

## Tooling

Runs entirely over Well's MCP server (`https://api.wellapp.ai/v1/mcp`, streamable HTTP). If
no `well_*` tool is present, the host has not added the server — tell the user to add it at
that URL and stop; do not report a passing sweep. Required:

- `well_list_workspaces` — enumerate every authorized workspace; the sweep is per-workspace.
- `well_get_schema` — **call before querying any root for the first time in a session.**
  Field names, enums, and semantics are workspace/connector-dependent. The schema also
  returns each field's `enrichment` provenance (`Bank sync`, `AI extraction`, `Derived`,
  `System generated`, `Manual`) — a control point should state which provenance it is
  auditing, because an `AI extraction` null and a `Bank sync` null are different defects.
- `well_query_records` — every control point below is a query against one of the 33 roots.
- `well_list_connectors` — resolve `install_url` for anything that should be connected but
  isn't (this is how an EXHAUSTIVE failure becomes a one-click fix).
- `well_list_connector_tools` / `well_invoke_connector_tool` — only to read live provider
  state when Well's copy is suspected stale. Never to mutate.

## Workflow

1. **Confirm the MCP server is present.** No `well_*` tools → tell the user the endpoint and
   stop. A sweep that could not run is a FAILED sweep, never a passing one.
2. **Enumerate workspaces** via `well_list_workspaces`. Run every subsequent step per
   workspace and label every finding with its workspace. Note parent/child relationships —
   a child workspace's gap is the parent's gap when consolidating.
3. **Schema pass.** `well_get_schema(root)` for each root a selected control point touches.
   If an expected field is absent, mark that control point **INCONCLUSIVE**, not PASS. This
   is the single most important rule in this skill: *absence of a check is not a pass.*
4. **Run the EXHAUSTIVE family first.** Breadth failures invalidate depth findings — there is
   no point verifying the balances of two accounts when a third was never connected. If any
   red exhaustiveness control point fails, every downstream completeness result must be
   labelled "scoped to the sources that were connected".
5. **Run the COMPLETE family.** Collect per-control-point: verdict (`pass` / `fail` /
   `inconclusive`), count of offending records, up to 5 example record ids, and the
   `records_url` deep link when the query returns one.
6. **Apply the tolerance rules** (§ Tolerances) before declaring any failure. A sweep that
   cries wolf gets ignored, which is worse than no sweep.
7. **Diff against yesterday's sweep if available.** New failures rank above persistent ones;
   a control point that flipped from pass to fail in 24h is the headline.
8. **Report** per § Output requirements. Then verify against § Quality checks.

## Control points — COMPLETE (depth)

Grounded in the live schema. `→` names the skill(s) that break or lie if the check fails.

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `CMP-balance-verified` | Balance snapshots pass verification | `account_balances` where `verification_error _eq true`; also `verified_at _is_null` | any row | red | cash-position, cash-balance-trend, runway-calculator, fx-exposure |
| `CMP-balance-diff-match` | Calculated vs bank-reported diff agree | `account_balances.calculated_balance_diff` vs `.expected_balance_diff` | any material delta | red | cash-position, cash-balance-trend |
| `CMP-balance-verify-fresh` | Verification actually ran recently | `account_balances.verification_last_run_at` older than the lookback | stale/never | amber | all cash skills |
| `CMP-txn-categorized` | Transactions carry a category | `transactions` where `category_key _is_null`, split by `category_status` (`classifier_failed` / `classifier_abstained` / `null` = never attempted) | any row; treat the three statuses as distinct defects | red | expense-breakdown, runway-calculator |
| `CMP-txn-category-confidence` | Categories are confident enough | `transactions.category_confidence` below threshold `[TO COMPLETE: set threshold]` | below floor | amber | expense-breakdown |
| `CMP-txn-booking-date` | Transactions have a booking date | `transactions` where `booking_date _is_null` | any row | red | cash-balance-trend (window bucketing), bills-due |
| `CMP-invoice-core-fields` | Invoices have the fields skills read | `invoices` where any of `grand_total` / `local_currency` / `issue_date` / `due_date` `_is_null` | any row | red | accounts-receivable-aging, bills-due, rank-clients-by-ltv |
| `CMP-invoice-counterparty` | Invoices resolve to a company | `invoices` where `issuer_pk _is_null` or `receiver_pk _is_null` | any row | red | company-profile, rank-clients-by-ltv, accounts-receivable-aging |
| `CMP-invoice-items-sum` | Line items reconcile to totals | `invoices.items_total` + `.tax_total` vs `.grand_total`; `invoice_items` present | mismatch | red | expense-breakdown, missing-receipts |
| `CMP-invoice-paid-consistent` | Paid amount and status agree | `invoices.paid_amount` / `.balance_due` / `.payment_status` / `.status` mutually consistent | contradiction | red | accounts-receivable-aging, bills-due |
| `CMP-fx-rate-present` | Converted amounts have a rate | `invoices` where `local_currency` ≠ `accounting_currency` and `exchange_rate_pk _is_null` | any row | red | fx-exposure, cash-position (consolidated) |
| `CMP-receipt-attached` | Expenses have a source document | `invoices.document_pk _is_null` / no `media` | any row | amber | missing-receipts |
| `CMP-sync-no-error` | Last sync per connector succeeded | `workspace_connector_sync_logs` latest per `workspace_connector_pk`: `status`, `error _is_null`, `completed_at` | failed or never completed | red | every skill reading that source |
| `CMP-sync-fresh` | Last successful sync within 24h | `workspace_connector_sync_logs.completed_at` vs now | older than window | amber | all |
| `CMP-sync-not-hung` | No sync stuck in progress | `status _eq in_progress` with old `started_at` / large `duration_ms` | hung run | amber | all — results are partial while true |
| `CMP-account-has-currency` | Every account states its currency | `accounts` where `currency _is_null` (seen live with `type _eq other`) | any row | red | cash-position, cash-balance-trend, fx-exposure — a currency-less balance cannot be summed or converted |
| `CMP-account-owns-connector` | Accounts link to their connector | `accounts.workspace_connector_pk _is_null` | any row | amber | ingestion attribution; "which bank is this?" is unanswerable |

### The one that matters most today: duplicate ingestion

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `CMP-account-not-duplicated` | One real account, one row | group `accounts` by (`account_name`, `currency`, `iban`/`account_number`, source connector); also compare `created_at` spacing for a regular cadence | more than one live row per real account, **especially one per sync interval** | **red — highest severity in this skill** | cash-position, cash-balance-trend, runway-calculator, fx-exposure — every one of them **multiplies cash by the duplicate factor** |
| `CMP-account-not-cross-connector-dup` | Same account not ingested twice via two connectors | same real account reachable from two different `workspace_connectors` (e.g. a direct provider connector AND an aggregator) | duplicate pair | red | all cash skills — double-counted balance |

This is not hypothetical. See § Provenance: **24 duplicate rows of a single bank account are
live in production right now**, created on an hourly cadence. Any cash figure summing
`accounts` today is overstated by roughly that factor. This control point exists because the
sweep's job is to catch exactly this before a human quotes the number.

### Counting primitive — read this before implementing any control point

`well_query_records` has **no aggregation** — no `group by`, `count(distinct)`, `min`, `max`.
Therefore:

- **A "count"** means `well_query_records({ root, fields:[…], limit:1, whereClause })` and
  reading the returned **`totalCount`**.
- **An extremum** means `orderBy <field> <dir>, limit 1`.
- **Every duplicate, continuity, and share check** requires paging the full set client-side via
  `nextCursor` against a **500-row page cap**. These are the expensive checks — scope them to
  a trailing window, and `log` what was skipped rather than silently truncating.
- The sweep **cannot distinguish "fetched every page" from "stopped early"** — pagination state
  is not persisted to any queryable root. State the pages actually read.

### Grounded status vocabularies

Never treat "not enabled" as a binary — both intermediate states are live in production.

- `workspace_connector_sync_logs.status` = `scheduled | in_progress | success | error`
- `workspace_connectors.status` = `enabled | disabled | to_configure | processing | error |
  need_reconnect | suspended | degraded`

## Control points — INGESTION / SYNC (`ING-`)

Contributed by the ingestion-domain review. These sit *upstream* of the tables above: if an
`ING-` red fails, treat the corresponding `CMP-`/`EXH-` results as scoped, not clean.

### `ING-` COMPLETE (depth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `ING-connector-never-synced` | Enabled connector, no successful sync | per enabled connector, `workspace_connector_sync_logs` where `workspace_connector_pk _eq <pk>` and `status _eq success` | `totalCount = 0` while `created_at _lt now-2h` | red | every skill treats `status: enabled` as data presence → cash-position totals a confident zero |
| `ING-sync-stale-no-recent-success` | No successful sync in 26h | `status _eq success`, `completed_at _gte now-26h`; plus `orderBy completed_at desc limit 1` for the true age | `totalCount = 0` and last success > 26h old | red | runway-calculator computes on last week's cash |
| `ING-sync-last-attempt-errored` | Latest attempt errored | latest log per connector: `status`, `error`, `completed_at`, `duration_ms` | latest `status _eq error` | red | connector still reads `enabled`, so cash-balance-trend trends a truncated series uncaveated |
| `ING-sync-stuck-in-progress` | Sync hung | `status _eq in_progress`, `started_at _lt now-2h`, `completed_at _is_null true` | any row | red | every answer becomes permanently "partial" or quietly wrong |
| `ING-sync-scheduled-never-dispatched` | Scheduled sync never started | `status _eq scheduled`, `created_at _lt now-1h`, `started_at _is_null true`; read `cloud_task_id`, `trigger_type` | any row | amber | Cloud-Task handshake dropped — freshness plateaus while **no error is ever recorded** |
| `ING-connector-needs-reconnect` | Credentials expired/revoked | `status _in [need_reconnect, error, suspended]` | any row | red | missing-receipts and payment-invoice-lookup return clean bills of health for periods never pulled |
| `ING-connector-degraded` | Connector degraded | `status _eq degraded`, read `installed_capabilities`, `updated_at` | any row | amber | `degraded` is neither enabled nor an error, so every skill's presence check **skips the connector entirely** and its records simply never appear |
| `ING-connector-stuck-provisioning` | Stalled mid-install | `status _in [to_configure, processing]` and `created_at _lt now-24h` | any row | amber | user believes it's connected; expense-breakdown silently falls back to invoice approximation |
| `ING-bank-connector-zero-accounts` | Bank connected, zero accounts | `accounts` filtered to that connector and `ownership _eq workspace` | `totalCount = 0` despite ≥1 `success` sync | red | cash-position totals nothing; runway has no numerator |
| `ING-account-zero-balance-rows` | Account with no snapshot | `account_balances` per workspace-owned account | `totalCount = 0` | red | account silently dropped from the total |
| `ING-account-no-open-balance-row` | Missing current-period row | `account_balances` where `balance_at_to _is_null true`, `orderBy balance_at_from desc` | none, while closed rows exist | red | cash-position needs the open row; else it reads a stale closed period as "current" |
| `ING-balance-verification-never-run` | Balances never verified | `verified_at _is_null true` (or `verification_last_run_at _is_null true`) and `created_at _lt now-48h` | any row | amber | **absence of `verification_error=true` is not evidence of correctness** — unverified and verified-clean are otherwise indistinguishable |
| `ING-balance-verification-stale` | Verification predates the data | compare `verification_last_run_at` to the newest `transactions.executed_at` for that balance | verification older | amber | a pass from two weeks ago says nothing about two weeks of rows since |
| `ING-balance-series-continuity-break` | Gap between adjacent periods | page per account `orderBy balance_at_from asc`; compare each `balance_at_to` to next `balance_at_from`, and `closing_booked` to next `opening_booked` | any mismatch | red | **`verification_error` validates *within* a period and cannot see a missing period *between* two clean ones** — exactly what cash-balance-trend reports as a real business trend |
| `ING-transaction-not-attached-to-balance` | Transactions orphaned from any period | `transactions` where `account_balance _is_null true` in-window | any row / rising share | amber | an orphaned txn is excluded from the diff, so the period verifies clean while the row is unaccounted for |
| `ING-transaction-booking-date-missing` | Booking date absent | `transactions` where `booking_date _is_null true` in-window, vs window total | share above provider baseline | amber | bucketing silently falls back to `executed_at`, so the same outflow lands in a different month than the ledger |
| `ING-duplicate-transaction-external-id` | Same source txn ingested twice | page `transaction_external_id`, `workspace_connector`, `executed_at`, `instructed_amount`; group on (connector, external_id) | any tuple > 1 with null `deleted_at` — a partial unique index exists, so a hit means it was bypassed or the id is null | red | double-counted outflow inflates burn → runway under-reported, category double-charged |
| `ING-duplicate-invoice-number` | Same invoice twice | page `invoice_number`, `grand_total`, `local_currency`, `issue_date`, `issuer.name`; group on (number, issuer) | count > 1 for non-null number | red | bills-due shows the bill twice; rank-clients-by-ltv inflates LTV |
| `ING-document-processing-stalled` | Extraction stuck or errored | `documents`: `processing_status`, `processing_stage`, `processing_error`, `uploaded_at _lt now-6h` | any non-terminal-success | amber | missing-receipts reports a *receipt* gap that is really an *extraction* gap → wrong remediation |
| `ING-fx-rate-missing-for-live-currency` | Live currency has no rate | distinct currencies from `accounts.currency`, `invoices.local_currency`, `transactions.instructed_amount.currency`; per non-home currency `exchange_rates` where `source_currency _eq <cur>`, `rate_date _gte now-7d` | `totalCount = 0` | red | fx-exposure must abandon; others blend or split silently |
| `ING-category-classifier-failures` | Classifier failed or abstained | `transactions.category_status _in [classifier_failed, classifier_abstained]` in-window, vs window total | `classifier_failed` > **2%**, or failed+abstained+null > **10%** | amber | reshapes which category ranks first; **failed is a pipeline defect, abstained is an honest refusal — different remediation, never one number** |
| `ING-category-low-confidence-share` | Weak-confidence categories | `category_confidence _lt 0.6` with `category_key` non-null, plus `category_source` distribution | rising share across sweeps | amber | these *look* categorized to expense-breakdown, which surfaces no confidence at all — the least visible category failure |

**`[TO COMPLETE]`** — additional completeness control points to be added by the team.

## Control points — EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `EXH-connector-configured` | No connector left unconfigured | `workspace_connectors.status` in (`to_configure`, `degraded`, anything ≠ `enabled`) | any row | red | every skill reading that source |
| `EXH-connector-never-synced` | Every enabled connector has synced once | enabled `workspace_connectors` with zero `workspace_connector_sync_logs` | any row | red | all |
| `EXH-recommended-connected` | Recommended sources are connected | `well_list_connectors` where `is_preselected` or high `match_score` and not `is_connected` | any row + `install_url` | amber | runway-calculator, cash-position (understated cash) |
| `EXH-bank-has-accounts` | Every bank connector yields accounts | enabled bank `workspace_connectors` with no `accounts` | any row | red | cash-position, cash-balance-trend |
| `EXH-account-has-balances` | Every account has balance history | `accounts` with zero `account_balances` rows | any row | red | cash-position, cash-balance-trend, runway-calculator |
| `EXH-balance-series-continuous` | No holes in the balance time series | per account, gaps in `account_balances.balance_at_to` across the window | any missing period | red | cash-balance-trend (a gap fakes a trend), runway-calculator |
| `EXH-balance-series-depth` | Enough history to trend at all | accounts with exactly one `account_balances` row | any row | amber | cash-balance-trend — must refuse, not infer direction |
| `EXH-txn-coverage-window` | Transactions span the whole window | earliest `transactions.booking_date` per account vs window start / account open date | truncated coverage | red | expense-breakdown, runway-calculator (burn understated) |
| `EXH-no-empty-entity-class` | No root a skill needs is empty | count per root: `invoices`, `transactions`, `accounts`, `companies`, `categories`, `exchange_rates`, `journal_entries` | zero where a connector should populate it | red | the skill(s) reading that root |
| `EXH-currency-rate-coverage` | Every live currency has a rate | distinct currencies in `accounts` / `invoices` vs `exchange_rates` | uncovered currency | red | fx-exposure, consolidated cash |
| `EXH-ledger-posted` | Accounting graph covers the period | periods with `transactions`/`invoices` but no `journal_entries` | unposted period | amber | any close/statement use |
| `EXH-recon-backlog-bounded` | Reconciliation backlog isn't growing | `transactions` with no `invoice_transactions` link, aged beyond tolerance | growing backlog | amber | payment-invoice-lookup |
| `EXH-workspace-covered` | Every workspace was actually swept | workspaces enumerated vs workspaces with results | any skipped | red | all — a skipped workspace must never read as clean |
| `EXH-no-duplicate-identity` | One counterparty, one company | `companies` sharing a normalized name / email / registration id | duplicate cluster | amber | rank-clients-by-ltv, company-profile (LTV split across duplicates) |

### `ING-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `ING-no-banking-source-installed` | No banking connector at all | `workspace_connectors.status _in [enabled, degraded]` joined to `connector.category_id` / `connector.data_domains`, cross-referenced against the `connectors` catalog | zero banking-domain connector | red | cash-position, cash-balance-trend, runway-calculator, fx-exposure all halt and present install links |
| `ING-no-invoicing-source-installed` | No invoicing/accounting connector | same shape, invoicing/accounting category | zero | red | **six of twelve skills** degrade to install prompts |
| `ING-data-domain-coverage-gap` | Installed set misses a domain | union of `connector.data_domains` vs the domains the 12 skills read (bank, invoicing, accounting/ledger, email/document) | any required domain absent | amber | expense-breakdown silently downgrades from ledger to invoice approximation |
| `ING-capability-surface-not-fully-granted` | Scopes narrower than provider surface | `installed_capabilities`: `available_tools` vs `unavailable_tools` / `granted_scopes` | `unavailable_tools` non-empty | amber | a whole record class is unreachable; payment-invoice-lookup finds no match for payments never fetchable |
| `ING-capability-snapshot-stale` | Capability snapshot predates syncs | `installed_capabilities.captured_at` vs latest `success.completed_at` | captured_at materially older | amber | advertises tools that now fail |
| `ING-single-balance-snapshot-only` | Only one balance point | `account_balances` per account | `totalCount = 1` for an account older than 48h | amber | cash-balance-trend must refuse; if it doesn't, it fabricates a direction from one snapshot |
| `ING-balance-period-cadence-gaps` | Missing days/months in series | page per account; derive modal period length, scan for longer intervals | interval > 1.5× modal, or fewer periods than the window implies | red | the stated window overstates real coverage |
| `ING-transaction-window-shorter-than-balance-window` | Txn history starts after balances | earliest `transactions.executed_at` vs earliest `account_balances.balance_at_from` per account | txn floor later by > one period | red | runway averages burn over a window that partly predates any transaction data → **under-reports burn, over-reports runway** |
| `ING-invoice-direction-coverage` | Only one side of the invoice graph | `invoices` totals where own company is `receiver` vs `issuer` | one side 0 while the other is non-zero | amber | payables-only empties AR-aging and LTV; receivables-only empties bills-due — **each reads to the user as "you're all caught up"** |
| `ING-fx-rate-date-coverage` | Rate series sparse across window | `exchange_rates` per currency between window bounds; page, count distinct `rate_date` | far fewer dates than business days, or max `rate_date` > 3 days old | amber | fx-exposure falls back to the last rate ≤ as-of date; sparse series makes every historical conversion drift |
| `ING-category-catalog-coverage` | Category catalog thin/absent | `categories` per `category_type` vs distinct `transactions.category_normalized` | zero for a referenced type, or catalog << observed set | amber | groups against a vocabulary that doesn't exist → distinct spend collapses into "other" |
| `ING-connector-produced-no-records` | Synced fine, ingested nothing | per connector with a `success` log, count `accounts`, `transactions`, `invoices`, `documents` | all four zero | red | **the most dangerous state**: `enabled` + `success` reads as healthy, every presence check passes, and the answer is empty |
| `ING-ledger-graph-absent` | No ledger accounts or entries | `ledger_accounts` and `journal_entries` totals | both 0 while a bookkeeping connector is installed | amber | expense-breakdown and runway prefer the ledger; without it the answers stop matching Well's own statements |

**`[TO COMPLETE]`** — additional exhaustiveness control points to be added by the team.

## Control points — ENTITY GRAPH (`GRAPH-`)

Contributed by the financial-graph review. **Every check here filters `deleted_at IS NULL` on
every root traversed, on both sides of every join** — see the soft-delete caveat in § Known
limits.

### `GRAPH-` COMPLETE (depth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `GRAPH-credit-note-sign-unresolved` | Credit notes not sign-distinguished | group `invoices` by `document_type_code` (UBL `380` invoice / `381` credit note / `383` debit note); check the sign convention of `grand_total`, `items_total`, `balance_due`, `paid_amount` within each code | null or non-UBL code; a `381` whose `grand_total` is positive while `380` is also positive; mixed convention within `381` | red | **not one of the 12 skills mentions `document_type_code`** — yet expense-breakdown, bills-due, accounts-receivable-aging and rank-clients-by-ltv all sum across the invoice population. If `381` is stored positive, every credit note **inflates** AP and AR instead of reducing them, and a refunded customer is credited twice. A silent systematic overstatement in four skills at once |
| `GRAPH-journal-entry-unbalanced` | Debits ≠ credits | group `journal_entries` by parent journal; sum debit vs credit side. **Resolve the parent FK and amount fields via `well_get_schema` — no skill exposes them; do not hardcode** | sides differ by > 0.01; or a group with exactly one line (half-posted) | red | expense-breakdown and runway prefer the ledger *because it's authoritative*. An unbalanced entry makes the preferred path **less** trustworthy than the fallback it overrides, and neither skill can detect the inversion |
| `GRAPH-journal-entry-unposted-or-dangling` | Entry not posted to a journal/ledger account | `journal_entries` where the journal or ledger-account FK is null, or points at an absent / soft-deleted row | any row | red | invisible to every ledger aggregation while still existing — ledger spend under-reports against the same period's transactions with no error surfaced |
| `GRAPH-invoice-items-vs-header-totals` | Line items don't sum to the header | group `invoice_items` by parent invoice; compare line sum vs `items_total`, line tax vs `tax_total`; check the accounting-side triplet independently of the local one | difference > 0.01; non-zero `grand_total` with zero live items; the two triplets diverge | amber | **what a header-internal check cannot see**: the header can balance perfectly while line detail is missing or contradictory. `draft-invoice` accepts `totals` and `line_items` as *independent* inputs, so divergence is structurally possible on every write |
| `GRAPH-invoice-transaction-currency-mismatch` | Payment match crosses currencies | per `invoice_transactions` edge compare `invoices.local_currency` vs `transactions.instructed_amount.currency`; accept `accounting_currency` only when `exchange_rate_pk` resolves live | neither currency matches; or they differ and `exchange_rate_pk` is null/dangling | red | payment-invoice-lookup asserts settlement of that invoice — a EUR payment bound to a USD invoice makes the assertion false, and fx-exposure counts the same money under two currencies |
| `GRAPH-invoice-transaction-amount-mismatch` | `full` allocation with unequal amounts | edges where `allocation_type = full` and abs(txn amount − `grand_total`) > 0.01; separately, summed edge amounts exceeding `grand_total`; and `paid_amount` disagreeing with the edge sum | any of the three sets | red | the invoice reads as settled while a residual exists, so it **drops out of AR-aging and bills-due entirely**. A header-only `paid_amount`/`balance_due` check can't catch it — those fields were written from the same bad edge |
| `GRAPH-invoice-transaction-dangling-side` | Edge points at an absent/deleted row | per edge, confirm both the `invoices` and `transactions` sides resolve live | either side unresolvable | red | payment-invoice-lookup handles a *missing* edge ("no match on file") but has **no branch** for an edge that exists and resolves to nothing — it reports a match it cannot display, or errors mid-answer |
| `GRAPH-invoice-document-pk-dangling` | `document_pk` resolves to nothing | `invoices` where `document_pk` is non-null but the `documents` row is absent / soft-deleted | any row | amber | missing-receipts tests the relation for **null** — a populated pointer to a deleted document **passes**. The invoice reads as documented, compliance reports zero gaps, the receipt does not exist. **A false green is worse than the gap the skill was written to find** |
| `GRAPH-account-ownership-unresolvable` | Account provenance unestablished | `accounts` where `workspace_connector_pk _is_null` (**currently all 30 live rows**) cross-checked against `ownership`; flag rows where `ownership` is also null/unknown | both null | red | cash-position and cash-balance-trend must count only workspace-owned accounts. With the connector FK null across the board, **`ownership` is the only discriminator left** — if it's unset too, a counterparty account can be summed into cash and runway inherits the inflated numerator |
| `GRAPH-account-open-balance-row-invalid` | Missing or duplicated current snapshot | count live `account_balances` per account where `balance_at_to _is_null true` | zero open rows, **or two or more** | red | zero → the account contributes nothing to cash; duplicate open rows → **the same balance counted twice**. Both produce a plausible number with no error raised |
| `GRAPH-transaction-uncategorized` | No category assigned | `transactions` with a null category link (resolve the FK via `well_get_schema` — the `categories` root exists but no skill verifies the FK) | any row; amber < 10% of window, red above | red | expense-breakdown's primary answer *is* spend by category; uncategorized rows vanish or dominate an "other" bucket |
| `GRAPH-transaction-counterparty-unresolved` | No resolvable counterparty | `transactions` where both `debtor_payment_means` and `creditor_payment_means` are null, plus means resolving to no live company/person/account | any row | amber | payment-invoice-lookup must list unmatched payments "with counterparty if resolvable", and company-profile reaches transaction history *only* through this chain — a broken link hides a vendor's payment history while the 360 view still renders complete |
| `GRAPH-person-not-linked-to-company` | Unaffiliated people | `people` with a null company FK or one pointing at an absent/deleted company | any row, reported as a share | amber | an unreachable island: the row exists, no skill can route to it, and the profile it should enrich reports no contacts |
| `GRAPH-company-no-contact-channel` | No contact channel on file | `companies` with zero live `emails`, `phones` and `web_links` | any company that was an `issuer_pk`/`receiver_pk` in the last 12 months; amber for dormant | amber | company-profile must return channels as a first-class section, and any follow-up on AR/AP output has no address to send to |

### `GRAPH-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev | → |
|---|---|---|---|---|---|
| `GRAPH-entity-class-silently-empty` | Root empty despite an enabled connector | `limit: 1` probe per root, cross-referenced with enabled `workspace_connectors` + `connector.slug` | banking enabled with `accounts`/`transactions` empty; invoicing enabled with `invoices`/`companies` empty; either with `journals` empty | red | **this control point IS every skill's "data presence, not connector status" gate — run once centrally instead of twelve times inconsistently** |
| `GRAPH-company-identity-fragmentation` | Duplicates **and** unusable dedup keys | collisions on non-null `canonical_tax_id`, on `domain_normalized`, on (`canonical_registry`, `registry_country`, `establishment_no`), and on normalized `canonical_legal_name`; **plus report the null rate of the two strong keys** | any strong-key collision; **or** a null rate high enough that strong keys cover only a minority | red | two failures, one root. Collisions mis-rank LTV and stall company-profile. But **the null rate is the more serious finding**: where both strong keys are null, dedup falls back to legal name, so non-fragmentation cannot be asserted for that slice. **Report the covered share, never a bare green** |
| `GRAPH-duplicate-invoice-identity` | Same invoice ingested twice | collisions on (`issuer_pk`, `invoice_number`, `document_type_code`) and (`issuer_pk`, `reference_number`, `grand_total`, `issue_date`); **segment by `source_workspace_connector_pk`** | more than one live row per group | red | distinct from duplicate *company* identity — counterparty clean, invoice doubled. The connector segmentation is what tells you whether one connector re-ingested or two connectors reported the same document |
| `GRAPH-ledger-coverage-vs-source` | Ledger coverage vs invoices/transactions | counts of `ledger_accounts`, `journals`, `journal_entries` vs `invoices`/`transactions` over the window | ledger roots at zero while sources are populated; or a populated window with no entries posting from it | red | the output says "ledger-based" while half the period is unposted — the skill flags an approximation **it cannot know it is making** |
| `GRAPH-journal-period-continuity` | Month with source activity, no posting | bucket `journal_entries` by month over 12 months vs the same month's transactions/invoices | any month with sources and zero entries; any gap between populated months | amber | runway averages over ledger movement — an unposted month **shrinks the divisor silently, making runway look longer** for a data reason that never appears in the answer |
| `GRAPH-ledger-account-tree-broken` | Chart of accounts orphaned | `ledger_accounts` whose parent FK is absent/deleted; plus accounts with zero posting entries | any orphan subtree | amber | children's totals never roll up into any reported parent, so **the presented categories sum to less than total spend with no residual line to show it** |
| `GRAPH-orphan-documents-and-media` | Files attached to nothing | live `documents` / `media` with no live parent | any orphan — most sharply when missing-receipts *simultaneously* reports invoices with no document | amber | an orphan file is a receipt Well **already holds and reports as missing**: a false compliance gap. Paired with `GRAPH-invoice-document-pk-dangling`, the two directions bound the real attachment error rate — **neither alone does** |
| `GRAPH-payment-means-island` | Instruments linked to nothing | `payment_means`, `invoice_payment_means`, `cards`, `checks` with no live owner | any island row | amber | the upstream cause of `GRAPH-transaction-counterparty-unresolved`. Companies have no direct FK to transactions — the only route is through `payment_means`, so **one island instrument hides many payments at once** |
| `GRAPH-sync-freshness-and-log-coverage` | Syncs stale or unlogged | latest `status` + `completed_at` per enabled connector; flag enabled connectors with zero logs; cross-check the distinct `invoices.source_workspace_connector_pk` set for connectors that log but write nothing | no log row; `completed_at` older than cadence; `in_progress` past normal duration; success with zero rows | red | all twelve skills read this root to say "still syncing, results may be partial" — an unlogged connector makes that warning impossible, so all twelve present stale data under a **false as-of date** |

### A principle worth keeping

The graph review deliberately authored **no invariants** on `blueprint_runs`, `tasks`,
`billing_events`, `chat_conversations`, `memberships`, `locations`, `subscription`,
`override_version`, `billing_context` — no skill breaks or lies if they drift. **A red nobody
can act on trains the operator to ignore the sweep.** Apply that test to every control point
added later.

## Control points — RECONCILIATION & CLOSE (`RECON-`)

Contributed by the reconciliation review. `[EXPENSIVE]` = requires client-side paging at the
500-row cap; budget as a paged job with checkpoint/resume, on a slower cadence than the cheap
`totalCount` checks.

**Windowing rule for every check below:** window on
`COALESCE(booking_date, value_date, executed_at)` — **never on `booking_date` alone.** It is
nullable in production, and filtering on a nullable column excludes exactly the rows most likely
to be defective, so the sweep's blind spot becomes its clean bill of health.

### `RECON-` COMPLETE (depth)

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `RECON-txn-no-invoice-link` | Unmatched transactions | in-window `transactions` with no `invoice_transactions` row | older than the 2-business-day grace | red |
| `RECON-invoice-no-txn-link` | Invoice settled outside the graph | in-window `invoices` with no edge | `payment_status` paid/partial or `paid_amount > 0` with zero edges | red |
| `RECON-paid-invoice-no-payment` | Paid with no cash movement | `payment_status: paid`, no edge; `last_payment_allocation_date` populated with no edge is the stronger signal | any row | red |
| `RECON-paid-amount-vs-allocation` | `paid_amount` ≠ matched cash `[EXPENSIVE]` | sum matched txn amounts per invoice vs `paid_amount` | gap > tolerance §14 | red |
| `RECON-partial-allocation-shortfall` | Allocations short of total `[EXPENSIVE]` | allocation sum vs `grand_total`, gated on `paid` | sum < total beyond tolerance | red |
| `RECON-overallocated-invoice` | Allocations exceed total `[EXPENSIVE]` | same sum, opposite direction | sum > total + tolerance | red |
| `RECON-invoice-totals-drift` | `items_total + tax_total` ≠ `grand_total` `[EXPENSIVE]` | compare per invoice; **compare on absolute value per `document_type_code`** — 381/383 may carry opposite signs | gap > 0.01 in `local_currency` | red |
| `RECON-balance-due-status-drift` | `balance_due` contradicts `payment_status` `[EXPENSIVE]` | `balance_due = 0` with unpaid/partial; `> 0` with paid; or `paid_amount + balance_due ≠ grand_total` | any row | red |
| `RECON-provisional-match-backlog` | Unconfirmed LLM matches | `invoice_transactions` with `edge_status: provisional` or `confidence < 0.85` | older than 10 business days | amber |
| `RECON-invoice-missing-document` | No receipt attached | `invoices.document_pk _is_null` in-window | past the 5-business-day receipt grace | amber |
| `RECON-txn-missing-document` | Transaction with no receipt | many-to-many — **resolve the relation name via `well_get_schema`, do not hardcode** | past the 5-business-day grace | amber |
| `RECON-txn-uncategorized` | No category | `category_key _is_null`, **split by `category_status` and `category_source`** | per-cause ladder §9 | §9 |
| `RECON-low-confidence-category` | Below the trust floor | `category_key` non-null, `category_confidence < 0.70`, `category_source` = classifier not human | older than 10 business days, or > 5% of period spend by value | amber |
| `RECON-duplicate-payment-candidates` | Same amount, counterparty, near dates `[EXPENSIVE]` | cluster on amount+currency+counterparty means within 3 calendar days | ≥2 in cluster **plus a corroborator** §4 | red |
| `RECON-balance-verification-failure` | Balance self-verification failing | `verification_error _eq true`, read `calculated_` vs `expected_balance_diff` | dual threshold §6b | red |
| `RECON-journal-unbalanced` | Journal doesn't balance `[EXPENSIVE]` | group `journal_entries` by journal/period, debits vs credits. **Field names unverified — start from `well_get_schema`** | non-zero net beyond 0.01 | red |
| `RECON-fx-rate-missing-or-stale` | Conversion on a stale/absent rate | cross-currency invoices: `exchange_rate_pk` populated and its `rate_date` inside the window | null rate, or `rate_date` > 4 days before the txn date | red |
| `RECON-failed-automation-run` | Failed run left work half-done | `blueprint_runs` / `tasks` in failed states. **Status vocabularies unverified — schema-read first** | any failed run with no successful re-run after it | red |

`RECON-failed-automation-run` is the worst case *for the sweep itself*: every downstream skill
reads a partially-written period as a complete one, with no signal that it is short.

### `RECON-` EXHAUSTIVE (breadth)

| id | name | check | fail signal | sev |
|---|---|---|---|---|
| `RECON-duplicate-account-rows` | Sync inserting instead of upserting | cluster `accounts` on `account_name` + `currency` + owning connector; compare provider id and the `created_at` cadence | §8 — the live 24× "Compte principal" case | red |
| `RECON-unposted-period` | Period has transactions, no entries | per month: `transactions` count vs `journal_entries` count | txns > 0 and entries = 0 for a period ending before the close cutoff §13 | red |
| `RECON-txn-no-ledger-account` | Transaction cannot post | `transactions.ledger_account_pk _is_null` past the close cutoff | any row | red |
| `RECON-account-never-reconciled` | An account excluded entirely | per workspace-owned account, in-window txn count vs how many carry an edge | **0% match rate across the whole window** | red |
| `RECON-account-current-balance-missing` | No open balance row | per account, `balance_at_to _is_null`, newest first | no open row, or `balance_at_from` older than 48h | red |
| `RECON-ledger-account-period-coverage` | Expense account with no period balance | expense `ledger_accounts` joined to `account_balances` | no row in a period that has transactions | amber |
| `RECON-sync-coverage-gap` | Enabled but silently not syncing | latest sync log per enabled connector | failed, `completed_at` > 26h, or `in_progress` > 3h | red |
| `RECON-backlog-age-tail` | Unswept tail beyond the window | oldest item per queue, `orderBy` asc limit 1 | oldest > 30 days, or any queue's count growing 3 sweeps running | amber |

`RECON-txn-no-ledger-account` is the subtle one: a transaction with no ledger account cannot
post, so `RECON-unposted-period` reads **green** while the period is structurally incomplete —
a breadth gap masquerading as depth.

`RECON-account-never-reconciled` matters because cash-position totals the account while
expense-breakdown never explains its spend. **A per-account 0% match rate is an excluded bucket,
not a coincidence.**

## Latent gaps — what the 12 skills ASSUME but never verify (`ASSUME-`)

From a full reverse-reading of all 12 published skills against the live schema. **This is the
most valuable table in this file.** Every entry below is assumed by at least one skill's
arithmetic and verified by *none* of them — so when one fails, no skill refuses. It answers
confidently, cites a real as-of date, and is wrong. That is precisely the failure class a daily
sweep exists to catch, and it is invisible from inside any single skill.

Ordered by blast radius. **Groundable today** = expressible with existing fields, zero schema
change.

| id | the assumption | assumed by | why it's dangerous | groundable today? |
|---|---|---|---|---|
| `ASSUME-balance-verification-unread` | That the balance you read passed verification | cash-position, cash-balance-trend, fx-exposure, runway-calculator | **The single worst one.** `account_balances` carries six verification fields and **not one of the 12 skills mentions any of them.** Every cash figure is read off `closing_booked` with zero regard for whether that balance failed verification, was never verified, or fails to tie to its own movement — then divided by burn to produce a runway headline. 6 rows are failing right now. | ✅ yes — pure read the skills never make |
| `ASSUME-booking-date-not-null` | That every transaction has a date | runway-calculator, payment-invoice-lookup, missing-receipts, expense-breakdown | `booking_date` is nullable in production and **no skill names any transaction date field at all** — the window filter is treated as self-evident. Null-dated rows drop from every windowed query without a trace, understating outflow and therefore **overstating runway — the failure direction that most flatters the number and is least likely to be questioned.** | ✅ yes |
| `ASSUME-payment-status-ties-to-balance` | That `paid ⇒ balance_due = 0` | rank-clients-by-ltv, accounts-receivable-aging, bills-due, fx-exposure, expense-breakdown | LTV counts `paid` and sums `grand_total`; AR/AP count `unpaid`/`partial` and sum `balance_due`. Nothing checks the invariant. A drifted pair **overstates revenue and understates receivables in the same workspace at the same time**, so the two reports disagree and neither flags it. | ✅ yes |
| `ASSUME-classifier-healthy` | That categorization succeeded before ranking categories | expense-breakdown | `category_status` has live `classifier_failed` / `classifier_abstained` / null, and `category_confidence` exists — the skill reads none of them. A failed window yields a skewed breakdown presented as the answer to the skill's own headline question. Low-confidence guesses are indistinguishable from confident ones in the output. | ✅ yes (needs a named threshold) |
| `ASSUME-fx-rate-fresh` | That "most recent rate at or before as-of" is recent | fx-exposure (red) + 8 skills' conversion paths | The skill forbids future/arbitrary rates but **sets no upper bound on age**. A six-month-old rate satisfies the rule, is cited honestly with its `rate_date`, and is materially wrong — the skill's own quality check is **fully passed by a bad answer**. | ✅ yes (needs a max-age constant) |
| `ASSUME-invoice-not-duplicated` | That each bill appears once | bills-due, expense-breakdown, accounts-receivable-aging | Both AP skills sum with no uniqueness check. The same bill ingested from a bank connector *and* an accounting connector doubles the cumulative-outflow total that `bills-due` exists to produce. | ✅ yes (`invoice_number` within issuer) |
| `ASSUME-degraded-connector-visible` | That a stopped feed is noticed | all 11 read skills | Every skill tests for `enabled` only. A connector that *was* feeding and has since gone `degraded` still has rows (so the data-presence spot-check passes), the feed has stopped, and **no skill says so** — while the staleness caveat depends on a `completed_at` a degraded connector may simply stop writing. | ✅ yes |
| `ASSUME-accounts-type-is-cash` | That every owned account is cash | cash-position, runway-calculator, fx-exposure | Skills check *ownership* but never account **kind**. A credit-card, loan, or investment account lands inside "total cash on hand" and flows into runway's numerator. (Live: 3 accounts are `type: other` with a null currency.) Needs a structured allow-list of `accounts.type` values — an exact-match record, **not a substring test on the type label**. | ✅ field exists; classification decision open |
| `ASSUME-own-company-correct` | That the workspace's own company is right, not merely non-null | accounts-receivable-aging, bills-due, rank-clients-by-ltv, expense-breakdown, company-profile, fx-exposure | A wrong own-company **inverts payables and receivables** — AR-aging lists your own bills as customer debt, LTV ranks your vendors as best customers — with no null to trip on. **Correction to the source review: `workspaces.own_company` does not exist** (verified: 14 fields). And live data is already wrong — WellappFR's own `"WELL APP INC"` is tagged `company_origin: counterparty`. | ❌ needs a self-marker + provenance (`own_company_source` / `confirmed_at`) |
| `ASSUME-no-duplicate-counterparty` | That one real counterparty is one row | rank-clients-by-ltv, company-profile, accounts-receivable-aging, expense-breakdown | Duplicates **split** per-company totals, dropping a top customer down the ranking or off it, and hide half the relationship in the 360 view. `company-profile` catches *query-time* ambiguity; the ranking skills never search by name, so they never even see it. | ❌ needs `duplicate_of` / a uniqueness axis; live keys are frequently null |
| `ASSUME-document-is-a-real-receipt` | That a non-null document is a valid receipt | missing-receipts | The entire compliance verdict is `document IS NOT NULL`. Nothing verifies the document has content, is a receipt, or belongs to that invoice. A workspace where every invoice has an empty or wrong-kind attachment gets **a clean bill of health — the exact opposite of the skill's purpose.** | ❌ needs a document type + byte-size/checksum field |
| `ASSUME-ledger-expense-filter-exists` | That "expense-type ledger accounts" is a filter someone can write | expense-breakdown, runway-calculator | Both skills instruct joining `ledger_accounts` for expense-type accounts and **no skill names the field carrying that type.** The *preferred* path for both the spend breakdown and the burn rate rests on a filter nobody has identified — any implementation is guessing, the exact failure `well_get_schema` was mandated to prevent. | ❌ needs the account-class field name + enum |
| `ASSUME-allocations-dont-over-allocate` | That payments allocated to an invoice sum to ≤ its total | payment-invoice-lookup | Over-allocation surfaces as a `confirmed` match with high `confidence` — **the reconciliation error most likely to be trusted.** The skill names `match_method`, `confidence`, `edge_status`, `allocation_type` — none carries a number. | ❌ needs a per-edge allocated amount |
| `ASSUME-rows-belong-to-this-workspace` | That returned rows are actually this workspace's | all 12 skills | No skill asserts tenancy on a single returned row; all 12 delegate scoping to the server. A scoping regression surfaces as **another workspace's financials presented with full confidence and a valid as-of date** — the highest-severity failure in the set, and the only one with no in-skill tripwire whatsoever. | ❌ needs a tenant key on returned rows of every read root |

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

## Known limits of the MCP surface — what this sweep CANNOT check

Recording these is part of the skill's honesty contract: a control point that cannot be
expressed must not be silently dropped, or the sweep implies coverage it does not have.

- **Per-sync record counts and truncation flags — not expressible.**
  `workspace_connector_sync_logs` has no `records_ingested`, `pages_fetched`, or `truncated`
  scalar, and no queryable `metadata` column. So *"partial sync / truncated pagination"*
  cannot be checked directly. Only weak proxies exist: `ING-connector-produced-no-records`,
  or a root's `totalCount` sitting exactly at the ingestion ceiling (5000) or an exact
  page-size multiple. **Recommended schema change — highest value for making this sweep
  honest: promote `records_ingested` and `truncated` to scalar columns on the sync log.**
- **Raw-vs-mapped drop rate — not expressible.** `ConnectorSyncDiagnostic` and
  `ConnectorRawObservation` exist in the backend but are **not among the 33 MCP roots**. The
  most direct measure of a partial sync — provider objects returned vs entities persisted — is
  invisible.
- **Account stated opening date — not expressible.** `accounts` has no `opened_at`. Coverage
  is anchored instead on the earliest `balance_at_from`, a weaker floor: a truncated balance
  series moves the floor along with it.
- **OAuth token expiry — not expressible.** Expiry lives in `workspace_connectors.config`
  (jsonb, not queryable by nested key). The only observable is the derived
  `status _eq need_reconnect`, so the sweep detects an expired credential **after** refresh has
  terminal-failed, never in the warning window before it.
- **Own-company resolution — NO grounded field exists, and the data is currently wrong.**
  `workspaces` has no `own_company` (verified: 14 fields, none of them it). The nearest
  candidates are `companies.entity_kind` and `companies.company_origin` — but live values are
  only `unknown` and `counterparty`, with **no value marking "self"**, and in workspace
  WellappFR the row `"WELL APP INC"` (`canonical_tax_id: FR932035157`, `wellapp.ai`) is
  literally classified **`company_origin: counterparty`** — the workspace's own company tagged
  as a third party. Until a self-marker exists, the payable/receivable split that
  `bills-due`, `accounts-receivable-aging`, `rank-clients-by-ltv` and `company-profile` depend
  on **cannot be verified by this sweep**, and `ING-invoice-direction-coverage` inherits that
  limitation. This is a red-severity gap in the data model, not just in the sweep.
- **Expected connector set — unknowable in-graph.** The sweep can prove *some* source of a
  domain exists, never that *every* source the business uses is connected — there is no
  per-workspace declared connector manifest. Detecting a wholly absent second bank needs an
  external signal; the closest in-graph heuristic (a counterparty IBAN in `payment_means` with
  no matching workspace-owned `accounts` row) is weak.
- **Soft-delete filtering — INCONCLUSIVE, and it gates five control points.** Every root has
  `deleted_at`, so a live child can reference a soft-deleted parent and pass every null check.
  Five `GRAPH-` checks exist purely for that class. Whether the MCP layer *already* filters
  soft-deletes server-side is **unresolved**: probing `invoices` and `accounts` with
  `whereClause {"deleted_at": {"_is_null": false}}` returned `totalCount: 0` on both — which is
  equally consistent with server-side filtering **and** with there simply being no soft-deleted
  rows. Per this skill's own rule, that is INCONCLUSIVE, not a pass. Re-probe against a root
  with a **known** soft-deleted row before trusting any dangling-reference verdict; if MCP does
  filter, those five checks silently degrade into the null checks already covered above.
- **No cross-root join in one query.** Any comparison spanning two roots (currency/amount
  mismatch, items-vs-header, ledger-vs-source) requires fetching both sides and joining
  client-side. Correct but **not atomic** — a mid-sweep sync can make the two sides disagree for
  reasons that are not defects. Sequence against a quiet window, and **re-verify a red before
  reporting it.**
- **Zero violations vs. violations past the page cap.** Without aggregation the sweep cannot
  distinguish the two unless it pages to exhaustion. **Record the page depth reached alongside
  every green** — an unqualified green over a truncated scan is the sweep lying in the same way
  the skills do.
- **Credit-note sign convention is unspecified anywhere.** `document_type_code` exists with UBL
  `380`/`381`/`383` and no skill reads it. `GRAPH-credit-note-sign-unresolved` can detect an
  *inconsistent* convention but cannot tell you which is *correct* — that needs a recorded
  data-model decision (a CHECK constraint on sign per code, or a documented invariant), then the
  four aggregating skills must filter or negate. **A sweep reporting "convention consistent"
  while all four skills ignore the code entirely is a green on a broken aggregation.**
- **No `paid_date` on invoices.** `last_payment_allocation_date` is an allocation timestamp, not
  a settlement date. A "payment recorded before the invoice was issued" check is expressible
  only for invoices that already carry an edge — i.e. the ones least likely to be broken.
- **No home/reporting currency on `workspaces`** (confirmed across its 14 fields).
  `invoices.accounting_currency` is per-invoice, so FX-coverage cannot know which pairs are
  *required* without inferring a home currency. **Record which inference was used**, or the same
  graph passes one day and fails the next.
- **Unverified field paths — resolve at runtime, never hardcode.** The 12 skills state field
  paths only for `invoices`, `companies`, `workspaces`, `transactions`, `invoice_transactions`,
  `accounts`, `account_balances`, `exchange_rates`, `workspace_connectors`,
  `workspace_connector_sync_logs`. For `invoice_items`, `journal_entries`, `journals`,
  `ledger_accounts`, `people`, `media`, `documents`, `categories`, `tax_rates`, `payment_means`,
  `invoice_payment_means`, `cards`, `checks` **no skill names a single field.** The `*_pk`
  convention suggests the names, but each must come from `well_get_schema(root)` at sweep time —
  **a hardcoded guess emits a false red the day a connector changes shape, which is worse than
  not running the check.**
- **`journal_entries` may carry no source FK at all.** If `well_get_schema` shows none, the
  ledger↔source reconciliation collapses to a population-count comparison, which detects
  *absence* but never *mis-posting*. State which of the two you ran.
- **Duplicate-identity keys are thin.** Dedup should key on `canonical_tax_id`,
  `domain_normalized`, `canonical_legal_name`, and `registry_name` + `establishment_no` rather
  than display name — but across 1,281 live companies `canonical_tax_id` and
  `domain_normalized` are frequently null (populated mainly on Qonto-sourced rows), so
  name-based fallback is unavoidable and will produce false pairs. Report duplicate clusters as
  candidates for review, never as confirmed duplicates.

## Tolerances — do not cry wolf

Every value below is a **proposed default with its reasoning**, not a guess. All of them belong
in sweep **config, not code** — tolerance is business policy and will be argued about.

| # | case | rule | why this number |
|---|---|---|---|
| 1 | Unmatched transaction | **grace = 2 business days** from `COALESCE(booking_date, value_date, executed_at)`. In-flight items reported as a separate count, **never in the defect total** | SEPA/ACH settle T+1–T+2 and the matcher runs after ingest, so an unmatched item inside 2 days carries no information. Business days so a Friday payment doesn't go red on Sunday |
| 2 | Invoice not yet due | fires only when `due_date` < as-of. `due_date` null → **`issue_date` + 30 days**, and **the fallback is labeled in the output** | matches accounts-receivable-aging's own mandated fallback; 30 days is standard net terms and must be stated, not implied to have been on the invoice |
| 3 | Installment / payment plan | suppress shortfall while `payment_status: partial` until **`due_date` + 7 calendar days**; also suppress if `last_payment_allocation_date` is within **10 business days** | partial is the *expected* state of a plan. 7 days past due is where "on a plan" becomes "not paying"; a recent allocation date proves the plan is live |
| 4 | Recurring identical charge | cluster window **3 calendar days**, **AND require one corroborator** — an over-allocated shared invoice, or one cluster member unlinked | two identical amounts ~30 days apart are a subscription. 3 days covers a same-batch double-submit including a weekend. **The corroborator is what keeps this from being the noisiest check in the sweep** |
| 5 | **FX rate max age** | **4 calendar days.** Accept the most recent `rate_date` at or before as-of, up to 4 days back, and cite it. Fail beyond 4 days or when no rate exists. **Never reach forward for a later rate** | 4 days covers a Friday close plus a Monday holiday — the longest routine EU/US gap. A forward rate is retroactive revaluation and would silently restate a closed period |
| 6a | **Balance verification staleness** | **48 hours** on the open row's `balance_at_from`; beyond that → red. Tighten to 26h once sync coverage is green for a month | two nominal daily syncs must both have failed before this fires, so one missed run can't trip it, and cash-position is never more than 2 days wrong |
| 6b | **Balance mismatch magnitude** | **Both thresholds, as an OR.** `verification_error = true` → **always at least amber**. Red when `abs(calculated − expected) ≥ 100` in account currency **OR** the gap is **> 1% of expected closing balance**. Amber floor: gap > 0.01 and under both | absolute-only misses a 0.8% gap on a 500k account (4,000 units, material); percent-only misses a 200-unit gap on a 2M account that's still a broken posting. **The live case trips both** (1,050 absolute = 10.0% of 10,498.53) — a correct spec shouldn't have to pick an arm |
| 7a | **Connector warm-up** | **30 minutes** — no control point runs against a connector enabled less than 30 min ago | covers a first historical backfill starting up and paging. Shorter → a defect for every row not yet ingested; longer → a genuinely broken first sync hides for most of an hour |
| 7b | **Hung sync** | `in_progress` **≤ 3h → suppress the COMPLETE bucket** for that connector's roots and report "sweep deferred — sync in progress". **> 3h → hung**, red. `completed_at` older than **26h → stale**, red | all 12 skills already defer on `in_progress`; the sweep must too or it reports garbage. 3h is generous for any single provider page-through. 26h = a daily sync plus 2h of jitter, so one late run doesn't page anyone |
| 8 | **Duplicate accounts vs. genuinely multiple accounts at one bank** | Red when ≥2 rows share `account_name` + `currency` + owning connector **AND** (identical provider `account_id` **OR** `account_id` null on ≥2). **Cadence corroborator, sufficient alone: ≥3 rows for the same triple created within 24h with `created_at` deltas within ±10 min of a constant interval.** **Not** a duplicate when rows carry distinct non-null `account_id`/IBAN, or were created > 30 days apart | a real second account at the same bank **always has a distinct provider identifier — that field, not the display name, is the identity.** Name+currency alone would suppress a legitimate pair across two entities. The regular-interval test is the unambiguous signature of a scheduled job inserting rather than upserting: **humans do not open accounts every 60 minutes on the hour** |
| 9 | **Uncategorized spend at production scale** | **Amber by default, red on escalation. Per cause:** `classifier_failed` → **red** (broken automation); `classifier_abstained` → **amber**, human queue, never red alone (the classifier working correctly on a genuinely ambiguous row); `category_status` null / never attempted → **red** (the enqueuer never fired — a pipeline gap, not a classification gap). **Aggregate ladder:** amber at value share **> 5%** of period spend **or** count **> 100**; red at share **> 15%** or count **> 500** or **> 25 `classifier_failed` in the trailing 7 days**. Backlog target: 788 → **under 100 in 30 days**, then hold | 788 nulls today would make a flat red permanent, and **a permanently red control point is a disabled control point** — that's the failure mode to design against, not the number. The three causes route to different fixes, and collapsing them hides the 7-day `classifier_failed` trend, the one signal that warrants a page. **Value share leads count because expense-breakdown renormalizes shares**: 10 rows worth 40% of spend is far worse than 300 rows worth 2% |
| 10 | **Confidence floors** | `category_confidence` **< 0.70** → review queue (amber); **0.70–0.85** → accepted but **labeled low-confidence in output**; **≥ 0.85** → trusted. Separately `invoice_transactions.confidence` **< 0.85** → provisional, needs human confirmation | 0.70 is where a classifier's probability stops beating a coin flip over a 10+ category space. **The match floor is stricter than the category floor because a wrong match moves cash between counterparties while a wrong category only misfiles it** — asymmetric cost, asymmetric floor |
| 11 | **Nullable `booking_date`** | **Always window on `COALESCE(booking_date, value_date, executed_at)`**; emit a separate INFO count of null-`booking_date` rows. A null rate **> 10%** of the period is itself amber | filtering on a nullable column excludes exactly the rows most likely to be defective. Fallback runs bank-booking → value → ingest, most authoritative first. The 10% tripwire catches a provider that stopped sending the field |
| 12 | **Soft-deleted rows** | `deleted_at IS NULL` on every query, both sides of every join. **Emit an INFO count of rows soft-deleted in the last 7 days that previously appeared in a defect queue** | an omitted predicate inflates every count. The 7-day INFO exists because **"the defect was fixed" and "the row was deleted" must not look identical in the sweep's trend line — otherwise deleting evidence reads as progress** |
| 13 | **Open period not yet closed** | **close cutoff = the 5th business day of month M+1.** Posting checks run only on periods ending before it | the open period is expected to be unposted; the prior period is expected posted by working day 5, the standard soft-close target. Earlier cries wolf for the first week of every month |
| 14 | **Rounding / FX cents on allocation sums** | **0.01 in `local_currency` same-currency; 0.5% of `grand_total` cross-currency.** Both from config per currency — **hardcoding either is a violation** | same-currency arithmetic should be exact, so 0.01 is pure decimal noise. Cross-currency needs room because invoice rate and settlement rate legitimately differ; 0.5% sits inside bank spread and outside a real short-payment |
| 15 | **Credit / debit notes swept as invoices** | Branch on `document_type_code` **exactly** — 380 invoice, 381 credit note, 383 debit note. **Aging and payable/receivable checks run on 380 only**; 381/383 participate in allocation-sum checks **on absolute value** | a structured typed code, so this is an exact lookup, not a name guess. **A credit note has no due-date semantics and will sit in an aging bucket forever if swept as an invoice** |
| 16 | Weekend / bank-holiday balance gap | not a series hole if the bank doesn't publish; distinguish **"no movement" from "no data"** | a non-publishing day is not a missing period |

## Output requirements

Return:

- **A one-line verdict per workspace**: `COMPLETE: pass/fail · EXHAUSTIVE: pass/fail`, plus
  the count of red and amber failures. The two verdicts are reported **separately, never
  merged into one score** — that separation is the point of the skill.
- **A table of failing control points only** (passing ones collapse to a count), each with:
  id, bucket, severity, the count of offending records, up to 5 example ids, and the
  `records_url` deep link when available.
- **The single highest-value action** for each red failure — reconnect this connector, re-run
  this sync, categorize these N transactions. Name the surface, not a vague "investigate".
- **An explicit INCONCLUSIVE list** — control points that could not be evaluated (missing
  field, empty root, permission). These are never silently counted as passes.
- **The scope actually swept**: which workspaces, which window, which control points ran, and
  which were skipped. A sweep that skipped half the surface must say so in the first lines.
- **The as-of timestamp** and, if a prior sweep exists, the day-over-day diff (new failures
  first).
- Every count carries its currency and date where financial.

## Quality checks

Before finishing, verify:

- The COMPLETE verdict and the EXHAUSTIVE verdict are stated **separately** and each control
  point declares its bucket.
- `well_get_schema` was called for every root touched, before querying it.
- A missing field or empty root produced **INCONCLUSIVE**, never PASS.
- Exhaustiveness ran before completeness, and any completeness result reported under a failed
  breadth check is labelled as scoped/partial.
- Every workspace from `well_list_workspaces` appears in the report, including ones with no
  data (`EXH-workspace-covered`).
- `deleted_at` rows were excluded from every count.
- Every tolerance in § Tolerances was applied before a failure was declared.
- No financial answer was volunteered — this skill reports data health, not cash.
- Every red failure names a concrete next action and a surface, and every EXHAUSTIVE
  connector failure carries an `install_url` where one exists.
- The sweep never reports "all clear" when it could not reach the MCP server or a workspace.

## Examples

**`[TO COMPLETE]`** — worked examples to be added once the control-point list is final. At
minimum: (1) an all-pass sweep, (2) a mixed sweep where a breadth failure scopes the depth
findings, (3) a sweep that could not run and must not read as clean.

---

## Provenance — what is grounded, what is pending

**Grounded in live production data (Well MCP, 2026-07-28):** the control points below were
not invented — the failure modes they describe are *currently failing* in production, which
is why they lead the tables:

- `account_balances` exposes first-class verification fields (`verification_error`,
  `verification_error_detail`, `verified_at`, `verification_last_run_at`,
  `calculated_balance_diff` vs `expected_balance_diff`). **6 rows currently have
  `verification_error = true`**, e.g. *"Balance mismatch: expected 10498.53, calculated
  9448.53, difference 1050"* on Mercury Credit (USD), and *"expected 0, calculated 28876.02"*
  on Mercury Checking. `verified_at` is null on all 6.
- `transactions` exposes `category_key` / `category_status` / `category_confidence` /
  `category_source`. **788 transactions have a null `category_key`**, across three distinct
  statuses — `classifier_failed`, `classifier_abstained`, and null (never attempted). Several
  also have a null `booking_date`.
- `workspace_connectors.status` is a real enum with live values beyond `enabled`:
  **`to_configure`** (Airtable, Circleback) and **`degraded`** (Attio, Xero) are present right
  now across 17 connections in 3 workspaces (Maxime, WELL APP INC., WellappFR) — the exact
  shape of an EXHAUSTIVE failure.
- **Duplicate account ingestion is live and severe.** `accounts` returns `totalCount: 30`, of
  which **~24 are the same account** — "Compte principal" (EUR, `deposit`, via the Qonto (FR)
  connector `plaid_ins_137879`, workspace WellappFR `1c5c706f`) — with `created_at` values
  spaced almost exactly **one hour apart**, from 2026-07-27T16:37 through 2026-07-28T15:01.
  That cadence is the sync interval, so the sync is **inserting a new account row per run
  instead of upserting**. Every skill that sums `accounts` or their balances is currently
  overstating cash by roughly that factor. This is why `CMP-account-not-duplicated` is the
  highest-severity control point in this skill.
- **Accounts with no currency exist**: 3 rows (`"active"`, `"Mercury Savings ••0729"`,
  `"Mercury Checking ••9282"`, all `type: other`, via the `mercury-mcp` connector) have
  `currency: null` — and they appear to be the *same* Mercury accounts already ingested via
  the Plaid Mercury connector (`plaid_ins_116794`), i.e. a cross-connector duplicate as well.
- `accounts.workspace_connector_pk` is **null on all 30 rows** even though the source
  connector resolves through `sourceWorkspaceConnector` — the direct FK is unpopulated.
- `journal_entries` returns `totalCount: 117`, sourced from Xero (WELL APP INC.) and Pennylane
  (WellappFR) — so the accounting graph is populated in 2 of 3 workspaces and empty in the
  third, which is the shape `EXH-no-empty-entity-class` is written to catch.
- 33 queryable roots confirmed via `well_get_schema()`; `enrichment` provenance is available
  per field and should be cited by each control point.

**Derived from the 12 published skills** (`/Users/maximechampoux/skills/skills/*/SKILL.md`):
the "→" column, and the principle that a skill must refuse rather than infer (e.g.
`cash-balance-trend` explicitly refuses to derive a direction from a single balance row —
`EXH-balance-series-depth` is the sweep-side enforcement of that promise).

**PENDING — QA feedback not yet incorporated.** Four QA recordings from 2026-07-28 cover
`/runway`, `/expense-breakdown`, `/cash-evolution` and `/cash-position` (Claap workspace
`CnQPUbett5`, recording ids `ZCh4p9ZdoEFk`, `Egz2h8u5c6dk`, `6NvSdl8IR4ko`, `nVpezWUI5XvV`).
**Their transcripts were not ready at the time of writing** — Claap returns "Transcript is
not ready" for all four and a semantic search over transcripts filtered to 2026-07-28 returns
zero results. **No control point in this file is derived from the QA feedback yet.** When the
transcripts land, each QA finding should become a control point here, tagged with its bucket.

**MERGED — fleet audit (complete).** Four domain experts contributed and all four are merged:
ingestion (`ING-`, 35 control points + the counting primitive + status vocabularies), financial
graph (`GRAPH-`, 23 control points + 8 MCP-surface limits), per-skill data contract (the
`ASSUME-` table + sweep ordering + the most-shared precondition), and reconciliation (`RECON-`,
26 control points + the 16 concrete tolerances). Where a contributor's field name could not be
grounded it was moved to § Known limits rather than merged — notably `workspaces.own_company`,
which three of the four independently assumed and which does not exist.

**INCONCLUSIVE — soft-delete filtering.** See § Known limits. Probed and unresolved; five
`GRAPH-` checks depend on the answer.

**Two live defects surfaced while building this** (both worth their own bug, independent of this
skill): duplicate hourly account ingestion (~24 rows of one account), and own-company
misclassification (WellappFR's own company tagged `counterparty`). A third is **suspected but
unconfirmed**: if credit notes (`document_type_code: 381`) are stored with a positive
`grand_total`, every credit note inflates AP and AR across four skills. One targeted query
settles it — do that before filing.

## Open decisions for the team

1. **The cash allow-list.** Which `accounts.type` values count as cash for `cash-position` and
   `runway-calculator`'s numerator? Needs a typed exact-match record, not a substring test.
2. **Credit-note sign convention.** Is `381` stored negative? If not, four skills need to filter
   or negate on `document_type_code`, and the convention needs recording as an invariant.
3. **Own-company marker.** A `self` value on `company_origin`, or an explicit workspace→company
   FK. Blocks every direction-dependent control point and four skills' documented workflows.
4. **Tolerance ratification.** The 16 defaults above are proposals with reasoning. They belong in
   config; someone owns the numbers.
5. **`billing_events` coverage** — read by no skill. Leave uncovered, or scope a skill for it?
