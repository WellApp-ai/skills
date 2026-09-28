---
name: "payroll-cost-by-month"
description: "Read the payslips Well holds for one calendar month and state gross pay, tax withheld, social contributions and net pay per employee, each in the currency the payslip was issued in, over Well's MCP financial graph. Use when the user asks \"what did payroll cost last month\", \"gross to net payroll summary\", \"what did each person take home\", \"payroll cost by month\", \"how much did we pay in salaries\", or \"show me last month's payslips\". Requires payslips in Well, synced from a payroll connector or extracted from pay documents dropped into the workspace. It states only what a payslip printed: employer charges are out of scope, and a missing amount is reported as unread rather than as zero."
license: PolyForm-Perimeter-1.0.0
---

# Payroll cost by month

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payroll-cost-by-month" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
