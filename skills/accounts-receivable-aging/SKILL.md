---
name: "accounts-receivable-aging"
description: "Answer \"which customers owe us money, and since when?\" from synced invoice data: every outstanding customer invoice bucketed into aging bands (current, 1-30, 31-60, 61-90, 90+ days past due). It answers first from the invoices Well already holds and asks for a missing connection after the answer. Use for « qui me doit de l'argent », who owes me money and since when; not rows (show-records)."
license: PolyForm-Perimeter-1.0.0
---

# Receivables aging

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "accounts-receivable-aging" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
