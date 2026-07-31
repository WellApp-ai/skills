# Schema facts — what exists, where, and under which name

The durable, verified facts about the Well schema and the MCP surface that control points are
written against. Several contradict what a reader would reasonably assume, and each one changes the
remediation, so check here before writing a predicate against an assumed field.

SKILL.md sends an agent here **before authoring or editing any control point**, and whenever a repo
read and a live MCP probe disagree.

## Own-company identity — `workspaces.own_company_pk`

**The column exists.** `apps/api/src/database/entities/Workspace.ts:64-65`, backed by an append-only
evidence ledger `workspace_own_company_evidence` carrying typed `source` / `strength` / `decision` /
`reason`. A fleet metric is already computed by `WorkspaceRepository.ownCompanyAnchorRate`, exposed
at `GET /v1/backoffice/self-heal/own-company-anchor-rate`.

It is **stripped by `workspace.formatter.ts:57-72`**, which is why `well_get_schema("workspaces")`
returns 14 fields and none of them is the own-company link. **This is a read-surface gap, not a
schema gap.**

Consequences for control design:

- `companies.company_origin` is a **per-company** column, and a company can legitimately be self in
  one workspace and a counterparty in another. A row such as `"WELL APP INC"` carrying
  `company_origin: counterparty` is therefore **not** a defect on its own — the FK is the correct
  model.
- **Do not add a `self` value to `company_origin`.**
- The real check is whether `own_company_pk` points at the right row. It cannot be run over the MCP
  surface today.

## Fiscal period — `workspace_accounting_settings`

**The entity is real and populated.** It carries `fiscal_year_start_month` (int 1-12, with a CHECK),
`fiscal_year_start_month_source` (`derived` | `user`), `incorporation_date`, `base_currency`,
`country`, and `accounting_framework`.

The legal-form → fiscal-year-end rule table is real (`FYE_RULES`: FR/DE/US → calendar, GB →
incorporation anniversary, sole traders → calendar), written by `deriveAndWriteFiscalYearStart`,
which never clobbers `source: "user"` and never defaults to December on underivable input.

`workspace_accounting_settings` is **not one of the MCP read roots** — a read-surface gap, not a
schema gap.

**Reporting rule:** a French SAS's *exercice comptable* is **not** statutorily December — the statuts
choose it. A `derived` FYE on a non-GB jurisdiction is therefore an **unconfirmed default** and must
ship as "assumed December — confirm?", never as fact.

## Connector matching fields — `match_score`, `is_preselected`, `is_connected`

**All three exist on the live `well_list_connectors` response**, alongside `is_matched` and
`is_selected`. A live call returns, per connector: Stripe (`category_id: finance`, `match_score: 1`,
`is_preselected: true`, `is_connected: false`), same shape for Postman and Figma; 183 connectors
total.

A read of the local checkout shows them absent. **The deployed MCP is ahead of the local checkout:
a repo read is not a substitute for a live probe, and a live probe is not a substitute for a repo
read.** Where the two disagree, record both observations and state which one was trusted.

## Connector status vocabularies — and the `degraded` rule

Never treat "not enabled" as a binary — both intermediate states are live in production.

- `workspace_connector_sync_logs.status` = `scheduled | in_progress | success | error`
- `workspace_connectors.status` = `enabled | disabled | to_configure | processing | error |
  need_reconnect | suspended | degraded`

**Unresolved:** `status = "degraded"` is observed live (Attio, Xero), while the native enum is
reported as `enabled | disabled | to_configure | processing | error | need_reconnect | suspended` —
**with no `degraded` member**. Both observations are first-hand and neither has been reconciled.

**Operative rule, which holds either way: filter on the SET of non-`enabled` statuses, never on
`degraded` alone.** A predicate matching only `degraded` will silently match nothing while
`need_reconnect` and `error` — the two that actually mean "this bank stopped feeding you" — go
unchecked.

## Related schema facts held elsewhere

- `invoice_transactions.invoice_pk` is NOT NULL; `documents` has `size` / `type` /
  `content_checksum`; `media` is `avatar | logo | banner` only — see the bookkeeping and documents
  control-point files.
- What the MCP surface cannot express at all (per-sync record counts, OAuth expiry, raw-vs-mapped
  drop rate, soft-delete filtering) — see `mcp-surface-limits.md`.
- Dated live measurements — see `baseline-2026-07-29.md`.


---

## `workspace_connectors.status` — the authoritative vocabulary

`status` is a **stored** value of the PG enum `core_api.status_enum`, fully filterable in a
`whereClause` (`{"status": {"_in": [...]}}`). It is NOT derived and NOT computed. Eight members:

`enabled | disabled | to_configure | processing | error | need_reconnect | suspended | degraded`

`degraded` was added 2026-07-08 (`Migration20260708120000_workspace_connector_degraded_status.ts`)
and is deployed. A checkout forked before that date shows only seven members in
`apps/api/src/constants/workspace-connector-status.const.ts` — read connector constants via
`git show origin/develop:<path>`, not the working tree, if the branch is behind.

**Bucketing** — mirrors `CONNECTOR_STATUS_BUCKET` in the close flow (exhaustive `Record<StatusEnum,…>`),
so the sweep and the close cannot disagree:

| bucket | values |
|---|---|
| healthy / syncing | `enabled`, `processing` |
| errored — stopped feeding | `degraded`, `error`, `need_reconnect`, `suspended` |
| not participating (count in total only) | `to_configure`, `disabled` |

**`degraded` semantics.** The stored grant is still valid; syncs are unhealthy. Distinct from
`need_reconnect` (dead grant, user must reauthorize): a degraded connector **clears itself back to
`enabled` on the next successful sync, with no user action**. Detector thresholds: 7 days without a
SUCCESS sync log, or 3 FAILURE-class diagnostics since the last success; 24h per-connector alert
cooldown. It keys off sync *failure* only — a successful zero-row sync keeps a connector healthy.

**Two vocabularies — do not mix them.**
- `well_query_records` on root `workspace_connectors` returns the **raw stored** status. This is
  what the sweep reads.
- `well_list_connectors` returns a **resolved display** status, folded server-side to only
  `enabled | processing | error`. An `error` there may be a resolved `degraded`; an `error` from
  `well_query_records` is the stored hard fault. Never compare across the two.
