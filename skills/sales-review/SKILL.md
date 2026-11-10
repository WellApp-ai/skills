---
name: "sales-review"
description: "Give the month's sales review in one reply, the month in one view and not one list, with the deals won and lost, the largest customers with their share, and the late payers, each line with its source. Use when asked for the \"monthly sales review\", the \"sales recap for the month\", « la revue commerciale du mois », « le bilan commercial du mois » or « le point commercial ». A month still running is marked provisional. It only reads, so nothing is written or sent. It needs deals in Well or invoices from an invoicing tool, and the reply names each line it could not read."
license: PolyForm-Perimeter-1.0.0
---

# Sales review

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "sales-review" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
