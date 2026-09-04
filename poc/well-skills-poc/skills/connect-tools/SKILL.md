---
name: connect-tools
description: Check which data sources a Well workspace has connected — bank accounts, accounting software, invoicing and payment portals — get the missing ones connected with Well's one-click install links, and hand off a typed coverage result to the flow that follows. Use when the user asks to connect a bank, connect their finance tools, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asks "which tools are connected", "what can I connect to Well", or when a Well skill needs bank / accounting / invoicing data present before it continues. Do not use to compute figures, to trigger a sync, to disconnect a tool, or to run a connector's own actions.
---

# Connect Tools with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "connect-tools" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.
