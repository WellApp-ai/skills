---
name: "show-missing-invoices"
description: "List the settled spend in one Well workspace with no supplier invoice for a month or fiscal period, one row per counterparty, each saying how the gap closes: Well's agent fetches it, connect the provider, or upload it by hand. Covers client files of a workspace group and gives the weekly total. Needs a workspace from define-workspace and a period from define-period. When asked for a reminder per missing invoice, Well sends none: say so, and offer the list. Use to list suppliers owing invoices, per file or week; read only, never to get or plan a chase."
license: PolyForm-Perimeter-1.0.0
---

# Missing supplier invoices

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "show-missing-invoices" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
