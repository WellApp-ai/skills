---
name: verify-sync-freshness
description: Confirm a connected feed has actually finished delivering, and recently. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "before the burn is measured"
  maxAgeHours: 24
---

The workspace is already pinned, and the connectors are already known to be connected — this checks whether what they carry has landed, which coverage does not answer.

One `well_query_records` on `workspace_connector_sync_logs` for the connected connectors, with `render_widget: false`: read each one's latest row's `status` and `completed_at`. Pass that flag on every read this step makes. The reader did not ask to see a table of sync rows, and a poll that redraws one each time buries their own conversation under a status they never requested — the rows still come back, only the card is withheld.

A sync still running → say which connector, {{#if purpose}}"{{purpose}}"{{/if}}, and say what the wait is. A reconnect re-fetches the whole history rather than the days since the last run, so it is normally minutes rather than seconds, and on a long history it runs considerably longer.

Then watch it, in the background, until it lands or the budget runs out. Re-read the sync logs every 60 seconds for at most 20 minutes, carrying on the moment every connector reports finished. Say once that you are waiting and how long the wait usually is; do not narrate each re-read.

**The interval is the point, and the Well toolset cannot supply it.** `well_wait_for_selection` is a selection wait of about ten seconds rather than a sleep, so these tools alone cannot pass a minute. Where your host can — a shell, a scheduler, anything that genuinely waits — use it at the interval above. Where it cannot, re-read once and stop there: reads fired back to back give the sync no time to progress, so a tight loop is the same answer repeated with a longer transcript.

**The budget is a ceiling, not a promise.** A run declares itself in progress until something marks it finished, and a run that has died never does, so an unbounded watch would sit on a dead sync forever. When the 20 minutes are up, stop re-reading and say how long the run has been going. That is a finding worth reporting, not a failure to wait harder.

This step does not offer a way past. A figure measured while its own feed is still loading is a figure nobody can check, so the run waits or it stops — and if it stops, the answer is what is still running and for how long, never a burn with a caveat attached.

A latest sync older than {{#if maxAgeHours}}{{maxAgeHours}}{{else}}24{{/if}} hours → name the connector and the age, offer both Re-check and the reconnect link, and carry on. Stale data makes a figure old rather than wrong, and saying which it is matters more than blocking on it.

Every connector finished, whether recent or stale → hand the timestamps back and carry on.

**Resuming.** The Re-check prefill names this step, so a run that comes back re-reads the sync logs alone and continues from here. It never re-enters at the workspace or the period: those were answered already, and asking twice reads as the routine having lost its place.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say freshness could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: per connector, its latest `status`, `completed_at`, and age in hours; `resolution: fresh | syncing | stale`.

Verify before moving on: freshness came from the sync logs rather than from connector state; a running sync and a stale one were reported as different situations; the age was stated, not summarized as "recent".
