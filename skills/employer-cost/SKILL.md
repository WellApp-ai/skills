---
name: "employer-cost"
description: "Read one month of payslips and state, per person, gross pay plus the employee deductions and the employer charges the payslip printed, split by the rubric side Well holds, then list separately, at company level, the payroll related bills paid from the bank that no payslip carries. Use when the user asks \"what does my employee really cost me\", \"fully loaded cost of employment\", \"employer charges last month\", \"payroll register\", \"Lohnjournal\", \"BG Beitragsbescheid\", \"workers' compensation policy\", \"bulletin de paie\", \"fiche de paie\", \"nomina\", \"DmfA\", \"mutuelle and prevoyance\", or \"taux AT/MP\". Requires payslips in Well and, for the off payslip bills, bank transactions with their payees categorised. This skill never files anything with an authority or a fund, it never allocates an off payslip bill to a named person, and a blank amount is reported as unread rather than as zero."
license: PolyForm-Perimeter-1.0.0
---

# Employer cost

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "employer-cost" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
