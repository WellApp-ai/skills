---
name: "money-back"
description: "Find money that is owed back to the company and list each sum with its evidence: a supplier credit note whose refund never reached the bank, a VAT credit position in the posted ledger, and a possible supplier double debit. Weak evidence is marked \"to check\", in the language of the answer (« à vérifier » in French). It drafts the claim email for an unpaid credit note and gives the steps to raise a VAT credit with the accountant. Use when the user asks \"un fournisseur ou l'État me doit-il de l'argent\", \"un fournisseur me doit un remboursement\", \"avoir jamais remboursé\", \"crédit de TVA à récupérer\", \"double prélèvement\", \"does anyone owe us money back\", \"is a supplier refund missing\", \"unpaid credit note\" or \"find the money I should get back\". Company workspaces only: it never looks at a person's own money. It states what the ledger and the bank show, never that a refund is due, and it sends nothing without the person's confirmation."
license: PolyForm-Perimeter-1.0.0
---

# Money back

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "money-back" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
