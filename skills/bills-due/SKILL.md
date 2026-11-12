---
name: "bills-due"
description: "Answer \"what bills are coming due, and how much do they add up to by date?\" from Well's MCP financial graph: every bill the workspace still owes, ordered by due date, with a running total. It answers first from the invoices Well holds and asks for a missing connection after the answer. Use for how much falls due by when, not to see the bills as rows (show-records)."
license: PolyForm-Perimeter-1.0.0
---

# Bills due

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "bills-due" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
