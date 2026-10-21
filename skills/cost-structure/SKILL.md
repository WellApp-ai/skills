---
name: "cost-structure"
description: "Answer \"what are we spending on?\" by breaking one complete month's outflow into categories computed here, under a grouping ladder the answer states. Use when the user asks \"what are we spending on\", \"break down our expenses\", \"where is the money going\", \"what are our biggest costs\", \"what did we spend per category\", \"dépenses par catégorie\" or \"dépenses par fournisseur\". Also answers, from the same bank rows, the suppliers paid the most in one month (a longer period is asked down to one month), a trend by category over up to 12 complete months, and a household space by category (\"mes dépenses du foyer par catégorie\"); one category against its usual month is personal-spending. Spend per supplier that names no invoice comes here; an ask that names invoices (factures) is supplier-spend-register. A single total with no breakdown is spend-total. Where to save is subscription-spend. Reads bank data; with no bank row, it breaks down the receipts Well holds and says the figure is partial."
license: PolyForm-Perimeter-1.0.0
---

# Cost structure

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "cost-structure" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
