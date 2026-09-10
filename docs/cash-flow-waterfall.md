<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Cash movement

**See the bridge from last month's balance to this one.**

## What it does

Ask your AI assistant why your balance changed, and it bridges the gap: opening position, total in, total out, closing position. Where the flows don't fully account for the movement between the two measured anchors, it tells you the residual instead of quietly adjusting a number to make the bridge balance.

## Required data in Well

- **Banking connector** (required). The bridge is built from settled bank movement on both sides.
- **A full period of synced history** (required). The bridge needs both ends of the period. A feed that starts mid-month cannot tie out.

## FAQ

**Q: Does it break out inflows by source?**
A: This skill gives you the bridge: opening, in, out, closing. For the breakdown of what the outflows were spent on, ask the cost structure skill.

**Q: Why doesn't it tie to my accounting?**
A: The bridge is settled bank movement. Your ledger can recognise things in a different period, so the two answer different questions on purpose.

**Q: Can I bridge a quarter?**
A: Yes. Ask for the period you want and the skill bridges it, as long as your feed covers both ends of it.

---

## Installation

The file under `skills/cash-flow-waterfall/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/cash-flow-waterfall/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "cash-flow-waterfall". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill cash-flow-waterfall
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
