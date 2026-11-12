---
name: "close-books"
description: "Drive a month-end close for a Well workspace from open to sent: read what blocks it, clear the blockers one at a time, prepare the package, mint the approval offer, and once it locks, send the entries to the connected accounting tool. A \"just show me\" ask reads the state and starts nothing. Otherwise this is a WRITE flow: it shows the state before every step and asks first before retrying reconciliation or queuing a vendor invoice fetch. It never locks the period itself; the final approval is a first-party click in Well. Use when asked to \"close the books\", \"close March\" or \"what's left to close the period\"."
license: PolyForm-Perimeter-1.0.0
---

# Close the books

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "close-books" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
