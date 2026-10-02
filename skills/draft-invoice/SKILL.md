---
name: "draft-invoice"
description: "Draft a real invoice in Well from a plain request — e.g. \"invoice Acme Corp 3 consulting days at 600 euros\" — then print it as a PDF in the customer's design. Use when the user asks to \"draft an invoice\", \"make an invoice\", \"create an invoice for [client]\", \"bill [client] for [work]\", \"invoice [client] [amount] for [description]\", or \"send an invoice to [company]\". It picks the customer, matches the lines against what the workspace billed before, reuses the payment details of the last invoice, checks the customer's e-invoicing details, and shows the full draft for an explicit yes before it writes anything. It never invents an amount, a tax id, a date or a line. Once the user confirms, the invoice is issued: numbered from the workspace's sequence, final, and corrected only by a credit note. Its PDF is attached, an email draft to the customer opens for the user to review, and nothing is sent without their own press on Send. Requires a connected Well workspace."
license: PolyForm-Perimeter-1.0.0
---

# Draft invoice

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "draft-invoice" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
