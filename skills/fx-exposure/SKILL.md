---
name: "fx-exposure"
description: "Measure how exposed a company is to foreign-currency risk using Well's MCP financial graph — outstanding invoice balances and cash balances summed by non-home currency and converted to the workspace's home/reporting currency at real exchange rates. Use when the user asks \"measure our FX exposure\", \"FX exposure\", \"currency risk\", \"how much of our cash/receivables is in foreign currency\", \"what's our exposure to EUR/USD/GBP\", or \"currency breakdown of our cash and invoices\". Requires a connected Well workspace with invoicing and/or banking data plus a resolvable home currency; if either is missing, this skill walks the user through connecting one or confirming the home currency first."
license: PolyForm-Perimeter-1.0.0
---

# FX exposure

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fx-exposure" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
