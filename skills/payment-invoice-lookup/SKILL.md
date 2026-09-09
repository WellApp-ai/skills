---
name: "payment-invoice-lookup"
description: "Find the reconciliation counterpart for a specific invoice, payment, or transaction (\"what payment settled this invoice\", \"what invoice does this payment belong to\"), or list every transaction/invoice with no reconciliation match at all — a compliance/reconciliation gap — using Well's MCP financial graph. Use when the user asks \"what happened with this payment\", \"find the invoice for this transaction\", \"why is this payment unmatched\", \"show me unreconciled payments\", \"find the details behind this invoice/payment\", \"which payments have no invoice\", or \"catch payments with no invoice\". Requires a connected Well workspace with invoicing and banking/accounting data; if none is connected, this skill walks the user through connecting one first."
license: PolyForm-Perimeter-1.0.0
---

# Payment and invoice lookup

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payment-invoice-lookup" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
