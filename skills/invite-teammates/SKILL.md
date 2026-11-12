---
name: "invite-teammates"
description: "Invite teammates into one Well workspace from a conversation. It offers the people Well detected who hold no membership yet: those on the owner's corporate email domain or, for an owner on a personal address, those seen across several connected tools (a calling flow can pass a set instead). A later or a first no waits 30 days, a second no stops it for good. Needs define-workspace. Use to invite a teammate or to answer yes or no to inviting one (\"invite Marie\", \"non\")."
license: PolyForm-Perimeter-1.0.0
---

# Invite teammates

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "invite-teammates" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
