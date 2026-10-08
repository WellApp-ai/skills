---
name: "money-back"
description: "Find money owed back to the company, each sum with its evidence: a supplier credit note never refunded, a VAT credit in the posted ledger, a possible supplier double debit. Weak evidence is marked \"to check\". It drafts the claim email for an unpaid credit note and gives the VAT credit steps. Use when the user asks \"does anyone owe us money back\", \"is a supplier refund missing\", \"unpaid credit note\", \"un fournisseur me doit un remboursement\", \"avoir jamais remboursé\", \"crédit de TVA à récupérer\". The claim email is sent only after the person's explicit yes. Do not use to chase customers (that is `chase-late-invoices`), to list unpaid customer invoices (that is `accounts-receivable-aging`), to read the VAT position for a return (that is `vat-radar`), to contest one subscription's double charge (that is `subscription-actions`) or to claim one order by phone (that is `call-and-claim`). Requires a connected invoicing or accounting tool and a confirmed own company; guides the user to connect one first."
license: PolyForm-Perimeter-1.0.0
---

# Money back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "money-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
