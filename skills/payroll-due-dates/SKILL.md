---
name: "payroll-due-dates"
description: "Read the payslips Well holds for the months you pin, say which legs of each payroll run already left the bank, and set the rest against a dated payroll and social deadline reference. It never files, signs or pays: it names what is due and hands the filing to you or your bureau. Use for payroll deadlines (\"when is the 941 due\", F24, DSN, DmfA), not for a filing."
license: PolyForm-Perimeter-1.0.0
---

# Payroll due dates

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payroll-due-dates" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
