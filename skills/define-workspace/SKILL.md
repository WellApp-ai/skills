---
name: "define-workspace"
description: "Resolve which Well workspace (legal entity) a conversation works in and hand it off as a typed result: workspace_id, name, identity and how it was resolved. It walks several entities one per pass. Use when asked to select, switch or confirm a workspace, or \"which company account is this\"."
license: PolyForm-Perimeter-1.0.0
---

# Pick the workspace

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "define-workspace" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
