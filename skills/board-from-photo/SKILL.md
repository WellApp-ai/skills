---
name: "board-from-photo"
description: "Read an attached image of a dashboard (a screenshot, a photo of a screen, a hand drawing) and turn it into a board: it names each measure the image shows, keeps those that match a feed Well already draws, and hands them to compose-board as a preset. The image says which measures and roughly where, never a figure. Use when the user sends a dashboard image (\"copy this dashboard\"), not measures in words."
license: PolyForm-Perimeter-1.0.0
---

# Build a board from a photo

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "board-from-photo" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
