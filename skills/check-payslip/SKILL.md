---
name: "check-payslip"
description: "Read one person's payslip for a month, list its lines beside the same contract's earlier payslips, and name every line whose amount changed, appeared or disappeared, with the contract terms Well holds. It never recomputes gross, tax, contributions or net, never checks a deduction against a withholding form, and files nothing. Use when asked \"is this payslip right\" or \"why is this payslip different from last month\"."
license: PolyForm-Perimeter-1.0.0
---

# Check a payslip

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-payslip" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
