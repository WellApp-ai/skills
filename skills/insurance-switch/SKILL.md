---
name: "insurance-switch"
description: "Compare an insurance contract with the offers the person received, and explain how to end the current contract: the facts side by side (premium, cover, deductible), the end of the cover period read from the contract on file, and a termination letter drafted for the person to send themselves. Use when the user asks \"mon assurance a augmenté, aide-moi à comparer\", \"compare ces devis d'assurance\", \"comment résilier mon assurance auto\", \"lettre de résiliation d'assurance\", \"my insurance went up, help me switch\", \"compare these insurance quotes\" or \"how do I cancel my insurance\". Business and personal insurance. Informative only: it ranks no offer, gives no advice on which to take, never estimates a date, and sends, signs or pays nothing."
license: PolyForm-Perimeter-1.0.0
---

# Insurance switch

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "insurance-switch" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
