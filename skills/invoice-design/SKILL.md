---
name: "invoice-design"
description: "Choose how one invoice prints: its design, the ink it is set in, the language it speaks, and which of the workspace's own notes, tax rate and payment means it carries, over Well's MCP server, writing only what the user picks. This is a WRITE flow: the gallery writes the user's pick itself when they press Apply. Every option is read from this workspace's own records. It never sends anything to a customer. To only see the designs, use show-invoice-designs (on WhatsApp, this skill). Use to pick, change or keep an invoice's look or colours, not to create it (draft-invoice)."
license: PolyForm-Perimeter-1.0.0
---

# Invoice design

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "invoice-design" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
