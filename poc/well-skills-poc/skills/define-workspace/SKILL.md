---
name: define-workspace
description: Resolve which Well workspace (legal entity / company account) a conversation works in, and hand it off as a typed result — workspace_id, name, identity, and how it was resolved — to any Well skill or flow that follows. Use when the user asks to select, choose, switch, or confirm a workspace, says "use my FR entity" / "work in workspace X" / "which company account is this", or when a Well skill needs one workspace pinned before it reads or writes data. Resolves several entities too — "do both my companies", "FR and US" — as a pin plus a server-held queue the caller walks one workspace per pass. Do not use to connect a bank or accounting tool, to compute any financial figure, or to confirm the company identity inside the Well app.
---

# Define Workspace with Well

This skill's instructions are served by Well's MCP server, so they are always current. The file you are reading is a stub.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector and stop.
2. Call `well_get_skill({ skill: "define-workspace" })` and follow the returned content exactly; it is the authoritative instruction set. A section titled "Sections not found in the source document" is a note for the operator; follow its instruction and do not repeat it to the user.
3. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop; do not improvise from memory.
