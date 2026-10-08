---
name: "todays-priorities"
description: "Answer \"what is important for me to do today?\" by reading the person's own calendar events for the day and the open work Well already tracks for the workspace, then putting the two in one short, ordered list: the meetings first, then the work that is due or blocked. Use when the user asks what to do today, for the day's priorities or for the day's agenda: \"what's important today\", \"what are my priorities today\", \"what should I do today\", \"what do I have today\", \"what's on my plate\", \"plan my day\", \"qu'est-ce que j'ai d'important à faire aujourd'hui\", \"c'est quoi mes priorités aujourd'hui\", or \"mon programme du jour\". Do not use for a brief, a recap or a catch-up of what happened (that is `signing-back`). Needs the person's own Google Calendar connected to Well; if it is missing, this skill says so, gives the link to connect it when Well has one, and answers from the workspace's open work alone."
license: PolyForm-Perimeter-1.0.0
---

# Today's priorities

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "todays-priorities" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
