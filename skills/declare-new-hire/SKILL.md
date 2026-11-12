---
name: "declare-new-hire"
description: "Lay out what a new hire needs before day one in the country you hire in: the forms to collect and the notices to hand over. On your yes, record the person in Well and file the signed contract as a document. This is a WRITE flow: it shows what it will write and asks first. This skill never files. Use when asked \"new hire checklist\" or \"what do I do before day one\" (W-4, DPAE, Dimona)."
license: PolyForm-Perimeter-1.0.0
---

# Declare a new hire

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "declare-new-hire" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
