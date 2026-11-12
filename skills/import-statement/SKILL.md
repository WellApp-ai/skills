---
name: "import-statement"
description: "Put a bank statement the user already has (a pdf, a csv, an ofx, an xml or a photo of the page) through Well's own extraction, so the statement, its lines and the transactions behind them land as records in one Well workspace. Takes a claim token from a drop on Well's website, an upload, or pasted text. It is the only Well skill that produces transactions without a bank connector. Use for a statement dropped on Well's site or pasted (« ce relevé que je te colle »); no sync."
license: PolyForm-Perimeter-1.0.0
---

# Import a statement

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "import-statement" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
