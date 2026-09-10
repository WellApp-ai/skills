<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Accounting settings

**Set the accounting basics every period-scoped answer depends on.**

## What it does

Well derives every fiscal period from one durable setting: the month your fiscal year starts. Leave it unset and Well assumes January; set it wrong and every close is filed against the wrong period, silently. This skill sets it — and the other accounting settings behind it — from what you tell it, never from a guess.

Ask it to set your fiscal year start ("our accounting year starts in April"), your reporting currency, your country, your accounting framework, or to confirm your chart of accounts, and it reads the current value, shows you what you're changing, and writes only what you confirm. Changing the fiscal year start realigns the whole calendar, so Well refuses it once a period is locked or a close is in progress, and warns you that the regenerable draft entries on the old coordinates are discarded — the skill says all of this before it writes.

It sets accounting *configuration* only. It never changes which company your workspace *is* — that's [`confirm-my-company`](confirm-my-company.md) — and it never picks which month a job works on — that's [`define-period`](define-period.md).

## Required data in Well

- **A Well workspace** (required). The settings belong to the workspace.
- **Owner or admin rights** (required). These values change how every period is derived, so they are admin-only to write.

## FAQ

**Q: Why does the fiscal year start matter?**
A: Every period-scoped answer is derived from it. If your year starts in April, a January-based calendar puts your months in the wrong periods.

**Q: Can I change it mid-close?**
A: No. The change is refused while a period is locked or a close is running, because it would move the ground under an open close.

**Q: What happens to existing entries?**
A: Changing the fiscal year start discards draft journal entries that can be regenerated. The skill tells you before it writes.

---

## Installation

The file under `skills/accounting-settings/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/accounting-settings/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "accounting-settings". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill accounting-settings
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
