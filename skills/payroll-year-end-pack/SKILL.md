---
name: "payroll-year-end-pack"
description: "Read every payslip Well holds for one calendar year, total gross pay, tax withheld, social contributions and net pay per contract and per month, name each month with no payslip or no posted journal entry, and hand the year to your accountant through the close package. It files no return and produces no annual statement. Use for \"payroll pack for last year\" or W-2, DSN, not one month (payroll-cost-by-month)."
license: PolyForm-Perimeter-1.0.0
---

# Payroll year end pack

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payroll-year-end-pack" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
