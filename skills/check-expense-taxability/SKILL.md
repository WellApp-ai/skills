---
name: "check-expense-taxability"
description: "For one French payroll month, list the payslip lines that are neither salary, tax nor contribution, with the label and amount the payslip printed, set the receipt gaps Well already found beside them, and state the country rule each item is judged against. It refuses to rule on taxability and files nothing with a tax or social security authority. Use when asked \"is this gift card taxable\" or about \"note de frais\" and \"avantages en nature\"."
license: PolyForm-Perimeter-1.0.0
---

# Check expense taxability

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "check-expense-taxability" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
