---
name: "board-from-photo"
description: "Read an attached image of a dashboard — a screenshot, a photo of a physical screen, or a hand drawing — and turn it into a board. Names each measure the image shows, keeps only the ones that match a feed Well already draws, and hands them to compose-board as a preset, with the board's source stored as \"photo\". The image tells this skill WHICH measures to put on the board and roughly where; it is never read for a figure, an amount, a date or a percentage. A file that is not a readable image gets one plain line and an offer to start from a template instead. It serves an image sent with \"build me this\", \"make my board look like this\", \"I sent you a screenshot of our old dashboard, rebuild it\", \"copy this dashboard\", or a photo and an ask for a board from it. Do not use when the user names the measures in words with no image — that is compose-board directly — or when they ask to open a board that already exists. Use when the user sends a dashboard image."
license: PolyForm-Perimeter-1.0.0
---

# Build a board from a photo

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "board-from-photo" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
