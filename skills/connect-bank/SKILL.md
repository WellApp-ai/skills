---
name: "connect-bank"
description: "Get a bank account connected to a Well workspace and confirm the feed is live: read which banks are connected, on their first sync, or in error, hand the user Well's one-click bank install link, and return a typed bank-coverage result. Use for a live-feed check, how bank linking works or missing rows; never to add a bank."
license: PolyForm-Perimeter-1.0.0
---

# Connect your bank

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "connect-bank" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
