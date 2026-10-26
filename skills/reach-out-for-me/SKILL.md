---
name: "reach-out-for-me"
description: "Write an email to one of the person's own contacts or colleagues, to book something or to ask for something: an appointment, a call, a document, a quote or an answer. The contact comes from the person's records in Well (a company, a person or a co-member), or from the name and address the person gives; an accountant or a lawyer is found from the bank payments made to them. It writes one email per contact, shows each one in full, and sends each one from the person's Gmail only after its own confirmation. Use when the user asks a contact or a colleague for something: \"dis à Inès de m'envoyer le devis Durand avant vendredi\", \"demande à mon comptable le relevé d'août\", \"écris au plombier pour prendre rendez-vous mardi\" or \"book a call with Julie next week\". To only tell a contact something, use write-email. To compare quotes from several vendors, use compare-vendor-quotes. It never guesses a contact, an address or a time, and writes by email only, never by WhatsApp or SMS."
license: PolyForm-Perimeter-1.0.0
---

# Reach out for me

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "reach-out-for-me" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
