---
name: "prepare-exit-pack"
description: "Read the final payslip Well holds for a leaver, state the gross pay, tax withheld, social contributions and net pay it printed, list its lines beside the contract's end date, last working day and termination reason, and name the exit documents the country expects and who sends each one. Requires a payslip in Well for the person leaving and a country on the accounting settings. It files nothing and computes no unused leave, severance, TFR or finiquito amount. Use when asked \"my employee is leaving, what do I owe\", \"final settlement\" or \"exit pack\"."
license: PolyForm-Perimeter-1.0.0
---

# Prepare exit pack

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "prepare-exit-pack" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
