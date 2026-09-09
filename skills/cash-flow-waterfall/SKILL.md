---
name: "cash-flow-waterfall"
description: "Answer \"where did the cash go?\" using Well's MCP financial graph — a bridge from the opening cash position to the closing one, showing total inflows and total outflows for the period. Use when the user asks \"where did the cash go\", \"reconcile our cash movement\", \"why did our balance change\", \"show me the cash flow bridge\", or \"how did we get from last month's balance to this one\". Requires a connected Well workspace with a banking connector; if none is connected, this skill guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Cash movement

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "cash-flow-waterfall" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
