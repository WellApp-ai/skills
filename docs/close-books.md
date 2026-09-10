<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Close the books

**Drive the month-end close to the point of approval.**

## What it does

Tell your AI assistant to close last month and it drives Well's month-end close for you: it starts the close for the month you name, reads what Well says is still blocking it — uncategorized spend, a payment with no supplier invoice, an unreconciled bank line, an open task — and works through them one at a time, checking the real state after each fix rather than trusting what it did a moment ago. Well computes readiness and every fiscal figure server-side; the skill never guesses whether the books are ready.

It takes the close right up to the finish line — a prepared close package and an approval waiting for you — and then hands the last step back to you. Locking a period is a one-click approval you give inside the Well app, on purpose: Well requires a person to lock the books, so the assistant prepares everything and you press the button. Once you have, it reads the receipt back to confirm the period is closed.

It only advances on what's ready. The bank feed is the one connection the close blocks on — if it isn't connected or synced, it says so and points you at what to connect; an accounting connection is optional and just makes the close richer, so it never holds the close up.

## Required data in Well

- **Banking connector** (required). The bank feed is the one connection the close will not start without.
- **Accounting connector** (recommended). Not required, but it makes the close richer and the package fuller.

## FAQ

**Q: Does it lock the period?**
A: No, by design. It takes the close all the way to the approval, and the final lock is a first-party click inside Well.

**Q: What does it ask before doing?**
A: Retrying a reconciliation and queuing a supplier invoice fetch both need an explicit yes, because they reach beyond your books.

**Q: What if a blocker cannot be cleared?**
A: It says so and leaves the period open. A close that hides an unresolved gap is worse than one that stays honest about it.

---

## Installation

The file under `skills/close-books/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/close-books/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "close-books". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill close-books
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
