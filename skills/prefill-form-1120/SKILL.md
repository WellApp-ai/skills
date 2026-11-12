---
name: "prefill-form-1120"
description: "Prefill page 1 of IRS Form 1120, the U.S. Corporation Income Tax Return, from a closed fiscal year's posted ledger in Well. Fetches the current IRS template, writes the identity block, the tax year and the book figures Well can source into named AcroForm fields, and returns the filled PDF with every blank field named. Requires a connected Well workspace with an accounting connector and a closed fiscal year; it produces a draft for review, never a filed return. Use when asked to \"prefill my 1120\" or \"start my corporate return\"."
license: PolyForm-Perimeter-1.0.0
---

# Prefill Form 1120

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "prefill-form-1120" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
