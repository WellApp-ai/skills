---
name: "signing-back"
description: "Open a Well session from one digest. Recap what landed since the last look, state where the workspace stands, and close on the five next steps Well ranked. The Well app also opens a conversation with it. With several workspaces authorized, it pins one first. A brief asked for now with no question (\"my brief\", \"mon brief\", \"fais-moi le point\", \"fais-moi mon brief du matin\", \"give me my morning brief\", \"catch me up on today\", \"send me my brief now\") goes to `well_send_brief_now`. Use when asked \"what matters today\", \"recap since yesterday\" or \"catch me up\"; not \"my brief\"."
license: PolyForm-Perimeter-1.0.0
---

# Signing back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "signing-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
