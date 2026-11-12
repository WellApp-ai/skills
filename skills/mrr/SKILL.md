---
name: "mrr"
description: "Answer \"what is our MRR?\" from live sold subscription rows, or from the trailing average of issued invoices when there are none, over Well's MCP financial graph. Use for \"what's our MRR\" or \"run rate\", not who owes money (accounts-receivable-aging)."
license: PolyForm-Perimeter-1.0.0
---

# Recurring revenue

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "mrr" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
