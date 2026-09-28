---
name: "check-payslip"
description: "Read one person's payslip for a month, list the lines it printed beside the same contract's earlier payslips, and name every line whose amount changed, appeared or disappeared, with the contract terms Well holds stated next to it. Use when the user asks \"is this payslip right\", \"why is this payslip different from last month\", \"check my employee's payslip\", \"what changed on the bulletin de paie\", \"check this Entgeltabrechnung\", \"read this fiche de paie\", \"check the cedolino paga\", \"does this nómina look right\", or \"what moved on this pay statement since March\". Requires payslips in Well for the same employment contract, at least one month to compare against, and a month to read. It refuses to file anything with any authority, refuses to recompute gross, tax, contributions or net, and refuses to check a deduction against a withholding form such as a W-4, an IT-2104, an ELStAM notice, a modulo detrazioni, a modelo 145 or a taux PAS notice, because none is a readable field in Well."
license: PolyForm-Perimeter-1.0.0
---

# Check a payslip

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-payslip" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
