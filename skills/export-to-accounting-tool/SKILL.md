---
name: "export-to-accounting-tool"
description: "Send a closed period's native journal entries to the workspace's connected accounting tool, on a card the user confirms. Use it as the last step of a close, once the period has reached `period_closed`: it reads whether a write-capable accounting connector is present and whether its grant can post, draws the export card when it can, and hands back `resolution: exported | nothing_to_send | no_tool | failed`. Never call it before the period is closed — the underlying write refuses on any earlier checkpoint. Requires a connected Well workspace; the accounting connection and its write scope are read, never assumed."
license: PolyForm-Perimeter-1.0.0
---

# Export to accounting tool

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "export-to-accounting-tool" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
