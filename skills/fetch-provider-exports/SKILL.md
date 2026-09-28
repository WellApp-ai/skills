---
name: "fetch-provider-exports"
description: "Get a provider's own exports into Well when Well has no connector for it, such as Gusto's payroll journal, employee roster and time off balances as CSV files. Shows a card with one row per provider, the files its run fetches and how the last run ended. Deploy opens Well's collect page, then the Well browser extension opens the provider in a new tab and downloads each file in the user's own signed-in session. Use when the user asks to sync, synchronize, fetch or refresh data from a provider with no Well connector, says \"sync my Gusto\", \"download the payroll CSV from Gusto\", \"export my Gusto reports\", asks whether the last export worked, or when a connect step fails because the provider offers Well no API. Do not use for a provider Well has a connector for (that is connect-tools), to import a file the user already has (that is import-statement), or to fetch supplier invoices from portals (that is deploy-agents)."
license: PolyForm-Perimeter-1.0.0
---

# Provider exports

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-provider-exports" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
