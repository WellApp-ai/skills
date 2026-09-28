---
name: "reconcile-payroll-month"
description: "Read one month's payslips and the bank transactions that paid them, name every payslip with no matching debit and every payroll debit with no payslip, and, on your explicit yes, categorise and post those debits as net salaries, employer social charges or wage withholding. Use when the user asks \"is last month's payroll booked\", \"did the payroll debits land\", \"match my payslips to the bank\", \"what is still open on payroll before I close\", or names the paperwork: a payroll register, an EFTPS deposit, an Entgeltabrechnung, a fiche de paie, a cedolino, a nomina, a bulletin de paie, DSN, F24 or Modelo 111. Requires a Well workspace with a connected bank and payslips already in it, synced from a payroll connector or extracted from pay documents dropped in. This is a WRITE flow: it writes only a transaction category and a ledger account, and only after you say yes. It never files a statutory return, never prefills a tax or social portal, and never pays anyone."
license: PolyForm-Perimeter-1.0.0
---

# Reconcile the payroll month

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "reconcile-payroll-month" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
