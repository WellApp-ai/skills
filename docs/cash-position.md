<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash position

**Know exactly how much cash you have, and which accounts it came from.**

## What it does

Sometimes you don't need a forecast — you just need the number. Ask your AI assistant what your cash position is, and it pulls your real, current bank balances straight from Well, broken down by account and currency, with an as-of timestamp on every figure. No burn rate, no runway, no projections — just what's actually in the bank today.

It also answers whether cash is rising or falling: the same read carries the trailing month-end balances behind today's figure, so "is our cash going up or down?" is this skill rather than a separate one. For cash projected FORWARD, see [`cash-forecast`](cash-forecast.md).

## Required data in Well

- **Banking connector** (required). This is where your real, current cash balances come from.

## FAQ

**Q: Does it handle multiple currencies?**
A: Yes. Each account is converted at a rate the answer names, and the total says so. A currency with no rate available is excluded and reported rather than quietly folded in.

**Q: Why does it ask which accounts are mine?**
A: Because an account nobody has claimed is silently left out of the total. The skill stops and asks rather than reporting a figure that is missing money you own.

**Q: How is this different from the runway skill?**
A: This one answers what is in the bank today. Runway adds your burn rate to tell you how long that cash lasts.

---

## Installation

The file under `skills/cash-position/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-position/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "cash-position". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cash-position
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
