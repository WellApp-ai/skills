---
name: "crm-task-reminder"
description: "List the Attio tasks that are due today or overdue, with the company and the Attio link of each, from the tasks Well syncs from Attio. For a member who turned the morning reminder on, a routine runs it with nobody present (`run: unattended`) and sends the one WhatsApp message it words. Use when the user asks \"which Attio tasks are due today\", \"what CRM follow-ups are late\", \"what is overdue in Attio\", or \"remind me of my CRM tasks\". Requires a connected Attio workspace. It reads only: it never creates, completes or moves an Attio task."
license: PolyForm-Perimeter-1.0.0
---

# CRM task reminder

The instructions for this skill are served by Well's MCP server, so they are always current. This file only loads them.

1. Check that `well_*` tools are in your toolset. If none are, tell the user to add the Well MCP connector (https://api.wellapp.ai/v1/mcp) and stop.
2. Call `well_get_skill({ skill: "crm-task-reminder" })` and follow the returned document exactly. It is the authoritative instruction set; do not substitute your own plan for it.
3. When the document tells you to run another Well skill, load it the same way, with `well_get_skill`, at the moment the document says to.
4. If the tool returns `success: false` or an error, tell the user the instructions are temporarily unavailable and stop. Do not improvise from memory.
