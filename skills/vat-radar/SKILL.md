---
name: "vat-radar"
description: "Read a French workspace's VAT position from its posted ledger: the net VAT payable it shows for a window of whole months, the split between collected and deductible VAT by month and by rate, and the invoices that make the figure unreliable, each with what to fix. Use when the user asks \"how much VAT do I owe this quarter\", \"what is my VAT for Q2\", \"combien je dois de TVA ce trimestre\", \"ma TVA est elle prete\", \"which invoices are hurting my VAT\", \"TVA deductible du mois\", or \"why is my VAT so high\". Also when the user asks to \"file my VAT return\" or \"which CA3 box\" a figure goes in: it declines the box and gives the working paper. It files nothing itself, and where Well has a browser skill for the return and the chat can run one, it offers that skill. A working paper for your accountant, France only: it names no printed box and never tells you a refund is due. Requires a connected Well workspace whose accounting country is France with posted ledger entries; with none, it says so instead of guessing."
license: PolyForm-Perimeter-1.0.0
---

# VAT radar

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "vat-radar" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
