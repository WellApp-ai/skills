# Root-Cause Analysis — WELL APP INC. production sweep, 2026-07-30

Workspace `c3f54fe3-6189-4854-a144-6c678f94806e`. Live server-side counts: 66 accounts (63 with `currency` NULL), 270 `account_balances`, 1,597 transactions (all `ledger_account_pk` NULL), two Mercury rails (`mercury-mcp` + `plaid_ins_116794`).

---

## Executive summary

1. **63 of 66 "bank accounts" are Mercury counterparty payees**, stamped `ownership = WORKSPACE` and admitted into every canvas KPI scope — the account count and the account picker are inflated ~22x, and a counterparty row is eligible to anchor `workspace.own_company` (cascades into every invoice direction / AR / AP decision).
2. **Cash and runway are overstated by an unbounded amount today**: 8 `account_balances` rows failed reconciliation with gaps up to $29,188.96 and are still summed at face value — `cash-position.service.ts:356` never reads `verified_at` or `verification_error`.
3. **The verification finding's first hypothesis was wrong.** It is not an available-vs-booked metric mismatch; it is a first-period scope mismatch (balance seeded, then the entire historical backfill FK'd into it). Detail in Finding 2.
4. **`accounts.currency` NULL on the MCP rail is a real write-path defect but is *not* what excludes those accounts from cash** — that correction is in Finding 3.
5. **No cross-connector account dedup exists anywhere.** Today the double-count is $0 only because `mercury-mcp` does not sync `account_balance`; the moment it does, every dual-rail Mercury account is summed twice.

---

## Findings, ranked by blast radius

### Finding 1 — Mercury counterparty recipients are ingested as workspace-owned accounts

**Classification: misconfiguration · Confidence: medium**

Ranked first because it corrupts the *set of rows every other financial number is computed over*, and because it puts `workspace.own_company` — the anchor for invoice direction, AR vs AP, and every counterparty decision — within reach of a third party's identity. Its amount contribution today is $0, but only accidentally (see Finding 3).

**Mechanism.** `mercury-mcp` is a bare marketplace OAuth-DCR connector (`apps/api/src/database/seed.ts:1086-1101`, target models `["company","people","transaction","account","payment_means"]`) with **zero** repo-side mapping governance: no `packages/mcp-generator/configs/mercury*.yaml` (84 configs, none Mercury) and no `apps/api/src/mcps/mercury-mcp/` shim. Every file-backed governor on the `account` target is therefore a structural no-op:

- `getForbiddenToolsForProviderAndTarget('mercury-mcp', ACCOUNT)` returns an **empty** deny set — `resolveForbiddenToolsPath()` resolves `<__dirname>/<slug>/forbidden-tools.json`, absent file → `{}` (`apps/api/src/mcps/forbidden-tools-registry.ts:16`, `:40-56`, `:84-88`).
- `getPinnedToolsForTarget` returns `[]` by the identical absent-file pattern (`apps/api/src/mcps/pinned-tools.helper.ts:33-54`).
- Tool choice is left entirely to the LLM jury, which is explicitly told to pick **one or more** tools per target (`apps/api/src/services/agents/mcp/tool-selection-jury.service.ts:57`), against an ACCOUNT task text reading "bank accounts, sub-accounts, card accounts, wallets — the things money moves through" (`apps/api/src/services/mcp-connector.service.ts:2820-2821`) — a description a recipients/payees listing endpoint matches. Dispatch at `apps/api/src/services/sync-config.service.ts:424`.
- All selected tools' rows are merged into one `allEntities` array in a single pass, each stamped `__well_source_tool_name` (`sync-config.service.ts:1118-1126`). **One run, one target, N tools** — the observed ~1-second 66-row batch.

Persistence then fails open twice:

- `account.ownership = accountOwnershipForTool(accountSourceTool)` (`apps/api/src/services/connector.service.ts:2163`) is the only counterparty guard on the entire persister, and it **labels, never rejects**. `ACCOUNT_OWNERSHIP_BY_TOOL` contains **only Wise** tool names (`apps/api/src/constants/account-ownership-by-tool.const.ts:33-52`); any unmapped tool returns `AccountOwnership.WORKSPACE` as a documented "safe default" (`:63-66`). Mercury recipients are therefore stamped workspace-owned.
- The `case "account"` persister (`connector.service.ts:2072-2240`) writes every mapped row unconditionally; no ownership or semantic gate before insert.
- The in-code comment at `connector.service.ts:2152-2162` already names this exact failure shape verbatim — *"the aggregate is ambiguous when an account target syncs from more than one tool (e.g. recipientList + balanceList on one page)"*. The mechanism was anticipated for Wise and never generalized.

**Why duplicate person names.** Dedup on this path is `workspace + account_external_id` only (`connector.service.ts:2073`, `:2089`). The inline persister bypasses `AccountRepository.create` entirely, so `resolveDedupPk` and the IBAN / routing+account_number natural-key re-link (`apps/api/src/database/repositories/account.repository.ts:21`, `:42-55`) never run. Several recipient records for the same human carry distinct provider ids → distinct rows.

**Downstream.** `apps/api/src/services/canvas/account-selector.ts:19`, `:154-156` admits every `ownership = WORKSPACE` account into cash-position, cash-forecast, burn, cost-structure and runway scope. `mercury-mcp` is also in `MCP_OWN_BANK_CONNECTOR_SLUGS` (`apps/api/src/services/enrichment/identity/self-record/mcp-bank-self-record.ts:13`) and own_company anchoring is gated on `accountOwnershipForTool(...) === WORKSPACE` (`:32`) — unconditionally true here.

**Verifier correction to the original wording (stated as a correction, not as the original claim):** the own_company guard is slightly *stronger* than the claim asserted. `bankAccountHolderToSelfRecord` (`apps/api/src/services/enrichment/identity/self-record/self-record-adapters.ts:154-172`) requires positive organisation evidence — an org-shaped `holder_type` (`/^(organi[sz]ation|company|business|corporate)$/`) **or** a non-empty `holder_tax_id_value` — and a missing `holder_type` is not treated as an organisation. The risk is narrower than "only `holder_type === organization` stands in the way", but it is not closed.

**Blast radius (direction).** Account **count** and every account-picker / bank-selection UI: inflated ~22x (66 shown, ~3 real), showing 63 people's names as the company's bank accounts. Cash **amount**: $0 error today (these rows carry no balances). Identity: `own_company` mis-anchorable from a counterparty, which would invert invoice direction and AR/AP classification workspace-wide.

**Fix (on-sync only, no backfill).**
1. Create `apps/api/src/mcps/mercury-mcp/forbidden-tools.json` denying Mercury's recipient/payee listing tool(s) for the `account` target — read with no other wiring by `loadProviderForbiddenTools` (`forbidden-tools-registry.ts:16`); the tool leaves the jury's candidate set before selection. **The exact tool name must be read from the live captured tool universe** (`connectors.capabilities.tools` / `workspace_connectors.installed_capabilities.available_tools` for workspace_connector `5fb9c28e-6ffd-4e39-9bb5-574bc65232b0`) — it is not in the repo.
2. Add those tool names to `ACCOUNT_OWNERSHIP_BY_TOOL` as `AccountOwnership.COUNTERPARTY` (exact lookup, no substring matching — root `CLAUDE.md`).
3. **Durable fix, separate ticket:** replace the fail-open `WORKSPACE` default at `account-ownership-by-tool.const.ts:64` with `UNKNOWN`, and gate persistence + own-company anchoring on *positive* workspace-ownership evidence rather than on the absence of a mapping. The canvas selector already handles UNKNOWN via the own_company FK anchor, so the number degrades to "excluded with a data-quality reason" instead of silently inflating.

**Acceptance:** fresh workspace → connect Mercury MCP → sync → `accounts` contains only real Mercury bank accounts (all non-null currency), zero rows named after a person.

---

### Finding 2 — `account_balances` verification: the first hypothesis was WRONG; the real cause is a first-period scope mismatch

**Classification: broken · Confidence: high (corrected mechanism) · Original hypothesis: REFUTED**

> **The originally investigated hypothesis — that the verifier compares the AVAILABLE series (`closing_value − opening_value`) against booked transaction movement, so pending float produces the residual — did not survive the refutation pass and is wrong.** Its citations were individually accurate, but its named mechanism, its explicit exclusion of the period explanation, and its numeric-fit argument were all incorrect. It also inverted Plaid's semantics: `current` is the total *including* pending; `available` is current minus holds — the opposite of what the hypothesis asserted, and contrary to the repo's own stated semantics at `apps/api/src/services/canvas/cash-position.service.ts:346-352`. What follows is the verifier's corrected explanation.

**Corrected mechanism.** Ordering inside `PlaidService.persistPlaidStateForWorkspace` (`apps/api/src/services/plaid.service.ts:2529`, the single entry point for every sync):

- **step 6** (`:2263-2288`) — if the account has no open `AccountBalance`, seed one *now* from the balances Plaid reports at this instant.
- **step 7** (`:2294`) — `syncAndProcessTransactions`. On the first sync the cursor is `""`, so Plaid drains the **entire ~24-month backfill**, and every drained transaction is FK'd to that just-seeded open balance (`:1795-1801`, `:1613`).
- then `:2022-2040` — `closeAndCreateAccountBalance` closes that same row with `closing_value = available now`.

Verification therefore computes `expected = available_now − current_at_seed` (`apps/api/src/services/account-balance-verification.service.ts:66`) — a delta spanning a few **seconds**, effectively zero — against `calculated =` the sum of the **entire transaction history**, because `TransactionRepository.findByAccountBalance` (`apps/api/src/database/repositories/transaction.repository.ts:311-323`) selects purely on `account_balance_pk` with **no date window**. The residual is the whole backfill.

This is deterministic: **exactly one permanently-failing balance row per connected Plaid account**, which fits 8 of 270 far better than "a handful of accounts happened to have pending holds at connect". `verified_at` is stamped only on the pass branch (`account-balance-verification.service.ts:164-169`) and `findUnverifiedBalances` filters `verified_at: null` (`apps/api/src/database/repositories/account-balance.repository.ts:467-473`), so those rows are re-picked and re-fail on every scheduler run **forever**.

The opening_booked/opening_value **swap between the two writers is real and confirmed** — roll-forward seeds `opening_booked = current, opening_value = available` (`plaid.service.ts:1578-1579`) while the initial seed writes `opening_booked = available, opening_value = current` (`plaid.service.ts:2278-2279`) — but it only adds the connect-time pending float on top of the backfill term. The original claim that the first-closure error is *"independent of any transaction activity"* is false.

**Confirmed secondary defects on the same path** (real, but not the cause of the 8 stuck rows — schedule separately):
- No status filter: PENDING transactions are persisted (`plaid.service.ts:1643-1647`) and summed by the verifier (`account-balance-verification.service.ts:72-83`).
- No currency filter: `instructed_amount.amount` is summed across mixed currencies with no check against `accounting_balance.currency` (`:78-83`).
- Retroactive mutation of a closed period: `existing.account_balance = accountBalance` is assigned unconditionally on modify (`plaid.service.ts:1950-1952`); soft-deleted removals erode a closed sum the same way (`:1996-2001`, and `findByAccountBalance` filters `deleted_at: null`).
- Fanout targets' closed rows are never verified inline (`plaid.service.ts:2575`).
- MCP balance rows verify as a **spurious PASS**: `resolveAccountBalanceRow` sets `opening_booked = opening_value = closing_booked = closing_value = balance` (`apps/api/src/helpers/account-balance-mapping.helper.ts:80-88`), and MCP transactions never receive an `account_balance` FK — so 0 vs 0.
- Persisted evidence is truncated: `calculated_balance_diff` / `expected_balance_diff` are `numeric(10,0)` (`apps/api/src/database/migrations/Migration20260102111942.ts:28`) — the recorded gap loses its cents.

**Blast radius (direction): cash and runway OVERSTATED.** `CashPositionService` sums the latest balance per account via `closing_booked ?? opening_booked` (`cash-position.service.ts:356-361`) and applies **no verification filter** — it never inspects `verified_at` or `verification_error`. The 8 failed balances, residuals up to $29,188.96, are counted at full face value in the headline cash figure, and `runway.service.ts:100` consumes that total as a pre-converted scalar, so runway inherits the overstatement with no signal at the runway layer.

**Fix (on-write only).**
1. `plaid.service.ts:2278-2279` — swap to `opening_booked: currentValue, opening_value: availableValue` so both writers use the same metric assignment as `:1578-1579`.
2. Scope the comparison to the period the balance actually covers: give `findByAccountBalance` (or the verifier's query) a `balance_at_from`/`balance_at_to` window so a first-sync historical backfill is not attributed to a seconds-long seed period. Without this, (1) alone does not fix the 8 rows.
3. `account-balance-verification.service.ts:66` — verify the settled series against settled movement (`closing_booked − opening_booked`); at `:78-83` skip `TransactionStatusEnum.PENDING` and skip transactions whose `instructed_amount.currency` differs from `accounting_balance.currency`, counting the skips into `verification_error_detail` rather than silently adding unlike units.
4. `plaid.service.ts:1950-1952` — only assign `existing.account_balance` when it is currently null, so a pending→posted modify cannot move a transaction out of a closed period.
5. Independently: `cash-position.service.ts:356` should exclude or flag balances with `verification_error = true` rather than trusting them silently.

**Acceptance:** fresh workspace → connect a Plaid bank → first sync → the first closed balance verifies (`verified_at` non-null, `verification_error` false) instead of failing permanently.

---

### Finding 3 — `accounts.currency` is NULL on the MCP rail (63/66)

**Classification: broken (write path) + unbuilt (missing `account_balance` target) · Confidence: high on root cause; the original consequence chain was corrected**

**Mechanism.** `apps/api/src/services/connector.service.ts:2188` is a bare pass-through: `account.currency = entityData.currency as string | undefined;` — no `CURRENCY_VALUES` validation, no default, no workspace-base fallback. It is the odd one out on its own loop (`type` falls back to `AccountTypeEnum.OTHER` with a warn at `:2189-2205`; `subtype` is set-membership-checked at `:2206-2210`) and in its own file (invoice `local_currency` `:1379-1381` and transaction `instructed_amount.currency` `:1824-1826` both validate and fall back to EUR). No other writer can repair it: the only other `Account.currency` assignment in the repo, `apps/api/src/database/repositories/account.repository.ts:71`, is gated on `if (data.currency)`.

The Plaid rail never emits null — `currency: plaidAccount.balances.iso_currency_code || "USD"` (`apps/api/src/services/plaid.service.ts:1345`) — so the defect is **rail-specific**, and the 3 accounts that do carry a currency are the Plaid-sourced ones.

It went unmapped for Mercury for the same reason as Finding 1: no shim, no generator YAML, hence no `slot-mappings.json` / `hints.md` / `tools.json`. The currency slot is **UNMAPPED (not pinned null)** and re-guessed per run by LLM JSONata against recipient payloads that carry no account-level ISO-4217 field. `mcp-connector.service.ts:567` declares `currency (optional)` and `:593` is `currency: s.currency ?? undefined` — no server-side backstop.

**Verifier correction (stated as a correction).** The originally proposed consequence chain — empty-string sentinel `currency: asNonEmptyString(row.currency) ?? ""` at `apps/api/src/helpers/account-balance-mapping.helper.ts:85` defeating the `ab.currency ?? account.currency ?? baseCurrency` fallbacks at `cash-position.service.ts:369` and dropping the accounts at `:383-396` — **is not the path these rows take**. `seed.ts:1104` shows `mercury-mcp`'s `supported_target_models` = `["company","people","transaction","account","payment_means"]` — `account_balance` is **absent** — and `resolveAccountBalanceRow` is reachable only from `case "account_balance":` (`connector.service.ts:2246`). These accounts have no `accounting_balance` JSONB at all and are excluded earlier by the `if (!balance?.accounting_balance)` guard (`cash-position.service.ts:~336`, `missingBalanceCount`). They never reach the unknown-currency branch or the *"N accounts have an unsupported currency code"* hint at `:468`.

**Blast radius (direction).** No cash-amount error attributable to the NULL currency today. The rows contribute $0 to cash-position, cash-forecast and runway because they carry no balance at all — and, since they are counterparty payees (Finding 1), that $0 is accidentally correct. The user-visible harm is a **permanently degraded / `partial: true` cash surface** with 63 in-scope-but-excluded accounts, attributed by the hint copy to the wrong cause. This is a data-integrity defect on the write path, not a number-wrong defect.

**Ordering hazard — land these together.** Fix the currency without fixing ownership (Finding 1) and, once `account_balance` is ever enabled for `mercury-mcp`, counterparty balances start summing into the workspace's own cash: the error flips from *excluded* to **overstated**. Sequence: Finding 1 first, then currency.

**Fix (on-write only).**
1. `connector.service.ts:2188` — mirror the sibling fields: accept the mapped value only if it is a valid `CURRENCY_VALUES` member; else the currency on the account's own synced balance row; else the workspace base currency (`WorkspaceAccountingSettings.base_currency` via `getWorkspaceBaseCurrency`). Warn-log the fallback exactly as the adjacent `type` fallback does, so an unmapped provider slot is visible in sync diagnostics instead of silently producing NULLs.
2. Have the MCP rail call `WorkspaceAccountingSettingsService.deriveFromBankAccounts` the way the Plaid rail does (`plaid.service.ts:2218-2224`) — today only Plaid seeds the base currency.
3. Author `packages/mcp-generator/configs/mercury.yaml` with a pinned `slot_mappings` entry for the account `currency` slot and `hints:` distinguishing own-balance tools from recipient tools, then run the generator. Do not hand-edit generated files.
4. Separately scoped as **unbuilt**: add `account_balance` to `mercury-mcp`'s `supported_target_models` so the connector reports balances at all. This is new work, not a bug fix, and must not be scheduled with (1)-(3).

**Acceptance:** fresh workspace → connect `mercury-mcp` → own-balance accounts carry a non-null ISO-4217 currency; recipient rows are classified COUNTERPARTY and absent from canvas scope.

---

## The two-Mercury-rails question — answered explicitly

**Cross-connector account dedup does not exist.** Facts:

- The MCP account upsert keys **solely** on `account_external_id` via `pkByExtId` (`connector.service.ts:2089`, `:2143-2147`) and **never calls `resolveDedupPk`**.
- Even if it did, the registered account dedup rules require `iban`, or `account_number` + one of `bic`/`routing_number`/`sort_code` (`apps/api/src/services/reconciliation/entity-rules.ts:147-172`) — none of which a Mercury MCP row carries.
- The natural-key re-link that would collapse the same real account arriving on two rails lives only in `AccountRepository.create` (`account.repository.ts:42-55`), which the MCP sync path bypasses entirely. Its own comment names Mercury as an un-dedupable case.

**Consequence today:** the same real Mercury account exists as **two `Account` rows** with different external ids — one from `plaid_ins_116794`, one from `mercury-mcp`. Cash is **not** double-counted right now, and for one reason only: `mercury-mcp` does not sync `account_balance` (`seed.ts:1104`), so the MCP twin has no balance and contributes $0. The account count and picker are already double-counted.

**Consequence the moment `account_balance` is added to `mercury-mcp`** (which Finding 3's fix #4 would do): every dual-rail Mercury account is summed twice and **cash position and runway become overstated by the full duplicated balance**, with no verification signal — MCP balance rows verify as a spurious 0-vs-0 pass (`account-balance-mapping.helper.ts:80-88`). **Do not enable the `account_balance` target for `mercury-mcp` before a cross-rail dedup key exists.**

---

## Classification split — schedule as four separate pieces of work

| # | Work item | Classification | Files |
|---|---|---|---|
| A | Mercury has no shim: no forbidden-tools, no pinned tools, no slot mappings — every ACCOUNT-target governor is a no-op | **misconfiguration** | new `apps/api/src/mcps/mercury-mcp/forbidden-tools.json`; new `packages/mcp-generator/configs/mercury.yaml` |
| B | Fail-open `WORKSPACE` default on an unmapped tool; persister has no ownership gate | **broken** | `account-ownership-by-tool.const.ts:63-66`; `connector.service.ts:2072-2240`; `mcp-bank-self-record.ts:32` |
| C | Verification first-period scope mismatch + swapped opening_* writers + pending/currency/closed-period defects; cash ignores `verification_error` | **broken** | `plaid.service.ts:2263-2294`, `:2278`, `:1950`; `account-balance-verification.service.ts:66,78,165`; `transaction.repository.ts:311`; `cash-position.service.ts:356` |
| D | MCP account `currency` write has no validation/fallback | **broken** | `connector.service.ts:2188` |
| E | `mercury-mcp` has no `account_balance` target; no cross-rail account dedup key | **unbuilt** (blocked on B + a dedup key) | `seed.ts:1104`; `connector.service.ts:2143`; `entity-rules.ts:147` |
| F | The sweep reported "8 balances failing" without direction or attribution | **measurement-error** | see final section |

No item here is a backfill, and none may become one. Per root `CLAUDE.md`, historical rows in this workspace are stale test data; the acceptance test for every item is a fresh workspace flowing end to end.

---

## Hypotheses needing verification (not evidenced by the repo)

1. **Mercury exposes a recipients/payees listing tool and the jury selected it for the ACCOUNT target.** Not provable from the repo — no `tools.json` exists for Mercury. Inferred from the observed data (person names, duplicates, 63/66 NULL currency). *The missing-governance root cause holds regardless of which extra tool the jury picked.* **Verify by:** reading `connectors.capabilities.tools` and `workspace_connectors.installed_capabilities.available_tools` for workspace_connector `5fb9c28e-6ffd-4e39-9bb5-574bc65232b0`, and the `__well_source_tool_name` distribution across the 66 rows.
2. **The 3 currency-bearing accounts are the Plaid-sourced ones.** Strongly implied by `plaid.service.ts:1345` but not confirmed against the live rows. **Verify by:** grouping the 66 accounts by `source_workspace_connector_id` × `currency IS NULL`.
3. **The 8 failing balances are one-per-connected-Plaid-account.** The corrected mechanism predicts exactly this. **Verify by:** checking whether the 8 rows are each an account's *earliest* closed balance, and whether the workspace has exactly 8 Plaid-linked accounts with transaction history.
4. **A simpler alternative for Finding 1** — a single mis-mapped tool feeding the ACCOUNT target rather than a two-tool fan-out — lands on the same root cause and the same missing guards. Weakly contradicted by the ~3 rows that do carry a currency.
5. **Whether `people` / `company` targets are also mis-fed by the same tool** for `mercury-mcp`. Unchecked; the deny-list fix should extend to them if so.
6. **The 1,597 transactions with `ledger_account_pk` NULL** were noted in the sweep but not investigated here. No root cause is offered and none should be assumed.

---

## What this means for the sweep skill itself

The sweep produced accurate counts and an inaccurate picture. Three concrete changes:

1. **Report ownership and source, not just row counts.** "66 accounts" is not a finding; "63 accounts with `ownership = WORKSPACE` whose `__well_source_tool_name` is a single non-balance tool" is. The sweep should group `accounts` by `source_workspace_connector_id` × `ownership` × `currency IS NULL` and flag any connector contributing >80% of the account rows in one second.
2. **Report direction, not incidence.** "8 balances failing verification" gave no indication that cash is *overstated* by up to $29,188.96 because `cash-position.service.ts:356` applies no verification filter. Every sweep control point should answer *which user-facing number, wrong in which direction, by how much*. This is the `measurement-error` item (F) in the classification table.
3. **Add a cross-rail duplicate control point.** Two connectors of the same provider feeding one workspace with no shared dedup key is a standing correctness hole the current sweep does not test for. Detect: same workspace, two `workspace_connectors` for the same underlying institution, ≥1 `Account` pair with no shared `iban`/`account_number`.

Finally: **the adversarial refutation pass earned its cost.** One of three findings had its named mechanism refuted despite every individual citation being accurate, and a second had its consequence chain corrected. A sweep that reports investigation output without a refutation pass will ship confidently-cited wrong mechanisms — and in this case would have sent an engineer to fix pending-float handling in a verifier whose actual bug is that a 24-month backfill lands inside a seconds-long balance period.