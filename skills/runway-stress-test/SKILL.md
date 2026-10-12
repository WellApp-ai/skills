---
name: "runway-stress-test"
description: "Re-run the runway under named what-ifs (a customer pays late, a customer leaves, a hire starts) and show each result against the base case, with the cause of each change. Use when the user asks \"what if my biggest customer pays 45 days late\", \"stress test my runway\", \"what if I hire [number] people at [cost] a month\" or \"et si mon plus gros client part\". Read only. Needs a connected bank account and the own company set; connect a bank first when none is."
license: PolyForm-Perimeter-1.0.0
---

# Runway Stress Test

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "runway-stress-test" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
