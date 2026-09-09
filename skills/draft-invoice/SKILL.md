---
name: "draft-invoice"
description: "Draft and create a real invoice record in Well from a conversational description — e.g. \"invoice Acme Corp $2,500 for consulting work, due in 30 days.\" Use when the user asks to \"draft an invoice\", \"create an invoice for [client]\", \"bill this client for Y\", \"send an invoice to [company] for [amount]\", or \"invoice [client] $[amount] for [description]\". This is a WRITE skill — it composes the invoice from user-supplied fields (never inventing an amount, tax id, date, or line item) and always shows the full draft for explicit confirmation before creating it. Once created, it also renders the invoice into a print-ready A4 PDF on the issuer's own letterhead and attaches it to the invoice record. Requires a connected Well workspace; if none, this skill walks the user through connecting one first. It creates the invoice record and its attached PDF only — it does not email or send anything to the client."
license: PolyForm-Perimeter-1.0.0
---

# Draft invoice

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "draft-invoice" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
