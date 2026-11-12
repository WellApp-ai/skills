---
name: "first-employer-setup"
description: "Lay out the one-time employer setup list for the country your company is registered in, counted back from your start date, with the portal link, who to contact and your company details to copy for each step. It never files. Requires a pinned workspace, a confirmed company and a start date. Use when asked \"what do I set up for my first hire\" or \"how do I register as an employer\"."
license: PolyForm-Perimeter-1.0.0
---

# First employer setup

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "first-employer-setup" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
