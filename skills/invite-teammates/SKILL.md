---
name: "invite-teammates"
description: "Invite teammates into one Well workspace from a conversation. Out of the box it offers the people Well detected from the workspace owner's email domain who hold no membership yet; a calling flow can instead pass a specific set of people to invite. Renders Well's invite card, one row per candidate with a checkbox and a state chip (`has access` or `invited`), a contact search with email chips, a role select (admin or member), and a target picker (this workspace or a workspace group). Picking who to invite and clicking Send invitations creates the memberships and sends the invitation emails, each address reporting its own result. Use when the user asks to invite a teammate, add a member, \"invite Marie to this workspace\", or when a close-books or fetch-missing-invoices flow needs the owners it just assigned invited so they can open their task. Needs define-workspace. Do not use to assign expense ownership (assign-missing-invoices), set the own company (confirm-my-company), or connect a tool (connect-tools)."
license: PolyForm-Perimeter-1.0.0
---

# Invite teammates

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "invite-teammates" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
