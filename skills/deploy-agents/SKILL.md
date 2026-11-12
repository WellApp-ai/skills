---
name: "deploy-agents"
description: "Preview what Well would fetch for the vendors the user picked, then on the Deploy click start one browser task per supplier with a portal address. Nothing starts until Deploy. This is a WRITE skill: a supplier Well lacks joins its catalog on the user's yes. Use for \"launch the agents\" on picked vendors; no pick yet is fetch-missing-invoices."
license: PolyForm-Perimeter-1.0.0
---

# Invoice fetching agents

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "deploy-agents" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
