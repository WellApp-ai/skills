---
name: "close-books"
description: "Drive a month-end close for a Well workspace to the point of approval — start the close for a named month, read what is blocking it, clear the blockers one at a time, prepare the close package, and mint the approval offer the user accepts in the Well app. Use when the user asks to \"close the books\", \"close last month\", \"run the month-end close\", \"close March\", \"finish the close\", or \"what's left to close the period\". This is a WRITE flow — it advances a real close run and can resolve tasks, so it shows the state before every step and asks first before retrying reconciliation or queuing a vendor invoice fetch, the two that need an explicit yes. It never locks the period itself; the final approval is a first-party click in Well by design. Requires a connected Well workspace with its bank synced — the only connection the close blocks on; an accounting connection is optional and makes the close richer. If none, it walks the user through connecting first."
license: PolyForm-Perimeter-1.0.0
---

# Close the books

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "close-books" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
