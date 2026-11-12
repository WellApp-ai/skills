---
name: "todays-priorities"
description: "Answer \"what is important for me to do today?\" from the person's own calendar events for the day and the open work Well tracks for the workspace, as two blocks: the meetings first, then the work that is due or blocked. Needs the person's own Google Calendar; without it, it says so and answers from the open work alone. Use when asked \"what are my priorities today\" or \"plan my day\", not for a brief (signing-back)."
license: PolyForm-Perimeter-1.0.0
---

# Today's priorities

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "todays-priorities" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
