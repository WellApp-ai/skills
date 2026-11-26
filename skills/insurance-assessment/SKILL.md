---
name: "insurance-assessment"
description: "Follow the company's insurance contracts: each policy's insurer, cover and renewal date, read from the documents Well holds, and the insurance direct debits read from the bank. After one yes, Well adds one item to the morning brief before each renewal. It never buys, changes or ends a contract: for a quote comparison or a termination letter, use `insurance-switch`. Use for \"which insurance do I have\" or \"quand renouvelle mon assurance ?\"."
license: PolyForm-Perimeter-1.0.0
---

# Insurance assessment

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "insurance-assessment" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
