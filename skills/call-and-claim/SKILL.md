---
name: "call-and-claim"
description: "Claim a refund or a compensation from one business for one purchase or one service: a delayed or cancelled flight, an order never delivered, a charge for something not received. It reads the evidence in Well first (the supplier's invoice or booking, and its bank debits), names a right only when the records and the person's own facts hold every fact it needs, else marks it \"to confirm\" (« à confirmer » in French), prepares the call as a script the person reads, and writes the claim email. Use when the user asks \"réclame une indemnisation pour mon vol en retard\", \"claim compensation for my delayed flight\", \"ma commande n'a jamais été livrée, réclame le remboursement\", \"get my money back from this supplier\", \"prépare l'appel au service client\" or \"what do I say when I call them\". It never promises an amount, it never places a call, and it sends nothing without the person's confirmation."
license: PolyForm-Perimeter-1.0.0
---

# Call and claim

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "call-and-claim" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
