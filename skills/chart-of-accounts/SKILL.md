---
name: "chart-of-accounts"
description: "Read the chart of accounts a Well workspace posts to, account number by account number, using Well's MCP context graph, as a table ordered by number with each account's type and class. It emits no statutory code and no Well role binding. Use when asked \"what chart of accounts are we on\" or \"what is account 1112\", not for balances."
license: PolyForm-Perimeter-1.0.0
---

# Chart of accounts

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "chart-of-accounts" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
