<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Burn rate

**Know what you actually spend each month, averaged over real months.**

## What it does

Ask your AI assistant what your burn rate is, and it reports the trailing average of your real monthly outflows — internal transfers excluded, currencies converted, and every month in the window counted in the divisor.

It computes the figure rather than reading it off a black box, which means you can see what it rests on. Each check runs in the open: the connection, whether the syncs actually finished, whether your accounts are attached to companies you own, whether the window's transactions are categorized. A check that fails **stops** and shows you what to fix, with the number of rows and the amount at stake, instead of reporting a figure with a caveat you would have to notice.

You also choose what does not count. Internal transfers leave the figure automatically, by a structural rule rather than a label; anything else your business does not treat as spend, you exempt yourself, with each option showing what it removes.

## Required data in Well

- **Banking connector** (required). This is where the real outflows come from.
- **Accounting connector** (recommended). Adds the ledger view, so spend that never touched the bank in the period still counts.

## FAQ

**Q: Why average instead of last month?**
A: Because one annual invoice or a delayed payroll run can double or halve a single month. The average over a window is the figure you can plan against.

**Q: Can I change the window?**
A: Yes. Ask for a different number of months and the skill recomputes, and it always states the window it used.

**Q: What if a month had no spend?**
A: The skill reports how much of the window actually carried spend. An average over a mostly empty window is flagged rather than presented as fact.

---

## Installation

The file under `skills/avg-burn/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/avg-burn/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "avg-burn". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill avg-burn
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
