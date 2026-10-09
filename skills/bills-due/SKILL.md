---
name: "bills-due"
description: "Answer \"what bills are coming due, and how much do they add up to by date?\" using Well's MCP financial graph: every bill the workspace still owes, ordered by due date, with a running total so the reader can see how much cash leaves and by when. Use when the user asks \"what bills are due\", \"upcoming payments\", \"what do we owe this week\", \"AP due dates\", \"when are our bills due\", \"payment calendar\", \"quelles factures fournisseurs arrivent à échéance\", \"qu'est-ce que je dois payer cette semaine\" or \"mes échéances fournisseurs\". It answers first from the invoices Well already holds. A confirmed own company splits the bills the workspace owes from the invoices it issued; until it is set, the answer lists the unpaid invoices on both sides, says it mixes them, and asks which company is the user's own once, on its last line. A missing connection is asked for after the answer."
license: PolyForm-Perimeter-1.0.0
---

# Bills due

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "bills-due" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
