---
name: "check-contractor-status"
description: "Read the purchase invoices, the payment rail and any employment contract Well holds for a supplier who looks like a freelancer, and state the facts a requalification question turns on (cadence, repeating amounts, share of spend, contract type), next to the papers your country expects you to keep. It states observed facts, never classifies anyone as an employee, and files nothing with any authority. Use when asked \"is this freelancer really a contractor\" or about requalification risk."
license: PolyForm-Perimeter-1.0.0
---

# Check contractor status

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-contractor-status" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
