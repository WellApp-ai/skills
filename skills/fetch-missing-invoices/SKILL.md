---
name: "fetch-missing-invoices"
description: "Show the invoices a workspace is missing and start the fetch in one turn: gaps, vendors to chase, connectors, and Well's browser agents fetch the pick. A WRITE flow: a supplier Well lacks joins its catalog on your yes. Use to get or plan a chase in a month, \"what am I missing\", « il me manque quoi »; no site named"
license: PolyForm-Perimeter-1.0.0
---

# Missing invoice sweep

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "fetch-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
