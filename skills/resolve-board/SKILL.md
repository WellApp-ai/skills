---
name: "resolve-board"
description: "Open a board the workspace saved and draw it WITH its figures — cash, burn, runway, recurring revenue, cost structure, a forecast, a cash bridge. Use when the user says \"open my board\", \"show me the board\", \"what does my dashboard say\", \"refresh the board\", or names a board they have. Each block stores the feed it reads and the window it asks for, so this runs that feed's own skill over that window and draws what it answered. Nothing is stored: the board is measured again every time it is opened, so no figure on it can be out of date. Requires a connected Well workspace and a resolved own company. Do not use it to build or rearrange a board, which is compose-board."
license: PolyForm-Perimeter-1.0.0
---

# Open a saved board

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "resolve-board" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
