# Daily Data Sweep — WELL APP INC.

**Workspace:** `c3f54fe3-6189-4854-a144-6c678f94806e`
**As of:** 2026-07-30T20:30Z
**Scope:** this workspace only, **workspace-scoped and paged** (see Method)
**Mode:** cold run — no prior-sweep store exists

---

## Verdict — reported separately, never merged

- **COMPLETE (are the numbers right?): `fail` — 4 red, 1 amber**
- **EXHAUSTIVE (is anything missing?): `pass (with findings)` — 3 amber (partial — several checks not evaluated)**

**Do not quote cash or runway for this workspace today.** Not because the arithmetic is wrong, but because it is precise and unfounded.

---

## COMPLETE — depth

| control point | measured | of | verdict |
|---|---|---|---|
| `RECON-txn-no-ledger-account` | **1,597** transactions with `ledger_account_pk` null | 1,597 | 🔴 **100%** |
| `BANK-account-currency-missing` | **63** accounts with null `currency` | 66 | 🔴 95.5% |
| `RECON-txn-uncategorized` | **749** transactions with `category_key` null | 1,597 | 🔴 46.9% |
| `RECON-txn-uncategorized` (status arm) | **608** with `category_status` null — the categorizer never fired | 1,597 | 🔴 38.1% |
| `BOOK-invoice-has-document` | **0** documents exist against 634 invoices | 634 | 🟡 amber — see below |

### `ledger_account_pk` is null on every transaction

Not a gradient — total, with zero variance. No transaction can post to a journal, so
`RECON-unposted-period` reads **green** while the period is structurally impossible to close: a
breadth gap wearing a depth disguise.

Root-cause traced (see `root-cause-2026-07-30.md`): **the writer was never built.** The schema
advertises the field as *"AI computed … assigned via auto-coding"*, but no provider config sources
it, and the one runtime write-back path is gated behind an invoice DRAFT journal entry that
connector-synced invoices never produce. A backfill migration already shipped for this field and
updated zero rows.

**Consequence:** trailing burn — and therefore runway — falls back to a crude "negative amount and
not TRANSFER" heuristic. Cost Structure can never elect its GL rung and silently drops to
LLM categories.

### `BOOK-invoice-has-document` is amber, not red — the control point was wrong

Zero documents against 634 invoices looks like an 86%+ compliance breach. It mostly is not.

All 634 invoices here are **accounting-connector ledger records** (Xero). Those legitimately have no
source PDF: the connector document persister never downloads bytes, and Xero's receipt endpoint is
behind a scope Well does not request. The check counted `document_pk IS NULL` globally with **no join
through `Connector.data_domains`**, reporting an unbuilt capability as a compliance failure.

Downgraded to amber pending the three-bucket fix (accounting-sourced = expected · document-producing
connector with no document = the only real red · manual entry = expected).

**This is a defect in the sweep, not in the data.** The same defect exists in the `missing-receipts`
skill, which is currently unusable for any accounting-connected workspace.

*Caveat:* "expected shape" means "not a regression", not "not a problem". For VAT deductibility, an
invoice whose PDF lives in Xero but not in Well is a real evidence gap — missing capability, not a bug.

---

## EXHAUSTIVE — breadth

| control point | finding | verdict |
|---|---|---|
| `ING-connector-degraded` | **Xero** (accounting) `degraded` — source of 634 invoices, 327 ledger accounts, 91 journal entries | 🟡 amber |
| `ING-connector-degraded` | **Attio** (CRM) `degraded` | 🟡 amber |
| `ING-account-mis-ingestion` | **66 accounts** created in one ~1-second batch on 2026-07-29 from **Mercury MCP**, named after people, many duplicate, 63 with no currency | 🟡 amber |

### The degraded connectors are in a loop, and the UI hides it

Root-cause traced: a run-level **success** that emits ≥3 FAILURE-class diagnostics re-degrades the
connector, and `FAILURE_REASONS` is default-DENY — so structural non-events like `empty_result` and
`no_suitable_tool` count toward the threshold. MCP sync then stamps `PROCESSING` unconditionally at
start, clobbering the resting `DEGRADED` and re-arming the guard. Cycle:
`DEGRADED → PROCESSING → ENABLED → DEGRADED`, indefinitely.

Proven live: Stripe's status write landed **17ms after a sync log with `status = success`**, last six
runs all successful.

**Do NOT reconnect.** The grant is valid and reconnecting cannot clear the flag by construction. The
status's own contract says it *"clears itself, no user action required"* — the accurate reading is
that **no user action would help**, which is a more alarming statement. The one user-visible surface
(`canvas-readiness.service.ts:199`) says "Reconnect it to restore fresh figures"; that advice is wrong.

**Open and consequential:** whether Xero's trigger is `EMPTY_RESULT` (harmless noise) or
`MAPPED_ENTITIES_DROPPED` (**real data loss on our primary accounting source**) is unresolved —
`connector_sync_diagnostics` is not queryable over MCP.

---

## Not evaluated — named, never counted as passes

- **Balance verification** — `BANK-balance-verification` over 270 balance rows was not re-run this
  pass. A prior run reported 8 failing verification with gaps up to **$29,188.96**; treat as
  outstanding, not cleared.
- **Per-month decomposition** — counts run over the full population, not partitioned into months, so
  month-level verdicts are `SAMPLED`.
- `SPINE-03` close-readiness — **INCONCLUSIVE**: no close-state field exists on the MCP surface.
- Home/non-home currency partition — **INCONCLUSIVE**: no home-currency field on `workspaces`, and it
  must never be inferred from the commonest transaction currency.
- Gates 7–8 (`IPAY-`, `EINV-`, 52 control points) — not run.

---

## Single highest-value action per red

1. **Ledger accounts** — build the missing writer where the classifier already decides accounting
   intent: resolve `ledger_account_role` to a concrete account via the existing per-workspace posting
   mapping and set the FK in the same write. Not a backfill; the source path.
2. **Accounts** — review `mercury-mcp` account ingestion. It created 66 person-named, currency-less
   rows in one second. These look like counterparties ingested as bank accounts, which would
   contaminate any per-account cash denomination.
3. **Categorization** — close the status-stamping gaps: three enum members are declared and never
   assigned, so "never tried", "halted" and "crashed" are all the same NULL, and the self-heal
   sweeper structurally excludes both populations.

---

## Handoff

COMPLETE fails, so the sweep dead-ends here rather than answering a financial question.
**`cash-position` and `runway-calculator` are blocked** until the currency gap and the balance
verification errors clear. Once they do, those skills are the right next stop.

---

## Method — and a correction to this skill's own baseline

Every count is an **exact server-side `totalCount`** obtained with `limit: 1`, workspace-scoped.

**`well_query_records` does paginate** — corrected today. A workspace-scoped query issues a
`nextCursor` whenever the page fills, and passing it back advances the window. An earlier revision of
this skill claimed cursors are always null; that came from probing only the multi-workspace fan-out
path with small limits, where `returned` never reaches `limit` so no cursor is ever issued. The
fan-out genuinely cannot be paged — which is why **every query here is scoped to one workspace.**
That scoping is what makes an exhaustive scan, and therefore an honest `pass`, reachable at all.

One useful property of scoping: an invalid field name in a workspace-scoped query returns a hard
`400`, whereas in the fan-out it returns `success: true, totalCount: 0` — indistinguishable from a
clean workspace. Scoped queries fail loudly, so a zero here is trustworthy.

_Well is SOC-2 Type I and GDPR compliant._

---

## Data landscape

| root | count |
|---|---|
| Transactions | 1,597 |
| Invoices | 634 |
| Account balances | 270 |
| Accounts | 66 |
| Documents | **0** |
| Connectors | 8 — Mercury/Plaid enabled, Mercury MCP processing, Well App + Extension enabled, **Xero + Attio degraded**, Airtable + Circleback to_configure |
