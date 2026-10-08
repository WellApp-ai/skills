---
name: "money-back"
description: "Find money owed back across all the person's workspaces, each sum with its evidence: a supplier credit note never refunded, a VAT credit in the ledger, a possible supplier double debit, and an expense paid for a company (an expense note). It gives the VAT credit steps, and sends a claim email or records an expense note only after the person's yes. Use when the user asks \"does anyone owe us money back\", \"is a supplier refund missing\", \"unpaid credit note\", \"un fournisseur me doit un remboursement\", \"avoir jamais remboursé\", \"crédit de TVA à récupérer\", \"double prélèvement\", \"note de frais jamais remboursée\". Do not use to chase customers (`chase-late-invoices`), to list unpaid customer invoices (`accounts-receivable-aging`), to read the VAT position for a return (`vat-radar`), to cancel, renegotiate or contest one named subscription (`subscription-actions`) or to claim one order by phone (`call-and-claim`). Needs a connected invoicing or accounting tool and a confirmed own company; guides the connection."
license: PolyForm-Perimeter-1.0.0
---

# Money back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "money-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
