---
name: "money-back"
description: "Answer \"does anyone owe me money?\" in one reply, across every workspace of the person: the customer invoices still unpaid, and the money owed back (a supplier credit note never refunded, a possible VAT credit, a possible supplier double debit, an expense paid for a company), each with its evidence. It sends a claim email or records an expense note only after the person's yes. Use for « quelqu'un me doit ? », money owed back; who owes, since when: accounts-receivable-aging. It serves \"does anyone owe me money\", \"est-ce que quelqu'un me doit de l'argent\", \"is a supplier refund missing\", \"avoir jamais remboursé\", \"double prélèvement\", \"note de frais jamais remboursée\", or customer invoices and supplier refunds named in one ask. Not for an aging report or one customer's lateness (`accounts-receivable-aging`), a chase (`chase-late-invoices`), the VAT position of a return (`vat-radar`), what the workspace owes (`bills-due`) or a subscription to cancel (`subscription-actions`). It asks nothing before the answer."
license: PolyForm-Perimeter-1.0.0
---

# Money back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "money-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
