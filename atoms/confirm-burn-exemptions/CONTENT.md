---
name: confirm-burn-exemptions
description: Ask which categories and transaction types do not count toward a figure, showing what each one removes. Dev-only test artifact — never installed by end users.
placeholders:
  figure: "burn"
---

The workspace, the window, and the categories are already settled.

Internal transfers are already out, structurally, by the leg rule — a movement with both legs on accounts the workspace owns never entered the sum. Do not offer them here and do not describe this step as excluding them: repeating an exclusion that already happened invites a reader to think it did not.

This is the second exclusion, and it is the reader's alone: what is genuinely not {{#if figure}}{{figure}}{{else}}spend{{/if}} for their business. Loan principal, an intra-group recharge, a category they treat as investment rather than cost.

Call the sum grouped by category once, so every option carries its own share of the window, then surface the exemption card. A list of category names with no amounts asks the reader to decide blind, and the amount is the whole content of the decision.

Take no default. Nothing is exempt until they say so, and a proposed exemption is a figure altered on their behalf.

Exempting everything is a real answer and must read as one: say the figure has nothing left to measure rather than reporting zero.

**Resuming.** The card's Continue names this step, so a run that comes back re-reads the selection alone and continues from here.

Hand off: `exempted_category_keys`, `exempted_types`, the remaining total, `resolution: confirmed | none_exempted`.

Verify before moving on: internal transfers were not offered; every option showed its own amount; nothing was exempt by default; an all-exempt selection was reported as nothing measured rather than as zero.
