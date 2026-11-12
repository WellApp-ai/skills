---
name: "subscription-spend"
description: "Find the subscriptions inside a workspace's bank spend: the suppliers paid from a bank account or card on a regular cadence, each with its monthly and yearly cost and amount changes, drawn as a trend and a monthly table. Asked where to save, it reads all the person's workspaces and gives numbered leads, biggest per year first. With no bank, it lists subscriptions from received invoices, then offers the bank. Asked when a subscription can be cancelled, it gives the notice deadline when Well holds the contract, else asks for it. It lists a refused payment, a double debit or a price rise. Use when asked \"what subscriptions are we paying for\" or \"did any go up\"; not to cancel one."
license: PolyForm-Perimeter-1.0.0
---

# Subscription spend

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "subscription-spend" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
