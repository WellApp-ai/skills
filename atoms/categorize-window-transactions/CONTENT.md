---
name: categorize-window-transactions
description: Confirm every transaction in a window carries a category, and surface the card that assigns the ones that do not. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "so the categories you exempt can actually be applied"
  scope: "the window"
---

The workspace and the window are already pinned.

One `well_query_records` on `transactions` over the window, filtered to rows with no category. Read `totalCount` and, when it is non-zero, the rows themselves so the card has something to list.

None → carry on.

Any → stop and surface the categorize card for {{#if scope}}{{scope}}{{else}}the window{{/if}}. Say how many rows and how much of the window's value sit behind them, because those two numbers are what tell a reader whether this is a minute of work or an afternoon{{#if purpose}}, and say what it unlocks — "{{purpose}}"{{/if}}.

Do not offer to categorize them yourself, and do not propose labels unless the reader asks. The card carries the classifier's own proposals where it has them; a second opinion typed into the chat competes with the one on screen.

**Resuming.** The card's Continue names this step, so a run that comes back re-counts the window alone and continues from here. A reader who fixed some but not all comes back to the same stop with a smaller number, which is progress rather than a failure.

**A read that fails is not a resolution.** When the call errors rather than returning a clean result, retry once; on a second failure stop and say the categorization coverage could not be read. Never hand off a resolution derived from data that did not arrive — the consuming skill cannot tell the two apart. This is stated here rather than left to a caller's preamble, because an atom is loaded standalone and composed by skills that have their own.

Hand off: `uncategorized_count`, the value behind it, `resolution: complete | outstanding`.

Verify before moving on: the count covered the window and nothing wider; the stop stated both the count and the value at stake; no category was assigned or proposed outside the card.
