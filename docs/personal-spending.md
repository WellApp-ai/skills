<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="../assets/brand/well-logo-white.svg">
    <img src="../assets/brand/well-logo-black.svg" alt="Well" width="180">
  </picture>
</p>

# Personal spending

**See what you spent on one thing this month, and how that compares to a usual month.**

## What it does

Ask your AI assistant how much you spent on one thing, such as groceries this month, and Well answers from the bank transactions in your personal space. It gives three figures for the category: the month total, the usual amount, and the difference between the two, in amount and in percent.

The usual amount is the average of the three full months before the month you ask about. A month with no spending in that category counts as zero, so a quiet month lowers the average instead of being left out. The running month is never part of it. When your bank was connected less than three months ago, the answer says which months had data and does not call the average usual.

Your personal space files household categories: groceries, rent and mortgage, energy and telecom, health, restaurants and bars, transport, and more. A company workspace files business categories instead, so a question about groceries there gets a plain line about that limit and an offer to move to your personal space. Refunds in a category lower its total. Each currency is reported on its own line, with no conversion. Transactions that have no category yet are counted, so the total reads as a floor when some of them may belong to the category.

## Required data in Well

- **Bank transactions in your personal space** (required). The figures come from the transactions your bank feed delivered to your personal space.
- **Three full months of history** (recommended). The usual amount is the average of the three full months before the month you ask about. With fewer, the answer says which months had data and does not call the average usual.

## FAQ

**Q: What does "usual" mean here?**
A: The average of the three full months before the month you ask about. A month with no spending in the category counts as zero. The running month is never part of it.

**Q: Why does it say my month is not over?**
A: The running month is partial. Its total is what you spent so far, so the comparison with a usual full month can still change.

**Q: Do refunds count?**
A: Yes. A refund in a category lowers that category's total for the month it landed in.

**Q: Why can't I ask about groceries in my company workspace?**
A: A company workspace files business categories, and groceries is a household category. Ask in your personal space, where your household spending is filed.

**Q: What about transactions with no category yet?**
A: They are counted and named in the answer. Some of them can belong to the category you asked about, so the total is a floor until they are filed.

**Q: What if I spend in more than one currency?**
A: Each currency gets its own line, with its own total and usual amount. Nothing is converted or added across currencies.

---

## Installation

The file under `skills/personal-spending/SKILL.md` is a shell: it carries the skill's name and description, and loads the instructions from Well's MCP server with `well_get_skill` when the skill runs. Install it once; it never goes stale.

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

[⬇ Install personal-spending](https://github.com/WellApp-ai/skills/raw/main/dist/personal-spending.skill) and open the downloaded file. Desktop installs the skill straight away, with nothing to unzip.

### Assisted by AI

Paste this into any AI agent (Claude, Codex, Cursor, OpenCode, and others):

```
Install the following official skill from Well. Instructions:

1. Fetch this file:
    https://raw.githubusercontent.com/WellApp-ai/skills/refs/heads/main/skills/personal-spending/SKILL.md
2. Save it as a file named exactly "SKILL.md" inside a folder named "personal-spending". No prefix, no suffix.
3. Install this skill.
4. If the MCP server https://api.wellapp.ai/v1/mcp is not connected: suggest it to the user and explain how to add a new MCP server in this tool.
```

### Advanced

Install directly from **[skills.sh/wellapp-ai](https://www.skills.sh/wellapp-ai)**:

```bash
npx skills add wellapp-ai/skills --skill personal-spending
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
