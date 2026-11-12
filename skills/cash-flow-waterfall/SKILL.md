---
name: "cash-flow-waterfall"
description: "Show where the cash went: a bridge from the opening cash to the closing cash, built from the workspace's own balances and transactions, with any gap between them reported. Use when asked \"where did the cash go\" or \"why did our balance change\", not a forecast."
license: PolyForm-Perimeter-1.0.0
---

# Cash flow bridge

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "cash-flow-waterfall" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
