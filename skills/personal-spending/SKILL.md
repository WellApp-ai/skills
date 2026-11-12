---
name: "personal-spending"
description: "Answer \"how much did I spend on groceries this month compared to usual?\" in a person's own space: one category's month total, its usual month (the mean of the three full months before it) and the difference, stated per currency, or the month's fixed-versus-flexible split. Use for \"how much did I spend on X\", not a breakdown (cost-structure) or a total (spend-total)."
license: PolyForm-Perimeter-1.0.0
---

# Personal spending

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "personal-spending" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
