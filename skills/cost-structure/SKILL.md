---
name: "cost-structure"
description: "Answer \"what are we spending on?\" using Well's MCP financial graph, breaking one complete month's outflow into categories computed here, under a grouping ladder the answer states and every check it rests on visible and repairable. Use when the user asks \"what are we spending on\", \"break down our expenses\", \"where is the money going\", \"what are our biggest costs\", \"show me our cost structure\", \"what did we spend per category\", \"dépenses par catégorie\" or \"dépenses par fournisseur\". Also answers, from the same bank rows, the suppliers paid the most in one month (an ask over a longer period is asked down to one month), a trend by category over up to 12 complete months, and the spending of a person's own household space. A single total for a period, with no breakdown, is spend-total. Requires a connected Well workspace with bank data (accounting data adds the reader's own chart of accounts as the grouping); if no bank is connected, this skill guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Cost structure

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "cost-structure" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
