---
name: elect-sign-convention
description: Decide, from the window's own rows, whether a feed records outflows as negatives or as positive magnitudes. Dev-only test artifact — never installed by end users.
placeholders:
  purpose: "before any outflow is totalled"
---

Which sign means money leaving is a property of the FEED, not of the data model. Most connectors store an outflow as a negative amount; some store it as a positive magnitude and carry the direction elsewhere. Two windows over the same workspace can differ, and both be right.

So it is measured, never assumed{{#if purpose}} — "{{purpose}}"{{/if}}. It costs no extra call: the sum returns `sum_negative`, `sum_positive`, `count_negative` and `count_positive` per group, and the counts are the evidence.

Read them over the whole window, not per month: one month of a signed feed can hold no negatives at all, and electing per month would flip conventions mid-window and total two different things together.

- Negatives are a substantial share of the rows → the feed is **signed**, and the outflow is `sum_negative`.
- Almost no negatives, and positives throughout → the feed is **magnitude**, and the outflow is `sum_negative` plus `sum_positive`.
- Neither shape is clear → say so and stop. A convention elected from ambiguous evidence produces a confident figure that may be inverted, which is worse than no figure.

State which convention you elected and the counts behind it, so a reader can check the choice rather than take it.

Hand off: `convention: signed | magnitude | ambiguous`, both counts, and the outflow total the choice implies.

Verify before moving on: the election came from counts rather than from a provider name or a field label; it was made once over the window; the choice and its evidence were both stated.
