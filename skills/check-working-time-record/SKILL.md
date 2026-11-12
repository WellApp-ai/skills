---
name: "check-working-time-record"
description: "For each employee Well can reach from a payslip or an uploaded contract, say which working time record the workspace country expects, whether a timesheet is on file for the period, and how long to keep it. It checks existence and kind, never the hours, and files nothing. Use when asked \"what working time record do I need\" or \"do I have to track my employee's hours\"."
license: PolyForm-Perimeter-1.0.0
---

# Check the working time record

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-working-time-record" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
