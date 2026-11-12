---
name: "reconcile-hours-to-payslip"
description: "Read one pay period's payslip lines for an hourly or part-time employee and state the hours, the rate and the amount on each line, name the lines the payslip rubric marks as overtime, and set the total against the hours the employment contract carries. Requires a payslip in Well for the period. It reads one side only: Well never subtracts a timesheet from a payslip, never says what overtime was owed, never tracks hours as they are worked, and never files a working-time record or a payslip. Use when asked \"did the hours on the payslip match\" or \"check my employee's overtime\"."
license: PolyForm-Perimeter-1.0.0
---

# Reconcile hours to payslip

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "reconcile-hours-to-payslip" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
