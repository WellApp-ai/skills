---
name: "approve-accounts-meeting"
description: "Prepare the approval of the accounts of a French SAS, SASU, SARL or EURL as drafts for the person to check, sign and file: the notice and the minutes of the general meeting, or the decision of the sole shareholder. Names the accounts used, the months still open in Well, the approval delay, the filing step with its documents and the registry link, and offers one reminder. This is a WRITE flow: Well prints the drafts and creates a reminder only after a yes. Well signs, sends and files nothing. Answers \"convocation et procès-verbal de l'assemblée\", \"approve the accounts\", \"PV d'approbation des comptes\" and a 1 to the brief line about the approval of the accounts. Not for the tax calendar (tax-calendar-pdf). Use for \"Prépare l'assemblée générale\", not a tax filing (file-declaration)."
license: PolyForm-Perimeter-1.0.0
---

# Approve the accounts

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "approve-accounts-meeting" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
