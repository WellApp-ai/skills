---
name: "runway"
description: "Answer \"how much runway do we have?\" using Well's MCP financial graph — months of cash left, computed from real synced balances divided by actual trailing burn, with the dividend and divisor shown so the number can be challenged. Use when the user asks \"what's my runway\", \"how much runway do we have\", \"when do we run out of cash\", or \"how many months of cash are left\". Requires a connected Well workspace with bank or accounting data; if none is connected, this skill guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Runway

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "runway" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
