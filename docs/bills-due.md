<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Bills due

**See exactly what's coming due, in what order, and how much cash it adds up to.**

## What it does

Instead of scanning a stack of invoices to figure out what's due next, ask your AI assistant "what bills are coming due?" and it pulls a date-ordered payment calendar straight from your synced invoices — overdue, due this week, due this month, and due later — with a running total so you can see how much cash is about to go out and by when.

## Required data in Well

- **Invoicing / bills connector** (required). This is where your unpaid and partially paid bills come from.
- **Banking or accounting connector** (optional). Not required to see the bills calendar, but helps confirm which bills have actually been paid.

## FAQ

**Q: Does it know which bills are already paid?**
A: It reads payment status from your invoicing data. Connecting a bank or accounting tool as well lets it confirm a payment actually settled.

**Q: What does the running total mean?**
A: Cumulative cash out by that date, so you can read off how much you need available by any point in the calendar.

**Q: Can it pay the bills?**
A: No. The skill builds the calendar. Approving and paying stays with you.

---

## Installation

The file under `skills/bills-due/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/bills-due/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "bills-due". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill bills-due
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
