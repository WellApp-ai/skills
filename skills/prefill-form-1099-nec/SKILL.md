---
name: "prefill-form-1099-nec"
description: "Fill IRS Form 1099-NEC for a closed calendar year from what the ledger already holds about who you paid, one sheet per payee. Fetches the current template from the IRS, totals posted payments per counterparty, writes the identity blocks and box 1, asks once for what the books cannot know, and refuses the state block. Use when the user asks to \"prefill my 1099s\", \"fill the 1099-NEC\", \"who do we owe a 1099 to\" or \"get our contractor forms ready\". Requires a connected Well workspace and a closed calendar year; it produces a draft for review, never a filed return."
license: PolyForm-Perimeter-1.0.0
---

# Prefill Form 1099-NEC

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "prefill-form-1099-nec" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
