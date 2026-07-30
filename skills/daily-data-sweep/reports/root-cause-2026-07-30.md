# Root-Cause Analysis — Four Reds from the Live Data-Quality Sweep

**Date:** 2026-07-30 · **Scope:** Well production workspaces (`c3f54fe3` WELL APP INC., `1c5c706f` WellappFR) · **Method:** server-side exact counts, then per-finding code trace with an adversarial refutation pass on every claim.

---

## Executive summary

1. **Runway and cost-structure numbers are computed off fallback rungs today** because `transactions.ledger_account_pk` is 100% NULL — an unbuilt writer, not a failure; burn is the crude "negative and not TRANSFER" heuristic (`burn.service.ts:29-38`).
2. **41.6% of transactions carry no category key** and 619 carry no status at all; the typed status state machine shipped half-wired (three enum members are declared and never assigned), so "never tried", "halted", and "crashed" are the same NULL, and the self-heal sweeper structurally excludes both populations.
3. **The 86% "invoices missing a document" red is mostly the sweep's own fault** — a global `document_pk IS NULL` count with no join through connector `data_domains`; the underlying capability (pull a source PDF off Xero/Pennylane) is unbuilt, and the connector→document link is dead across *every* provider.
4. **Xero/Stripe/Attio degraded simultaneously from one shared code path**, not three coincidences: every clean sync re-trips a fixed 3-diagnostic threshold and re-degrades. It self-clears only in theory; in practice it loops forever, and the one user-visible hint advises a reconnect that cannot possibly work.
5. Three of the four are **unbuilt or half-built capability**, one is **live broken behavior** (the degrade loop), and one is **also a measurement error in the sweep**. Fixes below are all on-write; no backfill is proposed.

---

## Finding 1 — `transactions.ledger_account_pk` 100% NULL (1,911/1,911)

**Class:** unbuilt feature. **Confidence:** high (mechanism), high (absence proven by exhaustive grep). **Blast radius: highest — it reaches runway.**

### What's wrong today, in user terms
- **Trailing burn, and therefore runway**, falls back to "negative amount and not TRANSFER". The ledger-based EXPENSE-account outflow filter is explicitly written but unimplemented pending this field (`apps/api/src/services/canvas/burn.service.ts:29-38`).
- **Canvas Cost Structure** rung 1 (`ledger_account.name`, requires ≥50% populated) can never elect, so every workspace silently drops to the LLM-category rung (`apps/api/src/services/canvas/cost-structure.service.ts:298-302`). The pie is category-flavoured, not GL-accurate.
- **Well posts no categorizing journal entries of its own** from bank transactions. The 118 journal entries present are consistent with connector import only.
- The schema advertises a capability that does not exist: `packages/shared/src/generated/column-contexts.json:7110` says this field is *"AI computed … assigned to this transaction via auto-coding."*

### Mechanism
Two runtime write paths exist; neither can fire here.

**Path A — connector sync.** `apps/api/src/services/connector.service.ts:1950-1955` sets `tx.ledger_account` only when the JSONata mapping emits `ledger_account_account_number`. No provider config anywhere sources that slot for the transaction target: Pennylane, Qonto and iBanFirst pin it to `{"null": true}` with rationales stating the provider payload carries no chart-of-accounts code (`apps/api/src/mcps/pennylane/slot-mappings.json:55`, `apps/api/src/mcps/qonto/slot-mappings.json:88`, `apps/api/src/mcps/ibanfirst/slot-mappings.json:64`); the rest define no such slot at all.

> *Correction to the original claim:* the first write-up said "every provider's slot is PINNED to null." That overstates it — three pin it, the others never define it. The accurate statement is that **no provider config sources it for the transaction target**.

**Path B — invoice-JE write-back**, `apps/api/src/services/accounting/invoice-transaction-journal-entry.service.ts:322-331`, nested inside three gates:
- Gate A: payment-settlement JE must persist (`:248`).
- Gate B: source connector slug must be in `BANK_SOURCE_CONNECTOR_SLUGS = ["plaid","mercury","mercury-mcp","qonto"]` (`apps/api/src/constants/connector.const.ts:45`, applied at `:307-309`) — Xero and Pennylane are deliberately excluded.
- Gate C: `pickCategorizingLineFromInvoiceJe` needs `je.source_entity_type = 'invoice' AND je.status = 'DRAFT'` (`apps/api/src/database/repositories/journal-entry.repository.ts:118-127`).

Gate C is the systematic killer. Connector-synced invoice items are stamped by the deterministic fallback with `rawFacts: undefined`, resolving to needs_review/missing_accounting_facts (`connector.service.ts:1536-1554`), so the invoice JE builder halts at `missing_item_classification` (`invoice-journal-entry-draft.builder.ts:107-110`). The code comment at `connector.service.ts:1605-1610` states this halt is the **expected** outcome. No invoice DRAFT JE ⇒ `picked` is always null ⇒ write-back skipped for every row.

The classifier that *does* run writes only the text `ledger_account_role` (`transaction-category.service.ts:133`) and never resolves it to a `LedgerAccount` FK — the entity comment says so itself (`Transaction.ts:150-157`). The FK: `Transaction.ts:219`.

Two sharpenings from verification:
- There is a **third** writer, uncited originally: `apps/api/src/database/seed-canvas-data.ts:259`, a manual QA canvas seed gated by a `[QA-Canvas] Salaries` sentinel. Consistent with 100% NULL; conclusion unchanged. This is what `burn.service.ts:29` means by *"once the workspace seeding consistently populates ledger_account."*
- Gate C is unreachable **in these workspaces**, not structurally impossible. `PostingRetrySweeper` can re-drain a halted invoice JE if classification is ever filled. The write-back is **dormant**, not dead.

The backfill migration that already shipped (`Migration20260530012307_backfill_ledger_account_pk_from_invoice_je`) uses the same invoice-JE derivation and therefore updated zero rows; its own header states the field *"was added on Migration20260306100000 (line 169) but no service code ever wrote to it."*

### Fix (source, on-write)
Build the missing writer where the classifier already decides accounting intent. In `apps/api/src/services/transaction-category.service.ts` — the auto-write branch that today sets only `ledger_account_role` at `:133` — resolve that semantic role to a concrete ledger account via the existing per-workspace `WorkspacePostingMapping` lookup (`apps/api/src/database/repositories/workspace-posting-mapping.repository.ts:330/360`, seeded by `WellCoaWorkspaceSeeder`, `workspace.service.ts:778`, swept by `chart-of-accounts-seed-sweeper.service.ts:139`) and set `transaction.ledger_account` in the same write under PRESERVE semantics (only when currently null, workspace-scoped, `deleted_at: null`). Keep the invoice-JE write-back as the higher-precedence source when it does fire.

Secondary, non-blocking: either implement this or correct `column-contexts.json:7110`, which currently advertises a writer that does not exist.

**Do not backfill.** Acceptance test: fresh workspace → connect a bank → sync → assert `ledger_account_pk` populated for classifier-touched rows, and that cost-structure rung 1 elects.

---

## Finding 2 — 795/1,911 transactions with `category_key` NULL; 619 with `category_status` NULL

**Class:** broken/half-wired code (not unbuilt — the writers exist, the terminal paths don't stamp). **Confidence:** high on mechanism, **low on the mix** (see hypotheses). **Blast radius: second — feeds a rung that is near a cliff, plus period-close coverage.**

### What's wrong today
`category_key`/`category_status` have no consumer in `apps/web` or the Hasura record views (grep finds them only in `apps/web/src/features/data-model/erd-model.json`), so direct UI damage is limited. But everything derived from "is this transaction categorized" reads the older, overloaded `category_normalized IS NULL` and inherits the same ambiguity:
- Period-close source-coverage gate (`period-coverage.repository.ts:82,121,223,232`).
- Cost-structure rung 2 requires `category_normalized` ≥50% populated (`cost-structure.service.ts:41,307-311`). At 795/1,911 uncategorized this sits **near the cliff** and can silently drop to the `transaction_type`/`uncategorised` rung.
- Any expense-breakdown or sweep answer reporting an uncategorized count.

The worse operational damage is observability: a halted classification is recorded as a **COMPLETED** enrichment task whose only trace is the `output` JSON blob; `logDecision` is never reached on halt paths (`transaction-category-enrichment.service.ts:149` runs only after classification). No metric distinguishes "never tried" from "gave up".

### Mechanism
`category_key` has exactly two writers, `category_status` three — all in `TransactionCategoryService`: `:73-74` (user override), `:109-115` (status-only), `:122-123` (classifier auto_write). A repo-wide grep over apps/packages/scripts finds no other writer of either column. Therefore `{key IS NULL} ⊇ {status IS NULL}` by construction.

**The 176-row asymmetry (795 − 619)** is exactly the `:109-115` status-only branch: `needs_review` (0.55 ≤ confidence < 0.85) → `CLASSIFIER_ABSTAINED`; `rejected` (invalid category / unknown flow / confidence < 0.55) → `CLASSIFIER_FAILED`; key deliberately untouched (comment `:103-106`). Thresholds: `transaction-category-validator.ts:97-113`, `types.ts:3-6`. Plus a small tail of free-text user overrides that land CATEGORIZED with a null key, because `buildCategoryKeyFromLabel` is exact-match-only over the 46-entry catalog (`constants/transaction-category.const.ts:86-88`).

**The 619 with no status at all** never reached that write. Nothing stamps a status at enqueue time (`enqueue.ts:50` creates a PENDING `EnrichmentTask` and touches no transaction column; a Cloud Tasks dispatch failure is only logged at `:89-91` while the task row survives), at halt time (`worker.service.ts:865-873` marks the task COMPLETED with `output = {status:'halted'}` and writes no transaction column), or at failure time (`enrichment-stuck-reaper.service.ts:231-240` terminal-fails the task row only). And `Migration20260623110000_transaction_category_typed_fields.ts:37-41` added all three columns NULL with no backfill and an explicit note at `:16-17`: *"No NOT NULL here — the deterministic backfill … is a follow-up."*

`TransactionCategoryStatusEnum.PENDING`, `.UNCATEGORIZED` and `.LEGACY_UNMAPPED` are declared (`constants/transaction-category-status.const.ts:8-15`) and **assigned nowhere in the repo**. The state machine built to eliminate an ambiguous NULL reproduces it.

The only self-heal path cannot converge: `findUncategorizedNeverEnqueued` is `category_normalized IS NULL AND NOT EXISTS (a transaction_category task)` (`transaction.repository.ts:46`). Any row that already has a task (halted, failed, abstained) or already carries a pre-migration label is excluded **forever** — a fact the sweeper's own doc comment admits (`categorization-sweeper.service.ts:26-29`). Queue backlog is not a candidate explanation: 30-min interval, 500/pass (`categorization-sweeper.service.ts:42`) against 1,911 live rows.

### Refuted sub-claim — say it plainly
The first hypothesis blamed part of the 619 on **`category_catalog_empty`**, reasoning that `TransactionCategoryCatalogSeeder` runs only inside `createWorkspace` (`workspace.service.ts:803`), so pre-2026-06-23 workspaces have an empty allow-list and halt every transaction. **That is wrong and has been removed.** `Category` is a **global** table with no workspace FK — stated outright in `transaction-category-catalog-seeder.service.ts:20-28`, confirmed by `entities/Category.ts` having no workspace relation — and the catalog lookup at `transaction-category-enrichment.service.ts:71-80` applies **no workspace filter**. The allow-list is environment-wide: once any workspace was created after the seeder shipped, all 46 labels are visible to every workspace of every vintage. Since the environment has a large CATEGORIZED population, its catalog is demonstrably non-empty. `category_catalog_empty` contributes **zero** rows.

The surviving contributors: (a) rows categorized before 2026-06-23 and never backfilled; (b) pre-classifier halts — `insufficient_features` (`:106-114`, gate at `transaction-category-features.ts:66-79`), `user_category_protected` (`:91-99`), `transaction_not_found` (`:61-69`); (c) terminally FAILED / dead-lettered tasks; (d) never enqueued (subscriber drops unresolvable-workspace inserts, `transaction.subscriber.ts:95-104`).

### Fix (source, on-write, no backfill, no LLM re-run)
1. `enqueue.ts:50` — in the same unit of work that creates the `EnrichmentTask`, set `category_status = PENDING` when NULL. "Queued" stops looking like "never attempted".
2. `transaction-category-enrichment.service.ts` — stamp a terminal status on **every** halted return (`:61`, `:91`, `:106`): `insufficient_features` → `UNCATEGORIZED`; `transaction_not_found` → `CLASSIFIER_FAILED` (retryable infra fault); `user_category_protected` → `CATEGORIZED` (the user's label is the answer).
3. `worker.service.ts:865` — in the catch / terminal-FAILED path for `TRANSACTION_CATEGORY`, stamp `CLASSIFIER_FAILED` so a dead-lettered task is visible on the row.
4. Once statuses are stamped, change the sweeper predicate (`transaction.repository.ts:46`) from `category_normalized IS NULL AND NOT EXISTS(task)` to `category_status IS NULL`. That is the correct never-attempted set and it converges by construction.

Acceptance test: fresh workspace, connect a bank, sync, assert **zero** `category_status IS NULL`.

---

## Finding 3 — Xero / Stripe / Attio simultaneously `degraded`

**Class:** broken code — a live re-degrade-on-success loop. **Confidence:** high (mechanism proven by elimination + live re-query); the specific diagnostic reasons crossing the threshold are unverified. **Blast radius: third — mostly invisible to users, but actively misleading where visible, and it impairs the accounting source behind the 118 JEs.**

> **Note on a prior contradiction:** an earlier reviewer reported "there is no such status." They were reading the local working tree (`feat/book-closer-component`), which predates `Migration20260708120000` and whose `workspace-connector-status.const.ts` has no `DEGRADED`. Every citation below is against `origin/develop`.

### Mechanism
`degraded` is a real stored `core_api.status_enum` value (`Migration20260708120000_workspace_connector_degraded_status.ts:19`), declared with a contract at `constants/workspace-connector-status.const.ts:10-18`: grant still valid, distinct from `NEED_RECONNECT`, *"clears itself back to ENABLED on the next successful sync, no user action required."*

Exactly one writer: `markSyncDegraded` (`workspace-connector.service.ts:1226` → `transitionStatus(ENABLED → DEGRADED)` at `:1231`), reached only from `reevaluateSyncHealth` (`:1093`), invoked only from the single terminal-sync chokepoint `workspace-connector-sync-log.service.ts:245`. Exactly one clearer: `clearSyncDegraded` (`:1322`), reachable only from the clean-success branch at `:1112`. Auth failures route to `NEED_RECONNECT`/`ERROR` (`mcp-oauth.service.ts:1032`), never `DEGRADED` — a shared token-refresh cause is ruled out.

Two entry conditions, both OR'd against one global `CONNECTOR_SYNC_FAILURE_THRESHOLD = 3` (`constants/connector-staleness.const.ts:17`; staleness 7d at `:14`; alert cooldown 24h at `:20`; decision logic `helpers/connector-staleness.helper.ts:47`):
- **(a) FAILURE path** — errored run + (no success in 7d, or ≥3 error runs, or ≥3 FAILURE diagnostics since last success) (`:1182`).
- **(b) SUCCESS-WITH-DROPS path** — a run-level *success* that itself wrote ≥3 FAILURE-class diagnostics inside its own window (`runDroppedEnoughToDegrade`, `:1146`) — and it **returns before clearing**.

Branch (b) is what is firing. `FAILURE_REASONS` is a **default-DENY** set (`entities/ConnectorSyncDiagnostic.ts:82` — everything not in `INFORMATIONAL_REASONS` at `:59`), so structural, non-actionable reasons — `empty_result`, `fk_parent_missing`, `no_suitable_tool`, `mapped_entities_dropped` — all count toward the 3.

**The closing mechanical link** (asserted but not explained in the first write-up): `connector.service.ts:919` stamps `status = PROCESSING` **unconditionally** at MCP-sync start, clobbering the resting `DEGRADED`. `exitProcessing` then flips PROCESSING → ENABLED on completion, which re-satisfies `markSyncDegraded`'s `WHERE status = ENABLED` guard. Without that unconditional write the ENABLED-only guard would make a re-degrade from a degraded resting state impossible. Loop: DEGRADED → PROCESSING → ENABLED → DEGRADED, every cycle.

**Live proof.** 2026-07-30: 292 sync logs in `c3f54fe3`, all `success`. Xero `be2b7833` degraded, `updated_at` 19:51:05.726 vs log completed 19:51:05.702 (~24ms). Attio `c3e8ebdb` 19:30:48.552 vs 19:30:48.530. On re-query an hour later, Stripe `06ee4e79` was still degraded but its `updated_at` had **advanced** to 20:21:22.888, 17ms after a sync log with `status = success` (started 20:21:01.067, completed 20:21:22.871); its last six runs are all `success`. Since `transitionStatus` (`:1358`) stamps `updated_at` only on an actual flip, these are live status writes on successful runs — not a stale one-off flag.

**Precedent — this is a known, shipped failure mode.** `Migration20260727120000_correct_wise_supported_target_models.ts:8`: six over-claimed target models meant *"every sync produced a permanent no_suitable_tool diagnostic for each of them and the connector never left `degraded`, even on an otherwise-clean sync."* Same fix applied to Xero two days ago (`Migration20260728000000_xero_drop_journal_payment_means_document_targets.ts:9`). Both fixed the *trigger*; neither touched the threshold semantics, so the pattern recurs from other reasons. Xero's catalog is now the corrected 6-model list and it is **still degraded**.

### User-facing impact today
- **Mostly invisible.** `resolveConnectorDisplayStatus` (`packages/shared/src/connectors/connector-display-status.ts:41-45`) renders a degraded connector whose last sync succeeded as `enabled` — exactly our state. Web UI and MCP catalog both show healthy.
- Degraded connectors keep syncing on the ordinary schedule with no backoff (`workspace-connectors.controller.ts:62`, `SYNC_WORKER_ELIGIBLE_STATUSES = {ENABLED, DEGRADED}`).
- Slack alerting is throttled to one per `connector.service_id` per 24h across **all** workspaces, armed before send (`:1260-1270`) — a second workspace on the same provider is silently suppressed.
- The one surface a user does see, `canvas-readiness.service.ts:199` (`connector.degraded_source`), says **"Reconnect it to restore fresh figures."** Reconnecting cannot clear DEGRADED by construction. That advice is wrong.
- Xero is WELL APP INC.'s accounting source and origin of most of the 118 journal entries. Whether real data is being lost depends on whether reason (b) is tripping on `MAPPED_ENTITIES_DROPPED` (real loss) or `EMPTY_RESULT` (not) — unresolved, see hypotheses.

### Fix (source, on-write; no backfill needed — `clearSyncDegraded` auto-recovers on the next clean run)
1. **Stop degrading a run-level SUCCESS on structural diagnostics.** Give `runDroppedEnoughToDegrade` (`:1146`) its own narrow "data was actually lost" set — `MAPPED_ENTITIES_DROPPED`, `MAPPED_ENTITIES_PARTIAL_DROP`, `ENTITY_PERSIST_FAILED`, `TOOL_EXECUTION_FAILED` — and move `EMPTY_RESULT` and `FK_PARENT_MISSING` into `INFORMATIONAL_REASONS` (`ConnectorSyncDiagnostic.ts:59`). The file's own doc already says a successful sync returning zero rows is still a success; the current classification contradicts it.
2. **Make the threshold relative.** A fixed 3 applies identically to a 2-target connector (Attio) and a 13-target one (Pennylane). Express the success-path trigger as a fraction of the run's scheduled targets so connector breadth stops determining health.
3. **Fix the hint.** `canvas-readiness.service.ts:199` must stop saying "Reconnect it" and instead say recent syncs are dropping data, pointing at the connector's diagnostics.

Pennylane's `processing` is not a separate finding — it was mid-run when sampled and is subject to the same detector.

---

## Finding 4 — 1,305/1,518 invoices with no linked document (86%)

**Class: measurement error in the sweep, over an unbuilt capability. Lead with that.** **Confidence:** high on mechanism; the per-bucket apportionment was not measured. **Blast radius: lowest — no financial figure is wrong.**

### Lead: the control point fired on an expected shape
`BOOK-invoice-has-document` is a bare `invoices.document_pk IS NULL` in-window, differentiated only by settlement class, with **no join through** `invoices.source_workspace_connector_pk → workspace_connectors → connectors.data_domains` (`entities/Connector.ts:186`; enum `bank|accounting` in `packages/shared/src/constants/connector-data-domains.ts:14-17`). The sweep's own documentation forbids publishing the figure this way — `control-points-documents.md` states "never publish A without B and C alongside" and "computed on (A+B)/N, never A/N". So 1,305 reads as a defect when it is mostly "N accounting ledger rows (expected) + M genuine gaps".

### Mechanism
`Invoice.document` is a nullable ManyToOne (`entities/Invoice.ts:134-135`) with no `source_kind`/`origin` companion field. Exactly three code paths write it anywhere in the API — verified by exhaustive search of `.document =` assignments, all `nativeUpdate` sites, and the REST/MCP update paths:

- `extract-persistence.service.ts:1886` — document-extraction (upload / Gmail / WhatsApp). Always has a document because the invoice is created *from* one; it also derives `invoice.sourceWorkspaceConnector` from the document at `:1893-1896`.
- `connector.service.ts:1467` — connector sync.
- `seed-workspace-data.ts:992` — demo seed, exactly 20 invoices, 100% document-backed.

Two paths create document-less invoices by construction: REST `createInvoice` (`invoice.service.ts:227-260`, never touches `invoice.document`) and MCP `well_create_invoice_from_data` (`create-invoice-from-data.tool.ts:8` — structured data, *"no file leaves the client"*).

**Strengthening correction to the original claim.** The first write-up said the connector link fails *for accounting connectors*. It is worse: it fails for **every** provider. The link at `connector.service.ts:1463-1467` needs (a) the mapping to emit a `document_content_checksum` hex digest and (b) a `Document` row already carrying that exact `content_checksum` in the workspace (`connector-resolution.service.ts:148-150, 221-241`). Condition (a) is impossible for URL-only providers — the mapping prompt mandates `null` and forbids a PDF URL (`constants/ai/jsonata-prompts.const.ts:616-621`, reinforced at `jsonata-generation.service.ts:386,406`). Condition (b) is impossible **universally**: the connector `document` persister (`connector.service.ts:2790-2822`) creates Documents keyed on `path:filename` and **never sets `content_checksum` at all** — it never downloads bytes. The checksum resolution map can only ever contain upload/email-ingested Documents. The connector rail's invoice→document link is dead code product-wide. That is the zero-variance, never-wired signature.

On top of that the capability itself is unbuilt per provider: Pennylane's document target is *"NOT SUPPORTED … (intentional)"* because all appendix endpoints are parent-scoped sub-resources the sync model cannot iterate (`packages/mcp-generator/configs/pennylane.yaml:1006-1014`), and Xero's `getReceipts` 401s on a deliberately unrequested scope (`packages/mcp-generator/configs/xero.yaml:41-43`).

### One real defect bucket
Rows with `sourceWorkspaceConnector` pointing at a Gmail/email connector **and** `document_pk IS NULL` are structurally self-contradictory, because `extract-persistence.service.ts:1893` derives that connector *from* the document. The cause is the unguarded lookup at `:1884-1888`: `em.findOne(Document, {document_id})` with **no else branch** — a miss silently drops the link while the invoice persists.

### Fix
**In the control point (the main fix):** replace the global count with a three-bucket split joined through `Connector.data_domains`:
- (a) `data_domains` contains `accounting` → **EXPECTED**, informational, reason "provider exposes no content digest / document target unmapped".
- (b) document-producing connector (Gmail/Drive/upload) with `document_pk IS NULL` → **RED**, the only real defect bucket, should be near zero.
- (c) `source_workspace_connector_pk IS NULL` → **EXPECTED**, manual / structured entry.

**In the code:** harden `extract-persistence.service.ts:1884-1888` to log or fail loudly rather than persist a document-less invoice on the document path. If a durable discriminator is wanted rather than a two-hop join, add a typed `invoice_origin` enum (`document_extraction | connector_sync | manual | client_structured`) stamped at each of the four creation sites — an explicit field beats inferring origin from a nullable FK.

**Do not backfill.** Mass-attaching documents to historical accounting rows would invent links that never existed.

*Framing caveat:* "expected shape" means "not a regression", not "not a problem". From a VAT-deductibility standpoint, an invoice whose PDF exists in Pennylane/Xero but not in Well is a genuine evidence gap Well cannot currently close — it is missing capability, not a bug in a shipped path.

*Bias note:* re-sync dedup builds `invoicePkByRef` from **all** live workspace invoices (`connector.service.ts:1288`), so a Xero sync can adopt a Gmail-extracted invoice by matching `reference_number` and rewrite its `sourceWorkspaceConnector` at `:1367` while keeping `document_pk`. This biases segmentation toward over-counting document-backed rows as accounting-sourced; it never manufactures a false gap.

---

## The three-way split

| Finding | Unbuilt feature | Broken code | Sweep measurement error |
|---|---|---|---|
| `ledger_account_pk` 100% NULL | ✅ primary — no AI auto-coding writer exists; schema advertises one | — | — |
| `category_key` / `category_status` NULL | partial — 3 enum members declared, never assigned; no backfill after migration | ✅ primary — enqueue/halt/failure paths don't stamp; sweeper predicate cannot converge | — |
| Connector `degraded` | — | ✅ primary — degrade-on-success loop; wrong user-facing remediation hint | — |
| Invoices without documents | ✅ — connector→document link never wired for any provider; Xero/Pennylane targets unsyncable | minor — silent link drop at `extract-persistence.service.ts:1884` | ✅ primary — global count with no source-of-record segmentation |

**These are three different pieces of work.** Building an auto-coding writer, closing status-stamping gaps, and re-segmenting a control point should not be scheduled as one "data quality" epic.

---

## Hypotheses needing verification (not established by code)

1. **The composition of the 619 status-NULL transactions.** By the finding's own argument nothing distinguishes them. A single-cause explanation — essentially all 619 predate the 2026-06-23 migration — fits the observed shape at least as well as the four-way mix. Resolve with a `created_at`-bucketed query joining `transactions` to `enrichment_tasks`. *The source fix is identical either way*, so this does not block the work.
2. **Which diagnostic reasons cross the ≥3 threshold** for Xero, Stripe and Attio. Branch (b) is established by elimination (it is the only path producing DEGRADED after a run-level success), but `connector_sync_diagnostics` is not queryable via the MCP roots. Whether the trigger is `EMPTY_RESULT`/`NO_SUITABLE_TOOL` (harmless, pure noise) or `MAPPED_ENTITIES_DROPPED` (**real data loss on Well's primary accounting source**) is the single most consequential open question in this document. Needs the per-connector diagnostics endpoint.
3. **The 1,305/1,518 apportionment** — accounting-sourced (expected) vs Gmail-sourced (defect) vs manual. Mechanism confirmed, split not measured. Run the three-bucket query before sizing any remediation.
4. **The 118 journal entries' provenance.** Asserted as connector-import from the observed shape. Confirm by grouping on `journal_entries.source_entity_type` (`'invoice'`/`'transaction'` = Well-posted, per `journal-entry-persister.service.ts:164`) or on `journal_entry_origins.origin = CONNECTOR_IMPORT` (`accounting-import.facade.ts:697-712`). Note a connector stamp alone does **not** prove import — Well-posted JEs also set `sourceWorkspaceConnector` (`:168-172`).
5. **Whether cost-structure rung 2 is currently electing.** At 795/1,911 uncategorized (58.4% populated) it clears the ≥50% bar by 8 points. A modest increase in uncategorized rows silently drops every workspace to the `transaction_type` rung with no signal. Worth an alert, not just a query.

---

## What this means for the sweep skill itself

**Control points that fired on an expected shape:**
- `BOOK-invoice-has-document` — the headline failure. It counted `document_pk IS NULL` globally with no join through `Connector.data_domains`, reporting an unbuilt capability as an 86% compliance breach. The sweep's own `control-points-documents.md` already forbids publishing the A term alone; the control point does not follow it. **Fix: three-bucket segmentation before the check can fire red.**
- The `missing-receipts` skill inherits the identical defect and is currently unusable for any accounting-connected workspace: it flags ~every synced Xero/Pennylane row as a missing receipt and would send a user hunting for PDFs that categorically do not exist in the provider.

**Segmentation the sweep should have made and didn't:**
- **Source-of-record before completeness.** Any check over a nullable link should first ask "which creation path produced this row, and can that path populate this field at all?" Three of the four reds are cases where the field is unpopulatable by construction for a subset of rows.
- **Capability-gap vs runtime-failure.** A 100%-with-zero-variance result is the signature of "never wired", not "failing intermittently". The sweep should classify a 100% red differently from a 40% red rather than ranking them by row count — `ledger_account_pk` (100%, feeds runway) and `document_pk` (86%, feeds nothing financial) should not appear at the same severity.

**What the sweep got right and should keep:**
- Firing on connector `degraded` was correct and valuable — it surfaced a status that `resolveConnectorDisplayStatus` deliberately hides from every product surface. Without the sweep querying `workspace_connectors.status` directly, a perpetual re-degrade loop across three connectors in two workspaces was completely invisible.
- Its advice not to reconnect was correct: the grant is valid and reconnecting cannot clear the flag. One refinement — the status's TSDoc promise ("clears itself, no user action required") is what made "needs no user action" sound reassuring. It should read as *"no user action would help"*, which is a different and more alarming statement.

**One process note:** the initial "there is no `degraded` status" contradiction came from reading a stale local branch. Any control point whose verdict rests on a code claim should state which ref it was checked against.