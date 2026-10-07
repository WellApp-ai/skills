---
name: "memory"
description: "Decide what Well remembers and answer from it. Use when the person tells Well a fact about themselves or their business to keep, says \"remember that\", corrects or removes something Well remembers, or asks \"what do you know about me\" or \"what do you remember\". Well's learning step applies the same rules after every session, and is told to skip a password, a secret, a bank, card or id number, or health information; a line the person adds or approves is saved as written. Do not use to change what Well does on its own, such as \"send my mails without asking\", \"brief me at 8\" or \"stop the morning messages\": that is an action level or the schedule, never a memory line. Do not use for records, amounts or documents, which the data tools read live."
license: PolyForm-Perimeter-1.0.0
---

# Memory

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "memory" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
