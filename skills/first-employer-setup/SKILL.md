---
name: "first-employer-setup"
description: "Lay out the one time employer setup list for the country your company is registered in, counted back from the start date you give, with the portal link, who to contact, and your own company details written out for each step to copy. Use when the user asks \"I am hiring my first employee, what do I need to set up\", \"how do I register as an employer\", \"what do I need before my first hire starts\", or names a step by the name it goes by: SS-4, EIN, NYS-100, workers' comp, DBL and PFL, Betriebsnummer, BG-Anmeldung, Krankenkasse, ONSS employer identification, SEPP, règlement de travail, INPS and INAIL, delega intermediario, DVR, CCC, Sistema RED, PRL, SPSTI, DUE, DUERP. Requires a pinned Well workspace, a confirmed own company, and a start date you type, since no contract or hire record is read. This skill never files any of these. It reads your company, its public registry record and your accounting country, then hands you the list and the links, and you or your payroll bureau submit."
license: PolyForm-Perimeter-1.0.0
---

# First employer setup

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "first-employer-setup" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
