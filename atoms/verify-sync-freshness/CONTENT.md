---
name: verify-sync-freshness
description: Confirm a connected feed has actually finished delivering, and recently. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "before the burn is measured"
  maxAgeHours: 24
---

The workspace is already pinned, and the connectors are already known to be connected — this checks whether what they carry has landed, which coverage does not answer.

One `well_query_records` on `workspace_connector_sync_logs` for the connected connectors: read each one's latest row's `status` and `completed_at`.

A sync still running → stop and say which connector, {{#if purpose}}"{{purpose}}"{{/if}}. Offer **Re-check** rather than a wait: nothing here polls, and a reader who watched the sync finish is the fastest signal there is.

A latest sync older than {{#if maxAgeHours}}{{maxAgeHours}}{{else}}24{{/if}} hours → stop, name the connector and the age, and offer both Re-check and the reconnect link. Stale data makes a figure old rather than wrong, and saying which it is matters more than the figure.

Every connector finished and recent → hand the timestamps back and carry on.

**Resuming.** The Re-check prefill names this step, so a run that comes back re-reads the sync logs alone and continues from here. It never re-enters at the workspace or the period: those were answered already, and asking twice reads as the routine having lost its place.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say freshness could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: per connector, its latest `status`, `completed_at`, and age in hours; `resolution: fresh | syncing | stale`.

Verify before moving on: freshness came from the sync logs rather than from connector state; a running sync and a stale one were reported as different situations; the age was stated, not summarized as "recent".
