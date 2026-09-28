---
name: "invoice-design"
description: "Choose how one invoice prints — its design, the ink it is set in, the language it speaks, and which of the workspace's own notes, tax rate and payment means it carries — over Well's MCP server, writing only what the user picks. Use when the user asks to \"change how my invoice looks\", \"pick an invoice template\", \"use a different invoice layout\", \"print my invoice in French\", \"put my terms on the invoice\", \"which bank account shows on my invoices\", or \"show me the invoice designs\". This is a WRITE flow — it draws the current design as a gallery, and the gallery writes the user's pick itself when they press Apply. Every option it offers is read from this workspace's own records, so a note or account from another workspace can never be selected. Requires a connected Well workspace and an invoice to design; it does not create the invoice — that is `draft-invoice` — and it never sends anything to a customer."
license: PolyForm-Perimeter-1.0.0
---

# Invoice design

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "invoice-design" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
