---
name: "bills-due"
description: "Show what bills are coming due and when, as a date-ordered cash-planning view of accounts payable with a running cumulative total, using Well's MCP financial graph. Use when the user asks \"what bills are due\", \"upcoming payments\", \"what do we owe this week/month\", \"AP due dates\", \"what's our cash outflow looking like\", \"when are our bills due\", or \"payment calendar\". Requires a connected Well workspace with invoicing/bills data; if none is connected, this skill walks the user through connecting one first."
license: PolyForm-Perimeter-1.0.0
---

# Bills due

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "bills-due" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
