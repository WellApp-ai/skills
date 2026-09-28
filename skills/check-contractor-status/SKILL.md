---
name: "check-contractor-status"
description: "Read the purchase invoices, the payment rail and any employment contract Well holds for a supplier who looks like a freelancer, and state the facts a requalification question turns on (cadence, repeating amounts, share of your spend, contract type where a record exists), next to the papers your country expects you to keep. Use when the user asks \"is this freelancer really a contractor\", \"am I at risk of requalification\", \"do I need a W-9 from this supplier\", \"what is a Statusfeststellung\", \"do I need a 30bis retention check\", \"do I need an attestation de vigilance from my sous-traitant\", or \"which papers should I hold for my freelancers\". Requires a connected Well workspace with purchase invoices, and the country each supplier works from, which you name because Well does not derive it. It states observed facts and the papers to check, it never classifies anyone as an employee, it cannot see which papers are in your drawer, and it files nothing with any authority."
license: PolyForm-Perimeter-1.0.0
---

# Check contractor status

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-contractor-status" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
