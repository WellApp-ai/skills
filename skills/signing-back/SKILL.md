---
name: "signing-back"
description: "Open a Well session from one digest. Greet, recap what landed since the last look, state where the workspace stands, and close with the five next steps Well ranked. Use when the user asks for a brief of the day, a recap or a catch-up of what changed, as in \"what matters today for the company\", \"recap since yesterday\", \"catch me up\", \"welcome me back\", \"ce qui compte aujourd'hui pour l'entreprise\", or \"quoi de neuf\"; or when the Well app sends it to open a new conversation. Do not use to plan the day or read the agenda with no brief asked (that is `todays-priorities`), to fetch an invoice (`fetch-missing-invoices`), to close a period (`close-books`), to connect a tool (`connect-tools`), or to answer a figure question. A brief asked for now (\"fais-moi le point\", \"on fait le point ?\", \"fais-moi mon brief du matin\", \"give me my morning brief\", \"catch me up on today\", \"send me my brief now\") goes to `well_send_brief_now`. When the connection authorizes several workspaces, this skill pins one first."
license: PolyForm-Perimeter-1.0.0
---

# Signing back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "signing-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
