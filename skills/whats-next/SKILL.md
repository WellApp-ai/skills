---
name: "whats-next"
description: "Close a turn on the five things worth doing next in a Well workspace, ranked by Well from the workspace's gaps, its open month and the skills already run, drawn on a card whose click starts the picked skill. Use when the user asks \"what should I do next\", \"what do you suggest\", \"propose skills\", \"what now\", \"where do I go from here\", or \"what else should I look at\", or when a Well flow reaches its closing step. Do not use to choose a step on the user's behalf (the click chooses), to fetch invoices (that is `fetch-missing-invoices`), to close a period (that is `close-books`), or to answer a figure question. Requires one Well workspace pinned; if none is pinned, this skill walks the user through pinning one first."
license: PolyForm-Perimeter-1.0.0
---

# What's next

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "whats-next" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
