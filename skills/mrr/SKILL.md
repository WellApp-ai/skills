---
name: "mrr"
description: "Answer \"what is our MRR?\" using Well's MCP financial graph — the trailing average of the recurring revenue the workspace invoiced, computed here from its own issued invoices, with every check it rests on visible and repairable. Use when the user asks \"what's our MRR\", \"what's our monthly recurring revenue\", \"how much recurring revenue do we have\", or \"what's our revenue run rate\". Requires a connected Well workspace with invoicing data and a resolved own company; if either is missing, this skill guides the user to set it up first."
license: PolyForm-Perimeter-1.0.0
---

# Recurring revenue

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "mrr" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
