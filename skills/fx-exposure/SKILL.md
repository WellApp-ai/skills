---
name: "fx-exposure"
description: "Measure foreign-currency risk from Well's MCP financial graph: open invoice balances and cash balances summed per currency other than the reporting currency, converted at real exchange rates. It answers first from the cash and invoices Well holds, and asks for a missing connection after. Use when asked \"what's our FX exposure\" or \"how much of our cash is in USD\"."
license: PolyForm-Perimeter-1.0.0
---

# FX exposure

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fx-exposure" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
