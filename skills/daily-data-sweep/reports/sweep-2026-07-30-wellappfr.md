# Daily Data Sweep — WellappFR

**Workspace:** `1c5c706f-fee3-4e5e-9fbc-746132b0647e`
**As of:** 2026-07-30T20:40Z
**Scope:** this workspace only, workspace-scoped and paged
**Mode:** cold run — no prior-sweep store exists

---

## Verdict

- **COMPLETE (are the numbers right?): `fail` — 1 red, 2 amber**
- **EXHAUSTIVE (is anything missing?): `pass (with findings)` — 3 amber (partial — several checks not evaluated)**

**This workspace is materially healthier than WELL APP INC.** — and the differences are the most
informative thing in this report, because the two workspaces run the same code against different
connectors. Where FR is clean and US is broken, the connector is the variable.

---

## COMPLETE — depth

| control point | measured | of | verdict | vs WELL APP INC. |
|---|---|---|---|---|
| `RECON-txn-no-ledger-account` | **314** transactions with `ledger_account_pk` null | 314 | 🔴 **100%** | same — 100% there too |
| `RECON-txn-uncategorized` | **46** with `category_key` null | 314 | 🟡 14.6% | **much better** (46.9% there) |
| `RECON-txn-uncategorized` (status arm) | **11** with `category_status` null | 314 | 🟡 3.5% | **much better** (38.1% there) |
| `BANK-account-currency-missing` | **0** accounts with null `currency` | 3 | ✅ pass | **clean** (95.5% broken there) |
| `BOOK-invoice-has-document` | **0** documents against 671 invoices | 671 | 🟡 amber | same shape |

### The only red is the universal one

`ledger_account_pk` is null on all 314 transactions — **identical to WELL APP INC. at 100%.** This is
the unbuilt auto-coding writer (see `root-cause-2026-07-30.md`), and it is workspace-independent by
construction: no provider config sources the field on any rail. Burn and runway fall back to the
crude "negative and not TRANSFER" heuristic here too.

### What FR proves about the US workspace

Three checks that are red in WELL APP INC. are clean or near-clean here, and FR **has no Mercury MCP
connector**:

- **Accounts: 3, all with a currency.** WELL APP INC. has 66 accounts, 63 currency-less, created in
  one ~1-second Mercury MCP batch and named after people. FR's accounts come from Pennylane and
  Qonto. This is direct confirmation that the counterparty-ingestion and currency-null defects are
  **Mercury-MCP-specific**, not general — exactly what the root-cause analysis concluded from the
  code, now corroborated by a workspace that lacks that rail.
- **Categorization: 14.6% uncategorized vs 46.9%.** Same classifier, same code, three times better.
  Worth understanding rather than celebrating — see the open question below.

---

## EXHAUSTIVE — breadth

| control point | finding | verdict |
|---|---|---|
| `ING-connector-degraded` | **Stripe** `degraded` — revenue events not arriving | 🟡 amber |
| `ING-connector-sync-in-progress` | **Pennylane** `processing` — the FR accounting source, mid-run when sampled | 🟡 amber |
| `ING-connector-not-configured` | **PayPal** and **Wise** `to_configure` — installed, never connected | 🟡 amber |

Stripe is degraded under the same re-degrade-on-success loop documented for Xero and Attio: a
run-level success emitting ≥3 FAILURE-class diagnostics re-degrades the connector, and MCP sync's
unconditional `PROCESSING` stamp re-arms the guard. Stripe is the workspace where that loop was
**proven live** — its status write landed 17ms after a sync log with `status = success`, last six
runs all successful.

**Do not reconnect.** The grant is valid; reconnecting cannot clear the flag.

**Consequence specific to FR:** Stripe is a revenue rail. While it is degraded, any receivables or
revenue figure for this workspace is computed over a knowingly partial set.

---

## The shape worth investigating: 671 invoices, 314 transactions, 3 accounts

FR holds **more invoices than WELL APP INC.** (671 vs 634) on **a fifth of the transactions**
(314 vs 1,597) and **3 accounts vs 66**.

That ratio — 2.1 invoices per transaction — means most invoices here cannot have a matching payment
in Well, so proof-of-payment coverage is structurally low regardless of matching quality. Whether
that is expected (Pennylane exports a full ledger; only Qonto-settled items appear as transactions)
or a real ingestion gap on the banking side is **not established by this sweep** and is the main
open question for the root-cause pass.

---

## Not evaluated — named, never counted as passes

- **Balance verification** over 94 balance rows — not run this pass. WELL APP INC. showed a
  deterministic first-period failure (one permanently-failing row per connected Plaid account); FR
  has Qonto via Plaid, so **the same defect is expected here and should be measured.**
- **E-invoicing readiness (gates 7–8, `IPAY-`/`EINV-`, 52 control points)** — not run, and this is
  the most material omission for a **French** entity: SIRET/VAT presence, Factur-X compliance and
  self-billing rules all live in those gates.
- **Per-month decomposition** — counts run over the full population, so month verdicts are `SAMPLED`.
- `SPINE-03` close-readiness — INCONCLUSIVE: no close-state field on the MCP surface.
- Home/non-home currency partition — INCONCLUSIVE: no home-currency field on `workspaces`.

---

## Single highest-value action

1. **Ledger accounts** — the same unbuilt writer as US. One fix serves both workspaces.
2. **Stripe** — investigate the failing syncs; do not reconnect. Revenue data is incomplete until it clears.
3. **Run gates 7–8 here specifically.** This is the French entity; e-invoicing compliance is the one
   control-point family whose absence has a regulatory cost rather than a reporting one.

---

## Handoff

COMPLETE fails on the ledger-account red, so `cash-position` and `runway-calculator` inherit the
fallback-heuristic caveat. Unlike WELL APP INC., there is **no currency gap and no counterparty
pollution** here, so per-account cash denomination is sound — the blocker is narrower.

---

## Method

Every count is an exact server-side `totalCount` with `limit: 1`, workspace-scoped. Scoped queries
issue a `nextCursor` when a page fills and return a hard `400` on an invalid field — so a zero here
is trustworthy, unlike the multi-workspace fan-out, which returns `success: true, totalCount: 0` for
an invalid field and cannot be paged.

_Well is SOC-2 Type I and GDPR compliant._

---

## Data landscape

| root | WellappFR | WELL APP INC. |
|---|---|---|
| Transactions | 314 | 1,597 |
| Invoices | **671** | 634 |
| Account balances | 94 | 270 |
| Accounts | **3** | 66 |
| Documents | 0 | 0 |
| Connectors | 8 — Qonto + Qonto (FR) + Well App + Extension enabled, **Pennylane processing**, **Stripe degraded**, PayPal + Wise to_configure | 8 |
