---
name: "connect-tools"
description: "Check which data sources a workspace has connected (bank, accounting, invoicing, payment portals), connect the missing ones with one-click install links, and hand off a typed coverage result. Use when asked to connect a bank or their finance tools, link an accounting tool (Pennylane, QuickBooks, Xero…), add Stripe or Shopify, asked \"which tools are connected\", \"is my Gmail or Outlook inbox connected\", \"what can I connect to Well\", or when a skill needs bank / accounting / invoicing data first. Also use when the user names or asks about one tool, such as what it would bring to Well, including a tool Well does not carry yet. Also use when they name a tool to connect but bar actions (« ne lance aucune action sans me demander », \"no action without asking me\"): reading the connection state is not an action, so load this skill and read it first. Do not use to compute figures, to trigger a sync, to disconnect a tool, to run a connector's own actions, or for export-fed providers like Gusto (fetch-provider-exports)."
license: PolyForm-Perimeter-1.0.0
---

# Check your connections

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "connect-tools" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
