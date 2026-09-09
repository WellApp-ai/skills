---
name: "avg-burn"
description: "Answer \"what is our burn rate?\" using Well's MCP financial graph — the trailing average of real monthly outflows, computed here from the workspace's own transactions, with every check it rests on visible and repairable. Use when the user asks \"what's our burn rate\", \"how much are we spending per month\", \"what's our monthly burn\", or \"how much goes out each month\". Requires a connected Well workspace with bank data; if none is connected, this skill guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Burn rate

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "avg-burn" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
