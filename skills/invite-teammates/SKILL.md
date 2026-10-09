---
name: "invite-teammates"
description: "Invite teammates into one Well workspace from a conversation. It offers the people Well detected on the owner's email domain who hold no membership yet; a calling flow can pass a set instead. Shows Well's invite card; Send invitations creates the memberships and sends the emails; each address reports its result. Use when the user asks to invite a teammate (\"invite Marie to this workspace\"), gives a mobile number (\"invite +33 6 00 00 00 01 as admin\"), asks how inviting someone with only a number works (\"comment tu invites quelqu'un qui n'a qu'un numéro ?\"), asks for the invitation link (\"donne-moi le lien d'invitation\") or to stop it, answers an invite Well suggested (\"oui\", \"plus tard\", \"non\": a later or a first no waits 30 days, a second no stops it for good), or when a close-books or fetch-missing-invoices flow needs its owners invited. Needs define-workspace. Do not use to assign expense ownership (assign-missing-invoices), set the own company (confirm-my-company), or connect a tool (connect-tools)."
license: PolyForm-Perimeter-1.0.0
---

# Invite teammates

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "invite-teammates" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
