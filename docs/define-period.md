<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Pick the period

**Fix the month every following answer is measured over.**

## What it does

"Last month", "March", "Q1" — everyone means a month, and almost nobody says which one. Before your AI assistant can tell you which invoices are missing or what still needs reviewing, it has to agree with you on which months the job covers, and translate them into the fiscal year and period your books actually use. This skill proposes the last complete month, accepts what you named ("March", "2026-03", "March and April"), declines a month that has not ended yet, takes a quarter as the three months it names rather than asking you to pick one of them, and derives the fiscal coordinate from your workspace's fiscal-year start — so a March in an April-to-March fiscal year lands in period 12 of the previous fiscal year, not period 3. It also tells you whether the selection holds any activity, and it reads only: it never closes, locks, or posts anything. In Well's fetch-missing-invoices flow it runs after `define-workspace`, `connect-tools` and `connect-bank`.

## Required data in Well

- **A Well workspace** (required). The fiscal coordinates come from the workspace's own accounting settings.
- **A confirmed fiscal year start** (recommended). Without it the month cannot be mapped to the right fiscal period.

## FAQ

**Q: Why refuse the current month?**
A: Because a month that has not ended gives you a partial figure that looks like a full one. That is the mistake this step exists to prevent.

**Q: What if our year does not start in January?**
A: The skill maps the calendar month onto your own fiscal year, using the start month set on your workspace.

**Q: Can it pin several months?**
A: Yes. Ask for a range and it fixes the selection, so a following skill reads the same window for all of them.

---

## Installation

The file under `skills/define-period/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/define-period/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "define-period". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill define-period
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
