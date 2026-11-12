---
name: "accounting-settings"
description: "Set a Well workspace's accounting settings, the fiscal year start month above all, plus the first fiscal year start date, base currency, country, accounting framework and chart-of-accounts confirmation, writing only the value the user confirms. This is a WRITE flow: it shows the current value, confirms the new one, then writes; a locked period or a close in progress refuses the fiscal year start. Requires a connected Well workspace and owner or admin rights. Use when asked \"set our fiscal year start\" or to change the currency or framework."
license: PolyForm-Perimeter-1.0.0
---

# Accounting settings

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounting-settings" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
