---
name: "mail-senders"
description: "Answer which newsletters the member receives from Well's email records, and save one private keep, skip or unsubscribe choice for one sender. Use for \"which newsletters do I get\", \"quelles newsletters je reçois\" or \"ignore this sender\". Do not use for weekly mail triage or reading what a sender wrote; that is mailbox. Do not unsubscribe, delete mail, move labels or send messages."
license: PolyForm-Perimeter-1.0.0
---

# Mail senders

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "mail-senders" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
