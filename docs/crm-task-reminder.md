<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# CRM task reminder

**Get one morning message with the Attio tasks that are due today or overdue.**

## What it does

Ask your AI assistant which Attio tasks are due, or turn on the morning reminder to get them on WhatsApp. The skill reads the tasks Well synced from Attio, drops the ones Attio marks completed, and keeps the open tasks whose due date is today or earlier. Overdue tasks come first, oldest first, then the tasks due today.

Each task carries its text, its due date, its company when the task names one, and its Attio link when Attio sent one. Nothing is guessed: a task with no company named shows no company, and a task with no due date is counted, never placed on a day.

The list is as fresh as the last Attio sync, and the message says so when that sync is older than a day. The skill reads only. It never completes, moves or creates a task, and it sends at most one reminder a day.

## Required data in Well

- **Attio connection** (required). The tasks come from Attio through Well's Attio connection. With no Attio connection there is nothing to remind, and the morning run sends nothing.

## FAQ

**Q: Which tasks are in the reminder?**
A: The open Attio tasks whose due date is today or earlier. A completed task is left out, and a task due later stays out until its day comes.

**Q: Will I get the same reminder twice in one day?**
A: No. The morning reminder sends at most one message a day, and a morning with nothing due sends nothing.

**Q: Which day does a due date fall on?**
A: The day Attio records, which is a UTC date. A task due near midnight in your time zone can show on the day before or the day after.

**Q: What happens to a task with no due date?**
A: It is counted, never listed. A task with no due date has no morning to fall on, so placing it on one would be a guess.

**Q: Can it complete or move a task for me?**
A: No. The skill reads only. Completing or moving a task stays in Attio.

---

## Installation

The file under `skills/crm-task-reminder/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install crm-task-reminder](https://github.com/WellApp-ai/skills/raw/main/dist/crm-task-reminder.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/crm-task-reminder/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "crm-task-reminder". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill crm-task-reminder
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
