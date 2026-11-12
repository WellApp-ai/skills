---
name: "fetch-provider-exports"
description: "Get a provider's own exports into Well when Well has no connector for it, such as Gusto's payroll journal as CSV files. A card shows the files; Deploy opens Well's collect page and the Well browser extension downloads each file. Use to download a provider's payroll or CSV export (\"sync my Gusto\"), not supplier invoices."
license: PolyForm-Perimeter-1.0.0
---

# Provider exports

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-provider-exports" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
