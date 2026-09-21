---
name: "signing-back"
description: "Open a Well session in one call. Greet the user, recap what landed since they last looked, state where the workspace stands today, and close with the five next steps Well ranked, every beat read from one Well session digest. Use when the user asks \"what happened since last time\", \"catch me up\", \"what's new since my last login\", \"what did the connectors bring in\", \"what did I miss\", or \"welcome me back\", or when the Well app opens a new conversation and sends this skill before the user types. Do not use to fetch an invoice (that is `fetch-missing-invoices`), to close a period (that is `close-books`), to connect a tool (that is `connect-tools`), or to answer a figure question, which each belong to the skill that owns them. Runs on the workspace the connection authorizes; when it authorizes several, this skill pins one first."
license: PolyForm-Perimeter-1.0.0
---

# Signing back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "signing-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
