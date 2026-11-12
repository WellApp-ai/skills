---
name: "reuse-invoice-design"
description: "Turn one of the user's own invoices into the workspace's invoice design: Well rebuilds the invoice's layout, fonts, colours, logo and legal mentions as a template, shows it beside the invoice, and saves it only when the user keeps it. This is a WRITE flow: it starts a rebuild, and it saves the design only after the user keeps it, with the logo and the mentions the user chose. Use when asked to reuse an invoice's look: \"use the design of this invoice\"."
license: PolyForm-Perimeter-1.0.0
---

# Reuse my invoice design

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "reuse-invoice-design" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
