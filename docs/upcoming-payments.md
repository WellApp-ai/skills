<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Upcoming payments

**See what leaves your account before payday, day by day, and what is left.**

## What it does

Ask your AI assistant what is left before payday, and Well answers from the bank transactions in your personal space. It lists each recurring debit still to come, in date order, with its next day, its amount and a running total, then names your next payday and what your balance leaves before it.

A debit is recurring when the same payee took money on a monthly, bimonthly, quarterly or yearly schedule. Its next day is the day it was last paid on, moved on by that schedule.

Your payday is the next recurring salary on your account. When no salary repeats, the answer says so and lists the money that does come in on a schedule. Moves between your own accounts and cash withdrawals pay no one, so they are never upcoming payments. Each currency is reported on its own line, with no conversion.

## Required data in Well

- **Bank transactions in your personal space** (required). The days and amounts come from the transactions your bank feed delivered to your personal space.
- **A few months of history** (recommended). A debit counts as recurring once the same payee took money on a schedule in several months. A bank connected last week shows no recurring debit yet.

## FAQ

**Q: How does Well know when a payment is due?**
A: From the dates your bank already paid on. The next day of a debit is the day it was last paid, moved on by its schedule: a month, two months, a quarter or a year.

**Q: What if a payment is a few days late?**
A: A debit whose day passed in the last five days with no payment seen yet is still expected and counts in the total. Past that, Well expects the next one.

**Q: How does Well know my payday?**
A: Your payday is the next recurring salary on your account. When no salary repeats, the answer lists the money that comes in on a schedule and does not pick a payday for you.

**Q: Why is a payment I expect missing?**
A: A debit appears once it repeated on a schedule in your bank history. A new payment, or one paid by a card your space does not hold, is not on the list yet.

---

## Installation

The file under `skills/upcoming-payments/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install upcoming-payments](https://github.com/WellApp-ai/skills/raw/main/dist/upcoming-payments.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/upcoming-payments/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "upcoming-payments". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill upcoming-payments
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
