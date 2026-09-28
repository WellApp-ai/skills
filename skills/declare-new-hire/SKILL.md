---
name: "declare-new-hire"
description: "Lay out what a new hire needs before day one in the country you hire in, name the forms to collect and the notices to hand over, and, on your explicit yes, record the person in Well and file the signed contract as a document. Use when the user asks \"I just signed someone, what do I do before day one\", \"new hire checklist\", \"what forms does my first employee sign\", \"onboarding an employee in France\", or names a form: W-4, I-9, the state new hire report, DPAE, Dimona, UniLav, DEUEV Anmeldung, Modelo 145 or contrat de travail. Requires a connected Well workspace, the country you employ in, and the hire's name, job title and start date. This is a WRITE flow, so it shows what it is about to write and asks first. Well never files: it submits no DPAE, Dimona IN, UniLav, alta, DEUEV Anmeldung or new hire report, holds no field for a national identity number, and does not read the signed contract's terms into a record."
license: PolyForm-Perimeter-1.0.0
---

# Declare a new hire

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "declare-new-hire" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
