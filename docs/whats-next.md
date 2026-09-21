<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# What's next

**Five things worth doing next in this workspace, each one a click that starts it.**

## What it does

A finance workspace always has a next move, and it is rarely the obvious one. Chasing a missing invoice matters more than reading a burn figure computed from half your spend. Closing a month you can close matters more than forecasting one you cannot.

This skill answers what to do next with five things you can start on the spot. Well ranks them from your workspace as it stands: the gaps holding your books open lead, then the month ready to close, then the reads that only tell the truth once the data is sound. A skill you ran in the last day drops off the list, so it moves with you instead of repeating itself.

Each line reads like something you would have typed yourself, and clicking it starts that skill in the same turn. Every Well flow ends on these five, and you can ask for them any time. For the same five with a recap of what changed since your last session, see [`signing-back`](signing-back.md).

## Required data in Well

- **A Well workspace** (required). The gaps the ranking reads belong to one workspace.

## FAQ

**Q: Why exactly five?**
A: Five is the size the product settled on: enough to cover the data gaps and the open month, short enough to read at a glance. Analysis skills fill the remaining slots.

**Q: Who decides the five?**
A: Well does, on the server, from a fixed rubric: open gaps first, then the open month's close, then analysis, and never a skill you ran today. The assistant only draws them and starts the one you click.

**Q: Does it re-read the recap?**
A: No. It reads the digest without moving your read cursor, so the recap that opened the session keeps the one advance.

---

## Installation

The file under `skills/whats-next/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

### Claude Code

```
/plugin marketplace add WellApp-ai/skills
/plugin install well-skills@wellapp
```

### Codex CLI

```bash
codex plugin marketplace add WellApp-ai/skills
codex plugin add well-skills@wellapp
```

### Claude Desktop

[⬇ Install whats-next](https://github.com/WellApp-ai/skills/raw/main/dist/whats-next.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/whats-next/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "whats-next". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill whats-next
```

Whatever the host, the skill needs the Well MCP server at `https://api.wellapp.ai/v1/mcp`. You'll be asked to sign in to Well the first time it needs your data.

---

[← Back to all skills](../README.md#available-skills)

<p align="center">
  <img src="https://wellapp.ai/images/badges/soc2.avif" alt="SOC 2 Type I" height="40">
  <img src="https://wellapp.ai/images/badges/gdpr.avif" alt="GDPR Compliant" height="40">
</p>

<p align="center">
    <sub><b>Well is SOC-2 Type I and GDPR Compliant</b></sub>
</p>
