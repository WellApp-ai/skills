---
name: "payroll-question"
description: "Answer a question about payroll figures by loading the one skill that reads them: what payroll or an employee costs the company, or the pay itself (gross, net, withheld, who was paid what). An ask for Well to make payslips or file a payroll return gets a refusal and one concrete next step. It writes nothing itself. Use for payroll cost, gross, net, withheld, who was paid what, or an ask to make payslips."
license: PolyForm-Perimeter-1.0.0
---

# Payroll question

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "payroll-question" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
