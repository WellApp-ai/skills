# Well skills

Well's finance skills for AI agents: cash, spending, receivables, invoices, and month-end close, served live from Well's MCP server.

## Generated — do not edit here

Every file in this repository is generated from `packages/skills` in `WellApp-ai/platform` and
pushed on every merge to `main`. An edit made here is lost on the next publish. Change the skill
source in the platform repository instead.

## Install

1. Add the marketplace: `/plugin marketplace add WellApp-ai/skills`.
2. Install the plugin: `/plugin install well-skills@wellapp`.
3. Add the Well MCP connector at https://api.wellapp.ai/v1/mcp, then sign in. The skills need it.

## What a shell is

Each `skills/<slug>/SKILL.md` is a shell: it carries the skill's name and description, and a short
body that tells the agent to load the real instructions with `well_get_skill`. The instructions
stay on Well's MCP server, so an installed shell never serves a stale copy.
