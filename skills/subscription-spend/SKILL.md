---
name: "subscription-spend"
description: "Find the subscriptions inside a workspace's bank spend: the suppliers paid from a bank account or a credit card on a regular cadence, each with its cost per month and per year and any change in amount, drawn as a trend and a month-by-month table. Use when the user asks \"what subscriptions are we paying for\", \"list our recurring costs\", \"what do we pay every month\", \"did any of our subscriptions go up\", \"where can I save on subscriptions\", \"quels abonnements je paie\", \"lesquels ont augmenté\" or \"où je peux économiser\". Asked where to save, it reads all the person's workspaces: subscriptions first, then leads to check, every amount per year. With no bank transactions landed, it guides connecting a bank first. A connected credit card counts like a bank account. Asked when a subscription can be cancelled, it gives the contract's notice deadline when Well holds it, else asks for the contract. It lists a refused payment, a double debit or a price rise, from the bank and the user's mails."
license: PolyForm-Perimeter-1.0.0
---

# Subscription spend

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "subscription-spend" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
