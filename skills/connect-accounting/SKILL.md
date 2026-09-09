---
name: "connect-accounting"
description: "Get an accounting tool connected to a Well workspace and confirm the feed is live — read whether an accounting system (Pennylane, QuickBooks, Xero, Sage…) is already connected, still running its first sync, or in error, hand the user Well's one-click install link, and return a typed accounting-coverage result to the flow that follows. Use when the user asks to connect their accounting software, link Pennylane/QuickBooks/Xero/Sage, asks \"is my accounting connected\", or when a Well skill (like closing the books) needs posted-ledger data in the workspace before it continues. Do not use to connect a bank (that is connect-bank), to connect invoicing or payment portals or several kinds at once (that is connect-tools), to compute a figure, to force a re-sync, or to disconnect a tool."
license: PolyForm-Perimeter-1.0.0
---

# Connect your accounting

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "connect-accounting" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
