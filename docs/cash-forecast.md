<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash forecast

**See where your cash lands if nothing new comes in.**

## What it does

Ask your AI assistant to project your cash forward, and it returns your real settled month-end balances followed by a worst-case projection — the same series the Well app charts. The projection assumes no incoming revenue, so it is a floor rather than a prediction, and the answer says so every time rather than letting you mistake one for the other.

## Required data in Well

- **Banking connector** (required). The projection starts from real settled balances, not an estimate.
- **Enough history to measure spend** (required). The projection subtracts your real trailing burn. Without a few months of history there is nothing to project with.

## FAQ

**Q: Does it model expected revenue?**
A: No, and that is the point. It assumes nothing comes in, so the date it gives you is the earliest possible one. Revenue only pushes it later.

**Q: How is this different from runway?**
A: Runway gives you one number, the months left. This gives you the shape month by month, so you can see which month gets tight.

**Q: Are the past months projected too?**
A: No. Everything up to the current month is settled balance from your bank feed. The chart marks where the projection starts.

---

## Installation

The file under `skills/cash-forecast/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-forecast/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "cash-forecast". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cash-forecast
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
