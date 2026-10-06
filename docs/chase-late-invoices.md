<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Chase late invoices

**Get a prioritized list of who to chase for payment, with their contact info and a message already drafted.**

## What it does

A handful of invoices dragging weeks past due rarely feels urgent enough to act on today, and that is exactly how they end up sitting for months. This skill turns that vague sense of "I should follow up" into a short, ranked list: which customers owe the most, for how long, with their contact info already resolved from your synced data and a chase message already drafted in a tone that matches how overdue it is.

Nothing is sent automatically. Every message comes back as a draft for you to read, edit, and send yourself. This skill has no way to send email or messages on its own, by design. What it removes is the friction of assembling the who, the contact info, and the words, so following up becomes a one-click decision instead of a research project.

## Required data in Well

- **Invoicing connector** (required). This is where your issued customer invoices and their payment status come from.
- **Company profile confirmed in Well** (required). The skill needs to know which company is yours so it can tell invoices you issued apart from bills you received.

## FAQ

**Q: Does this actually send the message?**
A: No. It drafts a message per customer and hands it to you to review, edit, and send yourself. There is no send capability behind this skill.

**Q: How are customers ranked?**
A: By a score: the amount overdue multiplied by the days the oldest of those invoices is past due, so the customers who owe the most for the longest come first. Each customer's historical paid revenue is shown alongside the score as a separate signal, in case you want to weigh a long-standing client differently.

**Q: Where does the contact info come from?**
A: From the company record already stored in Well for that customer: its saved email addresses and phone numbers. If none are on file, this skill says so rather than guessing an address.

**Q: What about invoices it cannot rank?**
A: They are named, not chased. An invoice with no due date, a payment status Well could not work out, a balance that is missing, or a settlement the source system claims but no bank payment backs is listed on its own line with a count, and no message is drafted from it.

---

## Installation

The file under `skills/chase-late-invoices/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install chase-late-invoices](https://github.com/WellApp-ai/skills/raw/main/dist/chase-late-invoices.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/chase-late-invoices/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "chase-late-invoices". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill chase-late-invoices
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
