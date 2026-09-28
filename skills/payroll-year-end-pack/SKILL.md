---
name: "payroll-year-end-pack"
description: "Read every payslip Well holds for one calendar year, total gross pay, tax withheld, social contributions and net pay per contract and per month, name each month with no payslip or no posted journal entry, and hand the year to your accountant through the close package. Use when the user asks \"give my accountant the payroll pack for last year\", \"payroll year end\", \"does my payroll tie to the annual statement\", \"what did we pay in salaries last year\", or names the paperwork: W-2, W-3, 941, 940, NYS-45, Lohnsteuerbescheinigung, fiche 281.10, certificazione unica, modelo 190, DSN or CUFPA. The faq entry \"Which forms does this cover?\" carries the full list per country. Requires payslips in Well for the year, from a payroll connector or from pay documents dropped into the workspace. Well never files any of those returns and never produces the annual statement: it reads the payslips, states its own totals, names the months that do not tie, and stops there."
license: PolyForm-Perimeter-1.0.0
---

# Payroll year end pack

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payroll-year-end-pack" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
