---
name: "cash-position"
description: "Answer \"how much cash do we have right now?\" with the total of your real bank balances, never invested cash, computed from the workspace's own accounts, every rule it rests on visible and repairable. Use for cash now: a bank or account balance, the balances page link, a cash chart; not runway."
license: PolyForm-Perimeter-1.0.0
---

# Cash position

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "cash-position" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
