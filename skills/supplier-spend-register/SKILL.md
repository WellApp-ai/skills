---
name: "supplier-spend-register"
description: "Rank what each supplier invoiced a workspace over a year, largest first, from the purchase side of the synced invoices in Well's financial graph. The invoices Well cannot place on either side are counted beside the total. It answers first from the invoices Well holds. Use when asked \"supplier register\" or \"who invoiced us most\", not bank spend (cost-structure)."
license: PolyForm-Perimeter-1.0.0
---

# Supplier spend register

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "supplier-spend-register" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
