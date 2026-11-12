---
name: "connect-tools"
description: "Check which sources a workspace has connected (bank, accounting, invoicing), connect the missing ones with install links, and hand off a coverage result. Not for an API key (about-well). Use for \"help me connect my tools\", \"install Stripe\" or \"which tools are connected\"."
license: PolyForm-Perimeter-1.0.0
---

# Check your connections

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "connect-tools" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
