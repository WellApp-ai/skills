---
name: "connect-tools"
description: "Check which data sources a Well workspace has connected — bank accounts, accounting software, invoicing and payment portals — get the missing ones connected with Well's one-click install links, and hand off a typed coverage result to the flow that follows. Use when the user asks to connect a bank, connect their finance tools, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asks \"which tools are connected\", \"what can I connect to Well\", or when a Well skill needs bank / accounting / invoicing data present before it continues. Do not use to compute figures, to trigger a sync, to disconnect a tool, or to run a connector's own actions."
license: PolyForm-Perimeter-1.0.0
---

# Check your connections

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "connect-tools" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
