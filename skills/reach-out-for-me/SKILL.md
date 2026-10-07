---
name: "reach-out-for-me"
description: "Write an email to one of the person's own contacts for them, to book something or to ask for something: an appointment, a visit, a call, a document, a quote or an answer. The contact comes from the person's records in Well (a company or a person, and its email address on file), or from the name and address the person gives; an accountant or a lawyer is found from the bank payments made to them. It writes one email per contact, shows each one in full, and sends each one from the person's Gmail only after its own confirmation. Use when the user asks \"demande à mon comptable le relevé d'août\", \"ask my accountant for the August statement\", \"écris au plombier pour prendre rendez-vous mardi\", \"demande un devis à Plomberie Martin\", \"book a call with Julie next week\" or \"write to my lawyer to ask about the lease\". It never guesses a contact or an address, never proposes a time the person did not give, and writes by email only, never by WhatsApp or SMS."
license: PolyForm-Perimeter-1.0.0
---

# Reach out for me

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "reach-out-for-me" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
