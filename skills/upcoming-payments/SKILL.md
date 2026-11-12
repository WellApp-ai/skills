---
name: "upcoming-payments"
description: "Answer \"what's left before payday?\" in a person's own space on Well's MCP business graph: the recurring debits still to come from their bank history, each with its next day and amount, a running total, the next payday, and what the balance leaves before it. It reads a personal space only; with no bank transactions there, it guides connecting a bank first. Use when asked \"what's left before payday?\", not company bills (bills-due)."
license: PolyForm-Perimeter-1.0.0
---

# Upcoming payments

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "upcoming-payments" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
