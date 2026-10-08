---
name: "missing-receipts"
description: "Find invoices with no source document. Use when the user asks \"do we have documentation for all our expenses\", \"which expenses are missing receipts\", \"which invoices have no document attached\", \"find missing receipts\", \"compliance check on receipts\", \"missing documentation\", \"quels justificatifs me manquent\", \"get the missing receipts\", \"récupère les justificatifs manquants\", \"match this receipt\", \"here is a receipt\" or \"voici le justificatif\". It hands a missing receipt to a browser skill or the Chrome extension, drafts a vendor email for a picked transaction, and matches a receipt photo or PDF to its payment. This is a WRITE flow: it attaches a receipt only to the payment the user picks, hands one on only on request, and never sends a vendor email. Do not use for a payment with no invoice (that is `payment-invoice-lookup`) or a month with no supplier invoice (that is `show-missing-invoices`). Requires a connected Well workspace; if none is connected, this skill walks the user through connecting one first."
license: PolyForm-Perimeter-1.0.0
---

# Missing receipts

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "missing-receipts" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
