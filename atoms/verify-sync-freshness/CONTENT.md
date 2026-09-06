---
name: verify-sync-freshness
description: Confirm a connected feed has actually finished delivering, and recently. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "before the burn is measured"
  maxAgeHours: 24
---

The workspace is already pinned, and the connectors are already known to be connected — this checks whether what they carry has landed, which coverage does not answer.

One `well_query_records` on `workspace_connector_sync_logs` for the connected connectors: read each one's latest row's `status` and `completed_at`.

A sync still running → say which connector, {{#if purpose}}"{{purpose}}"{{/if}}, and say what the wait is. A reconnect re-fetches the whole history rather than the days since the last run, so it is normally minutes rather than seconds, and on a long history it runs considerably longer.

Then poll, with a ceiling. Re-read the sync logs about every 20 seconds and carry on by yourself the moment every connector reports finished — a reader told the figure is coming should not have to ask for it again. Give up after a handful of attempts, or once the wait has run past a couple of minutes, and hand the decision back: say how long it has been running, that a sync can legitimately take much longer, and offer **Re-check** to keep waiting.

Never poll unbounded. A sync can run for hours or never finish, and a routine waiting silently on one is indistinguishable from a routine that has hung. The ceiling is what keeps a slow sync legible as slow.

A latest sync older than {{#if maxAgeHours}}{{maxAgeHours}}{{else}}24{{/if}} hours → name the connector and the age, offer both Re-check and the reconnect link, and carry on. Stale data makes a figure old rather than wrong, and saying which it is matters more than blocking on it.

Every connector finished, whether recent or stale → hand the timestamps back and carry on.

**Resuming.** The Re-check prefill names this step, so a run that comes back re-reads the sync logs alone and continues from here. It never re-enters at the workspace or the period: those were answered already, and asking twice reads as the routine having lost its place.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say freshness could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: per connector, its latest `status`, `completed_at`, and age in hours; `resolution: fresh | syncing | stale`.

Verify before moving on: freshness came from the sync logs rather than from connector state; a running sync and a stale one were reported as different situations; the age was stated, not summarized as "recent".
