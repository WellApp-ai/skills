---
name: "cash-position"
description: "Answer \"how much cash do we have right now?\" using Well's MCP financial graph — the total of your real bank balances, computed here from the workspace's own accounts, with every rule it rests on visible and repairable. Use when the user asks \"what's our cash position\", \"how much cash do we have right now\", \"current bank balance\", \"how much money is in the bank\", or \"what's our total cash on hand today\". Requires a connected Well workspace with a banking connector; if none is connected, this skill guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Cash position

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "cash-position" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
