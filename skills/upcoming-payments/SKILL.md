---
name: "upcoming-payments"
description: "Answer \"what's left before payday?\" in a person's own space on Well's MCP business graph: the recurring debits still to come from their bank history, each with its next day and amount, a running total, the next payday, and what the balance leaves before it. Use when the user asks \"what's coming out before payday\", \"which bills are due before I get paid\", \"what's left until payday\", \"when is my next payday\", \"my upcoming direct debits\", « qu'est-ce qui part avant ma paie ? », « combien il me reste avant la paie » or « mes prochains prélèvements ». It reads a personal space only. The supplier bills a company still owes are bills-due, and the list of what the person pays for on a schedule, with its cost per month, is subscription-spend. Requires bank transactions in the personal space; if none has landed, it guides connecting a bank first."
license: PolyForm-Perimeter-1.0.0
---

# Upcoming payments

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "upcoming-payments" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
