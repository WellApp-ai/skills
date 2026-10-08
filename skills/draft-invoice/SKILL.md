---
name: "draft-invoice"
description: "Draft an invoice in Well from a plain request, then issue it and print its PDF in the customer's design. Use when the user asks to \"draft an invoice for Acme Corp, 3 consulting days at 600 euros\", \"bill [client] for [work]\", \"invoice [client] [amount]\", \"fais une facture à Acme pour 3 jours de conseil à 600 €\" or \"facture [client] [montant]\". This is a WRITE flow: a first explicit yes saves the draft only, and Well shows the saved draft with its PDF; a second explicit yes, in a later turn, issues the invoice (numbered, final, with its Stripe payment link when Stripe is connected). It never invents an amount, a tax id, a date or a line, and it sends nothing. Do not use to find an existing invoice (that is `payment-invoice-lookup`), to change a design (that is `invoice-design`) or to push invoices to an accounting tool (that is `export-to-accounting-tool`). Requires a connected Well workspace; guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Draft invoice

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "draft-invoice" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
