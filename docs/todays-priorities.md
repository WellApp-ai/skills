<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Today's priorities

**See what matters today: your meetings and the work waiting on you, in one list.**

## What it does

Ask your AI assistant what is important today, and it reads your calendar for the day and the open work in your workspace, then answers in one list.

Events come from your own calendar, the one of the Google account you connected to Well. An all-day event is listed apart from the timed ones, so it does not read as a meeting at midnight. A repeating event shows once for the day, and a cancelled event is left out.

The work comes from what Well already tracks: the accounting periods that are still open and the invoices still missing. It is a prompt to act, not a new to-do list, and the skill points at the skill that does each piece of work rather than doing it inline.

The skill reads only. It cannot accept, decline or create an event, and it does not read the content of any email.

## Required data in Well

- **A bank, accounting or invoicing connector** (recommended). Where the open work in the list comes from. Without one, the day is built from the calendar alone.

## FAQ

**Q: Which calendar does it read?**
A: Your own calendar in Well, the one of the Google account you connected. It reads events only, and it never shows you another member's private events.

**Q: What if my Google calendar is not connected?**
A: It says so, gives you the link to connect it when Well has one, and answers from the work Well tracks for your workspace alone, rather than presenting a list with no meetings as a free day.

**Q: Can it change my calendar?**
A: No. It reads only, so it cannot create, move, accept or decline an event.

**Q: Why is a meeting not in the list?**
A: A cancelled event is left out because it will not take place. An event on a calendar that is not yours is left out too, because the list is about your own day.

---

## Installation

The file under `skills/todays-priorities/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install todays-priorities](https://github.com/WellApp-ai/skills/raw/main/dist/todays-priorities.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/todays-priorities/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "todays-priorities". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill todays-priorities
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
