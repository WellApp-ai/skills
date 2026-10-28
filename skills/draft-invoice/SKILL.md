---
name: "draft-invoice"
description: "Draft invoices from plain chat requests and prepare them for review. Use when the user asks to \"draft an invoice for a client\", \"bill [client] for [work]\", \"invoice [client] [amount]\", or \"fais une facture à [client]\". This is a WRITE flow. On WhatsApp, create and define an unmatched named customer, then save its draft; several matches need a numbered pick. Elsewhere, a first yes saves the draft. Issue on its own yes, or in a complete WhatsApp order when nothing blocks it. Needs a connected Well workspace."
license: PolyForm-Perimeter-1.0.0
---

# Draft invoice

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "draft-invoice" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
