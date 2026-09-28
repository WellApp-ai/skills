---
name: "chart-of-accounts"
description: "Read the chart of accounts a Well workspace posts to, account number by account number, using Well's MCP context graph. Use when the user asks \"what chart of accounts are we on\", \"show me our chart of accounts\", \"list our ledger accounts\", \"what account numbers do we use\", \"which accounts can a transaction post to\", \"do we have a 606 account\", or \"what is account 1112\". The accounts are put on screen as a table ordered by number, with the account type and class each row carries. It emits no statutory code and no Well role binding, because the Well to statutory translation runs at export time and no chart level read reaches it. Requires a connected Well workspace; the chart is seeded when the workspace is provisioned, and an imported accounting book adds the accounts its own chart carries."
license: PolyForm-Perimeter-1.0.0
---

# Chart of accounts

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "chart-of-accounts" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
