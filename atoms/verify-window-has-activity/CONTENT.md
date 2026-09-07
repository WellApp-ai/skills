---
name: verify-window-has-activity
description: Confirm the chosen window actually holds transactions on the workspace's own accounts, before anything is measured over it. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "to measure your average monthly burn"
---

The workspace and the window are already pinned{{#if purpose}}, {{purpose}}{{/if}}.

One `well_query_records` on `transactions` (`limit: 1`) ranging `executed_at` over the window's own interval, scoped to the workspace. Read `totalCount`, not the rows: the question is whether the window holds anything, and one count answers it in one call.

At least one → carry on, and keep the count.

None → stop. A window with no transactions produces a figure of zero, and zero standing on nothing measured is not a reading — say that instead of reporting it. Two situations look identical here and must not be described identically: a feed that has delivered nothing yet, and a real month in which nothing moved. The freshness step above tells them apart, so cite what it found rather than guessing.

Offer **Re-check** when the feed is the likely cause, and offer the period picker when the window may simply be the wrong one.

**Resuming.** Either affordance names this step in its prefill, so a run that comes back re-counts the window alone and continues from here.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the activity check could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: `transaction_count`, the window it covers, `resolution: has_activity | empty`.

Verify before moving on: the count came from `totalCount` rather than from walking rows; the window ranged `executed_at` over its own interval only; an empty window was never reported as a burn of zero.
