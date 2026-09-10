<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Receivables aging

**See who owes you money, and how long they've been sitting on it.**

## What it does

Chasing down late payments starts with knowing who's late. Ask your AI assistant who owes you money, and it pulls the answer straight from your synced invoices — every unpaid or partially-paid customer invoice, sorted into aging buckets (current, 1-30, 31-60, 61-90, 90+ days overdue) — with real currency amounts and an as-of date attached, not a guess.

## Required data in Well

- **Invoicing / accounting connector** (required). This is where your issued customer invoices and their payment status come from.
- **Company profile confirmed in Well** (required). The skill needs to know which company is yours so it can tell receivables (what customers owe you) apart from payables (what you owe others).

## FAQ

**Q: Why does it need to know my own company?**
A: To tell receivables from payables. Without it, the skill cannot separate invoices you issued from bills you received, so it asks you to confirm rather than guessing.

**Q: Which aging buckets does it use?**
A: Current, 1-30, 31-60, 61-90, and 90+ days overdue, measured from the due date.

**Q: Does it chase the payment for me?**
A: No. This skill surfaces who is late and by how much. Sending the follow-up is still your call.

---

## Installation

The file under `skills/accounts-receivable-aging/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounts-receivable-aging/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "accounts-receivable-aging". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounts-receivable-aging
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
