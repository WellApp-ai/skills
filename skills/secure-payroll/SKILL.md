---
name: "secure-payroll"
description: "Check if cash covers a payroll amount on a date, and name the vendor bills to delay if it does not. Use when asked \"will payroll bounce\" or \"can I pay payroll on the 28th\"."
license: PolyForm-Perimeter-1.0.0
---

# Secure Payroll

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "secure-payroll" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
