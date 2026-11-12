---
name: "board-pack"
description: "Assemble the board numbers in one pass from Well's MCP financial graph: cash, burn, runway, recurring revenue and what is owed on each side, each figure carrying its scope and window. Requires a connected Well workspace with bank data and a resolved own company. It reads and changes nothing. Use when asked \"what numbers do I put in front of the board\" or for \"my board pack\"."
license: PolyForm-Perimeter-1.0.0
---

# Board pack

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "board-pack" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
