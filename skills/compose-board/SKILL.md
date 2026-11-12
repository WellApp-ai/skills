---
name: "compose-board"
description: "Build a board in Well from the measures a person names (cash, burn, runway, recurring revenue, cost structure, a forecast, a cash bridge) and save it as a canvas that stores the question each block asks, not an answer. After the write the same turn continues into `resolve-board`, which draws the board with its figures. Use when asked \"build me a board\" or \"add MRR to my board\", not to answer one figure question."
license: PolyForm-Perimeter-1.0.0
---

# Compose a board

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "compose-board" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
