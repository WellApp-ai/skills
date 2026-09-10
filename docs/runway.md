<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Runway

**Know exactly how many months and days of cash you have left.**

## What it does

Ask your AI assistant what your runway is, and it divides your real synced cash balances by your actual trailing burn, computed here from your own accounts and your own transactions rather than estimated. You get months and days, plus both numbers behind the division, so the figure is something you can challenge rather than take on faith.

## Required data in Well

- **Banking connector** (required). This is where your real cash balance comes from.
- **Accounting connector or bank transaction history** (required). This is how the skill works out your burn rate, how fast you are spending.

## FAQ

**Q: How is burn calculated?**
A: As a trailing average over the last 3 full months by default, so a single unusual month cannot distort the figure. You can ask for a different window, and the runway is recomputed from that same window.

**Q: Is this a forecast?**
A: No. Runway is computed from real balances and real trailing spend. Nothing is modelled or predicted, and the skill shows the arithmetic it used.

**Q: What if a bank is still syncing?**
A: The skill says so rather than answering from partial data. A runway number built on half your accounts is worse than no number.

---

## Installation

The file under `skills/runway/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/runway/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "runway". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill runway
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
