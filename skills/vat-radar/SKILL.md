---
name: "vat-radar"
description: "Read a workspace's VAT position from Well's data. Position questions use draft, validated and locked entries plus supplier and customer documents; filing and readiness questions use posted ledger VAT, or the same entries and documents when nothing is posted, and list unreliable invoices with fixes. A request to file the return goes to file-declaration. It files nothing itself, names no printed box, and never says a refund is due. Position questions use the possibilities basis; filing and readiness questions use the posted basis, and the possibilities basis when nothing is posted. Load this skill before you write any text. Use for VAT amounts, deductible VAT, deadlines, readiness or CA3-box questions."
license: PolyForm-Perimeter-1.0.0
---

# VAT radar

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "vat-radar" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
