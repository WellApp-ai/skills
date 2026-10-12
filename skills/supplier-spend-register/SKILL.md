---
name: "supplier-spend-register"
description: "Rank what each supplier invoiced a workspace over a year, largest first, from Well's financial graph, built from the purchase side of the synced invoices. Use when the user asks \"how much did we pay each supplier last year, from the invoices\", \"supplier register\", \"vendor spend report from our invoices\", \"rank our vendors by what they invoiced\", \"combien chaque fournisseur nous a facturé\", or \"which suppliers invoiced us over 600 last year\". An ask that names invoices (\"factures\", \"from invoices\") or a supplier register comes here; spend per supplier that names no invoice is cost-structure, from the bank. The invoices Well cannot place on either side are counted beside the total. It answers first from the invoices Well holds: when Well cannot place the side, it lists the largest invoices of the window on both sides to check, ranks no supplier, and asks nothing about a company. Asked about a refused payment, a price rise or a cancellation, it also notes what the person's own mails say on each supplier's row."
license: PolyForm-Perimeter-1.0.0
---

# Supplier spend register

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "supplier-spend-register" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
