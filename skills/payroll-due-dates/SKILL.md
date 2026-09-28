---
name: "payroll-due-dates"
description: "Read the payslips Well holds for the months you pin, say which legs of each payroll run (net pay, employee deductions, employer charges, fees) already left the bank, and set the rest against a dated payroll and social deadline reference carried inside this skill. Use when the user asks \"what payroll deadlines are coming\", \"when is the 941 due\", \"EFTPS deposit date\", \"Lohnsteueranmeldung\", \"Beitragsnachweis\", \"DmfA\", \"double pécule\", \"F24\", \"UniEmens\", \"Modelo 111\", \"RLC and RNT\", \"DSN\", \"prélèvement à la source\", \"what do I owe the social office this quarter\", or \"did we already pay last month's payroll taxes\". Requires payslips in Well and a country on the accounting settings, and reads bank movement only where a payslip transaction links it. Well never files, signs or pays any of these: it names what is due, states the amount wherever a payslip carries one, says whether a matching debit has already left, and hands the filing to you or your bureau."
license: PolyForm-Perimeter-1.0.0
---

# Payroll due dates

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payroll-due-dates" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
