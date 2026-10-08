---
name: "signing-back"
description: "Open a Well session in one call. Greet the user, recap what landed since they last looked, state where the workspace stands, and close with the five next steps Well ranked, every beat read from one session digest. Use when the user asks for a brief, a recap or a catch-up in any words, as in \"give me my morning brief\", \"recap what happened since yesterday\", \"catch me up\", \"what did I miss\", \"welcome me back\", \"fais-moi mon brief du matin\", \"un récap depuis hier\", \"le résumé de ma journée\", \"quoi de neuf\", or \"what is the most urgent thing today\"; or when the Well app opens a new conversation and sends this skill before the user types. Do not use for what to do today, the day's priorities or the agenda (that is `todays-priorities`), to fetch an invoice (`fetch-missing-invoices`), to close a period (`close-books`), to connect a tool (`connect-tools`), or to answer a figure question. Runs on the workspace the connection authorizes; when it authorizes several, this skill pins one first."
license: PolyForm-Perimeter-1.0.0
---

# Signing back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "signing-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
