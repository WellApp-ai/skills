---
name: "founder-own-pay"
description: "Read the payslips Well holds for the founder and state gross pay, tax withheld, contributions and net pay per period, beside the legal form and country of incorporation on the own company record, so the founder can take the right paperwork to their accountant. Use when the user asks \"am I paying myself the right way\", \"what did I pay myself this year\", \"show me my own payslips\", \"what do I hand my accountant for my own pay\", or names the paperwork: bulletin de paie, W-2, Lohnkonto, UniEmens, RETA. Requires a Well workspace holding the founder's payslips, from a payroll connector sync or pay documents dropped in, and an own company set if you want the legal form and country reported. Well never files, submits or transmits any of these documents: it reads what it holds, names the paperwork that goes with them, and the founder or their accountant clicks submit. It states no filing date, derives no obligation from a legal form, and offers no bank side total of money moved to the founder."
license: PolyForm-Perimeter-1.0.0
---

# Founder's own pay

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "founder-own-pay" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
