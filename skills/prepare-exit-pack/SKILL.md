---
name: "prepare-exit-pack"
description: "Read the final payslip Well holds for a leaver, state the gross pay, tax withheld, social contributions and net pay it printed, list its lines as labelled beside the contract's end date, last working day and termination reason, and name the exit documents the country expects and who sends each one. Use when the user asks \"my employee is leaving, what do I owe and what must I send\", \"final settlement\", \"last payslip\", \"exit pack\", \"C4\", \"certificat de travail\", \"solde de tout compte\", \"documents de fin de contrat\", \"Arbeitsbescheinigung\", \"Kuendigung\", \"finiquito\" or \"COBRA notice\". Requires a payslip in Well for the person leaving, since the contract is reachable only through a payslip, and a country on the accounting settings to pick the document register. Well files nothing: it reads what the payslip printed and hands the filing to you or your bureau. It never computes unused leave, severance, TFR, pécule de sortie or a finiquito amount."
license: PolyForm-Perimeter-1.0.0
---

# Prepare exit pack

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "prepare-exit-pack" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
